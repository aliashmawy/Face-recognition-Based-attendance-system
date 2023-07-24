const express = require('express');
const multer = require('multer');
const app = express();

// Set up multer middleware
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); // Uploads folder will be created automatically
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname);
    }
});

const upload = multer({ storage });

// Define route for file upload
app.post('/upload', upload.single('csvfile'), (req, res) => {
    if (!req.file) {
        return res.status(400).send('Error: Please upload a file');
    }
    // File was uploaded successfully
    res.send('File uploaded!');
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});
