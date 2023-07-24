const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');
const mysql = require('mysql');
const multer = require('multer');
const jwt = require('jsonwebtoken');

// create mysql connection
const conn = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'new'
});

router.use(bodyParser.json());

// configure multer middleware to parse form_data
const upload = multer();

router.post('/api/login', upload.none(), (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  // check if the user exists in the database
  const sqlCheck = `SELECT * FROM users WHERE email = '${email}' AND password = '${password}'`;
  conn.query(sqlCheck, (err, result) => {
    if (err) throw err;
    if (result.length === 0) {
      // user not found, return error
      res.status(401).send({ message: 'Invalid username or password', data: null });
    } else {
      // user found, generate token with 1 hour expiration time
      const user = {
        id: result[0].id,
        email: result[0].email
      };
      const token = jwt.sign({ user }, 'mysecretkey', { expiresIn: '1h' });

      // return success with token and user info
      res.status(200).send({ message: 'Login successful', data: { id: user.id, email: user.email, token } });
    }
  });
});

module.exports = router;
