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
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "users", default: [] }]
}


  },
  { timestamps: true }
);

module.exports = mongoose.model("post", postSchema);
