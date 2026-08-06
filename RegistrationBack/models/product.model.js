const mongoose = require("mongoose")

const productSchema = new mongoose.Schema({
    name : {
        type : String,
        required : true,
        unique : true,
        minlength : [3,"main char is 3"],
        maxlength : [30,"max length is 30"]
    },
    price : {
        type : Number,
        required : true,
        min : [1,"price must be positive value"],
        max : [1000,"max value of price is 1000"]
    },
    description : {
        type : String,
        required : true,
        minlength : [3,"main char is 3"]
    },
    image : {
        type : String,
    },
    category : {
        type : String,
        required :true,
        enum : ["clothes","sports","electronics"]
    },
    isDeleted : {
        type : Boolean,
        default : false,
        select : false
    },
    // createdAt : {
    //     type : Date,

    // }
    deletedAt : {
        type : Date,
        select : false
    }

} , {
    timestamps : true,  //default schema, create (createdAt , updatedAt)
    versionKey : false
}
)

const Products = mongoose.model("Product",productSchema)     //must first letter capital when make models and collections first letter capital and no s in end
module.exports = Products