const asyncHandler = (fn) => async (req, res) => {
    try{
        await fn(req , res)
    } catch (error) {
        res.json({
            success: false,
            message: error.message
        })
    }
}

export {asyncHandler}