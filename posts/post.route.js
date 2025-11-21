const { Router } = require("express");
const postModels = require("../models/post.model");
const { isValidObjectId } = require("mongoose");
const { upload, deletefromcloudinary } = require("../config/clodinary.config");
const isAuth = require("../middlewares/isauth.middleware");



const postRouter = Router()

/**
 * @swagger
 * /posts:
 *   get:
 *     summary: Get all posts
 *     tags:
 *       - Posts
 *     description: Retrieve a list of all posts sorted by newest first.
 *     responses:
 *       200:
 *         description: A list of posts
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   _id:
 *                     type: string
 *                     example: 60f6f5f6e1f1c8a9d8f0e5b2
 *                   content:
 *                     type: string
 *                     example: This is a blog post
 *                   title:
 *                     type: string
 *                     example: Blog Title
 *                   image:
 *                     type: string
 *                     example: https://res.cloudinary.com/your-cloud/image/upload/v1234567890/uploads/example.jpg
 *                   author:
 *                     type: object
 *                     properties:
 *                       fullname:
 *                         type: string
 *                         example: John Doe
 *                       email:
 *                         type: string
 *                         example: john@example.com
 *       500:
 *         description: Server error
 */
postRouter.get("/", async (req, res) => {
    const posts = await postModels.find().sort({_id: -1}).populate({path: "author", select: "email"})
    res.status(200).json(posts)
})

/**
 * @swagger
 * /posts:
 *   post:
 *     summary: Create a new post
 *     tags:
 *       - Posts
 *     description: Creates a new blog post with optional image upload.
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *               - title
 *             properties:
 *               title:
 *                 type: string
 *                 example: My Blog Title
 *               content:
 *                 type: string
 *                 example: This is the content of the blog post.
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Post created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: created
 *       400:
 *         description: Missing required fields
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: fill in user-id
 */
postRouter.post("/",isAuth, upload.single("image"), async (req, res) => {
    const { descriptione, Location } = req.body;
    const image = req.file?.path;

    if (!image || !descriptione || !Location) {
        return res.status(400).json({ message: "All fields are required" });
    }

    await postModels.create({
        image,
        descriptione,
        Location,
        author: req.userId
    });

    res.status(201).json({ message: "created" });
});


/**
 * @swagger
 * /posts/{id}:
 *   delete:
 *     summary: Delete a post
 *     tags:
 *       - Posts
 *     description: Deletes a post by ID. Only the author of the post can delete it. If the post has an image, it will be removed from Cloudinary.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID of the post to delete
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Post deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: deleted
 *       400:
 *         description: Invalid ID
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: invalid id
 *       401:
 *         description: Unauthorized (not the post author)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: no permission
 */
postRouter.delete("/:id", isAuth, async (req, res) => {
    const {id} = req.params
    if(!isValidObjectId()){
        return  res.status(400).json({message: "invalid id"})
    }

    const post = await postModels.findById(id)

    if(post.author.toString() !== req.userId){
        return  res.status(401).json({message: "no permission"})
    }

    if (post.image) {
        const publicId = post.image.split("/").pop().split(".")[0]; 
        await deletefromcloudinary(`uploads/${publicId}`); 
    }

    await postModels.findByIdAndDelete(id)
    res.status(200).json({message: "deleted"})
})


module.exports = postRouter