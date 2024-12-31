import jwt from 'jsonwebtoken'

const authAdmin = async(req, res, next) => {
    try{
        const atoken = req.header("Authorization")?.replace("Bearer ", "")
        if(!atoken){
            return res.json({
                success:false,
                message:'Not Authorized Login Again'
            })
        }
        const decodedToken = jwt.verify(atoken,process.env.ADMIN_TOKEN_SECRET)
        if(decodedToken.email !== process.env.ADMIN_EMAIL){
            return res.json({
                success:false,
                message:'Not Authorized Login Again'
            })
        }

        next();

    } catch(error){
        res.status(error.code || 500).json({
            success: false,
            message: error.message
        })
    }
}

export default authAdmin