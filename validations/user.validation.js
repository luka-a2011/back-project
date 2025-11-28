const Joi = require('joi');

const userSchema = Joi.object({
    fullname: Joi.string().min(4).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).max(20).required(),
    role: Joi.string().valid('user', 'admin').optional() // <-- allow role
});

module.exports = userSchema;
