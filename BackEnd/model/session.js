const mongoose = require('mongoose');
const db = require('../config/db');

const sessionSchema = new mongoose.Schema({
  ses_id: { type: String, required: true },
  session_name: { type: String, required: true },
  Start_date: { type: Date, required: true },
  End_date: { type: Date, required: true },
}, { versionKey: false });

const Session = db.model('Session', sessionSchema);
module.exports = Session;
