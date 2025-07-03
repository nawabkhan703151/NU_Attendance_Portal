const mongoose = require('mongoose');
const db = require('../config/db');

const departmentSchema = new mongoose.Schema({
  d_id: { type: String, required: true, unique: true },

  d_name: { type: String, required: true },
  
  
    
  },
 { versionKey: false });

//const department = db.model('Department', departmentSchema);
module.exports = db.models.Department || db.model('Department', departmentSchema);

//module.exports=Department;