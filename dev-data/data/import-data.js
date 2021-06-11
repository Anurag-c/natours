const mongoose = require('mongoose');
const dotenv = require('dotenv');
const fs = require('fs');
const Tour = require('../../models/tourModel');
const User = require('../../models/userModel');
const Review = require('../../models/reviewModel');

dotenv.config({ path: '../../config.env' });

const DB = process.env.DATABASE.replace('<PASSWORD>', process.env.DATABASE_PASSWORD);

mongoose
    .connect(DB, {
        useNewUrlParser: true,
        useCreateIndex: true,
        useFindAndModify: false
    })
    .then(() => console.log('DB Connection Successful'));

const tours = JSON.parse(fs.readFileSync(`${__dirname}/tours.json`, 'UTF-8'));
const users = JSON.parse(fs.readFileSync(`${__dirname}/users.json`, 'UTF-8'));
const reviews = JSON.parse(fs.readFileSync(`${__dirname}/reviews.json`, 'UTF-8'));

// IMPORT SAMPLE DATA
const importData = async () => {
    try {
        await Tour.create(tours);
        await User.create(users, { validateBeforeSave: false });
        await Review.create(reviews);
        console.log('Data loaded successfully');
    } catch (err) {
        console.log(err.message);
    }
    process.exit();
};

// DELETE ALL DATA
const deleteData = async () => {
    try {
        await Tour.deleteMany();
        await User.deleteMany();
        await Review.deleteMany();
        console.log('Data Deleted successfully');
    } catch (err) {
        console.log(err.message);
    }
    process.exit();
};

console.log(process.argv);

if (process.argv[2] === '--import') {
    importData();
}
if (process.argv[2] === '--delete') {
    deleteData();
}
