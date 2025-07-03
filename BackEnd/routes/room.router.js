const express = require('express');
const router = express.Router();
const xlsx = require('xlsx');
const multer = require('multer');
const Room = require('../model/room.js');
const fs = require('fs');
const upload = multer({ dest: "uploads/" });

// ✅ Create Room
// router.post('', async (req, res) => {
//   try {
//     const { roomid, RoomName, RoomType } = req.body;

//     if (!roomid || !RoomName || !RoomType) {
//       return res.status(400).json({ status: false, message: 'All fields are required' });
//     }

//     // Check duplicate roomid
//     const exists = await Room.findOne({ roomid });
//     if (exists) {
//       return res.status(409).json({ status: false, message: 'Room ID already exists' });
//     }

//     const room = new Room({ roomid, RoomName, RoomType });
//     await room.save();

//     res.status(201).json({ status: true, message: 'Room created successfully', data: room });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ status: false, message: 'Server error' });
//   }
// });

// ✅ Upload Rooms from Excel

router.post('/uploadallrooms', upload.single('excelFile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded.' });
    }

    const workbook = xlsx.readFile(req.file.path);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = xlsx.utils.sheet_to_json(sheet, { defval: '' });

    if (rows.length === 0) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ success: false, message: 'Excel file is empty.' });
    }

    const lastRoom = await Room.findOne({}).sort({ roomid: -1 }).lean();
    let lastNumber = 0;

    if (lastRoom && lastRoom.roomid) {
      const match = lastRoom.roomid.match(/\d+/);
      if (match) lastNumber = parseInt(match[0]);
    }

    const results = [];
    const validRooms = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNumber = i + 2;

      const RoomName = String(row.RoomName || '').trim();
      const RoomType = String(row.RoomType || '').trim();

      if (!RoomName || !RoomType) {
        results.push({
          row: rowNumber,
          status: 'failed',
          error: 'Missing required fields: RoomName or RoomType'
        });
        continue;
      }

      const existingRoom = await Room.findOne({
        RoomName: { $regex: new RegExp(`^${RoomName}$`, 'i') }
      });

      if (existingRoom) {
        results.push({
          row: rowNumber,
          status: 'failed',
          error: `Room with name '${RoomName}' already exists.`
        });
        continue;
      }

      lastNumber += 1;
      const roomid = lastNumber.toString().padStart(4, '0');

      validRooms.push({ roomid, RoomName, RoomType });

      results.push({
        row: rowNumber,
        roomid,
        status: 'success',
        message: 'Room validated and added successfully.'
      });
    }

    if (validRooms.length > 0) {
      await Room.insertMany(validRooms);
    }

    fs.unlinkSync(req.file.path);

    res.status(200).json({
      success: true,
      message: 'Upload completed.',
      data: results
    });
  } catch (error) {
    console.error('Upload Room Excel API error:', error);
    if (req.file) fs.unlinkSync(req.file.path);
    res.status(500).json({
      success: false,
      message: 'Server error while uploading rooms.',
      error: error.message
    });
  }
});


// ✅ Get all rooms with sr_no
router.get('/', async (req, res) => {
  try {
    const rooms = await Room.find();

    // ✅ Map with sr_no
    const roomsWithSrNo = rooms.map((room, index) => ({
      sr_no: index + 1,
      _id: room._id,
      roomid: room.roomid,
      RoomName: room.RoomName,
      RoomType: room.RoomType
    }));

    res.json({ status: true, data: roomsWithSrNo });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: false, message: 'Server error' });
  }
});

// ✅ Get single room by Mongo _id
router.get('/room/:id', async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) {
      return res.status(404).json({ status: false, message: 'Room not found' });
    }
    res.json({ status: true, data: room });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: false, message: 'Server error' });
  }
});

// ✅ Update room
router.put('/room/:id', async (req, res) => {
  try {
    const { roomid, RoomName, RoomType } = req.body;

    const room = await Room.findByIdAndUpdate(
      req.params.id,
      { roomid, RoomName, RoomType },
      { new: true }
    );

    if (!room) {
      return res.status(404).json({ status: false, message: 'Room not found' });
    }

    res.json({ status: true, message: 'Room updated successfully', data: room });

  } catch (err) {
    console.error(err);
    res.status(500).json({ status: false, message: 'Server error' });
  }
});

// ✅ Delete room
router.delete('/room/:id', async (req, res) => {
  try {
    const room = await Room.findByIdAndDelete(req.params.id);

    if (!room) {
      return res.status(404).json({ status: false, message: 'Room not found' });
    }

    res.json({ status: true, message: 'Room deleted successfully' });

  } catch (err) {
    console.error(err);
    res.status(500).json({ status: false, message: 'Server error' });
  }
});

module.exports = router;