const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const mysql = require('mysql');
const loginModule = require('./login');
const subjectModule = require('./subject');
const weeksAPI = require('./weeks');
const { getAttendanceForWeekBySubject } = require('./getweek');
const fs = require('fs');
const { saveAttendanceAsCsv } = require('./save_csv');

const moment = require('moment');

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

// use the login module
app.use(loginModule);

// use the subject module
app.use(subjectModule);


app.get('/weeks/:subject_id', (req, res) => {
    const subject_id = req.params.subject_id;

    weeksAPI.getWeeksBySubject(subject_id, (result) => {
        res.send(result);
    });
});

app.get('/api/attendance/subject/:subject_id/week/:weekNumber', (req, res) => {
    const subject_id = req.params.subject_id;
    const weekNumber = req.params.weekNumber;

    getAttendanceForWeekBySubject(subject_id, weekNumber, (result) => {
        res.json(result);
    });
});


app.get('/attendance/:subject_id/week/:weekNumber', (req, res) => {
    const subject_id = req.params.subject_id;
    const weekNumber = req.params.weekNumber;

    saveAttendanceAsCsv(subject_id, weekNumber)
        .then(csvData => {
            const filename = `attendance_${subject_id}_week${weekNumber}_${Date.now()}.csv`;

            // Write the CSV data to a new file with the unique filename
            fs.writeFile(filename, csvData, (err) => {
                if (err) throw err;

                // Set the content disposition and type headers to prompt download
                res.setHeader('Content-disposition', `attachment; filename=${filename}`);
                res.set('Content-Type', 'text/csv');

                // Send the CSV data in the response
                res.status(200).send(csvData);
            });
        })
        .catch(err => {
            console.error(err);
            res.status(500).send('Internal Server Error');
        });
});


app.post('/api/attendance', (req, res) => {
    const name = req.body.name;
    const collegeColiseum = req.body.college_coliseum;
    const date = moment().format('YYYY-MM-DD');
    const weekNumber = moment().week();

    // retrieve lecture schedule for current date and college coliseum
    const sqlLectureCheck = `SELECT subject_id, date_time FROM lecture_schedule WHERE DATE(date_time) = '${date}' AND college_coliseum = '${collegeColiseum}'`;
    conn.query(sqlLectureCheck, (err, lectureResult) => {
        if (err) throw err;
        if (lectureResult.length > 0) {
            const lectureDateTime = moment(lectureResult[0].date_time);
            const lectureStartTime = moment(lectureDateTime).startOf('minute');
            const currentTime = moment().startOf('minute');
            const timeDiff = moment.duration(lectureStartTime.diff(currentTime));
            const minutesDiff = timeDiff.asMinutes();
            if (minutesDiff <= 0 && minutesDiff >= -15) {
                const subjectId = lectureResult[0].subject_id;
                // check if name exists in database for the current week and college coliseum
                const sqlCheck = `SELECT * FROM attendance WHERE name = '${name}' AND date = '${date}' AND week_number = '${weekNumber}' AND college_coliseum = '${collegeColiseum}'`;
                conn.query(sqlCheck, (err, result) => {
                    if (err) throw err;
                    if (result.length === 0) {
                        // insert new attendance record for the current week and college coliseum
                        const sqlInsert = `INSERT INTO attendance (name, time, date, week_number, college_coliseum, subject_id) VALUES ('${name}', NOW(), '${date}', '${weekNumber}', '${collegeColiseum}', '${subjectId}')`;
                        conn.query(sqlInsert, (err, result) => {
                            if (err) throw err;
                            console.log('Attendance record inserted');
                            console.log(req.body);
                        });
                    } else {
                        console.log('Attendance record already exists');
                    }
                });
            } else if (minutesDiff > 0) {
                console.log(`Lecture has not started yet. ${timeDiff.humanize(true)} remaining`);
            } else {
                console.log('Lecture has already ended');
            }
        } else {
            console.log('No lecture found for the current date and college coliseum');
        }
    });

    res.send('Attendance record received');
});
app.listen(3000, () => console.log('Server started on port 3000'));
