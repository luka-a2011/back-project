const { Router } = require("express");
const userSchema = require("../validations/user.validation");
const userModel = require("../models/users.model");
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken');
const isAuth = require("../middlewares/isauth.middleware");
const passport = require("../config/google.stategy");
require('dotenv').config()

const authRouter = Router()

// SIGN-UP
authRouter.post('/sign-up', async (req, res) => {
    try {
        const { error } = userSchema.validate(req.body || {})
        if (error) return res.status(400).json({ message: error.message })

        const { fullname, email, password } = req.body
        const existUser = await userModel.findOne({ email })
        if (existUser) return res.status(400).json({ message: 'user already exist' })

        const hashedPass = await bcrypt.hash(password, 10)
        await userModel.create({ fullname, password: hashedPass, email })

        res.status(201).json({ message: "user registered successfully" })
    } catch (err) {
        console.error("SIGN-UP ERROR:", err)
        res.status(500).json({ message: "Internal server error", error: err.message })
    }
})  

// GOOGLE LOGIN
authRouter.get('/google', passport.authenticate('google', {scope: ['profile', 'email']}))

authRouter.get('/google/callback', passport.authenticate('google', {session: false}), async (req, res) => {
    try {
        let existUser = await userModel.findOne({email: req.user.email})

        if(!existUser){
            existUser = await userModel.create({
                avatar: req.user.avatar,
                email: req.user.email,
                fullname: req.user.fullname,
                role: 'user',
            })
        }

        await userModel.findByIdAndUpdate(existUser._id, {avatar: req.user.avatar})
        const payload = { userId: existUser._id, role: existUser.role }

        const token = await jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' })

        res.redirect(`${process.env.FRONT_END_URL}/Login?token=${token}`)
    } catch (err) {
        console.error("GOOGLE LOGIN ERROR:", err)
        res.status(500).send("Internal server error")
    }
})

// SIGN-IN
authRouter.post('/sign-in', async (req, res) => {
    try {
        const { email, password } = req.body || {}
        if (!email || !password) return res.status(400).json({ message: 'email and password is required' })

        const existUser = await userModel.findOne({ email }).select('password role')
        if (!existUser) return res.status(400).json({ message: 'email or password is invalid' })

        const isPassEqual = await bcrypt.compare(password, existUser.password)
        if (!isPassEqual) return res.status(400).json({ message: 'email or password is invalid' })

        const payload = { userId: existUser._id, role: existUser.role }
        const token = await jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' })

        // ✅ Send token in an object
        res.json({ token, role: existUser.role })
    } catch (err) {
        console.error("SIGN-IN ERROR:", err)
        res.status(500).json({ message: "Internal server error", error: err.message })
    }
})

// CURRENT USER
authRouter.get('/current-user', isAuth, async (req, res) => {
    try {
        const user = await userModel.findById(req.userId)
        res.json(user)
    } catch (err) {
        console.error("CURRENT USER ERROR:", err)
        res.status(500).json({ message: "Internal server error" })
    }
})

module.exports = authRouter
