const mongoose = require('mongoose');
const db=require('../config/db');

const batchSchema = new mongoose.Schema({
  b_id: { type: String, required: true, unique: true },
  Batch_Name: { type: String, required: true },
  Start_Date: { type: String },
  End_Date: { type: String },
students: [{                                   // Many-to-many relationship with Student
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true,
  }],

},
 { versionKey: false });


//const batch = db.model('Batch', batchSchema);
const Batch = db.models.Batch || db.model('Batch', batchSchema);
module.exports=Batch;