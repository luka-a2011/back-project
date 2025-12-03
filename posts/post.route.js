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

module.exports = postRouter;
