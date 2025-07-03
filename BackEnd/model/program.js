const mongoose = require('mongoose');
const db = require('../config/db');

const programSchema = new mongoose.Schema({
  p_id: { 
    type: String, 
    required: true, 
    trim: true, 
    index: true, 
    unique: true,
    lowercase: true // Normalize to lowercase
  },
  p_name: { type: String, required: true },
  department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: true }
}, 
{ versionKey: false });

//const Program = db.model('Program', programSchema);
const Program = db.models.Program || db.model('Program', programSchema);
module.exports = Program;