const app = require("./app")

// const {setServers} = require("dns/promises")
// setServers(["8.8.8.8","8.8.4.4"])


const connectDB = require("./config/connectDB")
connectDB()



const port = process.env.PORT || 5000

app.listen(port,() => {
    console.log(`server is running at port ${port}`);
})