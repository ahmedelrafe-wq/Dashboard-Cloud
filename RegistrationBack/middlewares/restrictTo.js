const AppError = require("../utils/AppError")
const catchAsync = require("../utils/catchAsync");



const restrictTo = (...roles) => catchAsync(async (req,res,next) => {
    const {role} = req.user
    if(roles.includes(role)) {
        next()
    } else {
        next(new AppError(403,"this route is protected"))
    }
}) 

module.exports = restrictTo