const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema({
    city: {
        type: String,
        required: true
    },
    latitude: {
        type: Number,
        required: true
    },
    longitude: {
        type: Number,
        required: true
    },
    current: {
        type: mongoose.Schema.Types.ObjectId,
        ref:'Current'
    },
    hourlyForecast: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'HourlyForecast'
    },
    tenDaysForecast: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'TenDaysForecast'
    },
});

const Location = mongoose.model('Location', locationSchema);
module.exports = Location;