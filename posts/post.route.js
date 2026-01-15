const { Router } = require("express");
const postModel = require("../models/post.model"); // fix naming
const isAuth = require("../middlewares/isauth.middleware");
const { upload, deleteFromCloudinary } = require("../config/clodinary.config");
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
postRouter.post(
  "/",
  isAuth,
  upload.array("images", 10),
  async (req, res) => {
    console.log("FILES:", req.files);

    try {
      const { descriptione, Location } = req.body;

      if (!req.files || req.files.length < 3) {
        return res.status(400).json({ message: "At least 3 images are required" });
      }

      if (!descriptione || !Location) {
        return res.status(400).json({ message: "All fields are required" });
      }

      const imagePaths = req.files.map((file) => file.path);

      const post = await postModel.create({
        images: imagePaths,
        descriptione,
        Location,
        author: req.userId,
        afterImages: [],
        reactions: { likes: [], dislikes: [] },
        hold: { user: null, expiresAt: null },
      });

      res.status(201).json(post);
    } catch (err) {
      console.error("POST /posts error:", err);
      res.status(500).json({ message: "Server error creating post" });
    }
  }
);

/* ===========================
   ADD AFTER-PHOTO
=========================== */
postRouter.put("/:id/after-photo", isAuth, upload.array("afterImages"), async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid post ID" });
    }

    const post = await postModel.findById(id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    if (
      post.hold?.user &&
      post.hold.expiresAt > new Date() &&
      post.hold.user.toString() !== req.userId
    ) {
      return res.status(403).json({ message: "You do not hold this post" });
    }

    if (!req.files || !req.files.length) {
      return res.status(400).json({ message: "After photos are required" });
    }

    req.files.forEach((file) => post.afterImages.push(file.path));

    post.hold = { user: null, expiresAt: null };

    await post.save();
    res.json({ message: "After photos added successfully", post });
  } catch (err) {
    console.error("PUT /:id/after-photo error:", err);
    res.status(500).json({ message: "Server error while adding after photos" });
  }
});

/* ===========================
   DELETE POST ✅ FIXED
=========================== */

const getPublicIdFromUrl = (url) => {
  const parts = url.split("/");
  const filename = parts.pop().split(".")[0];
  const folder = parts.pop();
  return `${folder}/${filename}`;
};

postRouter.delete("/:id", isAuth, async (req, res) => {
  console.log("DELETE POST HIT", req.params.id);
  console.log("USER:", req.userId, req.role);

  const { id } = req.params;

  if (!isValidObjectId(id)) {
    return res.status(400).json({ message: "Invalid post ID" });
  }

  try {
    console.log("Finding post...");
    const post = await postModel.findById(id);

    console.log("POST FOUND:", post);

    if (!post) return res.status(404).json({ message: "Post not found" });

    console.log("POST AUTHOR:", post.author);
    console.log("REQ USER:", req.userId, "ROLE:", req.role);

    // ✅ SAFE PERMISSION CHECK
    if (post.author?.toString() !== req.userId && req.role !== "admin") {
      return res.status(401).json({ message: "You don't have permission" });
    }

    if (post.images?.length) {
      for (const img of post.images) {
        const publicId = getPublicIdFromUrl(img);
        await deleteFromCloudinary(publicId);
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
   TOGGLE REACTIONS
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

/* ===========================
   HOLD POST (3 DAYS)
=========================== */
postRouter.put("/:id/hold", isAuth, async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid post ID" });
    }

    const post = await postModel.findById(id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    if (post.afterImages?.length) {
      return res.status(400).json({ message: "Post already completed" });
    }

    if (
      post.hold?.user &&
      post.hold.expiresAt > new Date() &&
      post.hold.user.toString() !== req.userId
    ) {
      return res.status(400).json({ message: "Post is already on hold" });
    }

    const alreadyHolding = await postModel.findOne({
      "hold.user": req.userId,
      "hold.expiresAt": { $gt: new Date() },
    });

    if (alreadyHolding) {
      return res.status(400).json({ message: "You can only hold one post at a time" });
    }

    post.hold = {
      user: req.userId,
      expiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    };

    await post.save();
    res.json({ message: "Post held successfully", post });
  } catch (err) {
    console.error("PUT /:id/hold error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = postRouter;
