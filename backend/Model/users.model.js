const mongoose = require('mongoose');

const calorieEntrySchema = new mongoose.Schema({
    foodItem: String,
    foodAmount: String,
    calories: String,
    proteins: String,
    fats: String,
    carbs: String,
    timestamp: { type: Date, default: Date.now }
});

const voiceSessionSchema = new mongoose.Schema({
    transcript: [{
        role: String,
        content: String,
        timestamp: { type: Date, default: Date.now }
    }],
    duration_seconds: Number,
    session_date: { type: Date, default: Date.now }
});

const useSchema = mongoose.Schema({
    name: String,
    email: String,
    password: String,
    height: String,
    weight: String,
    gender: String,
    age: String,
    activitylevel: String,
    location: {
        country: { type: String, default: '' },
        city: { type: String, default: '' },
        region: { type: String, default: '' }
    },
    dietaryRestrictions: {
        vegetarian: { type: Boolean, default: false },
        vegan: { type: Boolean, default: false },
        glutenFree: { type: Boolean, default: false },
        dairyFree: { type: Boolean, default: false },
        halal: { type: Boolean, default: false },
        kosher: { type: Boolean, default: false },
        noBeef: { type: Boolean, default: false },
        noPork: { type: Boolean, default: false }
    },
    calories: [calorieEntrySchema],
    voiceSessions: [voiceSessionSchema],
    dailyGoals: {
        calories: {
            type: Number,
            default: 2000
        },
        proteins: {
            type: Number,
            default: 150
        },
        carbs: {
            type: Number,
            default: 250
        },
        fats: {
            type: Number,
            default: 65
        }
    }
})

const UserModel = mongoose.model('user', useSchema);

module.exports = {
    UserModel
}