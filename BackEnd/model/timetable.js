const mongoose = require('mongoose');
const db = require('../config/db');

const timetableSchema = new mongoose.Schema({

  timetable_id: { type: String, required: true },


  Day: String, //required:true,

  Room: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room',
    required: true
  },
  
  Venue: String,
  TimeFrom: String,

  TimeTo: String,



  Teachers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Teacher', required: true }], // Many-to-many

  session: { // Changed from ses_id to session object
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Session',
    required: true,
  },

  Courses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true }] // Many-to-many
},
  {
    versionKey: false,
  }
);

const Timetable = db.model('Timetable', timetableSchema);
module.exports = Timetable;