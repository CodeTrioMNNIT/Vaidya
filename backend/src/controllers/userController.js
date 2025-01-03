import { asyncHandler } from "../utils/asyncHandler.js"
import validator from 'validator'
import bcrypt from 'bcrypt'
import userModel from "../models/userModel.js"
import jwt from 'jsonwebtoken' 
import { v2 as cloudinary } from "cloudinary"
import fs from "fs"

const registerUser = asyncHandler(async (req, res) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({
            success: false,
            message: "Missing required details: name, email, and password.",
        });
    }

    if (!validator.isEmail(email)) {
        return res.status(400).json({
            success: false,
            message: "Please enter a valid email address.",
        });
    }

    if (password.length < 8) {
        return res.status(400).json({
            success: false,
            message: "Password must be at least 8 characters long.",
        });
    }

    try {
        const existingUser = await userModel.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: "A patient with this email already exists.",
            });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const userData = {
            name,
            email,
            password: hashedPassword,
        };

        const newUser = new userModel(userData);
        const user = await newUser.save();

        const token = jwt.sign(
            { _id: user._id },
            process.env.USER_TOKEN_SECRET,
            { expiresIn: "10d" }
        );

        res.status(201).json({
            success: true,
            token,
        });
    } catch (error) {
        console.error("Error while registering user:", error);
        res.status(500).json({
            success: false,
            message: "Server error. Please try again later.",
        });
    }
});

const loginUser = asyncHandler(async (req , res) => {
    const {email , password} = req.body
    const user = await userModel.findOne({email})
    if(!user) {
        return res.json({
            success:false,
            message:'User does not exist'
        })
    }

    const isMatch = await bcrypt.compare(password , user.password)

    if(isMatch) {
        const token = jwt.sign({_id: user._id}, process.env.USER_TOKEN_SECRET)
        res.json({
            success: true,
            token
        })
    } else {
        res.json({
            success: false,
            message: "Invalid Credentials"
        })
    }
})

const getProfile = asyncHandler(async (req , res) => {
    return res.json({
        success: true,
        userData: req.user
    })
})

const updateProfile = asyncHandler(async(req , res) => {
    const {name , phone , address , dob , gender} = req.body
    const imageFile = req.file 

    if(!name || !phone || !dob || !gender) {
        return res.json({
            success: false,
            message: "Data Missing"
        })
    }

    await userModel.findByIdAndUpdate(req.user._id, { name, phone, address: JSON.parse(address), dob, gender })

    if(imageFile){
        if(req.user.image !== ''){
            cloudinary.uploader.destroy(req.user.image.split("/").pop().split(".")[0])
        }
        try{
            const imageUpload = await cloudinary.uploader.upload(imageFile.path, {resource_type: "image"})
            const imageUrl = imageUpload.secure_url
            fs.unlinkSync(imageFile.path)
            await userModel.findByIdAndUpdate(req.user._id , {image:imageUrl})
        } catch (error) {
            fs.unlinkSync(imageFile.path)
            return res.json({
                success:false,
                message: "Unable to upload the profile pic"
            })
        }
    }

    res.json({
        success: true,
        message: "Profile updated successfully"
    })

})

export { registerUser , loginUser, getProfile, updateProfile }