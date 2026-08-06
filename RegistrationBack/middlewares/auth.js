const jwt = require("jsonwebtoken")
const AppError = require("../utils/AppError")
const catchAsync = require("../utils/catchAsync")
const Users = require("../models/user.model")

const authMiddleware = catchAsync(async (req,res,next) => {
    if(req.headers.authorization) {
        const token = req.headers.authorization.split(" ")[1]
        const {_id} = await jwt.verify(token,process.env.SECRET_KEY)
        const user = await Users.findOne({isDeleted:false ,_id})
        req.user = user
        next()
    } else {
        return next(new AppError(401,"please login first"))
    }
})

module.exports = authMiddleware