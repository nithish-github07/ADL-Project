import app from "./app.js";
import connectDB from "./config/db.js";

import dotenv from "dotenv"
dotenv.config()

export const config = {
    port: process.env.PORT || 5000
};
connectDB();

app.listen(config.port, ()=>{
    console.log(`Server running on port ${config.port}`);
});