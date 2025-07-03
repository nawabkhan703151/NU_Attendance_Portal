const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

const registerUsers = require('../controller/registerController');

router.post('/adminregisterstudent', upload.single('excelFile'), (req, res) => {
  registerUsers(req, res, 'student');
});

router.post('/adminregisterteacher', upload.single('excelFile'), (req, res) => {
  registerUsers(req, res, 'teacher');
});

router.post('/adminregisteradmin', upload.single('excelFile'), (req, res) => {
  registerUsers(req, res, 'admin');
});

module.exports = router;
