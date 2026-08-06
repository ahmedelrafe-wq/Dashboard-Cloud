require("dotenv").config()
const express = require("express")
const morgan = require("morgan")
const cors = require("cors");
const path = require("path")
const productRouter = require("./routes/products.route")
const userRouter = require("./routes/users.route")
const authRouter = require("./routes/auth.route")
const globalError = require("./middlewares/globalError")

const app = express()

app.use(cors());
app.use(express.json())
app.use(express.static(path.join(__dirname,"assets")))
app.use(morgan("dev"))


// app.use("/custom",(req,res,next) => {
//     let flag = false
//     if(flag){
//         next()
//     }else{
//         res.status(200).send("don't move to next middleware")
//     }
// })


app.get("/", (req,res)=>{
    res.status(200).json({
        success : true,
        message : "welcome to server 1.0.0"
    })
})


// app.get("/custom",(req,res)=>{
//     res.status(200).send("final round")
// })


app.use("/auth",authRouter)
app.use("/products",productRouter)
app.use("/users",userRouter)



app.use((req,res)=>{
    res.status(404).sendFile(path.join(__dirname,"views","error.html"))
})

//Global error Middleware
app.use(globalError)






module.exports = app