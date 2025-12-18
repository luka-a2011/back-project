const { Router } = require("express");
const postModel = require("../models/post.model"); // fix naming
const isAuth = require("../middlewares/isauth.middleware");
const { upload, deletefromcloudinary } = require("../config/clodinary.config");
const { isValidObjectId } = require("mongoose");

const postRouter = Router();

/* ===========================
   GET ALL POSTS
=========================== */
postRouter.get("/", async (req, res) => {
  try {
    const posts = await postModel
      .find()
      .sort({ _id: -1 })
      .populate({ path: "author", select: "email fullname role" });

    res.status(200).json(posts);
  } catch (err) {
    console.error("GET /posts error:", err);
    res.status(500).json({ message: "Server error getting posts" });
  }
});

/* ===========================
   CREATE NEW POST
=========================== */
postRouter.post("/", isAuth, upload.single("image"), async (req, res) => {
  try {
    const { descriptione, Location } = req.body;

    if (!req.file) {
      return res.status(400).json({ message: "Image is required" });
    }
    if (!descriptione || !Location) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const post = await postModel.create({
      image: req.file.path,
      descriptione,
      Location,
      author: req.userId,
      afterImages: [],
      reactions: { likes: [], dislikes: [] },
    });

    res.status(201).json(post);
  } catch (err) {
    console.error("POST /posts error:", err);
    res.status(500).json({ message: "Server error creating post" });
  }
});

/* ===========================
   ADD AFTER-PHOTO (UPLOAD MULTIPLE)
=========================== */
postRouter.put("/:id/after-photo", isAuth, upload.array("afterImages"), async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid post ID" });
    }

    const post = await postModel.findById(id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    if (!req.files || !req.files.length) {
      return res.status(400).json({ message: "After photos are required" });
    }

    req.files.forEach((file) => post.afterImages.push(file.path));
    await post.save();

    res.json({ message: "After photos added successfully", post });
  } catch (err) {
    console.error("PUT /:id/after-photo error:", err);
    res.status(500).json({ message: "Server error while adding after photos" });
  }
});

/* ===========================
   DELETE POST
=========================== */
postRouter.delete("/:id", isAuth, async (req, res) => {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    return res.status(400).json({ message: "Invalid post ID" });
  }

  try {
    const post = await postModel.findById(id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    if (post.author.toString() !== req.userId && req.role !== "admin") {
      return res.status(401).json({ message: "You don't have permission" });
    }

    if (post.image) {
      try {
        await deletefromcloudinary(post.image);
      } catch (err) {
        console.warn("Cloudinary delete failed:", err);
      }
    }

    await postModel.findByIdAndDelete(id);
    res.status(200).json({ message: "Post deleted successfully" });
  } catch (err) {
    console.error("DELETE /posts/:id error:", err);
    res.status(500).json({ message: "Server error while deleting post" });
  }
});

/* ===========================
   TOGGLE REACTIONS (LIKE/DISLIKE)
=========================== */
postRouter.post("/:id/reactions", isAuth, async (req, res) => {
  const { id } = req.params;
  const { type } = req.body;

  const supportedTypes = ["like", "dislike"];
  if (!supportedTypes.includes(type)) {
    return res.status(400).json({ error: "Invalid reaction type" });
  }

  try {
    const post = await postModel.findById(id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    const likedIndex = post.reactions.likes.findIndex((u) => u.toString() === req.userId);
    const dislikedIndex = post.reactions.dislikes.findIndex((u) => u.toString() === req.userId);

    if (type === "like") {
      if (likedIndex === -1) post.reactions.likes.push(req.userId);
      else post.reactions.likes.splice(likedIndex, 1);
      if (dislikedIndex !== -1) post.reactions.dislikes.splice(dislikedIndex, 1);
    }

    if (type === "dislike") {
      if (dislikedIndex === -1) post.reactions.dislikes.push(req.userId);
      else post.reactions.dislikes.splice(dislikedIndex, 1);
      if (likedIndex !== -1) post.reactions.likes.splice(likedIndex, 1);
    }

    await post.save();
    res.json({ message: "Reaction updated successfully", reactions: post.reactions });
  } catch (err) {
    console.error("POST /:id/reactions error:", err);
    res.status(500).json({ message: "Server error updating reactions" });
  }
});

module.exports = postRouter;
