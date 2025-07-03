
const mongoose = require('mongoose');
const db = require('../config/db');

const attendanceSchema = new mongoose.Schema({
  timetable: { type: mongoose.Schema.Types.ObjectId, ref: 'Timetable', required: true },
  enrollment: { type: mongoose.Schema.Types.ObjectId, ref: 'Enrollment', required: true },
  teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher', required: true },
  session: { type: mongoose.Schema.Types.ObjectId, ref: 'Session', required: true },
  date: { type: String, required: true },
  status: { type: String, enum: ['P', 'A'], required: true },
  st_comment: { type: String, default: '' },
  comment_status: {
    type: String,
    enum: ['Pending', 'Accepted', 'Rejected', 'Expired'],
   
  },
  comment_expiry: { type: Date }
}, {
  versionKey: false
});

attendanceSchema.index({
  teacher: 1,
  session: 1,
  date: 1
});

//const Attendance = db.model('Attendance', attendanceSchema);
const Attendance = db.models.Attendance || db.model('Attendance', attendanceSchema);
module.exports = Attendance;


