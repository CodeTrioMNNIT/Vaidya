const asyncHandler = (fn) => async (req, res) => {
    try{
        await fn(req , res)
    } catch (error) {
        res.status(error.code || 500).json({
            success: false,
            message: error.message
        })
    }
}

export {asyncHandler}