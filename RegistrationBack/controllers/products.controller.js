const Products = require("../models/product.model")
const ApiFeature = require("../utils/Apifeatures")
const AppError = require("../utils/AppError")
const catchAsync = require("../utils/catchAsync")

exports.getAllProducts = catchAsync(async (req,res,next) =>{
    const features = new ApiFeature(Products.find({isDeleted : false}), req.query).filter()
    const products = await  features.query //Products.find({isDeleted : false}) //if isDeleted false function get it
    res.status(200).json({
        success : true,
        productsCount : products.length,
        data : products
    })
})

exports.getOneProduct = catchAsync(async (req,res,next) => {
    // const product = await Products.findById(req.params.id)
    // const product = await Products.find({_id : req.params.id,isDeleted : false}) //if data empty the return still true and it is wrong
    const product = await Products.findOne({_id : req.params.id,isDeleted : false})
    if(!product) return next(new AppError(404,`product not found with this id ${req.params.id}`))    //res.status(404).json({success : false, message : `No Product found with this id ${req.params.id}` })
    
    res.status(200).json({
    success : true,
    data : product
})    
})

exports.getDeletedProducts = catchAsync(async (req,res) =>{
    const products = await Products.find({isDeleted : true}).select("+deletedAt") //if isDeleted true function get it
    res.status(200).json({
        success : true,
        productsCount : products.length,
        data : products
    })
})  


exports.getStates = catchAsync(async (req,res) =>{
    const states = await Products.aggregate([
        {$sort : {price :-1}},
        {$group : {
            _id : "$category",
            sum : {$sum : 1},
            minPrice : {$min : "$price"},
            maxPrice : {$max : "$price"},
            avgPrice : {$avg : "$price"},
            ExProduct : {$first : "$$ROOT"}
        }}
    ])

    res.status(200).json({
        success : true,
        data : states
    })
})



exports.createProduct = catchAsync(async (req,res) =>{
    const product = await Products.create(req.body)
    product.isDeleted = undefined //make isDeleted don't appear
    
    res.status(201).json({
        success : true,
        message : "product is created successfully",
        data : product
    })    
    
    // const product = new Products(req.body)
    // await product.save()
})


exports.updateProduct = catchAsync(async (req,res,next) =>{
    const product = await Products.findOneAndUpdate({_id : req.params.id,isDeleted : false},{...req.body,updatedAt : new Date()},{returnDocument: "after", runValidators : true})
    // if(!product) return res.status(404).json({success : false, message : `No Product found with this id ${req.params.id}` })
    if(!product) return next(new AppError(404,`product not found with this id ${req.params.id}`)) 
    res.status(200).json({
    success : true,
    message :"product is updated successfully",
    data : product
})
})

exports.softDeletedProduct = catchAsync(async (req,res,next)=>{
    const product = await Products.findOneAndUpdate({_id : req.params.id,isDeleted : false},{isDeleted : true, deletedAt : new Date() }) //.select("+deletedAt")
    // if(!product) return res.status(404).json({success : false, message : `No Product found with this id ${req.params.id}` })
    if(!product) return next(new AppError(404,`product not found with this id ${req.params.id}`)) 
    res.status(204).send()
})


exports.deleteProduct = catchAsync(async (req,res,next)=>{
    const product = await Products.findOneAndDelete({_id : req.params.id,isDeleted : false})
    // if(!product) return res.status(404).json({success : false, message : `No Product found with this id ${req.params.id}` })
    if(!product) return next(new AppError(404,`product not found with this id ${req.params.id}`)) 
    res.status(204).send()
        
})
