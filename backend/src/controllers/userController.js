import { asyncHandler } from "../utils/asyncHandler.js"
import validator from 'validator'
import bcrypt from 'bcrypt'
import userModel from "../models/userModel.js"
import jwt from 'jsonwebtoken' 
import { v2 as cloudinary } from "cloudinary"
import fs from "fs"
import doctorModel from "../models/doctorModel.js"
import appointmentModel from "../models/appointmentModel.js"
import razorpay from 'razorpay'
import dotenv from "dotenv";
dotenv.config();

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

const bookAppointment = asyncHandler(async (req ,res) => {
    const {docId , slotDate , slotTime} = req.body
    const docData = await doctorModel.findById(docId).select('-password')

    if(!docData.available){
        return res.json({
            success: false,
            message:'Doctor not available'
        })
    }

    let slots_booked = docData.slots_booked

    if(slots_booked[slotDate]) {
        if(slots_booked[slotDate].includes(slotTime)) {
            return res.json({
                success: false,
                message:'Slot not available'
            })
        } else {
            slots_booked[slotDate].push(slotTime)
        }
    } else {
        slots_booked[slotDate] = []
        slots_booked[slotDate].push(slotTime)
    }

    delete docData.slots_booked

    const appointmentData = {
        userId: req.user._id,
        docId,
        userData: req.user,
        docData,
        amount:docData.fees,
        slotTime,
        slotDate,
    }

    const newAppointment = new appointmentModel(appointmentData)
    await newAppointment.save()

    await doctorModel.findByIdAndUpdate(docId,{slots_booked})

    res.json({
        success: true,
        message: 'Appointment Booked'
    })
})

const listAppointments = asyncHandler(async (req ,res) => {
    const appointments = await appointmentModel.find({userId : req.user._id})
    res.json({
        success: true,
        appointments
    })
})

const cancelAppointment = asyncHandler(async(req ,res) => {
    const {appointmentId} = req.body
    const appointmentData = await appointmentModel.findById(appointmentId)
    if(appointmentData.userId !== req.user._id.toString()) {
        console.log(appointmentData.userId)
        console.log(req.user._id)
        return res.json({
            success: false,
            message: 'Unauthorized action'
        })
    }

    await appointmentModel.findByIdAndUpdate(appointmentId, {cancelled: true})

    const {docId, slotDate, slotTime} = appointmentData
    const doctorData = await doctorModel.findById(docId)
    let slots_booked = doctorData.slots_booked
    slots_booked[slotDate] = slots_booked[slotDate].filter(e => e !== slotTime)
    await doctorModel.findByIdAndUpdate(docId,{slots_booked})

    res.json({
        success: true,
        message: 'Appointment Cancelled'
    })
})

const razorpayInstance = new razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
})

const paymentRazorpay = async (req, res) => {
    try {
        const { appointmentId } = req.body
        const appointmentData = await appointmentModel.findById(appointmentId)

        if(!appointmentData || appointmentData.cancelled) {
            return res.json({success: false, message: "Appointment cancelled or not found"})
        }

        const options = {
            amount: appointmentData.amount * 100,
            currency: process.env.CURRENCY, 
            receipt: appointmentId
        }

        const order = await razorpayInstance.orders.create(options)

        res.json({success: true, order})

    } catch (error) {
        console.log(error) 
        res.json({success : false, message: error.message})
    }    
}

const verifyRazorpay = async (req, res) => {
    try {
        
        const {razorpay_order_id} = req.body
        const orderInfo = await razorpayInstance.order.fetch(razorpay_order_id)

        if(orderInfo.status === 'paid') {
            await appointmentModel.findByIdAndUpdate(orderInfo.receipt, {payment: true})
            res.json({success: true, message: "Payment Successful"})
        } else {
            res.json({success: false, message: "Payment Failed"})
        }

    } catch (error) {
        console.log(error) 
        res.json({success : false, message: error.message})
    }
}

export { registerUser , loginUser, getProfile, updateProfile, bookAppointment, listAppointments, cancelAppointment, paymentRazorpay, verifyRazorpay }