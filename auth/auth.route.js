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

    const { fullname, email, password } = req.body;

    const existUser = await userModel.findOne({ email });
    if (existUser) {
        return res.status(400).json({ message: "User already exists" });
    }
const hashedPass = await bcrypt.hash(password, 10);

    const newUser = await userModel.create({ fullname, email, password: hashedPass });

    const payload = { userId: newUser._id, role: newUser.role };
const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "24h" });

// Optionally save token to user in DB
await userModel.findByIdAndUpdate(newUser._id, { token });

// Send token and user info back
res.cookie("token", token, {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  maxAge: 24 * 60 * 60 * 1000,
});
res.status(201).json({ token, userId: newUser._id, role: newUser.role });

   
});






authRouter.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

authRouter.get('/google/callback', passport.authenticate('google', { session: false }), async (req, res) => {
  let existUser = await userModel.findOne({ email: req.user.email });

  if (!existUser) {
    // New user: default role = user
    existUser = await userModel.create({
      avatar: req.user.avatar,
      email: req.user.email,
      fullname: req.user.fullname,
      role: 'user',
    });
  } else {
    // Update avatar but keep role
    await userModel.findByIdAndUpdate(existUser._id, { avatar: req.user.avatar });
  }

  const payload = {
    userId: existUser._id,
    role: existUser.role,
  };

  const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });


  await userModel.findByIdAndUpdate(existUser._id, { token });

  res.redirect(`${process.env.FRONT_END_URL}/?token=${token}`);
});









authRouter.post("/sign-in", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Enter email and password." });
  }

  const existUser = await userModel.findOne({ email }).select("+password role");

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


  await userModel.findByIdAndUpdate(existUser._id, { token });

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