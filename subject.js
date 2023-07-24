const express = require('express');
const router = express.Router();
const mysql = require('mysql');
const jwt = require('jsonwebtoken');

// create mysql connection
const conn = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'new'
});

// middleware to verify token
const verifyToken = (req, res, next) => {
    // check if authorization header is present
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send({ error: 'Authorization header not found' });
    }

    // verify the token
    const token = authHeader.split(' ')[1];
    jwt.verify(token, 'mysecretkey', (err, decoded) => {
        if (err) {
            return res.status(401).send({ error: 'Invalid authorization token' });
        }
        req.user = decoded.user;
        next();
    });
};

router.get('/api/subjects', verifyToken, (req, res) => {
    const userId = req.user.id;

    const sql = `SELECT id, name FROM subjects WHERE user_id = '${userId}'`;
    conn.query(sql, (err, result) => {
        if (err) throw err;
        res.status(200).send(result);
    });
});

module.exports = router;
