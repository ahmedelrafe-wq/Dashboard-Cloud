const AppError = require("../utils/AppError");

module.exports = (err,req,res,next) =>{
    console.log(err);
    
    if(err.kind == "objectId") err = new AppError(400,`Not Valid mongo id with value ${err.value} it's must be 24 char`)
    
    if(err.name == "ValidationError") {
        let message = Object.values(err.errors).map(err => err.message).join(", ").replaceAll("path","")
        err = new AppError(400,message)
    }
    if(err.code == 11000) err = new AppError(404,`Duplicated key ${Object.keys(err.keyValue)[0]} and it's ${Object.values(err.keyValue)[0]}`)
    if(err.name == "JsonWebTokenError") err = new AppError(400,"invalid token")
    if(err.name == "TokenExpiredError") err = new AppError(400,"token expired please login again")
    
    if(process.env.ENVIRONMENT === "production"){
        res.status(err.status || 500).json({
            success : false,
            message : err.message || `internal server error`
        })
    }else{
        res.status(err.status || 500).json({
            success : false,
            message : err.message || `internal server error`,
            stack : err.stack
        })
    }
}
