import multer from 'multer'
import path from "path"

const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, './public/temp')
    },
    filename: function(req, file, callback){
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const fileName = file.originalname + uniqueSuffix
        callback(null, fileName + path.extname(file.originalname))
    }
})

const upload = multer({storage})

export default upload