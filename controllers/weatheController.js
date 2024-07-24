require("dotenv").config();
const fetch = require("node-fetch"); // Ensure to install node-fetch
const Location = require("../models/Locatoin");
const TenDaysForecast = require("../models/TenDaysForecast");
const HourlyForecast = require("../models/HourlyForecast");
const Current = require("../models/Current");
const API_KEY = process.env.API_KEY;
const API_KEY1 = process.env.API_KEY1;
const schedule = require("node-schedule");
const moment = require("moment");
const User = require("../models/User");

async function getTenDaysWeatherForecast(lat, long) {
  const apiUrl = `http://api.worldweatheronline.com/premium/v1/weather.ashx?key=${API_KEY1}&q=${lat},${long}&num_of_days=10&tp=3&format=json`;

  try {
    const response = await fetch(apiUrl);
    const data = await response.json();
    // Extracting relevant data for each day and converting temperature to Celsius
    const formattedData = data.data.weather.map((day) => ({
      date: day.date,
      temperature: (((day.maxtempF - 32) * 5) / 9).toFixed(2),
      cloudcover: day.hourly[0].cloudcover,
      description: day.hourly[0].weatherDesc[0].value,
    }));
    // console.log(formattedData);
    return formattedData;
  } catch (error) {
    console.log("error from 10days data", error.message);
    return error;
  }
}

async function currentWeather(lat, long) {
  // console.log(lat);
  // console.log(long);
  const apiUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${long}&appid=${API_KEY}&units=metric`; // Include units=metric to get temperature in Celsius

  try {
    const response = await fetch(apiUrl);
    const data = await response.json();

    weatherData = {
      temperature: data.main.temp,
      humidity: data.main.humidity,
      description: data.weather[0].description,
      cloudcover: data.clouds.all,
    };
    return weatherData;
  } catch (error) {
    console.log("error from current data");
    return error;
  }
}

async function getHourlyWeatherForecast(lat, long) {
  const apiUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${long}&appid=${API_KEY}&units=metric`;

  try {
    const response = await fetch(apiUrl);
    const data = await response.json();
    const forecasts = data.list.slice(1, 10).map((item) => {
      return {
        time: item.dt_txt.split(" ")[1].substr(0, 5),
        temperature: item.main.temp,
        description: item.weather[0].description,
        cloudy: item.clouds.all,
      };
    });
    // console.log(forecasts);
    return forecasts;
  } catch (error) {
    console.log("error from hourly data");
    return error;
  }
}

schedule.scheduleJob("30 02 * * *", async () => {
  console.log("running");
  try {
    // Step 1: Fetch all Locations
    const allLocations = await Location.find().exec();

    // Step 2: Fetch all Users and their referenced locations
    const allUsers = await User.find().populate("Location").exec();
    const referencedLocations = new Set(
      allUsers.map((user) => user.Location.toString())
    );

    // Step 3: Find unused Locations
    const unusedLocations = allLocations.filter(
      (location) => !referencedLocations.has(location._id.toString())
    );

    // Step 4: Delete unused Locations
    const unusedLocationIds = unusedLocations.map((location) => location._id);
    await Location.deleteMany({ _id: { $in: unusedLocationIds } });
    await HourlyForecast.deleteMany({});
    await TenDaysForecast.deleteMany({});
    await Current.deleteMany({});
    const locations = await Location.find().exec();

    for (const location of locations) {
      const newCurrentData = await currentWeather(
        location.latitude,
        location.longitude
      );
      const newHourlyForecastData = await getHourlyWeatherForecast(
        location.latitude,
        location.longitude
      );
      const newTenDaysForecastData = await getTenDaysWeatherForecast(
        location.latitude,
        location.longitude
      );

      const current = await Current.findById(location.current);
      if (current) {
        Object.assign(current, newCurrentData);
        await current.save();
      }

      const hourlyForecast = await HourlyForecast.findById(
        location.hourlyForecast
      );
      if (hourlyForecast) {
        Object.assign(hourlyForecast, newHourlyForecastData);
        await hourlyForecast.save();
      }

      const tenDaysForecast = await TenDaysForecast.findById(
        location.tenDaysForecast
      );
      if (tenDaysForecast) {
        Object.assign(tenDaysForecast, newTenDaysForecastData);
        await tenDaysForecast.save();
      }
    }
  } catch (err) {
    console.error("Error cleaning up locations:", err);
  }
});

async function updateHourlyDB() {
  const locations = await Location.find().exec();

  for (const location of locations) {
    const newHourlyForecastData = await getHourlyWeatherForecast(
      location.latitude,
      location.longitude
    );

    const hourlyForecast = await HourlyForecast.findById(
      location.hourlyForecast
    );
    if (hourlyForecast) {
      Object.assign(hourlyForecast, newHourlyForecastData);
      await hourlyForecast.save();
    }
  }
}
schedule.scheduleJob("00 09 * * *", () => {
  updateHourlyDB();
});
schedule.scheduleJob("00 15 * * *", () => {
  updateHourlyDB();
});
schedule.scheduleJob("00 21 * * *", () => {
  updateHourlyDB();
});
module.exports.current_weather_get = async (req, res) => {
  const { lat, long, city } = req.query;

  const now = moment();
  const currentHour = now.hour();
  const currentMinute = now.minute();

  // Location Db updating time;
  if (
    (currentHour === 2 && currentMinute >= 30) ||
    (currentHour === 3 && currentMinute === 0)
  ) {
    const currentData = await currentWeather(lat, long);
    const tenDaysData = await getTenDaysWeatherForecast(lat, long);
    const hourlyData = await getHourlyWeatherForecast(lat, long);

    const tenDaysForecast = {
      tenDaysForecast: tenDaysData,
    };

    const hourlyForecast = {
      hourlyForecast: hourlyData,
    };

    const combinedData = {
      city: city,
      current: currentData,
      hourlyForecast: hourlyForecast,
      tenDaysForecast: tenDaysForecast,
    };
    return res.json(combinedData);
  }
  //Hourly Db updating times
  if (
    (currentHour === 9 && currentMinute >= 0 && currentMinute <= 30) ||
    (currentHour === 15 && currentMinute >= 0 && currentMinute <= 30) ||
    (currentHour === 21 && currentMinute >= 0 && currentMinute <= 30)
  ) {
    const hourlyData = await getHourlyWeatherForecast(lat, long);
    const currentData = await Location.findById(found._id).populate("current");
    const tenDaysForecast = await Location.findById(found._id).populate(
      "tenDaysForecast"
    );
    const hourlyForecast = {
      hourlyForecast: hourlyData,
    };
    const combinedData = {
      city: city,
      current: currentData,
      hourlyForecast: hourlyForecast,
      tenDaysForecast: tenDaysForecast,
    };
    return res.json(combinedData);
  }

  const found = await Location.findOne({ city });
  if (!found) {
    try {
      const currentData = await currentWeather(lat, long);
      const tenDaysData = await getTenDaysWeatherForecast(lat, long);
      const hourlyData = await getHourlyWeatherForecast(lat, long);

      const tenDaysWeather = {
        tenDaysForecast: tenDaysData,
      };

      const hourlyWeather = {
        hourlyForecast: hourlyData,
      };

      // Store the data in the database
      const tenDaysForecast = await TenDaysForecast.create(tenDaysWeather);
      const hourlyForecast = await HourlyForecast.create(hourlyWeather);
      const currentWeatherData = await Current.create(currentData);

      const loc = await Location.create({
        city,
        latitude: lat,
        longitude: long,
        current: currentWeatherData._id,
        hourlyForecast: hourlyForecast._id,
        tenDaysForecast: tenDaysForecast._id,
      });

      const combinedData = {
        city: city,
        current: currentData,
        hourlyForecast: hourlyForecast,
        tenDaysForecast: tenDaysForecast,
      };
      res.json(combinedData);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
    // res.json({ message: "ok" });
  } else {
    // console.log(found);
    const Weather = await Location.findById(found._id).populate("current");
    // console.log(Weather);
    const now = new Date();
    const updatedAt = new Date(Weather.current.updatedAt);
    const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60 * 1000); // 30 minutes in milliseconds

    if (updatedAt < thirtyMinutesAgo) {
      const newCurrentData = await currentWeather(lat, long);

      const current = await Current.findById(Weather.current._id);
      if (current) {
        Object.assign(current, newCurrentData);
        await current.save();
      }
      const updatedWeather = await Location.findById(found._id)
        .populate("current")
        .populate("hourlyForecast")
        .populate("tenDaysForecast");
      res.json(updatedWeather);
    } else {
      const Weather = await Location.findById(found._id)
        .populate("current")
        .populate("hourlyForecast")
        .populate("tenDaysForecast");
      res.json(Weather);
    }
  }
};

module.exports.UpdatePLocatoin_post = async (req, res) => {
  try {
    const { id, city, lat, long } = req.body;
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const found = await Location.findOne({ city });
    if (found) {
      console.log(found);
      user.MyLocation = found._id;
      await user.save();
      return res
        .status(200)
        .json({ message: "Location updated successfully", found });
    }
    const currentData = await currentWeather(lat, long);
    const tenDaysData = await getTenDaysWeatherForecast(lat, long);
    const hourlyData = await getHourlyWeatherForecast(lat, long);

    const tenDaysWeather = {
      tenDaysForecast: tenDaysData,
    };

    const hourlyWeather = {
      hourlyForecast: hourlyData,
    };

    // Store the data in the database
    const tenDaysForecast = await TenDaysForecast.create(tenDaysWeather);
    const hourlyForecast = await HourlyForecast.create(hourlyWeather);
    const currentWeatherData = await Current.create(currentData);

    const loc = await Location.create({
      city,
      latitude: lat,
      longitude: long,
      current: currentWeatherData._id,
      hourlyForecast: hourlyForecast._id,
      tenDaysForecast: tenDaysForecast._id,
    });

    user.MyLocation = loc._id;
    await user.save();

    res.status(200).json({ message: "Location updated successfully", loc });
  } catch (error) {
    res
      .status(500)
      .json({ error: "An error occurred while updating location" });
  }
};
