const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const user_schema = new Schema({
    email: {
        type: String,
        required: true,
    },
    password: {
        type: String,
        required: true,
    },
    role: {
        type: String,
        required: true,
    },
}, {timestamps: true});

const User = mongoose.model('User', user_schema);

module.exports = User;