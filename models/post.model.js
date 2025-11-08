const { default: mongoose,  } = require("mongoose");


const postSchema = new mongoose.Schema({
    image: {
        type: String,
        require: true
    },
    descriptione: {
        type: String,
        require: true
    },
    Location : {
        type: String,
        require: true
    },
   
    
   
}, {timestamps: true})

module.exports = mongoose.model("post", postSchema)