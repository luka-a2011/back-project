const { default: mongoose } = require("mongoose");

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        lowercase: true,
        required: true
    },
    password: {
        type: String,
        required: false,
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

    fullname: {        
        type: String,
        default: ""
    },

    avatar: {
        type: String,
        default: ""
    },

    token: {
        type: String,
        default: ""
    }
});

module.exports = mongoose.model("users", userSchema);

