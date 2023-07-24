const mysql = require('mysql');
const moment = require('moment');

// create mysql connection
const conn = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'new'
});

function getAttendanceForWeekBySubject(subject_id, weekNumber, callback) {
    // Query the database for attendance records matching the subject_id and weekNumber
    const sql = `SELECT * FROM attendance WHERE subject_id = ${subject_id} AND week_number = ${weekNumber}`;
    conn.query(sql, (err, result) => {
        if (err) throw err;
        callback(result);
    });
}

module.exports = {
    getAttendanceForWeekBySubject: getAttendanceForWeekBySubject
};
