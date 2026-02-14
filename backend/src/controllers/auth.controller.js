import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";


const createTransporter = () => {
    return nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT),
        secure: false, 
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
    });
} 


const sendOtpEmail = async(to,otp) => {
    const transporter = createTransporter();
    const text = `Your verification code is ${otp}. It expires in ${process.env.OTP_EXPIRE_MIN || 10} minutes.`;
    await transporter.sendMail({
        from: process.env.SMTP_USER,
        to,
        subject: "Your OTP for AI Learning Path Generator",
        text,
    });
};

const generateOtp = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
}
export const register = async (req,res)=>{
    try{
        const {email,password} = req.body;
        if(!email || !password) return res.status(400).json({message: "Email and Password required"});
        const name = email.split("@")[0];

        const exists = await User.findOne({email});
        if(exists) return res.status(409).json({message: "User exists"});

        const hashed = await bcrypt.hash(password,10);
        const otp = generateOtp();
        const otpExpires = new Date(Date.now() + (Number(process.env.OTP_EXPIRE_MIN || 10) * 60 * 1000));

        const user = await User.create({name,email,password: hashed, otp, otpExpires, isVerified: false});

        try{
            await sendOtpEmail(user.email, otp);
        } catch(emailErr){
            console.error("Failed to send OTP email: ", emailErr);
            return res.status(500).json({message: "Failed to send OTP email"});
        }

        res.status(201).json({message: "Registered successfully. OTP sent to email. "});
    } catch(err){
        console.error(err);
        res.status(500).json({message: "Registration failed"});
    }
    

};

export const login = async (req,res) =>{
    try{
        const {email,password} = req.body;

        const user = await User.findOne({email});
        if(!user) return res.status(401).json({message: "User not found"});
        if(!user.isVerified) return res.status(403).json({message: "Email not verified"});

        const match = await bcrypt.compare(password, user.password);
        if(!match) return res.status(401).json({message: "Invalid Password"});

        const token = jwt.sign(
            {id: user._id},
            process.env.JWT_SECRET, 
            {expiresIn: "7d"}
        );
        res.json({token});
    } catch(err){
        console.error(err);
        res.status(500).json({message: "Login failed"});
    }
};

export const verifyOtp = async(req,res) => {
    try{
        const {email, otp} = req.body;
        if(!email || !otp) return res.status(400).json({message: "Email and OTP required"});

        const user = await User.findOne({email});
        if(!user) return res.status(404).json({message: "User not found"});
        if(user.isVerified) return res.status(400).json({message: "Account already verified"});

        if(!user.otp || user.otp != otp) return res.status(400).json({message: "Invalid OTP"});
        if(user.otpExpires && user.otpExpires < new Date()) return res.status(400).json({message: "OTP expired"});

        user.isVerified = true;
        user.otp = undefined;
        user.otpExpires = undefined;
        await user.save();

        const token = jwt.sign(
            { id: user._id },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        res.json({message: "Account verified successfully"});
    } catch(err){
        console.error(err);
        res.status(500).json({message: "OTP verification failed"});
    }
};

export const resendOtp = async (req,res) => {
    try{
        const {email} = req.body;
        if(!email) return res.status(400).json({message: "Email required"});

        const user = await User.findOne({email});
        if(!user) return res.status(404).json({message: "User not found"});
        if(user.isVerified) return res.status(400).json({message: "Account already verified"});

        const otp = generateOtp();
        const otpExpires = new Date(Date.now() + (Number(process.env.OTP_EXPIRE_MIN || 10) * 60 * 1000));

        user.otp = otp;
        user.otpExpires = otpExpires;
        await user.save();

        await sendOtpEmail(user.email, otp);
        
        res.json({message: "OTP resent to your email"});
    } catch(err) {
        console.error(err);
        res.status(500).json({message: "Failed to resend OTP"});
    }
};

