const express = require("express");
const app = express();
require("dotenv").config();
const main = require("./config/db")


const port = process.env.PORT;

const initializeConnection = async ()=>{
    try{
        await Promise.all([main()]);
        console.log("DB connected");

        app.listen(port,()=>{
            console.log("Server is listening at port : ",port);
        });
    }
    catch(err){
        console.log("Error : ",err.message);
    }
}

initializeConnection();
