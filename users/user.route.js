const { Router } = require("express");
const userModel = require("../models/users.model");
const {upload, deleteFromCloudinary} = require("../config/clodinary.config");
const postModel = require("../models/post.model");


const userRouter = Router()

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Get all users
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all users
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   _id:
 *                     type: string
 *                     example: "60d0fe4f5311236168a109ca"
 *                   fullName:
 *                     type: string
 *                     example: "John Doe"
 *                   email:
 *                     type: string
 *                     example: "john.doe@example.com"
 *                   avatar:
 *                     type: string
 *                     example: "https://example.com/avatar.jpg"
 */
userRouter.get('/', async (req, res) => {
    const users = await userModel.find().sort({_id: -1})
    res.status(200).json(users)
})

/**
 * @swagger
 * /users:
 *   put:
 *     summary: Update user details
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "john.doe@example.com"
 *               avatar:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: User updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "user updated successfully"
 *       403:
 *         description: Unauthorized access
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "You don't have permission"
 */
userRouter.put('/', upload.single('avatar') , async (req, res) => {
    const id = req.userId
    const {email} = req.body
    const filePath = req.file.path
    const user = await userModel.findById(id)
    if(filePath){
        const deleteId = user.avatar?.split('uploads/')[1]
        const id = deleteId.split('.')[0]
        console.log(deleteId, "deleteId")
        console.log(id, "id")
        await deleteFromCloudinary(`uploads/${id}`)
    }

    await userModel.findByIdAndUpdate(id, {email, avatar: filePath })
    // await deleteFromCloudinary(req.file.filename)
    res.status(200).json({message: "user updated successfully"})
})

/**
 * @swagger
 * /users/{id}:
 *   delete:
 *     summary: Delete a user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the user to delete
 *     responses:
 *       200:
 *         description: User deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "user deleted successfully"
 *       403:
 *         description: Unauthorized access
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "You don't have permission"
 */
userRouter.delete('/:id', async (req, res) => {
    const targetUserId = req.params.id
    const userId = req.userId

    const user = await userModel.findById(userId)
    const targetUser = await userModel.findById(targetUserId)

    if(user.role !== 'admin' && targetUserId !== userId){
        return res.status(403).json({error: "You dont have perimition"})
    }

    await userModel.findByIdAndDelete(targetUserId)
    await postModel.deleteMany({author: targetUserId})
    res.json({message: 'user deleted successfully'})
})

module.exports = userRouter

// Express backend route