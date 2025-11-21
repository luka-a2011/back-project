const mongoose = require("mongoose");

const postSchema = new mongoose.Schema({
    image: {
        type: String,
        required: true
    },
    descriptione: {
        type: String,
        required: true
    },
    Location: {
        type: String,
        required: true
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users",   // MUST match your users.model name
        required: true
    }
}, { timestamps: true });

module.exports = mongoose.model("post", postSchema);
