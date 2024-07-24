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
    origin:"https://accurateweather.vercel.app",
    methods:["GET","POST","OPTIONS","PUT","PATCH","DELETE"],
    allowedHeaders:["X-CSRF-Token","X-Requested-With","Accept","Accept-Version","Content-Length","Content-MD5","Content-Type","Date","X-Api-Version"],
    credentials:true
}));
app.use(express.urlencoded({ extended: false }));
const port = process.env.PORT || 4000;

const dbURI = process.env.dbURI;
mongoose
  .connect(dbURI)
  .then((result) => app.listen(4000))
  .catch((err) => console.log("My error", err));

app.use(appRoute);
