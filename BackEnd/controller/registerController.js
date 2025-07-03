// const express = require('express');
// const router = express.Router();
// const multer = require('multer');
// const xlsx = require('xlsx');
// const { User } = require('../model/User');
// const Student = require('../model/Student');
// const Teacher = require('../model/Teacher');
// const Program = require('../model/Program');
// const Department = require('../model/department');
// const Batch = require('../model/batch');

// const registerUsers = async (req, res) => {
//   try {
//     let data = [];

//     // 🔥 File ya body se data uthao
//     if (req.file) {
//       const workbook = xlsx.readFile(req.file.path);
//       const sheet = workbook.Sheets[workbook.SheetNames[0]];
//       data = xlsx.utils.sheet_to_json(sheet);
//     } else if (Array.isArray(req.body)) {
//       data = req.body;
//     } else if (req.body && typeof req.body === 'object') {
//       data = [req.body];
//     } else {
//       return res.status(400).json({ error: 'Invalid input format' });
//     }

//     const results = [];

//     for (let record of data) {
//       try {
//         const { u_id, username, U_Phone, DOB, password, role, st_id, CGPA, p_id, b_id, section_name, t_id, d_id, salary } = record;

//         // 🔎 Core fields check
//         if (!u_id || !username || !U_Phone || !DOB || !password || !role) {
//           results.push({ u_id, status: 'failed', error: 'Missing core fields' });
//           continue;
//         }

//         // 🔎 Phone format check
//         if (!/^03[0-9]{9}$/.test(U_Phone.trim())) {
//           results.push({ u_id, status: 'failed', error: 'Invalid phone number' });
//           continue;
//         }

//         // 🔎 DOB format check
//         if (!/^([0-2][0-9]|(3)[0-1])(\-)(((0)[0-9])|((1)[0-2]))(\-)\d{4}$/.test(DOB)) {
//           results.push({ u_id, status: 'failed', error: 'Invalid DOB format' });
//           continue;
//         }

//         // 🔎 Role valid check
//         if (!['student', 'teacher', 'admin'].includes(role)) {
//           results.push({ u_id, status: 'failed', error: 'Invalid role' });
//           continue;
//         }

//         // 🔎 Existing user check
//         const existingUser = await User.findOne({ $or: [{ U_Id: u_id.trim() }, { username: username.trim() }] });
//         if (existingUser) {
//           results.push({ u_id, status: 'failed', error: 'U_Id or username already exists' });
//           continue;
//         }

//         // ✅ Create user
//         const user = new User({
//           U_Id: u_id.trim(),
//           username: username.trim(),
//           U_Phone: U_Phone.trim(),
//           DOB,
//           password: String(password).trim(),
//           role,
//         });
//         await user.save();

//         // 🔥 Role specific saving
//         if (role === 'student') {
//           if (!st_id || CGPA === undefined || !p_id || !b_id) {
//             await User.deleteOne({ _id: user._id });
//             results.push({ u_id, status: 'failed', error: 'Missing student fields' });
//             continue;
//           }

//           const existingStudent = await Student.findOne({ st_id: st_id.trim() });
//           if (existingStudent) {
//             await User.deleteOne({ _id: user._id });
//             results.push({ u_id, status: 'failed', error: 'st_id already exists' });
//             continue;
//           }

//           const program = await Program.findOne({ p_id: p_id.trim().toLowerCase() });
//           const batch = await Batch.findOne({ b_id: b_id.trim() });

//           if (!program || !batch) {
//             await User.deleteOne({ _id: user._id });
//             results.push({ u_id, status: 'failed', error: 'Program or Batch not found' });
//             continue;
//           }

//           const student = new Student({
//             userId: user._id,
//             st_id: st_id.trim(),
//             p_id: p_id.trim(),
//             b_id: b_id.trim(),
//             section_name: section_name ? section_name.trim() : null,
//             CGPA: Number(CGPA),
//           });
//           await student.save();

//           batch.students.push(user._id);
//           await batch.save();

//           results.push({ u_id, status: 'success', role: 'student' });

//         } else if (role === 'teacher') {
//           if (!t_id || !d_id || salary === undefined) {
//             await User.deleteOne({ _id: user._id });
//             results.push({ u_id, status: 'failed', error: 'Missing teacher fields' });
//             continue;
//           }

//           const existingTeacher = await Teacher.findOne({ t_id: t_id.trim() });
//           if (existingTeacher) {
//             await User.deleteOne({ _id: user._id });
//             results.push({ u_id, status: 'failed', error: 't_id already exists' });
//             continue;
//           }

//           const department = await Department.findOne({ d_id: d_id.trim() });
//           if (!department) {
//             await User.deleteOne({ _id: user._id });
//             results.push({ u_id, status: 'failed', error: 'Department not found' });
//             continue;
//           }

//           const teacher = new Teacher({
//             userId: user._id,
//             t_id: t_id.trim(),
//             department: department._id,
//             salary: Number(salary),
//           });
//           await teacher.save();

//           results.push({ u_id, status: 'success', role: 'teacher' });

//         } else if (role === 'admin') {
//           // ✅ Admin creation simple
//           results.push({ u_id, status: 'success', role: 'admin' });
//         }

//       } catch (err) {
//         console.log('Error processing record:', err.message);
//         results.push({ u_id: record.u_id || 'N/A', status: 'failed', error: err.message });
//       }
//     }

//     res.status(200).json({ message: 'Register API completed', results });

//   } catch (error) {
//     console.error('Register API error:', error);
//     res.status(500).json({ error: 'Server error', details: error.message });
//   }
// };

 
// module.exports = registerUsers;

const express = require('express');
const router = express.Router();
const multer = require('multer');
const xlsx = require('xlsx');
const { User } = require('../model/user');
const Student = require('../model/student');
const Teacher = require('../model/teacher');
const Program = require('../model/program');
const Department = require('../model/department');
const Batch = require('../model/batch');

const generateUId = (rolePrefix) => {
  const random = Math.floor(1000 + Math.random() * 9000); // Generates 4 digit random number
  return rolePrefix + random;
};
const registerUsers = async (req, res) => {
  try {
    let data = [];

    if (req.file) {
      const workbook = xlsx.readFile(req.file.path);
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      data = xlsx.utils.sheet_to_json(sheet);
    } else if (Array.isArray(req.body)) {
      data = req.body;
    } else if (req.body && typeof req.body === 'object') {
      data = [req.body];
    } else {
      return res.status(400).json({ error: 'Invalid input format' });
    }

    const results = [];

    for (let record of data) {
      try {
        // ✅ Sanitize fields
        const username = String(record.username || '').trim();
        const U_Phone = String(record.U_Phone || '').trim();
        const DOB = String(record.DOB || '').trim();
        const password = String(record.password || '').trim();
        const role = String(record.role || '').trim().toLowerCase();

        const st_id = String(record.st_id || '').trim();
        const CGPA = record.CGPA;
        const p_name = String(record.p_name || '').trim();
        const Batch_Name = String(record.Batch_Name || '').trim();
        const section_name = String(record.section_name || '').trim();

        const t_id = String(record.t_id || '').trim();
        const d_name = String(record['Department Name'] || record.d_name || '').trim();
        const salary = record.salary;

        // 🔎 Core fields check
        if (!username || !U_Phone || !DOB || !password || !role) {
          results.push({ username, status: 'failed', error: 'Missing core fields' });
          continue;
        }

        if (!/^03[0-9]{9}$/.test(U_Phone)) {
          results.push({ username, status: 'failed', error: 'Invalid phone number' });
          continue;
        }

        if (!/^([0-2][0-9]|(3)[0-1])\-(((0)[0-9])|((1)[0-2]))\-\d{4}$/.test(DOB)) {
          results.push({ username, status: 'failed', error: 'Invalid DOB format' });
          continue;
        }

        if (!['student', 'teacher', 'admin'].includes(role)) {
          results.push({ username, status: 'failed', error: 'Invalid role' });
          continue;
        }

        const existingUser = await User.findOne({ username });
        if (existingUser) {
          results.push({ username, status: 'failed', error: 'Username already exists' });
          continue;
        }

        const u_id = generateUId(role.slice(0, 3));

        const user = new User({
          U_Id: u_id,
          username,
          U_Phone,
          DOB,
          password,
          role,
        });
        await user.save();

        if (role === 'student') {
          if (!st_id || CGPA === undefined || !p_name || !Batch_Name || !section_name) {
            await User.deleteOne({ _id: user._id });
            results.push({ username, status: 'failed', error: 'Missing student fields' });
            continue;
          }

          const existingStudent = await Student.findOne({ st_id });
          if (existingStudent) {
            await User.deleteOne({ _id: user._id });
            results.push({ username, status: 'failed', error: 'st_id already exists' });
            continue;
          }

          const program = await Program.findOne({ p_name });
          const batch = await Batch.findOne({ Batch_Name });

          if (!program || !batch) {
            await User.deleteOne({ _id: user._id });
            results.push({ username, status: 'failed', error: 'Program or Batch not found' });
            continue;
          }

          const student = new Student({
            userId: user._id,
            st_id,
            p_id: program.p_id,
            b_id: batch.b_id,
            section_name,
            CGPA: Number(CGPA),
          });
          await student.save();

          batch.students.push(user._id);
          await batch.save();

          results.push({ username, status: 'success', role: 'student' });

        } else if (role === 'teacher') {
          if (!t_id || !d_name || salary === undefined) {
            await User.deleteOne({ _id: user._id });
            results.push({ username, status: 'failed', error: 'Missing teacher fields' });
            continue;
          }

          const existingTeacher = await Teacher.findOne({ t_id });
          if (existingTeacher) {
            await User.deleteOne({ _id: user._id });
            results.push({ username, status: 'failed', error: 't_id already exists' });
            continue;
          }

          const department = await Department.findOne({ d_name });
          if (!department) {
            await User.deleteOne({ _id: user._id });
            results.push({ username, status: 'failed', error: 'Department not found' });
            continue;
          }

          const teacher = new Teacher({
            userId: user._id,
            t_id,
            department: department._id,
            salary: Number(salary),
          });
          await teacher.save();

          results.push({ username, status: 'success', role: 'teacher' });

        } else if (role === 'admin') {
          results.push({ username, status: 'success', role: 'admin' });
        }

      } catch (err) {
        console.log('Error processing record:', err.message);
        results.push({ username: record.username || 'N/A', status: 'failed', error: err.message });
      }
    }

    res.status(200).json({ message: 'Register API completed', results });

  } catch (error) {
    console.error('Register API error:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
};

module.exports = registerUsers;
