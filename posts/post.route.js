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

postRouter.delete("/:id", isAuth, async (req, res) => {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    return res.status(400).json({ message: "Invalid post ID" });
  }

  try {
    const post = await postModels.findById(id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    // Allow admin or author to delete
    if (post.author.toString() !== req.userId && req.role !== "admin") {
      return res.status(401).json({ message: "You don't have permission" });
    }

    // Delete image from Cloudinary if exists
    if (post.image) {
      try {
        await deletefromcloudinary(post.image);
      } catch (err) {
        console.warn("Cloudinary delete failed:", err);
      }
    }

    await postModels.findByIdAndDelete(id);

    return res.status(200).json({ message: "Post deleted successfully" });
  } catch (err) {
    console.error("DELETE /posts/:id error:", err);
    return res.status(500).json({ message: "Server error while deleting post" });
  }
});

postRouter.put("/posts/:id/after-photo", isAuth, async (req, res) => {
  try {
    const post = await post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    post.afterImages.push(req.body.afterImage);
    await post.save();

    res.json({ message: "After photo added", post });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});



module.exports = postRouter;
