const { default: mongoose } = require("mongoose");

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        lowercase: true,
        required: true
    },
    password: {
        type: String,
        required: true,
        select: false
    },
    posts: {
        type: [mongoose.Schema.Types.ObjectId],
        ref: "post",
        default: []
    },
    role: {
        type: String,
        enum: ["user", "admin"],
        default: "user"
    },

    name: {
        type: String,
        default: ""
    },
    profileImage: {
        type: String,   
        default: ""
    }
});

module.exports = mongoose.model("users", userSchema);
