const mongoose = require("mongoose")
module.exports = async function (){
    try {
        const con = await mongoose.connect(process.env.LOCAL_DATABASE)
    console.log(`Database is connected in name ${con.connection.name} ✅`);
    } catch (error) {
        console.log(`Database Error : ${error}`);
        
    }
}