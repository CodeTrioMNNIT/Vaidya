import jwt from 'jsonwebtoken'
import userModel from '../models/userModel.js'

const authUser = async(req, res, next) => {
    try{
        const token = req.header("Authorization")
        if(!token){
            return res.json({
                success:false,
                message:'Not Authorized Login Again'
            })
        }
        const decodedToken = jwt.verify(token,process.env.USER_TOKEN_SECRET)

        const user = await userModel.findById(decodedToken?._id).select("-password")
        if (!user) {
            res.status(401).json({
                success: false,
                message: "Invalid Access Token"
            })
        }
        
        req.user = user;
        next()

    } catch(error){
        res.status(error.code || 500).json({
            success: false,
            message: error.message
        })
    }
}

export default authUser