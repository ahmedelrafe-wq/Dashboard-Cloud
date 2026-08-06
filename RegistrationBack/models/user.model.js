const mongoose = require("mongoose")

const userSchema = new mongoose.Schema({
    name : {
        type :String,
        required : true,
        minlength : [3,"main char is 3"],
        maxlength : [20,"max length is 20"]
    },
    email : {
        type : String,
        unique : true,
        lowercase : true,
        minlength : [3,"main char is 3"]
    },
    password :{
        type : String,
        required : true,
        minlength : [6,"main char is 6"],
        select : false
    },
    isDeleted : {
        type : Boolean,
        default : false,
        select : false
    },
    role : {
        type : String,
        default : "user",
        enum : ["user","admin"]
    },
    isConfirm : {
        type : Boolean,
        default : false
    },
    otp : {
        type : String,
    },
    otpDate : {
        type : Date,
    },
    resetToken :{
        type : String,
    }
},{
    timestamps : true,
    versionKey : false
})

const Users = mongoose.model("User",userSchema)

module.exports = Users