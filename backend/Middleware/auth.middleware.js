const jwt=require("jsonwebtoken")
const auth=(req,res,next)=>{
    const token=req.cookies.token;
    if (!token) return res.status(401).json({ msg: "Not Logged in" });

    try {
        const decoded = jwt.verify(token, "masai");
        req.user = decoded;
        next();
    } catch (err) {
        res.status(403).json({ msg: "Invalid Token" });
    }
}
module.exports={auth}