import express from "express"
import cors from "cors"
import adminRouter from "./routes/adminRoute.js"
import doctorRouter from "./routes/doctorRoute.js"
import userRouter from "./routes/userRoutes.js"

const app = express()

app.use(cors())
app.use(express.json())
app.use('/api/admin', adminRouter)
app.use('/api/doctor',doctorRouter)
app.use('/api/user', userRouter)


export {app}