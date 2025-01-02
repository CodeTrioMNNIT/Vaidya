import express from "express"
import cors from "cors"
import adminRouter from "./routes/adminRoute.js"
import doctorRouter from "./routes/doctorRoute.js"

const app = express()

app.use(cors())
app.use(express.json())
app.use('/api/admin', adminRouter)
app.use('/api/doctor',doctorRouter)


export {app}