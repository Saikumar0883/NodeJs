const mongoose = require('mongoose');
const currentSchema = new mongoose.Schema({
    temperature: {
        type: Number,
        required: true
    },
    humidity: {
        type: Number,
        required: true,
    },
    description: {
        type: String,
        required: true
    },
    cloudcover: {
        type: Number,
        required: true
    },

},{timestamps: true});

const Current = mongoose.model('Current', currentSchema);

module.exports = Current;