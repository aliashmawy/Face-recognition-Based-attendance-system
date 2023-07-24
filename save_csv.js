const mysql = require('mysql');
const moment = require('moment');
const { Readable } = require('stream');
const csvWriter = require('csv-write-stream');

const conn = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'new'
});
function saveAttendanceAsCsv(subject_id, weekNumber) {
    const sql = `SELECT * FROM attendance WHERE subject_id = ${subject_id} AND week_number = ${weekNumber}`;
    return new Promise((resolve, reject) => {
        conn.query(sql, (err, result) => {
            if (err) reject(err);
            if (!result) reject('No attendance data found');

            const writer = csvWriter({
                headers: [
                    'Student ID',
                    'Name',
                    'Subject ID',
                    'Week Number',
                    'Date'
                ]
            });

            const data = result.map((row) => {
                return {
                    'Student ID': row.id,
                    'Name': row.name,
                    'Subject ID': row.subject_id,
                    'Week Number': row.week_number,
                    'Date': moment(row.date).format('YYYY-MM-DD')
                };
            });

            const chunks = [];
            const concatStream = new require('stream').Writable({
                write(chunk, encoding, next) {
                    chunks.push(chunk);
                    next();
                },
                final(callback) {
                    resolve(Buffer.concat(chunks).toString());
                    callback();
                }
            });

            writer.pipe(concatStream);

            for (const row of data) {
                writer.write(row);
            }

            writer.end();
        });
    });
}





module.exports = {
    saveAttendanceAsCsv: saveAttendanceAsCsv
};

