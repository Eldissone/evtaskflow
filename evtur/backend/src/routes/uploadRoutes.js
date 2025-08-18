const express = require('express');
const multer = require('multer');
const path = require('path');

const router = express.Router();

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../../uploads'));
  },
  filename: function (req, file, cb) {
    const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname);
    cb(null, uniqueName);
  }
});
const upload = multer({ storage });

router.post('/upload', upload.single('file'), (req, res) => {
  console.log('Arquivo recebido:', req.file);
  if (!req.file) {
    return res.status(400).json({ error: 'Arquivo não enviado.' });
  }
  res.json({ url: `/uploads/${req.file.filename}` });
});

module.exports = router; 