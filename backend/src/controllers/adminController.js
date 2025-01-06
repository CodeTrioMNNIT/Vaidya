import { asyncHandler } from "../utils/asyncHandler.js"
import validator from "validator"
import bcrypt from "bcrypt"
import { v2 as cloudinary } from "cloudinary"
import fs from "fs"
import doctorModel from "../models/doctorModel.js"
import userModel from "../models/userModel.js"
import jwt from "jsonwebtoken"
import appointmentModel from '../models/appointmentModel.js'

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

const appointmentsAdmin = async (req, res) => {
    try {
        
        const appointments = await appointmentModel.find({}).sort({ createdAt: -1 });
        res.json({success: true, appointments})

    } catch (error) {
        console.log(error) 
        res.json({success:false, message: error.message})
    }
}

const appointmentCancel = asyncHandler(async(req ,res) => {
    const {appointmentId} = req.body
    const appointmentData = await appointmentModel.findById(appointmentId)

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

const adminDashboard = async (req, res) => {

    try {
        
        const doctors = await doctorModel.find({})
        const users = await userModel.find({})
        const appointments = await appointmentModel.find({})

        const dashData = {
            doctors: doctors.length, 
            appointments: appointments.length, 
            patients: users.length, 
            latestAppointments: appointments.reverse().slice(0, 5)
        }

        res.json({success:true, dashData})

    } catch (error) {
        console.log(error) 
        res.json({success:false, message: error.message})
    }

} 

export { addDoctor, adminLogin, allDoctors, appointmentsAdmin, appointmentCancel, adminDashboard }