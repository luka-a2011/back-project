const { Router } = require("express");
const userSchema = require("../models/users.model");
const userModel = require("../models/users.model");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const passport = require("../config/google.stategy")
const isAuth = require("../middlewares/isauth.middleware");
require("dotenv").config()
const authRouter = Router()




authRouter.post("/sign-up", async (req, res) => {
    const { error } = userSchema.validate(req.body || {});
    if (error) {
        return res.status(400).json({ message: error.details[0].message });
    }

    const { fullName, email, password } = req.body;

    const existUser = await userModel.findOne({ email });
    if (existUser) {
        return res.status(400).json({ message: "User already exists" });
    }

    const hashedPass = await bcrypt.hash(password, 10);

    const newUser = await userModel.create({ fullName, email, password: hashedPass });

    return res.status(201).json({ userId: newUser._id });
});






authRouter.get('/google', passport.authenticate('google', {scope: ['profile', 'email']}))

authRouter.get('/google/callback', passport.authenticate('google', {session: false}), async (req, res) =>{
  let existUser = await userModel.findOne({ email: req.user.email });

if (!existUser) {
  // New user: default to 'user'
  existUser = await userModel.create({
    avatar: req.user.avatar,
    email: req.user.email,
    fullName: req.user.fullName,
    role: 'user',
  });
} else {
  // Update avatar (or other info) but keep existing role
  await userModel.findByIdAndUpdate(existUser._id, {
    avatar: req.user.avatar,
  });
}

    await userModel.findByIdAndUpdate(existUser._id, {avatar: req.user.avatar})
     const payload = {
        userId: existUser._id,
        role: existUser.role
    }

    const token = await jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' })

res.redirect(`${process.env.FRONT_END_URL}/?token=${token}`);

})








authRouter.post("/sign-in", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Enter email and password." });
  }

  const existUser = await userModel.findOne({ email }).select("password role");

  console.log("existUser:", existUser); 

  if (!existUser) {
    return res.status(400).json({ message: "Email or password is invalid" });
  }

  const isPassEqual = await bcrypt.compare(password, existUser.password);
  if (!isPassEqual) {
    return res.status(400).json({ message: "Email or password invalid" });
  }

  const payload = {
    userId: existUser._id,
    role: existUser.role,
  };

  const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "24h" });



  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production", 
    maxAge: 24 * 60 * 60 * 1000, 
  });
  res.json({ token, role: existUser.role });
});




authRouter.get("/current-user", isAuth, async (req, res) => {
    const user = await userModel.findById(req.userId)
    res.json(user)
})

module.exports = authRouter