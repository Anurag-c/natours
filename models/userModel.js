const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'A user must have a name'],
        trim: true
    },
    email: {
        type: String,
        required: [true, 'A user must have an email'],
        unique: true,
        lowercase: true,
        trim: true,
        validate: [validator.isEmail, 'please provide a valid Email']
    },
    photo: {
        type: String,
        trim: true,
        default: 'default.jpg'
    },
    role: {
        type: String,
        enum: ['admin', 'user', 'guide', 'lead-guide'],
        default: 'user'
    },
    password: {
        type: String,
        required: [true, 'A user must have a password'],
        minlength: [8, 'Password must be at least 8 characters long'],
        select: false
    },
    passwordConfirm: {
        type: String,
        required: [true, 'Please Confirm your password'],
        validate: {
            // This only works on CREATE and SAVE !!!
            validator: function (el) {
                return el === this.password;
            },
            message: 'Passwords are not the same'
        },
        select: false
    },
    passwordChangedAt: {
        type: Date,
        select: false
    },
    passwordResetToken: {
        type: String,
        select: false
    },
    passwordResetExpires: {
        type: Date,
        select: false
    },
    active: {
        type: Boolean,
        default: true,
        select: false
    }
});

userSchema.pre('save', async function (next) {
    // only run this function if password was actually modified
    if (!this.isModified('password')) return next();

    //hash with cost = 12
    this.password = await bcrypt.hash(this.password, 12);
    this.passwordConfirm = undefined;
    next();
});

userSchema.pre('save', async function (next) {
    // only run this function if password was actually modified and not new
    if (!this.isModified('password') || this.isNew) return next();

    this.passwordChangedAt = Date.now() - 1000;
    next();
});

userSchema.methods.correctPassword = async function (candidatePassword, userPassword) {
    return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
    if (this.passwordChangedAt) {
        const passTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
        return passTimestamp > JWTTimestamp;
    }
    return false;
};

userSchema.methods.createPasswordResetToken = function () {
    const resetToken = crypto.randomBytes(32).toString('hex');
    this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    this.passwordResetExpires = Date.now() + 10 * 60 * 1000;
    return resetToken;
};

userSchema.pre(/^find/, function (next) {
    this.find({ active: { $ne: false } });
    next();
});

const User = mongoose.model('User', userSchema);
module.exports = User;
