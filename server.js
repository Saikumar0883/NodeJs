const express = require('express')
const mongoose = require('mongoose');
const app = express()
const appRoute = require('./routes/authRoute')
const cors = require('cors')

const cookieParser = require('cookie-parser')
app.use(express.static('public'));
app.use(express.json())
app.use(cookieParser())
app.use(cors({
    credentials: true,
    origin: 'https://accurateweather.vercel.app',
    method: ["GET", "POST", "DELETE", "PUT"],
    credentials:true,            
    optionSuccessStatus: 200,
    allowedHeaders: ['Content-Type', 'Authorization', 'x-csrf-token'],
}));
app.use(express.urlencoded({ extended: false }));
const port = process.env.PORT || 8080;

const dbURI = process.env.dbURI;
mongoose
  .connect(dbURI)
  .then((result) => app.listen(4000))
  .catch((err) => console.log("My error", err));

app.use(appRoute);
