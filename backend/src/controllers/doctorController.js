import appointmentModel from "../models/appointmentModel.js"
import doctorModel from "../models/doctorModel.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'

const changeAvailability = asyncHandler(async (req, res) => {
    const {docId} = req.body
    const docData = await doctorModel.findById(docId)
    await doctorModel.findByIdAndUpdate(docId, { available: !docData.available })
    res.json({success:true, message: 'Availability Changed'})
})

const doctorList = asyncHandler(async (req , res) => {
    const doctors = await doctorModel.find({ available: true }).select(['-password','-email'])
    res.json({
        success:true,
        doctors
    })
})

const loginDoctor = asyncHandler(async (req, res) => {
    const { email, password } = req.body 
    const doctor = await doctorModel.findOne({email})

    if(!doctor) {
        return res.json({success: false, message:"Invalid credentials"})
    }

    const isMatch = await bcrypt.compare( password, doctor.password )

    if(isMatch) {

        const token = jwt.sign({id:doctor._id}, process.env.USER_TOKEN_SECRET)

        res.json({success:true, token})

    } else {
        res.json({success: false, message:"Invalid credentials"})
    }

})

const appointmentsDoctor = asyncHandler(async (req, res) => {
    const { docId } = req.body 
    const appointments = await appointmentModel.find({ docId })

    res.json({ success:true, appointments})
})

const appointmentComplete = asyncHandler(async (req, res) => {
    const { docId, appointmentId } = req.body

    const appointmentData = await appointmentModel.findById(appointmentId)
    if (appointmentData && appointmentData.docId === docId) {
        await appointmentModel.findByIdAndUpdate(appointmentId, { isCompleted: true })
        return res.json({ success: true, message: 'Appointment Completed' })
    }

    res.json({ success: false, message: 'Appointment Cancelled' })
})

const appointmentCancel = asyncHandler(async (req, res) => {
    const { docId, appointmentId } = req.body

    const appointmentData = await appointmentModel.findById(appointmentId)
    if (appointmentData && appointmentData.docId === docId) {
        await appointmentModel.findByIdAndUpdate(appointmentId, { cancelled: true })
        return res.json({ success: true, message: 'Appointment Cancelled' })
    }

    res.json({ success: false, message: 'Appointment Cancellation Failed' })
})

const doctorDashboard = asyncHandler(async (req, res) => {
    const { docId } = req.body

    const appointments = await appointmentModel.find({ docId })

    let earnings = 0
    appointments.forEach((item) => {
        if (item.isCompleted || item.payment) {
            earnings += item.amount
        }
    })

    let patients = []
    appointments.forEach((item) => {
        if (!patients.includes(item.userId)) {
            patients.push(item.userId)
        }
    })

    const dashData = {
        earnings,
        appointments: appointments.length,
        patients: patients.length,
        latestAppointments: appointments.reverse().slice(0, 5),
    }

    res.json({ success: true, dashData })
})

const doctorProfile = asyncHandler(async (req, res) => {
    const { docId } = req.body
    const profileData = await doctorModel.findById(docId).select('-password')

    res.json({ success: true, profileData })
})

const updateDoctorProfile = asyncHandler(async (req, res) => {
    const { docId, fees, address, about, available } = req.body

    await doctorModel.findByIdAndUpdate(docId, { fees, address, about, available })

    res.json({ success: true, message: 'Profile Updated' })
})

export { changeAvailability, doctorList, loginDoctor, appointmentsDoctor, appointmentComplete, appointmentCancel, doctorDashboard, doctorProfile, updateDoctorProfile }