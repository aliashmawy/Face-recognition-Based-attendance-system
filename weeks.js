const mysql = require('mysql');
const moment = require('moment');

// create mysql connection
const conn = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'new'
});

function getWeeksBySubject(subject_id, callback) {
    // Get the current week number
    const currentWeek = moment().isoWeek();

    // Query the database for unique week numbers associated with the given subject_id
    const sql = `SELECT DISTINCT week_number FROM attendance WHERE subject_id = ${subject_id} AND week_number <= ${currentWeek}`;
    conn.query(sql, (err, result) => {
        if (err) throw err;
        callback(result);
    });
}

module.exports = {
    getWeeksBySubject: getWeeksBySubject
};
