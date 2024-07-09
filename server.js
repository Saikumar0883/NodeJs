const express = require('express');
const app = express();
require('fetch');
const port = process.env.PORT || 4000;


app.get('/weather', async (req, res) => {
    try {
      const params = {
        latitude:18.4085,
        longitude: 77.6593,
        hourly: "temperature_2m,precipitation,cloudcover,windspeed_10m", // Add other fields as needed
      };
      const url = `https://api.open-meteo.com/v1/jma?latitude=${params.latitude}&longitude=${params.longitude}&hourly=${params.hourly}`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      // Log the raw API response
    //   console.log('API Response:', data);
  
      const hourly = data.hourly;
      
      // Log the hourly data
    //   console.log('Hourly Data:', hourly);
  
      const currentTime = new Date();
      const oneHourAgo = new Date(currentTime.getTime() - 1 * 60 * 60 * 1000); // One hour ago
      
      // Calculate the end of the day (11:59 PM)
      const endOfDay = new Date(currentTime);
      endOfDay.setHours(23, 59, 59, 999);
  
      // Helper function to parse date strings
      const parseDate = (dateString) => new Date(dateString);
      const relevantData = hourly.time
        .map((time, index) => {
          const timeObj = parseDate(time);
          return {
            time: timeObj,
            temperature2m: hourly.temperature_2m[index],
            precipitation: hourly.precipitation ? hourly.precipitation[index] : null,
            cloudcover: hourly.cloudcover ? hourly.cloudcover[index] : null,
            windspeed10m: hourly.windspeed_10m ? hourly.windspeed_10m[index] : null,
            // Add other fields similarly
          };
        })
        .filter(entry => entry.time > oneHourAgo && entry.time <= endOfDay);
  
      // Log the final result
    //   console.log('Relevant Data:', relevantData);
  
      res.json(relevantData);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'An error occurred' });
    }
  });
  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
