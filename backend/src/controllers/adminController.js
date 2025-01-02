import { asyncHandler } from "../utils/asyncHandler.js"
import validator from "validator"
import bcrypt from "bcrypt"
import { v2 as cloudinary } from "cloudinary"
import fs from "fs"
import doctorModel from "../models/doctorModel.js"
import jwt from "jsonwebtoken"

const addDoctor = asyncHandler(async (req, res) => {
    const { name, email, password, speciality, degree, experience, about, fees, address } = req.body
    const imageFile = req.file

    if(!name || !email || !password || !speciality || !degree || !experience || !about || !fees || !address || !imageFile){
        return res.json({
            success:false,
            message:"Missing Details"
        })
    }

    const existingDoctor = await doctorModel.findOne({ email });
    if (existingDoctor) {
        return res.json({
            success: false,
            message: "A doctor with this email already exists"
        });
    }

    if(!validator.isEmail(email)) {
        return res.json({
            success:false,
            message:"Please enter a valid email"
        })
    }

    if(password.length < 8) {
        return res.json({
            success:false,
            message:"Please enter a strong password"
        })
    }

    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(password , salt)

    let imageUrl
    try{
        const imageUpload = await cloudinary.uploader.upload(imageFile.path, {resource_type: "image"})
        imageUrl = imageUpload.secure_url
        fs.unlinkSync(imageFile.path)
    } catch (error) {
        fs.unlinkSync(imageFile.path)
        return res.json({
            success:false,
            message:"Unable to upload the profile pic"
        })
    }

    const doctorData = {
        name,
        email,
        image:imageUrl,
        password:hashedPassword,
        speciality,
        degree,
        experience,
        about,
        available:true,
        fees,
        address: JSON.parse(address),
        date:Date.now()
    }    

    const newDoctor = new doctorModel(doctorData)
    await newDoctor.save()

    res.json({
        success: true,
        message: "Doctor Added"
    })

})

const adminLogin = asyncHandler(async (req , res) => {
    const {email , password} = req.body

    if(email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD){
        const token = jwt.sign(
            { email }, 
            process.env.ADMIN_TOKEN_SECRET,
            { expiresIn:'10d' } 
        );
        res.json({
            success:true,
            token
        })
    } else {
        res.json({
            success:false,
            message:"Invalid Credentials"
        })
    }
})

const allDoctors = asyncHandler(async (req, res) => {
    const doctors = await doctorModel.find({}).select('-password')
    res.status(200).json({ success: true, doctors })
})

export { addDoctor, adminLogin, allDoctors }