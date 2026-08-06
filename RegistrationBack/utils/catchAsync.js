const AppError = require("./AppError")

module.exports = fn => (req,res,next) =>{
    Promise.resolve(fn(req,res,next)).catch(next)
}