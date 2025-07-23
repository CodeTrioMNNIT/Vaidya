import { asyncHandler } from "../utils/asyncHandler.js"
import validator from 'validator'
import bcrypt from 'bcrypt'
import userModel from "../models/userModel.js"
import jwt from 'jsonwebtoken' 
import { v2 as cloudinary } from "cloudinary"
import fs from "fs"
import doctorModel from "../models/doctorModel.js"
import appointmentModel from "../models/appointmentModel.js"
import Razorpay from 'razorpay'
import crypto from 'crypto'
import dotenv from "dotenv";
import mongoose from "mongoose"

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

const bookAppointment = asyncHandler(async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { docId, slotDate, slotTime } = req.body;
    const updateResult = await doctorModel.updateOne(
      {
        _id: docId,
        available: true,
        [`slots_booked.${slotDate}`]: { $ne: slotTime },
      },
      {
        $push: { [`slots_booked.${slotDate}`]: slotTime },
      },
      { session }
    );

    if (updateResult.modifiedCount === 0) {
      throw new Error('Slot not available or doctor not available');
    }
    const docData = await doctorModel.findById(docId)
      .select('-password')
      .session(session);
    if (!docData) {
      throw new Error('Doctor not found');
    }
    const appointmentData = {
      userId: req.user._id,
      docId,
      userData: req.user,
      docData,
      amount: docData.fees,
      slotTime,
      slotDate,
    };
    const newAppointment = new appointmentModel(appointmentData);
    await newAppointment.save({ session });
    await session.commitTransaction();
    session.endSession();

    res.json({
      success: true,
      message: 'Appointment Booked Successfully',
    });

  } catch (err) {
    await session.abortTransaction();
    session.endSession();

    res.status(400).json({
      success: false,
      message: err.message || 'Failed to book appointment',
    });
  }
});


const listAppointments = asyncHandler(async (req ,res) => {
    const appointments = await appointmentModel.find({userId : req.user._id})
    res.json({
        success: true,
        appointments
    })
})

const cancelAppointment = asyncHandler(async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { appointmentId } = req.body;
    const appointmentData = await appointmentModel.findById(appointmentId).session(session);
    if (!appointmentData || appointmentData.userId.toString() !== req.user._id.toString()) {
      throw new Error("Unauthorized action");
    }

    if (appointmentData.cancelled) {
      throw new Error("Appointment already cancelled");
    }

    const { docId, slotDate, slotTime } = appointmentData;
    await appointmentModel.findByIdAndUpdate(
      appointmentId,
      { cancelled: true },
      { session }
    );
    await doctorModel.updateOne(
      { _id: docId },
      { $pull: { [`slots_booked.${slotDate}`]: slotTime } },
      { session }
    );
    await session.commitTransaction();
    session.endSession();

    res.json({
      success: true,
      message: 'Appointment Cancelled',
    });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();

    res.status(400).json({
      success: false,
      message: err.message || 'Failed to cancel appointment',
    });
  }
});

  

  const razorpayInstance = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
  })
  
  const paymentRazorpay = asyncHandler(async (req, res) => {
    const { appointmentId } = req.body
  
    const appointmentData = await appointmentModel.findById(appointmentId)
  
    if (!appointmentData || appointmentData.cancelled) {
      return res.status(400).json({ success: false, message: "Appointment cancelled or not found" })
    }
  
    if (appointmentData.payment === true) {
      return res.status(400).json({ success: false, message: "Payment already completed" })
    }
  
    const options = {
      amount: appointmentData.amount * 100, // INR to paise
      currency: process.env.CURRENCY || 'INR',
      receipt: appointmentId
    }
  
    const order = await razorpayInstance.orders.create(options)
  
    await appointmentModel.findByIdAndUpdate(appointmentId, {
      razorpay_order_id: order.id
    })
  
    res.json({ success: true, order })
  })

  const verifyRazorpay = asyncHandler(async (req, res) => {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    } = req.body
  
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ success: false, message: 'Missing payment details' })
    }
  
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex')
  
    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ success: false, message: 'Invalid payment signature' })
    }
  
    const appointmentData = await appointmentModel.findOne({ razorpay_order_id })
  
    if (!appointmentData || appointmentData.cancelled) {
      return res.status(404).json({ success: false, message: 'Appointment not found or cancelled' })
    }
  
    if (appointmentData.payment === true) {
      return res.status(400).json({ success: false, message: 'Payment already processed' })
    }
  
    await appointmentModel.findByIdAndUpdate(appointmentData._id, {
      payment: true,
      razorpay_payment_id,
      razorpay_signature
    })
  
    res.json({ success: true, message: 'Payment verified successfully' })
  })

export { registerUser , loginUser, getProfile, updateProfile, bookAppointment, listAppointments, cancelAppointment, paymentRazorpay, verifyRazorpay }