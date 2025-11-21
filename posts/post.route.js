const { Router } = require("express");
const postModels = require("../models/post.model");
const { isValidObjectId } = require("mongoose");
const { upload, deletefromcloudinary } = require("../config/clodinary.config");
const isAuth = require("../middlewares/isauth.middleware");

const postRouter = Router();


postRouter.get("/", async (req, res) => {
  try {
    const posts = await postModels
      .find()
      .sort({ _id: -1 })
      .populate({ path: "author", select: "email fullName" });

    res.status(200).json(posts);
  } catch (err) {
    console.error("GET /posts error:", err);
    res.status(500).json({ message: "Server error getting posts" });
  }
});


postRouter.post("/", isAuth, upload.single("image"), async (req, res) => {
  try {
    const { descriptione, Location } = req.body;
    const image = req.file?.path;

    if (!image || !descriptione || !Location) {
      return res.status(400).json({ message: "All fields are required" });
    }

    await postModels.create({
      image,
      descriptione,
      Location,
      author: req.userId,
    });

    res.status(201).json({ message: "created" });
  } catch (err) {
    console.error("POST /posts error:", err);
    res.status(500).json({ message: "Server error creating post" });
  }
});


postRouter.delete("/:id", isAuth, async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: "invalid id" });
    }

    const post = await postModels.findById(id);

    if (!post) {
      return res.status(404).json({ message: "post not found" });
    }

    if (post.author.toString() !== req.userId) {
      return res.status(401).json({ message: "no permission" });
    }

    if (post.image) {
      const publicId = post.image.split("/").pop().split(".")[0];
      await deletefromcloudinary(`uploads/${publicId}`);
    }

    await postModels.findByIdAndDelete(id);

    res.status(200).json({ message: "deleted" });
  } catch (err) {
    console.error("DELETE /posts/:id error:", err);
    res.status(500).json({ message: "Server error deleting post" });
  }
});

module.exports = postRouter;
