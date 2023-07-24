const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const mysql = require('mysql');

// create mysql connection
const conn = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'new'
});

// connect to mysql
conn.connect((err) => {
    if (err) throw err;
    console.log('Mysql Connected...');
});

app.use(bodyParser.json());

app.post('/api/attendance', (req, res) => {
    const name = req.body.name;
    const time = req.body.time;
    const date = req.body.date;

    // check if name exists in database
    const sqlCheck = `SELECT * FROM attendance WHERE name = '${name}' AND date = '${date}'`;
    conn.query(sqlCheck, (err, result) => {
        if (err) throw err;
        if (result.length === 0) {
            // insert new attendance record
            const sqlInsert = `INSERT INTO attendance (name, time, date) VALUES ('${name}', '${time}', '${date}')`;
            conn.query(sqlInsert, (err, result) => {
                if (err) throw err;
                console.log('Attendance record inserted');
            });
        } else {
            console.log('Attendance record already exists');
        }
    });

    res.send('Attendance record received');
});

app.listen(3000, () => console.log('Server started on port 3000'));
