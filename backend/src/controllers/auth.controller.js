export const register = (req,res)=>{
    const {name,email} = req.body;

    res.json({
        message: "User registered successfully",
        user: {name, email}
    });
};

export const login = (req,res) =>{
    res.json({
        message: "User logged in successfully"
    });
};