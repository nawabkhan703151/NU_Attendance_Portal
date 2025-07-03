const jwt = require('jsonwebtoken');
const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { User } = require('../model/User');
const Student = require('../model/Student');
const Teacher = require('../model/Teacher');
const Batch = require('../model/batch.js');
const Program = require('../model/Program.js');
const Department = require('../model/department.js');






// router.post('/register', async (req, res) => {
//   try {
//     console.log('Request body:', req.body);

//     const { u_id, username, U_Phone, DOB, password, role, st_id, CGPA, p_id, b_id, section_name, t_id, d_id, salary } = req.body;

//     // Validate core fields
//     if (!u_id || typeof u_id !== 'string' || u_id.trim() === '') {
//       return res.status(400).json({ error: 'Valid U_Id zaroori hai' });
//     }
//     if (!username || typeof username !== 'string' || username.trim() === '') {
//       return res.status(400).json({ error: 'Valid username zaroori hai' });
//     }
//     if (!U_Phone || !/^03[0-9]{9}$/.test(U_Phone.trim())) {
//       return res.status(400).json({ error: 'Valid 03XXXXXXXXX phone number zaroori hai' });
//     }
//     if (!DOB || !/^([0-2][0-9]|(3)[0-1])(\-)(((0)[0-9])|((1)[0-2]))(\-)\d{4}$/.test(DOB)) {
//       return res.status(400).json({ error: 'DOB DD-MM-YYYY format mein hona chahiye' });
//     }
//     if (!password || typeof password !== 'string' || password.trim() === '') {
//       return res.status(400).json({ error: 'Valid password zaroori hai' });
//     }
//     if (!role || !['student', 'teacher', 'admin'].includes(role)) {
//       return res.status(400).json({ error: 'Role "student", "teacher", ya "admin" hona chahiye' });
//     }

//     // Check if user already exists
//     const existingUser = await User.findOne({ $or: [{ U_Id: u_id.trim() }, { username: username.trim() }] });
//     if (existingUser) {
//       return res.status(400).json({ error: 'U_Id or username already exists' });
//     }

//     // Create new user
//     const user = new User({
//       U_Id: u_id.trim(),
//       username: username.trim(),
//       U_Phone: U_Phone.trim(),
//       DOB: DOB,
//       password: password.trim(),
//       role,
//     });
//     await user.save();

//     // Handle role-specific registration
//     if (role === 'student') {
//       if (!st_id || typeof st_id !== 'string' || st_id.trim() === '') {
//         await User.deleteOne({ _id: user._id });
//         return res.status(400).json({ error: 'Valid st_id zaroori hai' });
//       }
//       if (CGPA === undefined || isNaN(CGPA) || CGPA < 0 || CGPA > 4) {
//         await User.deleteOne({ _id: user._id });
//         return res.status(400).json({ error: 'CGPA 0 to 4 ke beech hona chahiye' });
//       }
//       if (!p_id || typeof p_id !== 'string' || p_id.trim() === '') {
//         await User.deleteOne({ _id: user._id });
//         return res.status(400).json({ error: 'Valid p_id zaroori hai' });
//       }
//       if (!b_id || typeof b_id !== 'string' || b_id.trim() === '') {
//         await User.deleteOne({ _id: user._id });
//         return res.status(400).json({ error: 'Valid b_id zaroori hai' });
//       }
//       if (section_name && typeof section_name !== 'string' || section_name.trim() === '') {
//         await User.deleteOne({ _id: user._id });
//         return res.status(400).json({ error: 'Valid section_name zaroori hai agar diya jaye' });
//       }

//       // Check if student with st_id already exists
//       const existingStudent = await Student.findOne({ st_id: st_id.trim() });
//       if (existingStudent) {
//         await User.deleteOne({ _id: user._id });
//         return res.status(400).json({ error: 'st_id pehle se mojood hai' });
//       }

//       // Check if Program exists
//       const program = await Program.findOne({ p_id: p_id.trim().toLowerCase() });
//       if (!program) {
//         await User.deleteOne({ _id: user._id });
//         return res.status(404).json({ error: `Program ${p_id} nahi mila` });
//       }

//       // Check if Batch exists
//       const batch = await Batch.findOne({ b_id: b_id.trim() });
//       if (!batch) {
//         await User.deleteOne({ _id: user._id });
//         return res.status(404).json({ error: `Batch ${b_id} nahi mila` });
//       }

//       // Add student to Batch
//       batch.students.push(user._id);
//       await batch.save();

//       const student = new Student({
//         userId: user._id,
//         st_id: st_id.trim(),
//         p_id: p_id.trim(),
//         b_id: b_id.trim(),
//         section_name: section_name ? section_name.trim() : null,
//         CGPA: Number(CGPA),
//       });
//       await student.save();

//       return res.status(201).json({
//         message: 'Student register hogaya',
//         U_Id: user.U_Id,
//         username: user.username,
//         st_id: student.st_id,
//         p_id: student.p_id,
//         b_id: student.b_id,
//         section_name: student.section_name,
//         CGPA: student.CGPA,
//       });
//     } else if (role === 'teacher') {
//       if (!t_id || typeof t_id !== 'string' || t_id.trim() === '') {
//         await User.deleteOne({ _id: user._id });
//         return res.status(400).json({ error: 'Valid t_id zaroori hai' });
//       }
//       if (!d_id || typeof d_id !== 'string' || d_id.trim() === '') {
//         await User.deleteOne({ _id: user._id });
//         return res.status(400).json({ error: 'Valid d_id zaroori hai' });
//       }
//       if (salary === undefined || isNaN(salary) || salary < 0) {
//         await User.deleteOne({ _id: user._id });
//         return res.status(400).json({ error: 'Salary positive number hona chahiye' });
//       }

//       const existingTeacher = await Teacher.findOne({ t_id: t_id.trim() });
//       if (existingTeacher) {
//         await User.deleteOne({ _id: user._id });
//         return res.status(400).json({ error: 't_id pehle se mojood hai' });
//       }

//       const department = await Department.findOne({ d_id: d_id.trim() });
//       if (!department) {
//         await User.deleteOne({ _id: user._id });
//         return res.status(404).json({ error: `Department ${d_id} nahi mila` });
//       }

//       const teacher = new Teacher({
//         userId: user._id,
//         t_id: t_id.trim(),
//         department: department._id,
//         salary: Number(salary),
//       });
//       await teacher.save();

//       // Update Department teachers array
//       department.teachers = department.teachers || [];
//       if (!department.teachers.includes(teacher._id)) {
//         department.teachers.push(teacher._id);
//         await department.save();
//       }

//       return res.status(201).json({
//         message: 'Teacher register hogaya',
//         U_Id: user.U_Id,
//         username: user.username,
//         t_id: teacher.t_id,
//         d_id: department.d_id,
//         salary: teacher.salary,
//       });
//     } else if (role === 'admin') {
//       return res.status(201).json({
//         message: 'Admin register hogaya',
//         U_Id: user.U_Id,
//         username: user.username,
//       });
//     }
//   } catch (error) {
//     console.error('Registration error:', error);
//     if (error.code === 11000) {
//       const field = Object.keys(error.keyPattern)[0];
//       return res.status(400).json({ error: `${field} pehle se mojood hai` });
//     }
//     if (error.name === 'ValidationError') {
//       const messages = Object.values(error.errors).map(err => err.message);
//       return res.status(400).json({ error: 'Validation failed', details: messages });
//     }
//     res.status(500).json({ error: 'Server error', details: error.message });
//   }
// });


//Login Route (Updated to return only st_id for student or t_id for teacher)

// Login route




router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Input validation
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    // Authenticate user using findByCredentials
    const user = await User.findByCredentials(username, password);

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, role: user.role },
      'your-secret-key', // Replace with your secret key (store in environment variable in production)
      { expiresIn: '1h' }
    );

    // Prepare response based on role
    let responseData = {
      U_Id: user._id.toString(), // Add U_Id field
      username: user.username,
      role: user.role
    };

    if (user.role === 'student') {
      // Fetch st_id from Student collection
      const student = await Student.findOne({ userId: user._id });
      
      if (!student) {
        return res.status(404).json({ error: 'Student not found' });
      }

      responseData.st_id = student.st_id; // Include st_id for student
    } 
    else if (user.role === 'teacher') {
      // Fetch t_id from Teacher collection
      const teacher = await Teacher.findOne({ userId: user._id });
    
      if (!teacher) {
        return res.status(404).json({ error: 'Teacher not found' });
      }
    
      responseData.t_id = teacher.t_id; // Include t_id for teacher
    } else if (user.role === 'admin') {
      // No additional data needed for admin
    }

    res.status(200).json({
      status: true, // Added status field to match frontend expectation
      token: token, // Include token in response
      user: responseData
    });
  } catch (error) {
    console.error(error);
    if (error.message === 'Invalid credentials') {
      return res.status(400).json({ error: 'Wrong username or password' });
    }
    res.status(500).json({ error: 'Username or Password do not match' });
  }
});
 
module.exports = router;
