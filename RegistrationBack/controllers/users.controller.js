const Users = require("../models/user.model")
const AppError = require("../utils/AppError")
const catchAsync = require("../utils/catchAsync")

exports.getAllUsers = catchAsync(async (req,res,next) =>{
    const users = await Users.find({isDeleted : false}) //if isDeleted false function get it
    res.status(200).json({
        success : true,
        usersCount : Users.length,
        data : users
    })
})

exports.getOneUser = catchAsync(async (req,res,next) => {
    const user = await Users.findOne({_id : req.params.id,isDeleted : false})
    if(!user) return next(new AppError(404,`product not found with this id ${req.params.id}`))
    
    res.status(200).json({
    success : true,
    data : user
})    
})

exports.getDeletedUsers = catchAsync(async (req,res) =>{
    const users = await Users.find({isDeleted : true}).select("+deletedAt") //if isDeleted true function get it
    res.status(200).json({
        success : true,
        UsersCount : users.length,
        data : users
    })
})  



exports.createUser = catchAsync(async (req,res) =>{
    const user = await Users.create(req.body)
    user.isDeleted = undefined //make isDeleted don't appear
    
    res.status(201).json({
        success : true,
        message : "user is created successfully",
        data : user
    })    
})


exports.updateUser = catchAsync(async (req,res,next) =>{
    const user = await Users.findOneAndUpdate({_id : req.params.id,isDeleted : false},{...req.body,updatedAt : new Date()},{returnDocument: "after", runValidators : true})
    if(!user) return next(new AppError(404,`user not found with this id ${req.params.id}`)) 
    res.status(200).json({
    success : true,
    message :"user is updated successfully",
    data : user
})
})

exports.softDeletedUser = catchAsync(async (req,res,next)=>{
    const user = await Users.findOneAndUpdate({_id : req.params.id,isDeleted : false},{isDeleted : true, deletedAt : new Date() }) //.select("+deletedAt")
    if(!user) return next(new AppError(404,`user not found with this id ${req.params.id}`)) 
    res.status(204).send()
})


exports.deleteUser = catchAsync(async (req,res,next)=>{
    const user = await Users.findOneAndDelete({_id : req.params.id,isDeleted : false})
    if(!user) return next(new AppError(404,`user not found with this id ${req.params.id}`)) 
    res.status(204).send()
        
})
