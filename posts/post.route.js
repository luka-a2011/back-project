const { Router } = require("express");
const postModels = require("../models/post.model");
const isAuth = require("../middlewares/isauth.middleware");
const { upload, deletefromcloudinary } = require("../config/clodinary.config");
const { isValidObjectId } = require("mongoose");
const postRouter = Router();



/* ===========================
   ADD AFTER-PHOTO (UPLOAD MULTIPLE)
=========================== */
postRouter.put("/:id/after-photo", isAuth, upload.array("afterImages"), async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid post ID" });
    }

    const post = await postModels.findById(id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    if (!req.files || !req.files.length) {
      return res.status(400).json({ message: "After photos are required" });
    }

    // Add all uploaded files to afterImages array
    req.files.forEach(file => post.afterImages.push(file.path));

    await post.save();

    res.json({
      message: "After photos added successfully",
      post,
    });
  } catch (err) {
    console.error("PUT /:id/after-photo error:", err);
    res.status(500).json({ message: "Server error while adding after photos" });
  }
});

module.exports = postRouter;


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


/* ===========================
   TOGGLE REACTION (LIKE)
=========================== */
postRouter.post('/:id/reactions', isAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { type } = req.body;

    if (type !== 'like') return res.status(400).json({ error: "Invalid reaction type" });

    const post = await postModels.findById(id);
    if (!post) return res.status(404).json({ error: "Post not found" });

    // Ensure reactions object exists
    if (!post.reactions) post.reactions = { likes: [] };

    const index = post.reactions.likes.findIndex(userId => userId.toString() === req.userId);

    if (index !== -1) {
      post.reactions.likes.splice(index, 1);
    } else {
      post.reactions.likes.push(req.userId);
    }

    await post.save();

    res.json({ message: "Reaction updated", likes: post.reactions.likes.length });
  } catch (err) {
    console.error("Reaction route error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});



module.exports = postRouter;
