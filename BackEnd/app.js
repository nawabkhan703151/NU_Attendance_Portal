require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 4000;

// Middleware
app.use(cors());
app.use(express.json());

// Basic route
app.get('/', (req, res) => {
  res.json({ status: 'Server running', 
   // ip: '192.168.26.232'
   ip:'192.168.24.159'//..laptop ip
  });
});

//all routes
app.use('/', require('../BackEnd/routes/user.router'));
app.use('/student', require('./routes/student.router'));
app.use('/teacher', require('./routes/teacher.router'));    
app.use('/department', require('./routes/department.router'));
app.use('/program', require('./routes/program.router'));
app.use('/session', require('./routes/session.router'));
app.use('/course', require('./routes/course.router'));
app.use('/enrollment', require('./routes/enrollment.router'));
app.use('/timetable', require('./routes/timetable.router'));
app.use('/allocation', require('./routes/allocation.router'));
app.use('/attendance', require('./routes/attendance.router'));
app.use('/batch', require('./routes/batch.router'));
app.use('/offer', require('./routes/offer.router'));
app.use('/room', require('./routes/room.router'));
app.use('/', require('./routes/admin.router'));

// Error handler

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: err.message });
  
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server started on:
  - http://localhost:${PORT}

  - http://192.168.24.259:${PORT}`);

});