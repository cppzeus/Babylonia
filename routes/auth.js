'use strick';
require('dotenv').config();

let express = require('express');
let router = express.Router();

let Pool = require('pg').Pool;
// Connect Database
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.POSTGRESQL_DB_HOST,
    database: process.env.DB_DATABASE,
    password: process.env.DB_PASS,
    port: process.env.POSTGRESQL_DB_PORT,
    connectionLimit: 20,
    waitForConnections: false
});

let Member = require('../model/member');

/*GET memeber api page.*/
router.get('/', function(req, res, next) {
    res.render('index', { title: 'auth API v1' });
});

/*GET login /v1/login */
router.get('/v1/login', async(req, res, next) => {
    console.log(`${logtime} /auth:GET/ get member info api starting...`);

    const { email, password } = req.body;
    console.log(`${logtime} /auth:GET/ Email address: ${email}`);

    if (await !Member.isEmailValid(email)) {
        console.log(`${logtime} /auth:GET/ Invalid Email => ${email}`);
        res.status(406).set({
            'content-Type': 'application/json',
            'X-Powered-By': 'Sercre',
            'X-Babylonia-Media-Type': 'Babylonia.v1',
            'Status': '406 Not Acceptable'
        }).json({ message: "Invalid Email" });
        return;
    }

    if (await !Member.pw_schema.validate(password)) {
        console.log(`${logtime} /auth:GET/ Invalid Password => ${password}`);
        res.status(406).set({
            'content-Type': 'application/json',
            'X-Powered-By': 'Sercre',
            'X-Babylonia-Media-Type': 'Babylonia.v1',
            'Status': '406 Not Acceptable'
        }).json({ message: "Invalid Password" });
        return;
    }

    let query = `SELECT password FROM ${process.env.DB_MEMBERTABLE} WHERE email = '${email}'`;
    console.log(`${logtime}/auth:GET/ Select member query => ${query}`);

    await pool.query(query, (err, results) => {
        console.log(`${logtime} /auth:GET/ get users data by email`);
        if (err) {
            console.log(`${logtime} /auth:GET/ error => ${err}`);
            res.status(400).set({
                'content-Type': 'application/json',
                'X-Powered-By': 'Sercre',
                'X-Babylonia-Media-Type': 'Babylonia.v1',
                'Status': '400 Bad Request'
            }).json({ message: err });
        } else {
            if (results.rowCount === 0) {
                console.log(`${logtime} /auth:GET/ error => Email is not found`);
                res.status(204).set({
                    'content-Type': 'application/json',
                    'X-Powered-By': 'Sercre',
                    'X-Babylonia-Media-Type': 'Babylonia.v1',
                    'Status': '204 No Content'
                }).json({ message: "Email is not found" });
            } else {
                console.log(`${logtime} /auth:GET/ succeed => ${results.rows}`);
                let member = new Member.memberClass(email, '', password, results.rows[0].password);
                if (!member.comparePassword(member.nohash_password)) {
                    res.status(401).set({
                        'content-Type': 'application/json',
                        'X-Powered-By': 'Sercre',
                        'X-Babylonia-Media-Type': 'Babylonia.v1',
                        'Status': '401 Unauthorized'
                    }).json({ message: "Unauthorized" });
                } else {
                    res.status(200).set({
                        'content-Type': 'application/json',
                        'X-Powered-By': 'Sercre',
                        'X-Babylonia-Media-Type': 'Babylonia.v1',
                        'Status': '200 OK'
                    }).json({ message: "OK" });
                }
            }
        }
    });
});

/*GET logout /v1/logout */
router.get('/v1/logout');

require('date-utils');
const dt = new Date();
const logtime = dt.toFormat(`YYYY-MM-DD HH24:MI:SS`);

module.exports = router;