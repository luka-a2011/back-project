const mongoose = require("mongoose");

const postSchema = new mongoose.Schema(
  {
    images: {
      type: [String],
      required: true,
    },
    descriptione: {
      type: String,
      required: true,
    },
    Location: {
      type: String,
      required: true,
    },

    // All after photos stored as Cloudinary URLs
    afterImages: [
      {
        type: String,
      },
    ],

    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // match your user model
      required: true,
    },

    authorEmail: { // <-- new field
      type: String,
      default: "",
    },

    reactions: {
      likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
      dislikes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    },

    hold: {
      user: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
      expiresAt: { type: Date, default: null },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("post", postSchema);
