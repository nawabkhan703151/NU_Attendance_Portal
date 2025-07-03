const express = require('express');
const router = express.Router();
const Session = require('../model/session');
const multer = require("multer");
const xlsx = require("xlsx"); 
const fs = require("fs");
const upload = multer({ dest: "uploads/" });
const moment = require("moment-timezone");

// Helper function to convert dd-mm-yyyy to ISO format
const convertToISO = (dateStr) => {
  const [day, month, year] = dateStr.split('-');
  if (!day || !month || !year || day > 31 || month > 12 || day < 1 || month < 1) {
    throw new Error('Invalid date format or value');
  }
  return new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T00:00:00Z`).toISOString();
};

// Helper function to convert ISO to dd-mm-yyyy
const convertToDDMMYYYY = (isoDate) => {
  const date = new Date(isoDate);
  const day = String(date.getUTCDate()).padStart(2, '0');
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const year = String(date.getUTCFullYear());
  return `${day}-${month}-${year}`;
};

// Sab sessions ki list
router.get('/', async (req, res) => {
  try {
    const sessions = await Session.find();
    const formattedSessions = sessions.map((session, index) => ({
      sr_no: index + 1, // ✅ sr_no added
      ...session.toObject(),
      Start_date: convertToDDMMYYYY(session.Start_date),
      End_date: convertToDDMMYYYY(session.End_date)
    }));
    res.json(formattedSessions);
  } catch (error) {
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
});

// Session ko upload karne ke liye 


// router.post('/uploadSessionExcel', upload.single('excelFile'), async (req, res) => {
//   try {
//     if (!req.file) {
//       return res.status(400).json({
//         status: false,
//         message: 'No file uploaded.',
//       });
//     }

//     const workbook = xlsx.readFile(req.file.path);
//     const sheet = workbook.Sheets[workbook.SheetNames[0]];
//     const data = xlsx.utils.sheet_to_json(sheet, { defval: '' }); // prevent undefined

//     const results = [];

//     for (let i = 0; i < data.length; i++) {
//       const record = data[i];
//       const { ses_id, session_name, start_date, end_date } = record;

//       try {
//         if (!ses_id || !session_name) {
//           results.push({
//             row: i + 2,
//             ses_id: ses_id || 'N/A',
//             status: 'failed',
//             error: 'Missing required fields: ses_id or session_name',
//           });
//           continue;
//         }

//         const existing = await Session.findOne({ ses_id: ses_id.trim() });
//         if (existing) {
//           results.push({
//             row: i + 2,
//             ses_id,
//             status: 'failed',
//             error: 'Session with this ses_id already exists',
//           });
//           continue;
//         }

//         const parsedStartDate = moment(start_date, 'DD-MM-YYYY', true);
//         const parsedEndDate = moment(end_date, 'DD-MM-YYYY', true);

//         if (!parsedStartDate.isValid() || !parsedEndDate.isValid()) {
//           results.push({
//             row: i + 2,
//             ses_id,
//             status: 'failed',
//             error: 'Invalid date format (expected DD-MM-YYYY)',
//           });
//           continue;
//         }

//         const newSession = new Session({
//           ses_id: ses_id.trim(),
//           session_name: session_name.trim(),
//           Start_date: parsedStartDate.toDate(),
//           End_date: parsedEndDate.toDate(),
//         });

//         await newSession.save();

//         results.push({
//           row: i + 2,
//           ses_id,
//           status: 'success',
//           message: 'Session added successfully',
//         });

//       } catch (err) {
//         results.push({
//           row: i + 2,
//           ses_id: ses_id || 'N/A',
//           status: 'failed',
//           error: err.message,
//         });
//       }
//     }

//     fs.unlink(req.file.path, (err) => {
//       if (err) console.error('Error deleting file:', err.message);
//     });

//     res.status(200).json({
//       status: true,
//       message: 'Session Excel upload processed.',
//       totalRecords: data.length,
//       results,
//     });

//   } catch (error) {
//     console.error('Upload error:', error);
//     res.status(500).json({
//       status: false,
//       message: 'Server error during upload.',
//       error: error.message,
//     });
//   }
// });


// ✅ Convert dd-mm-yyyy string to Date object

// ✅ Convert dd-mm-yyyy string to Date object

// ✅ Convert dd-mm-yyyy string to Date object
function parseDate(dateStr) {
  if (!dateStr) return null;
  const parts = dateStr.split('-');
  if (parts.length !== 3) return null;
  return new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
}

// ✅ Generate new ses_id (e.g. s0001)
async function generateSessionId(lastNumber) {
  const newNumber = lastNumber + 1;
  return 's' + newNumber.toString().padStart(4, '0');
}

// ✅ Upload Session Excel API
router.post('/uploadSessionExcel', upload.single('excelFile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ status: false, message: 'No file uploaded.' });
    }

    const workbook = xlsx.readFile(req.file.path);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = xlsx.utils.sheet_to_json(sheet);

    const results = [];

    const lastSession = await Session.findOne({}).sort({ ses_id: -1 }).lean();
    let lastNumber = 0;
    if (lastSession && lastSession.ses_id) {
      const match = lastSession.ses_id.match(/\d+/);
      if (match) lastNumber = parseInt(match[0]);
    }

    const validSessions = [];

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const rowNumber = i + 2; // Excel row index (header = 1)

      const session_name = String(row.session_name || '').trim();
      const start_date = String(row.start_date || '').trim();
      const end_date = String(row.end_date || '').trim();

      // ✅ Validate required fields
      if (!session_name || !start_date || !end_date) {
        results.push({
          row: rowNumber,
          ses_id: '',
          status: 'failed',
          error: 'Missing session_name, start_date, or end_date',
        });
        continue;
      }

      // ✅ Validate date format
      const parsedStartDate = parseDate(start_date);
      const parsedEndDate = parseDate(end_date);

      if (!parsedStartDate || !parsedEndDate || isNaN(parsedStartDate) || isNaN(parsedEndDate)) {
        results.push({
          row: rowNumber,
          ses_id: '',
          status: 'failed',
          error: 'Invalid date format. Use DD-MM-YYYY.',
        });
        continue;
      }

      // ✅ Check for duplicate session name
      const existingSession = await Session.findOne({ session_name });
      if (existingSession) {
        results.push({
          row: rowNumber,
          ses_id: '',
          status: 'failed',
          error: `Session "${session_name}" already exists.`,
        });
        continue;
      }

      // ✅ All checks passed – generate ID & prepare data
      lastNumber += 1;
      const new_ses_id = await generateSessionId(lastNumber);

      validSessions.push({
        ses_id: new_ses_id,
        session_name,
        Start_date: parsedStartDate,  // ✅ Corrected field name and value
        End_date: parsedEndDate       // ✅ Corrected field name and value
      });

      results.push({
        row: rowNumber,
        ses_id: new_ses_id,
        status: 'success',
        message: 'Inserted successfully',
      });
    }

    // ✅ Insert only if there is valid data
    if (validSessions.length > 0) {
      await Session.insertMany(validSessions);
    }

    // ✅ Remove temp Excel file
    fs.unlink(req.file.path, (err) => {
      if (err) console.error('Error deleting uploaded file:', err.message);
    });

    // ✅ Final response
    res.status(200).json({
      status: validSessions.length > 0,
      message: validSessions.length > 0
        ? 'Session upload completed.'
        : 'No sessions inserted due to validation errors.',
      results,
    });
  } catch (error) {
    console.error('Upload Session Excel API error:', error);
    res.status(500).json({
      status: false,
      message: 'Server error while uploading sessions.',
      error: error.message,
    });
  }
});


// Ek session ko ses_id se dhoondo
router.get('/:ses_id', async (req, res) => {
  try {
    const session = await Session.findOne({ ses_id: req.params.ses_id });
    if (!session) return res.status(404).json({ error: 'Session nahi mila' });
    const formattedSession = {
      ...session.toObject(),
      Start_date: convertToDDMMYYYY(session.Start_date),
      End_date: convertToDDMMYYYY(session.End_date)
    };
    res.json(formattedSession);
  } catch (error) {
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
});

// Naya session banao
router.post('/', async (req, res) => {
  try {
    const { ses_id, session_name, Start_date, End_date } = req.body;
    console.log('Received Request Body:', req.body);
    if (!ses_id || !session_name || !Start_date || !End_date) 
      return res.status(400).json({ error: 'Sab fields zaroori hain' });

    const existing = await Session.findOne({ ses_id });
    if (existing) return res.status(400).json({ error: 'ses_id pehle se maujood hai' });

    const startISO = convertToISO(Start_date);
    const endISO = convertToISO(End_date);

    const session = new Session({ ses_id, session_name, Start_date: startISO, End_date: endISO });
    await session.save();

    const formattedSession = {
      ...session.toObject(),
      Start_date,
      End_date
    };
    res.status(201).json({ message: 'Session ban gaya', session: formattedSession });
  } catch (error) {
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
});

// Session update karo
router.put('/:ses_id', async (req, res) => {
  try {
    const { session_name, Start_date, End_date } = req.body;
    if (!session_name || !Start_date || !End_date) 
      return res.status(400).json({ error: 'Sab fields zaroori hain' });

    const startISO = convertToISO(Start_date);
    const endISO = convertToISO(End_date);

    const updatedSession = await Session.findOneAndUpdate(
      { ses_id: req.params.ses_id },
      { session_name, Start_date: startISO, End_date: endISO },
      { new: true }
    );
    if (!updatedSession) return res.status(404).json({ error: 'Session nahi mila' });

    const formattedSession = {
      ...updatedSession.toObject(),
      Start_date,
      End_date
    };
    res.json({ message: 'Session update ho gaya', session: formattedSession });
  } catch (error) {
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
});

// Session delete karo
router.delete('/:ses_id', async (req, res) => {
  try {
    const session = await Session.findOne({ ses_id: req.params.ses_id });
    if (!session) return res.status(404).json({ error: 'Session nahi mila' });

    await Session.findOneAndDelete({ ses_id: req.params.ses_id });
    res.json({ message: 'Session delete ho gaya' });
  } catch (error) {
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
});

module.exports = router;
