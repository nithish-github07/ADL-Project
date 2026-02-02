import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export const register = async (req,res)=>{
    const {name,email,password} = req.body;
    
    const exists = await User.findOne({email});
    if(exists) return res.status(409).json({message: "User exists"});

    const hashed = await bcrypt.hash(password,10);

    await User.create({name,email,password: hashed});

    res.status(201).json({message: "Registered successfully"});
};

export const login = async (req,res) =>{
    const {email, password} = req.body;

    const user = await User.findOne({email});
    if(!user) return res.status(404).json({message: "User not found"});

    const match = await bcrypt.compare(password, user.password);
    if(!match) return res.status(401).json({message: "Invalid Password"});

    const token = jwt.sign(
        {id: user._id},
        process.env.JWT_SECRET,
        {expiresIn: "7d"}
    );


    res.json({token});
};