const { Router } = require("express");
const userSchema = require("../validations/user.validation");
const userModel = require("../models/users.model");
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken');
const isAuth = require("../middlewares/isauth.middleware");
const passport = require("../config/google.stategy");
require('dotenv').config()

const authRouter = Router()

/**
 * @swagger
 * /auth/sign-up:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fullname
 *               - email
 *               - password
 *             properties:
 *               fullname:
 *                 type: string
 *                 example: John Doe
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john.doe@example.com
 *               password:
 *                 type: string
 *                 example: password123
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: user registered successfully
 *       400:
 *         description: Bad request (validation error or user already exists)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: user already exists
 */
authRouter.post('/sign-up', async (req, res) => {
    const { error } = userSchema.validate(req.body || {})
    if (error) {
        return res.status(400).json(error)
    }
    const { fullname, email, password } = req.body

    const existUser = await userModel.findOne({ email })
    if (existUser) {
        return res.status(400).json({ message: 'user already exist' })
    }

    const hashedPass = await bcrypt.hash(password, 10)
    await userModel.create({ fullname, password: hashedPass, email })
    res.status(201).json({ message: "user registered successfully" })

})

authRouter.get('/google', passport.authenticate('google', {scope: ['profile', 'email']}))

authRouter.get('/google/callback', passport.authenticate('google', {session: false}), async (req, res) =>{
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
     const payload = {
        userId: existUser._id,
        role: existUser.role
    }

    const token = await jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' })

    res.redirect(`${process.env.FRONT_END_URL}/sign-in?token=${token}`)
})

/**
 * @swagger
 * /auth/sign-in:
 *   post:
 *     summary: Authenticate a user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john.doe@example.com
 *               password:
 *                 type: string
 *                 example: password123
 *     responses:
 *       200:
 *         description: JWT token returned
 *         content:
 *           application/json:
 *             schema:
 *               type: string
 *               example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *       400:
 *         description: Invalid email or password
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: email or password is invalid
 */
authRouter.post('/sign-in', async (req, res) => {
    console.log(req.body, "reqbodu")
    const { email, password } = req.body || {}
    if (!email || !password) {
        return res.status(400).json({ message: 'email and password is required' })
    }

    const existUser = await userModel.findOne({ email }).select('password role')
    if (!existUser) {
        return res.status(400).json({ message: 'emial or password is invalid' })
    }

    const isPassEqual = await bcrypt.compare(password, existUser.password)
    if (!isPassEqual) {
        return res.status(400).json({ message: 'emial or password is invalid' })
    }

    const payload = {
        userId: existUser._id,
        role: existUser.role
    }

    const token = await jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' })

    res.json(token)
    
})

/**
 * @swagger
 * /auth/current-user:
 *   get:
 *     summary: Get current user details
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: header
 *         name: Authorization
 *         required: true
 *         type: string
 *         description: Bearer token for authentication
 *         example: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *     responses:
 *       200:
 *         description: User details returned
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 _id:
 *                   type: string
 *                   example: "60d0fe4f5311236168a109ca"
 *                 fullname:
 *                   type: string
 *                   example: "John Doe"
 *                 email:
 *                   type: string
 *                   example: "john.doe@example.com"
 *                 role:
 *                   type: string
 *                   example: "user"
 *       401:
 *         description: Unauthorized access
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Unauthorized
 */
authRouter.get('/current-user', isAuth, async (req, res) => {
    const user = await userModel.findById(req.userId)
    res.json(user)
})

module.exports = authRouter