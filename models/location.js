const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const location_schema = new Schema({
    name: {
        type: String,
        required: true,
    },
    location: {
        type: String,
        required: true,
    },
    type: {
        type: String,
        required: true,
    },
}, {timestamps: true});

const Location = mongoose.model('Location', location_schema);

module.exports = Location;