const User = require("../models/User");
require("dotenv").config();
const jwt = require("jsonwebtoken");

//handle errors
const handleErrors = (err) => {
  let errors = { userName: "", email: "", password: "" };
  console.log(err);

  //incorrect email
  if (err.message === "incorrect email") {
    errors.email = "that email is not registered";
    return errors;
  }

  //incorrect password
  if (err.message === "incorrect password") {
    errors.password = "that password is incorrect";
    return errors;
  }

  //duplicate error code
  if (err.code === 11000) {
    errors.email = "That email is already registered";
    return errors;
  }
  //validate errors
  if (err.message.includes("User validation failed")) {
    Object.values(err.errors).forEach(({ properties }) => {
      errors[properties.path] = properties.message;
    });
  }
  return errors;
};

//creating tokens
const secret = "aer34tsdfq34taasdfadfadfadfad";
const maxAge = 3 * 24 * 60 * 60;
const createToken = (id, userName) => {
  return jwt.sign({ id, userName }, secret, {
    expiresIn: maxAge,
  });
};

module.exports.signup_post = async (req, res) => {
  console.log(req.body);
  const { email, password, userName } = req.body;

  try {
    const user = await User.create({ userName, email, password });
    user.MyLocation = null;
    user.SavedLocations = [];
    const token = createToken(user._id, user.userName);
    res.cookie("token", token, {
      maxAge: maxAge * 1000,
      httpOnly: true,
      sameSite: "None", // Ensure cross-site cookies are allowed
      secure: true, // Ensure the cookie is only sent over HTTPS
    });

    if (user.MyLocation) {
      user = await User.findById(user._id).populate({
        path: "MyLocation",
        select: "city latitude longitude"
      });
    }
    
    // Populate SavedLocations if they exist
    if (user.SavedLocations && user.SavedLocations.length > 0) {
      user = await user.findById(user._id).populate({
        path: "SavedLocations",
        select: "city latitude longitude"
      })
    }

    res.status(200).json({
      id: user._id,
      userName: user.userName,
      email: user.email,
      MyLocation: user.MyLocation,
      SavedLocations: user.SavedLocations,
    });
  } catch (err) {
    const errors = handleErrors(err);
    // console.log("my error", { errors });
    res.status(400).json({ errors });
  }
};

module.exports.login_post = async (req, res) => {
  const { email, password } = req.body;

  try {
    let user = await User.login(email, password);

    if (user.MyLocation) {
      user = await User.findById(user._id).populate({
        path: "MyLocation",
        select: "city latitude longitude"
      });
    }
    
    // Populate SavedLocations if they exist
    if (user.SavedLocations && user.SavedLocations.length > 0) {
      user = await user.findById(user._id).populate({
        path: "SavedLocations",
        select: "city latitude longitude"
      })
    }

    const token = createToken(user._id, user.userName);
    res.cookie("token", token, {
      maxAge: maxAge * 1000,
      httpOnly: true,
      sameSite: "None", // Ensure cross-site cookies are allowed
      secure: true, // Ensure the cookie is only sent over HTTPS
    });

    res.status(200).json({
      id: user._id,
      userName: user.userName,
      email: user.email,
      MyLocation: user.MyLocation,
      SavedLocations: user.SavedLocations,
    });
  } catch (error) {
    const errors = handleErrors(error);
    res.status(400).json({ errors });
  }
};


module.exports.logout_get = (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    sameSite: "None",
    secure: true,
  });
  res.json({ suc: true });
  // res.redirect('/')
};

module.exports.profile_get = (req, res) => {
  const { token } = req.cookies;

  if (!token) {
    return res.status(401).json({ error: "Token not provided" });
  }

  jwt.verify(token, secret, {}, async (err, info) => {
    if (err) {
      console.log(err);
      return res.status(401).json({ error: "Invalid token" });
    }

    try {
      const user = await User.findById(info.id)
        .populate('MyLocation', 'city')
        .populate('SavedLocations', 'city');

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      res.status(200).json({
        id: user._id,
        userName: user.userName,
        email: user.email,
        MyLocation: user.MyLocation,
        SavedLocations: user.SavedLocations,
      });
    } catch (error) {
      console.log(error);
      res.status(500).json({ error: "An error occurred while fetching user profile" });
    }
  });
};