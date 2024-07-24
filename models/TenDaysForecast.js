const mongoose = require('mongoose');

// Subdocument schema for a single day's forecast
const dayForecastSchema = new mongoose.Schema({
    date: {
        type: Date,
        required: true
    },
    temperature: {
        type: Number,
        required: true
    },
    cloudcover: {
        type: Number,
        required: true
    },
    description: {
        type: String,
        required: true
    },
});

// Main schema for the 10-day forecast
const forecastSchema = new mongoose.Schema({
    tenDaysForecast: {
        type: [dayForecastSchema],
        required:true,
    }
});

// Custom validation function to ensure array length is at most 10
function arrayLimit(val) {
    return val.length <= 10;
}

const TenDaysForecast = mongoose.model('TenDaysForecast', forecastSchema);

module.exports = TenDaysForecast;
