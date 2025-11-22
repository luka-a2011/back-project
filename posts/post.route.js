const { Router } = require("express");
const postModels = require("../models/post.model");
const { isValidObjectId } = require("mongoose");
const { upload, deletefromcloudinary } = require("../config/clodinary.config");
const isAuth = require("../middlewares/isauth.middleware");

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

// GET posts of current logged-in user
postRouter.get("/my-posts", isAuth, async (req, res) => {
  try {
    const posts = await postModels
      .find({ author: req.userId })
      .sort({ _id: -1 })
      .populate({ path: "author", select: "fullname email" });

    res.status(200).json(posts);
  } catch (err) {
    console.error("GET /posts/my-posts error:", err);
    res.status(500).json({ message: "Server error getting user's posts" });
  }
});

// CREATE new post
postRouter.post("/", isAuth, upload.single("image"), async (req, res) => {
  try {
    const { descriptione, Location } = req.body;
    const image = req.file?.path;

    if (!image || !descriptione || !Location) {
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

// DELETE a post (author or admin)
postRouter.delete("/:id", isAuth, async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid post ID" });
    }

    const post = await postModels.findById(id);

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    // Check if the user is the author or admin
    if (post.author.toString() !== req.userId && req.role !== "admin") {
      return res.status(401).json({ message: "No permission to delete this post" });
    }

    // Delete image from Cloudinary
    if (post.image) {
      const publicId = post.image.split("/").pop().split(".")[0];
      await deletefromcloudinary(`uploads/${publicId}`);
    }

    await postModels.findByIdAndDelete(id);

    res.status(200).json({ message: "Post deleted successfully" });
  } catch (err) {
    console.error("DELETE /posts/:id error:", err);
    res.status(500).json({ message: "Server error deleting post" });
  }
});

module.exports = postRouter;
