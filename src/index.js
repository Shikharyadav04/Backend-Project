// require('dotenv').config({path : './env'})
import dotenv from 'dotenv'
import connectDB from "./db/index.js";
import { app } from './app.js';


dotenv.config({
    path : './.env'
})

const port = process.env.PORT ;

connectDB()
.then(() => {
    app.on('error',(error) => {
        console.error("ERROR AT CONNECTING APP !! :",error);
       
    })
    app.listen(port,() => {
        console.log(`SUCESSFULLY LISTENING AT : ${port}`);
    })
})
.catch((error) =>{
    console.log("DATABASE CONNECTION FAILED !! :",error)
})











/*
;(async () => {
    try {
        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        app.on("error" , (error) => {
            console.log("ERROR :",error) ;
            throw error
        })

        app.listen(process.env.PORT, () => {
            console.log(`App is listen on port ${process.env.PORT}`)
        })
    } catch (error) {
        console.error("ERROR : ",error )
        throw error
    }
})()



*/