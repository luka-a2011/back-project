const { Router } = require("express");
const postModels = require("../models/post.model");
const isAuth = require("../middlewares/isauth.middleware");
const { upload, deletefromcloudinary } = require("../config/clodinary.config"); // your multer/cloudinary setup
const { isValidObjectId } = require("mongoose");

const postRouter = Router();

// GET all posts
postRouter.get("/", async (req, res) => {
  try {
    const posts = await postModels
      .find()
      .sort({ _id: -1 })
      .populate({ path: "author", select: "email fullname role" });
    res.status(200).json(posts);
  } catch (err) {
    console.error("GET /posts error:", err);
    res.status(500).json({ message: "Server error getting posts" });
  }
});

// CREATE new post
postRouter.post("/", isAuth, upload.single("image"), async (req, res) => {
  try {
    const { descriptione, Location } = req.body;

    if (!req.file) {
      return res.status(400).json({ message: "Image is required" });
    }

    const image = req.file.path; // multer-cloudinary gives path as URL

    if (!descriptione || !Location) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const post = await postModels.create({
      image,
      descriptione,
      Location,
      author: req.userId,
    });

    res.status(201).json(post);
  } catch (err) {
    console.error("POST /posts error:", err);
    res.status(500).json({ message: "Server error creating post" });
  }
});

postRouter.delete('/:id', async (req, res) => {
    const {id} = req.params;
    console.log("Delete request for ID:", id);
    console.log("User ID:", req.userId);

    if(!isValidObjectId(id)){
        return res.status(400).json({message: "id is invalid"});
    }

    try {
        const post = await postModel.findById(id);
        console.log("Post found:", post);

        if(!post){
            return res.status(404).json({message: "Post not found"});
        }

        if(post.author.toString() !== req.userId){
            return res.status(401).json({message: 'You don\'t have permission'});
        }

        await postModel.findByIdAndDelete(id);
        res.status(200).json({message: "Post deleted successfully"});
    } catch (err) {
        console.error("Delete error:", err);
        res.status(500).json({message: "Server error"});
    }
});



module.exports = postRouter;
