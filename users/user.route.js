const { Router } = require("express");
const userModel = require("../models/users.model");
const { upload, deleteFromCloudinary } = require("../config/clodinary.config");
const postModel = require("../models/post.model");
const isAuth = require("../middlewares/isauth.middleware"); // make sure auth middleware is here

const userRouter = Router();

// GET current logged-in user
userRouter.get("/current-user", isAuth, async (req, res) => {
  try {
    const user = await userModel.findById(req.userId);
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch user" });
  }
});

// GET all users
userRouter.get("/", isAuth, async (req, res) => {
  const users = await userModel.find().sort({ _id: -1 });
  res.status(200).json(users);
});

// UPDATE user profile
userRouter.put("/", isAuth, upload.single("avatar"), async (req, res) => {
  try {
    const user = await userModel.findById(req.userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    if (req.body.fullName) user.fullName = req.body.fullName;

    if (req.file) {
      if (user.avatarPublicId) await deleteFromCloudinary(user.avatarPublicId);
      user.avatar = req.file.path; // Cloudinary URL
      user.avatarPublicId = req.file.filename; // optional
    }

    // Also allow updating avatar via JSON (from frontend PUT request without file)
    if (req.body.avatar) user.avatar = req.body.avatar;

    await user.save();
    res.json({ message: "Profile updated successfully", user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Update failed" });
  }
});

// DELETE user
userRouter.delete("/:id", isAuth, async (req, res) => {
  const targetUserId = req.params.id;
  const userId = req.userId;

  const user = await userModel.findById(userId);
  const targetUser = await userModel.findById(targetUserId);

  if (user.role !== "admin" && targetUserId !== userId) {
    return res.status(403).json({ error: "You don't have permission" });
  }

  await userModel.findByIdAndDelete(targetUserId);
  await postModel.deleteMany({ author: targetUserId });

  res.json({ message: "User deleted successfully" });
});

module.exports = userRouter;
