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


userRouter.put("/", isAuth, async (req, res) => {
  try {
    const user = await userModel.findById(req.userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    // Update name
    if (req.body.fullname) user.fullname = req.body.fullname;

    // Update avatar (Cloudinary URL)
    if (req.body.avatar) {
      user.avatar = req.body.avatar;
    }

    await user.save();

    res.json({
      message: "Profile updated successfully",
      user
    });
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



// ADMIN / Update any user by ID
userRouter.put("/:id", isAuth, async (req, res) => {
  try {
    const requester = await userModel.findById(req.userId);
    
    if (!requester || requester.role !== "admin") {
      return res.status(403).json({ error: "Only admin can update users" });
    }
    
    const updatedUser = await userModel.findByIdAndUpdate(
      req.params.id,
      {
        fullname: req.body.fullname,
        email: req.body.email,
        role: req.body.role,
      },
      { new: true }
    );
    
    if (!updatedUser) {
      return res.status(404).json({ error: "User not found" });
    }
    
    res.json({ message: "User updated", user: updatedUser });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update user" });
  }
});

module.exports = userRouter;