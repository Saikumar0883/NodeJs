const mongoose = require('mongoose')
const bcrypt = require('bcrypt')
const { isEmail } = require('validator')
const userSchema = new mongoose.Schema({
    userName: {
        type: String,
        required: [true, 'Please enter username'],
        minlength: [6, 'Min length is 6 characters'],
    },
    email: {
        type: String,
        required: [true, 'Please enter an email'],
        unique: true,
        lowercase: true,
        validate: [isEmail, 'Please enter a valid email']
    },
    password: {
        type: String,
        required: [true, 'Please enter a password'],
        minlength: [6, 'Minimum password length is  6 characters'],
    },
    MyLocation: {
        type: mongoose.Schema.Types.ObjectId,
        ref:'Location'
    },
    SavedLocations: [{
        type: mongoose.Schema.Types.ObjectId,
        ref:'Location'
    }]
})

//fire a function after the doc is saved
userSchema.post('save', function (doc, next) {
    // console.log('new user created and saved', doc);
    next();
})

//fire a function before doc saved to db
userSchema.pre('save', async function (next) {
    // Only hash the password if it's a new document
    if (this.isNew) {
        const salt = await bcrypt.genSalt();
        this.password = await bcrypt.hash(this.password, salt);
        // console.log("After hashing, salt and hashed password at the time of signup");
        // console.log(salt);
        // console.log(this.password);
    }
    next();
});




//static method for login user
userSchema.statics.login = async function (email, password) {
    const user = await this.findOne({ email });
    if (user) {
        const auth = await bcrypt.compare(password, user.password);
        // console.log("While login password and hashed password");
        // console.log(password);
        // console.log(user.password);
        // console.log('Password Match:', auth); // Log result of password comparison
        if (auth) {
            return user;
        }
        throw Error('incorrect password');
    }
    throw Error('incorrect email');
};

const User = mongoose.model('User', userSchema);
module.exports = User