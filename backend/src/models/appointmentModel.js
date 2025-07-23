import mongoose from 'mongoose'

const appointmentSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true
  },
  docId: {
    type: String,
    required: true
  },
  slotDate: {
    type: String,
    required: true
  },
  slotTime: {
    type: String,
    required: true
  },
  userData: {
    type: Object,
    required: true
  },
  docData: {
    type: Object,
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  cancelled: {
    type: Boolean,
    default: false
  },
  payment: {
    type: Boolean,
    default: false
  },
  razorpay_order_id: {
    type: String
  },
  razorpay_payment_id: {
    type: String
  },
  razorpay_signature: {
    type: String
  },
  isCompleted: {
    type: Boolean,
    default: false
  }
}, { timestamps: true })

const appointmentModel = mongoose.models.appointment || mongoose.model('appointment', appointmentSchema)

export default appointmentModel
