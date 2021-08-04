//@ts-check

const { Schema, model } = require('mongoose');

const user = new Schema({
    _id: String,
    prefab: {
        language: {
            default: 'english',
            type: String
        },
        embedColor: {
            default: 'default',
            type: String
        }
    },

    // You can add your own things after this 
});

module.exports = model('users', user);
