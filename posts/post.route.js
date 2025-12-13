const { Router } = require("express");
const postModels = require("../models/post.model");
const isAuth = require("../middlewares/isauth.middleware");
const { upload, deletefromcloudinary } = require("../config/clodinary.config");
const { isValidObjectId } = require("mongoose");

const postRouter = Router();

/* ===========================
   GET ALL POSTS
=========================== */
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

/* ===========================
   CREATE NEW POST
=========================== */
postRouter.post("/", isAuth, upload.single("image"), async (req, res) => {
  try {
    const { descriptione, Location } = req.body;

    if (!req.file) {
      return res.status(400).json({ message: "Image is required" });
    }

    const image = req.file.path;

    if (!descriptione || !Location) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const post = await postModels.create({
      image,
      descriptione,
      Location,
      author: req.userId,
      afterImages: []  // important!
    });

    res.status(201).json(post);
  } catch (err) {
    console.error("POST /posts error:", err);
    res.status(500).json({ message: "Server error creating post" });
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
    const post = await postModels.findById(id);
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

    await postModels.findByIdAndDelete(id);

    return res.status(200).json({ message: "Post deleted successfully" });
  } catch (err) {
    console.error("DELETE /posts/:id error:", err);
    return res.status(500).json({ message: "Server error while deleting post" });
  }
});

/* ===========================
   ADD AFTER-PHOTO (UPLOAD)
=========================== */

postRouter.put("/:id/after-photo", isAuth, upload.single("image"), async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid post ID" });
    }

    const post = await postModels.findById(id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    if (!req.file) {
      return res.status(400).json({ message: "After photo is required" });
    }

    // Cloudinary URL
    const afterImageUrl = req.file.path;

    // Add to array
    post.afterImages.push(afterImageUrl);

    await post.save();

    res.json({
      message: "After photo added successfully",
      post,
    });

  } catch (err) {
    console.error("PUT /:id/after-photo error:", err);
    res.status(500).json({ message: "Server error while adding after photo" });
  }
});

/* ===========================
   TOGGLE REACTION (LIKE)
=========================== */
postRouter.post("/:id/reaction", isAuth, async (req, res) => {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    return res.status(400).json({ message: "Invalid post ID" });
  }

  try {
    const post = await postModels.findById(id);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    const userIndex = post.reactions.findIndex(
      (userId) => userId.toString() === req.userId
    );

    // 🔁 TOGGLE
    if (userIndex !== -1) {
      post.reactions.splice(userIndex, 1); // unlike
    } else {
      post.reactions.push(req.userId); // like
    }

    await post.save();

    res.status(200).json({
      message: "Reaction updated",
      likesCount: post.reactions.length,
      liked: userIndex === -1,
    });
  } catch (err) {
    console.error("POST /:id/reaction error:", err);
    res.status(500).json({ message: "Server error reacting to post" });
  }
});


module.exports = postRouter;
