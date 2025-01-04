import doctorModel from "../models/doctorModel.js"
import { asyncHandler } from "../utils/asyncHandler.js"

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

export {changeAvailability , doctorList}