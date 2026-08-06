const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const crypto = require("crypto")
const {promisify} = require("util")
const Users = require("../models/user.model")
const AppError = require("../utils/AppError")
const catchAsync = require("../utils/catchAsync")
const { customAlphabet } = require("nanoid")
const sendEmail = require("../utils/sendEmail")

const jwtSign = promisify(jwt.sign)

exports.signUp = catchAsync(async (req,res,next) => {
    const {email,password} = req.body
    //email exist
    const findUser = await Users.findOne({isDeleted : false,email})
    if(findUser) return next(new AppError(400,`This Email is already used`))
    if (!password || password.length < 6) return next(new AppError(400, "Password must be at least 6 characters"));
    //hash password
    const salt = await bcrypt.genSalt(+process.env.SALT_ROUNDS) //more rounds less performance &&&&& + to be number
    const hashedPassword = await bcrypt.hash(password,salt)
    //generate otp      nodemailer
    const otp = customAlphabet("0123456789",6)()
    const hashedOTP = await bcrypt.hash(otp,salt)
    const otpDate = Date.now() + (10 * 60 *1000) //valid for 10 minuit
    //save user
    const user = await Users.create({...req.body,otp: hashedOTP,password : hashedPassword,otpDate})
    user.password = undefined
    user.otp = undefined
    user.otpDate = undefined
    user.isDeleted = undefined
    //send email
    sendEmail(email , "confirm email","", `<h1>the otp is ${otp}</h1>`)
    
    res.status(200).json({
        success : true,
        message : "user is created",
        data : user
    })
})


exports.confirmEmail = catchAsync(async (req,res,next) => {
    const {email,otp} = req.body
    const findUser = await Users.findOne({isDeleted : false,email})
    if(!findUser) return next(new AppError(400,`This Email is not found please signUp`))
    if(findUser.isConfirm) return next(new AppError(400,`This Email is already active`))
    const check = await bcrypt.compare(otp,findUser.otp) // return boolean
    if(!otp || !check || findUser.otpDate < Date.now()) return next(new AppError(400,`invalid OTP or expired`))
    findUser.isConfirm = true
    findUser.otp = undefined
    findUser.otpDate = undefined
    await findUser.save()  //change DataBase
    res.status(200).json({
        success : true,
        message : "email is confirmed"
    })
})
    
exports.login = catchAsync(async (req,res,next) => {
    const {email,password} = req.body
    const findUser = await Users.findOne({isDeleted : false,email}).select("+password")
    if(!findUser) return next(new AppError(400,`email or password incorrect`))
    if(!findUser.isConfirm) return next(new AppError(400,`this email isn't active`))
    const check = await bcrypt.compare(password,findUser.password)
    console.log("Entered Password:", password);
    console.log("Hashed Password:", findUser.password);
    console.log("Compare Result:", check);
    if(!check) return next(new AppError(400,`invalid credential`))
    const token = await jwtSign({_id : findUser.id},process.env.SECRET_KEY,{expiresIn:"7d"})  //token saved in localstorage or cookies
    res.status(200).json({
        success : true,
        data :{
            accessToken : token
        }
    })
})

exports.forgetPassword = catchAsync(async(req,res,next) => {
    const {email} = req.body
    const findUser = await Users.findOne({email, isDeleted:false })
    if(!findUser) return next(new AppError(404,"this user is not found"))
    const resetToken = await crypto.randomBytes(32).toString("hex") //crypto built in module in node
    findUser.resetToken = resetToken
    // findUser.resetDate = Date.now() + 10 * 60 * 1000
    await findUser.save()
    const link = `http://localhost:4200/reset-password?token=${resetToken}`
    await sendEmail(email,"Reset Password","",`<h3>${link}</h3>`)

    res.status(200).json({success:true,message:"Reset Link sent to email"})
})

exports.resetPassword = catchAsync(async(req,res,next) => {
    const {token} = req.params 
    const {password} = req.body
    const findUser = await Users.findOne({resetToken:token,isDeleted:false})
    if(!findUser) return next(new AppError(400,'The link is expired'))
    if(password.length < 6) return next(new AppError(400,'please send valid password'))
    const hashPassword = await bcrypt.hash(password,+process.env.SALT_ROUNDS)
    findUser.password = hashPassword 
    findUser.resetToken = null 
    // findUser.resetDate = null 
    await findUser.save()
    res.status(200).json({
        success:true ,
        message : 'password reset successfully'
    })
})