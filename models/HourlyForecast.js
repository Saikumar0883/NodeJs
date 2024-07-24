const mongoose = require('mongoose');

// Subdocument schema for a single hour's forecast
const hourForecastSchema = new mongoose.Schema({
    time: {
        type: String,  // Time in HH:mm format
        required: true
    },
    temperature: {
        type: Number,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    cloudy: {
        type: Number,
        required: true
    }
});

// Main schema for the hourly forecast
const hourlyForecastSchema = new mongoose.Schema({
    hourlyForecast: {
        type: [hourForecastSchema],
        required: true
    }
});

const HourlyForecast = mongoose.model('HourlyForecast', hourlyForecastSchema);

module.exports = HourlyForecast;
