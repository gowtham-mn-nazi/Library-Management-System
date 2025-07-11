import jwt from 'jsonwebtoken';

const adminAuth = async (req, res, next) => {
  try {
    const {token} = req.headers
    if(!token) {
        return res.json({success:false,msg:"Not authorized, Login again"})
    }
    const tokenDecode = jwt.verify(token,process.env.JWT_SECRET);
    if(tokenDecode !== process.env.ADMIN_USERID + process.env.ADMIN_PASSWORD) {
        return res.json({success:false,msg:"Not authorized, Login again"})
    }
    next()
  } 
  catch (error) {
    console.log(error);
    res.json({ success: false, msg: error.message });
  }
};

export default adminAuth;