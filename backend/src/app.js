import express from "express"
import cors from "cors"
import adminRouter from "./routes/adminRoute.js"

const app = express()

app.use(cors())
app.use(express.json())
app.use('/api/admin', adminRouter)


export {app}