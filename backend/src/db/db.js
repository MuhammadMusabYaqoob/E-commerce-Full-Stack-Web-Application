import mongoose from "mongoose"
import { DB_NAME } from "../constants.js"
export const connectDB = async ()=>{
    try {
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        // console.log(`Connection Instance: ${connectionInstance}`)
        // console.log("MongoDB Connected Successfully 🚀")
        // console.log("Connection Instance:", connectionInstance);
        // console.log(`DB NAME: ${connectionInstance.connection.name}`)
        // console.log(`DB HOST: ${connectionInstance.connection.host}`)
        // console.log(`DB PORT: ${connectionInstance.connection.port}`)
        // console.log(`DB USER: ${connectionInstance.connection.user}`)
        // console.log(`DB PASSWORD: ${connectionInstance.connection.password}`)
        // console.log(`DB URI: ${process.env.MONGODB_URI}`)
        // console.log(`DB STATUS: ${connectionInstance.connection.readyState}`)
    } catch (error) {
        console.log("MONGODB connection FAILED", error)
        process.exit(1)
    }
}