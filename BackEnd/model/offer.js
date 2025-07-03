const mongoose = require('mongoose');
const db = require('../config/db');

const offerSchema = new mongoose.Schema({
  offer_id: { // Alag ID assuming aapne 'c' ka matlab offer_id se liya
    type: String,
    required: true,
    unique: true,
  },
  c_code: { // Link to Course
    type: String,
    required: true,
  },
 session: { // Changed from ses_id to session object
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Session',
    required: true,
  },
}, {
  versionKey: false,
});
const offer = db.model('Offers', offerSchema);
module.exports = offer;