module.exports = class AppError extends Error{
    constructor(s,m){
        super(m) //message
        this.status = s
        this.isOperational = true //to don't take syntax error with my class
    }
}