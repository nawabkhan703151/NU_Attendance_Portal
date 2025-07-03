const mongoose = require('mongoose');
const db = require('../config/db');

const roomSchema = new mongoose.Schema({
  roomid: { type: String, required: true, unique: true }, // e.g. R1, Lab101
  RoomName: { type: String, required: true }, // e.g. "Lab 1"
  RoomType: { type: String, required: true } // e.g. "Lab", "Lecture Room"
}, {
  versionKey: false
});


const Room = db.model('Room', roomSchema);
module.exports = Room;