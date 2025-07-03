const express = require('express');
const router = express.Router();
const Batch = require('../model/batch');
const multer = require("multer");
const xlsx = require("xlsx"); 
const fs = require("fs");
const upload = multer({ dest: "uploads/" });

router.get('/', async (req, res) => {
  try {
    const batches = await Batch.find()
      .populate('students', 'sr_no st_id');

    // Serial number add karo
    const batchesWithSrNo = batches.map((batch, index) => ({
      sr_no: index + 1, // Serial number starting from 1
      ...batch._doc, // Spread original batch data
    }));

    return res.status(200).json({
      message: 'Batches fetch ho gaye',
      batches: batchesWithSrNo,
    });
  } catch (error) {
    console.error('Batches fetch error:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});
// ye admin main batch ko upload karti hai.
// router.post('/uploadBatchExcel', upload.single('excelFile'), async (req, res) => {
//   try {
//     if (!req.file) {
//       return res.status(400).json({
//         status: false,
//         message: 'No file uploaded.',
//       });
//     }

//     const workbook = xlsx.readFile(req.file.path);
//     const sheet = workbook.Sheets[workbook.SheetNames[0]];
//     const data = xlsx.utils.sheet_to_json(sheet);
//     const results = [];

//     for (let i = 0; i < data.length; i++) {
//       const record = data[i];
//       const { b_id, Batch_Name, Start_Date, End_Date } = record;

//       try {
//         if (!b_id || !Batch_Name) {
//           results.push({
//             row: i + 2,
//             b_id: b_id || 'N/A',
//             status: 'failed',
//             error: 'Missing required fields: b_id or Batch_Name',
//           });
//           continue;
//         }

//         const existingBatch = await Batch.findOne({ b_id: b_id.trim() });
//         if (existingBatch) {
//           results.push({
//             row: i + 2,
//             b_id,
//             status: 'failed',
//             error: 'Batch with this b_id already exists',
//           });
//           continue;
//         }

//         const batch = new Batch({
//           b_id: b_id.trim(),
//           Batch_Name: Batch_Name.trim(),
//           Start_Date: Start_Date ? Start_Date.toString().trim() : null,
//           End_Date: End_Date ? End_Date.toString().trim() : null,
//         });

//         await batch.save();

//         results.push({
//           row: i + 2,
//           b_id,
//           status: 'success',
//           message: 'Batch added successfully',
//         });

//       } catch (innerError) {
//         console.error(`Error processing row ${i + 2}:`, innerError.message);  // ✅ FIXED HERE
//         results.push({
//           row: i + 2,
//           b_id: b_id || 'N/A',
//           status: 'failed',
//           error: innerError.message,
//         });
//       }
//     }

//     fs.unlink(req.file.path, (err) => {
//       if (err) console.error('Error deleting uploaded file:', err.message);
//     });

//     res.status(200).json({
//       status: true,
//       message: 'Batch Excel upload processed successfully.',
//       totalRecords: data.length,
//       results,
//     });

//   } catch (error) {
//     console.error('Upload Batch Excel API error:', error);
//     res.status(500).json({
//       status: false,
//       message: 'Server error while uploading batches.',
//       error: error.message,
//     });
//   }
// });


// Utility to generate b_id
async function generateBatchId(lastNumber) {
  const newNumber = lastNumber + 1;
  return 'b' + newNumber.toString().padStart(4, '0');
}

// Route to upload batch Excel
router.post('/uploadBatchExcel', upload.single('excelFile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        status: false,
        message: 'No file uploaded.',
      });
    }

    const workbook = xlsx.readFile(req.file.path);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = xlsx.utils.sheet_to_json(sheet);

    const results = [];

    // Get last batch number once
    const lastBatch = await Batch.findOne().sort({ b_id: -1 }).lean();
    let lastNumber = 0;
    if (lastBatch && lastBatch.b_id) {
      const match = lastBatch.b_id.match(/\d+/);
      if (match) lastNumber = parseInt(match[0]);
    }

    for (let i = 0; i < data.length; i++) {
      const record = data[i];
      const { Batch_Name, Start_Date, End_Date } = record;

      try {
        if (!Batch_Name) {
          results.push({
            row: i + 2,
            b_id: 'N/A',
            status: 'failed',
            error: 'Missing required field: Batch_Name',
          });
          continue;
        }

        // Generate new b_id
        lastNumber += 1;
        const new_b_id = await generateBatchId(lastNumber);

        // Check duplicate Batch_Name (optional)
        const existingBatch = await Batch.findOne({ Batch_Name: Batch_Name.trim() });
        if (existingBatch) {
          results.push({
            row: i + 2,
            b_id: new_b_id,
            status: 'failed',
            error: 'Batch with this name already exists',
          });
          continue;
        }

        const batch = new Batch({
          b_id: new_b_id,
          Batch_Name: Batch_Name.trim(),
          Start_Date: Start_Date ? String(Start_Date).trim() : '',
          End_Date: End_Date ? String(End_Date).trim() : '',
        });

        await batch.save();

        results.push({
          row: i + 2,
          b_id: new_b_id,
          status: 'success',
          message: 'Batch added successfully',
        });

      } catch (innerError) {
        console.error(`Error processing row ${i + 2}:`, innerError.message);
        results.push({
          row: i + 2,
          b_id: 'N/A',
          status: 'failed',
          error: innerError.message,
        });
      }
    }

    // Clean up uploaded file
    fs.unlink(req.file.path, (err) => {
      if (err) console.error('Error deleting uploaded file:', err.message);
    });

    res.status(200).json({
      status: true,
      message: 'Batch Excel upload processed successfully.',
      totalRecords: data.length,
      results,
    });

  } catch (error) {
    console.error('Upload Batch Excel API error:', error);
    res.status(500).json({
      status: false,
      message: 'Server error while uploading batches.',
      error: error.message,
    });
  }
});

router.get('/', async (req, res) => {
  try {
    const batches = await Batch.find().populate('students', 'st_id'); // Populate students with st_id
    return res.status(200).json({
      message: 'Batches fetch ho gaye',
      batches: batches,
    });
  } catch (error) {
    console.error('Batches fetch error:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});


router.get('/:b_id', async (req, res) => {
  try {
    const { b_id } = req.params;
    const batch = await Batch.findOne({ b_id: b_id.trim() }).populate('students', 'st_id');
    if (!batch) {
      return res.status(404).json({ error: 'Batch nahi mila' });
    }
    return res.status(200).json({
      message: 'Batch fetch hogaya',
      batch: batch,
    });
  } catch (error) {
    console.error('Batch fetch error:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});


router.put('/:b_id', async (req, res) => {
  try {
    const { b_id } = req.params;
    const { Batch_Name, Start_Date, End_Date } = req.body;

    const batch = await Batch.findOne({ b_id: b_id.trim() });
    if (!batch) {
      return res.status(404).json({ error: 'Batch nahi mila' });
    }

    if (Batch_Name && typeof Batch_Name === 'string' && Batch_Name.trim() !== '') {
      batch.Batch_Name = Batch_Name.trim();
    }
    if (Start_Date && typeof Start_Date === 'string' && Start_Date.trim() !== '') {
      batch.Start_Date = Start_Date.trim();
    }
    if (End_Date && typeof End_Date === 'string' && End_Date.trim() !== '') {
      batch.End_Date = End_Date.trim();
    }

    await batch.save();

    return res.status(200).json({
      message: 'Batch update hogaya',
      batch: batch,
    });
  } catch (error) {
    console.error('Batch update error:', error);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ error: 'Validation failed', details: messages });
    }
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});


router.delete('/:b_id', async (req, res) => {
  try {
    const { b_id } = req.params;
    const batch = await Batch.findOneAndDelete({ b_id: b_id.trim() });
    if (!batch) {
      return res.status(404).json({ error: 'Batch nahi mila' });
    }
    return res.status(200).json({
      message: 'Batch delete hogaya',
      b_id: batch.b_id,
    });
  } catch (error) {
    console.error('Batch delete error:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});



module.exports = router;