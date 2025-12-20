const mongoose = require("mongoose");

const postSchema = new mongoose.Schema(
  {
    image: {
      type: String,
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
      ref: "users", // MUST match your user model name
      required: true,
    },

 reactions: {
        likes: [{type: mongoose.Schema.Types.ObjectId, ref: 'user'}],
        dislikes: [{type: mongoose.Schema.Types.ObjectId, ref: 'user'}],
    },
    hold: {
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  expiresAt: { type: Date, default: null }
}



  },
  { timestamps: true }
);

module.exports = mongoose.model("post", postSchema);
