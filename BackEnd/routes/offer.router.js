const express = require('express');
const router = express.Router();
const multer = require("multer");
const xlsx = require("xlsx"); 
const path = require('path');
const fs = require("fs");
const upload = multer({ dest: "uploads/" });
const Course = require('../model/course.js');
const Session = require('../model/session.js');
const Offer = require('../model/offer.js');

router.post('', async (req, res) => {
  try {
    const { offer_id, c_code, session_id } = req.body;

    // ✅ Validate
    if (!offer_id || !c_code || !session_id) {
      return res.status(400).json({ message: 'offer_id, c_code, and session_id are required' });
    }

    // ✅ Session ka ObjectId nikaalo
    const session = await Session.findOne({ ses_id: session_id });
    if (!session) {
      return res.status(404).json({ message: 'Session not found with given session_id' });
    }

    // ✅ Check duplicate offer
    const existing = await Offer.findOne({ offer_id });
    if (existing) {
      return res.status(400).json({ message: 'Offer ID already exists' });
    }

    // ✅ Save Offer with proper session ObjectId
    const newOffer = new Offer({
      offer_id,
      c_code,
      session: session._id // ✅ auto set
    });

    await newOffer.save();

    res.status(201).json({ message: 'Offer created successfully', offer: newOffer });

  } catch (error) {
    console.error('Offer creation error:', error);
    res.status(500).json({ message: 'Error creating offer', error: error.message });
  }
});

const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// Multer disk storage setup
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function(req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

// ✅ POST /api/offers/uploadExcel


router.post('/uploadOffersExcel', upload.single('excelFile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ status: false, message: 'No file uploaded' });
    }

    const workbook = xlsx.readFile(req.file.path);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = xlsx.utils.sheet_to_json(sheet, { defval: '' });

    if (data.length === 0) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ status: false, message: 'Excel file is empty.' });
    }

    const lastOffer = await Offer.findOne({}).sort({ offer_id: -1 }).lean();
    let lastNumber = 0;
    if (lastOffer && lastOffer.offer_id) {
      const match = lastOffer.offer_id.match(/\d+/);
      if (match) lastNumber = parseInt(match[0]);
    }

    const results = [];
    const validOffers = [];

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const rowNumber = i + 2;

      const c_code = String(row.c_code || '').trim();
      const course_name = String(row.course_name || '').trim();
      const session_name = String(row.session_name || '').trim();

      if (!c_code || !course_name || !session_name) {
        results.push({
          row: rowNumber,
          status: 'failed',
          error: 'Missing required fields: c_code, course_name, or session_name'
        });
        continue;
      }

      const course = await Course.findOne({ c_code: c_code, c_title: course_name });
      if (!course) {
        results.push({
          row: rowNumber,
          status: 'failed',
          error: `Course with c_code '${c_code}' and name '${course_name}' not found`
        });
        continue;
      }

      const session = await Session.findOne({ session_name: session_name });
      if (!session) {
        results.push({
          row: rowNumber,
          status: 'failed',
          error: `Session '${session_name}' not found`
        });
        continue;
      }

      lastNumber += 1;
      const offer_id = 'o' + lastNumber.toString().padStart(4, '0');

      validOffers.push({
        offer_id,
        c_code,
        session: session._id
      });

      results.push({
        row: rowNumber,
        offer_id,
        status: 'success'
      });
    }

    const hasErrors = results.some(r => r.status === 'failed');
    if (hasErrors) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({
        status: false,
        message: 'Validation failed. No offers inserted.',
        results
      });
    }

    await Offer.insertMany(validOffers);
    fs.unlinkSync(req.file.path);

    res.status(201).json({
      status: true,
      message: 'All offers inserted successfully.',
      insertedCount: validOffers.length,
      results
    });

  } catch (err) {
    console.error('Offer Excel Upload Error:', err);
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    res.status(500).json({
      status: false,
      message: 'Server error while uploading offers.',
      error: err.message
    });
  }
});


// ✅ GET /api/offers/
router.get('/', async (req, res) => {
  try {
    const offers = await Offer.find()
      .populate({
        path: 'session',
        select: 'session_name -_id'
      })
      .lean();

    const data = [];

    for (let i = 0; i < offers.length; i++) {
      const offer = offers[i];

      // Course find karo
      const course = await Course.findOne({ c_code: offer.c_code.trim() }).select('c_title -_id');

      data.push({
        sr_no: i + 1,
        offer_id: offer.offer_id,
        c_code: offer.c_code,
        course_name: course ? course.c_title : 'Not Found',
        session_name: offer.session ? offer.session.session_name : 'Not Found'
      });
    }

    res.status(200).json({
      success: true,
      data: data
    });

  } catch (error) {
    console.error('Offers fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});


router.delete('/:offer_id', async (req, res) => {
  try {
    const { offer_id } = req.params;

    const offer = await Offer.findOneAndDelete({ offer_id });
    if (!offer) {
      return res.status(404).json({ 
        success: false,
        message: 'Offer not found' 
      });
    }

    res.status(200).json({
      success: true,
      message: 'Offer deleted successfully',
      deleted_offer: {
        offer_id: offer.offer_id,
        c_code: offer.c_code,
        session_id: offer.ses_id
      }
    });

  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Server error',
      error: error.message 
    });
  }
});

module.exports = router;