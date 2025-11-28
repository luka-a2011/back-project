const Joi = require('joi');

const userSchema = Joi.object({
    fullname: Joi.string().min(4).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).max(20).required(),
    accountType: Joi.string().valid("user", "admin").default("user") // optional, defaults to user
});

module.exports = userSchema;
