const { default: mongoose } = require("mongoose");


const orderSchema = new mongoose.Schema({
    sessionId: {
        type: String,
        require: true
    },
    status: {
        type: String,
        default: "PENDING",
        enum: ["PENDING", 'REJECT', 'SUCCESS']
    },
    amount: {
        type: Number,
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        default: []
    },
}, {timestamps: true})

module.exports = mongoose.model('order', orderSchema)