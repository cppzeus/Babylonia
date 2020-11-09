'use strick';
require('dotenv').config();

let express = require('express');
const member = require('../model/member');
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
router.get('/v1', function(req, res, next) {
    res.render('member', { title: 'Member API v1' });
});

/*POST create /v1/member*/
router.post('/v1/member', async(req, res, next) => {
    console.log(`${logtime} /member:POST/ create api starting...`);
    const { email, name, password, nickname, authtype } = req.body;

    let member = new Member.memberClass(email, name, password, '', nickname, authtype);
    console.log(`${logtime} /member:POST/ Email address: ${email}`);

    if (await !member.checkEmailValidation()) {
        console.log(`${logtime} /member:POST/ Invalid Email => ${member.email}`);
        res.status(406).set({
            'content-Type': 'application/json',
            'X-Powered-By': 'Sercre',
            'X-Babylonia-Media-Type': 'Babylonia.v1',
            'Status': '406 Not Acceptable'
        }).json({ message: "Invalid Email" });
        return;
    }

    if (await !member.checkPasswordValidation()) {
        console.log(`${logtime} /member:POST/ Invalid Password => ${member.nohash_password}`);
        res.status(406).set({
            'content-Type': 'application/json',
            'X-Powered-By': 'Sercre',
            'X-Babylonia-Media-Type': 'Babylonia.v1',
            'Status': '406 Not Acceptable'
        }).json({ message: "Invalid Password" });
        return;
    }

    console.log(`${logtime} /member:POST/ Validation check complete.`);
    member.encodePassword();

    let query = `INSERT INTO members_info(email, name, password, nickname, authtype, regdate, used_yn) VALUES('${member.email}', '${member.name}', '${member.password}', '${member.nickname}', '${member.authtype}', now()::timestamp, true)`;
    await pool.query(query, (err, results) => {
        console.log(`${logtime} /member:POST/ Insert member data.`);
        if (err) {
            if (err.code === "23505") {
                console.log(`${logtime} /member:POST/ error => ${member.email} already exists.`);
                res.status(406).set({
                    'content-Type': 'application/json',
                    'X-Powered-By': 'Sercre',
                    'X-Babylonia-Media-Type': 'Babylonia.v1',
                    'Status': '406 Not Acceptable'
                }).json({ message: "email already exists" });
            } else {
                console.log(`${logtime} /member:POST/ error => ${err}`);
                res.status(400).set({
                    'content-Type': 'application/json',
                    'X-Powered-By': 'Sercre',
                    'X-Babylonia-Media-Type': 'Babylonia.v1 ',
                    'Status': '400 Bad Request'
                }).json({ message: err });
            }
        } else {
            console.log(`${logtime} /member:POST/ success => ${member.email}`);
            res.status(201).set({
                'content-Type': 'application/json',
                'X-Powered-By': 'Sercre',
                'X-Babylonia-Media-Type': 'Babylonia.v1 ',
                'Status': '201 Created'
            }).json({ message: "Created" });
        }
    });
});

/*DELETE delete /v1/member/:email*/
router.delete('/v1/member/:email', async(req, res, next) => {
    console.log(`${logtime} /member:DELETE/ delete api starting...`);

    const email = req.params.email;
    console.log(`${logtime} /member:DELETE/ Email address: ${email}`);

    if (await !Member.isEmailValid(email)) {
        console.log(`${logtime} /member:DELETE/ Invalid Email => ${email}`);
        res.status(406).set({
            'content-Type': 'application/json',
            'X-Powered-By': 'Sercre',
            'X-Babylonia-Media-Type': 'Babylonia.v1',
            'Status': '406 Not Acceptable'
        }).json({ message: "Invalid Email" });
        return;
    }

    let query = `UPDATE "members_info" SET used_yn = false, expdate = now() WHERE email = '${email}'`;
    console.log(`${logtime} /member:DELETE/ Delete member query => ${query}`);

    await pool.query(query, (err, results) => {
        console.log(`${logtime} /member:DELETE/ DELETE users data by email`);
        if (err) {
            console.log(`${logtime} /member:DELETE/ error => ${err}`);
            res.status(400).set({
                'content-Type': 'application/json',
                'X-Powered-By': 'Sercre',
                'X-Babylonia-Media-Type': 'Babylonia.v1 ',
                'Status': '400 Bad Request'
            }).json({ message: err });
        } else {
            if (results.rowCount === 0) {
                console.log(`${logtime} /member:DELETE/ error => Email is not found`);
                res.status(204).set({
                    'content-Type': 'application/json',
                    'X-Powered-By': 'Sercre',
                    'X-Babylonia-Media-Type': 'Babylonia.v1',
                    'Status': '204 No Content'
                }).json({ message: "Email is not found" });
            } else {
                console.log(`${logtime} /member:DELETE/ success => ${email}`);
                res.status(200).set({
                    'content-Type': 'application/json',
                    'X-Powered-By': 'Sercre',
                    'X-Babylonia-Media-Type': 'Babylonia.v1',
                    'Status': '200 OK'
                }).json({ message: "delete" });
            }
        }
    });
});

/*GET get /v1/member/:email*/
router.get('/v1/member/:email', async(req, res, next) => {
    console.log(`${logtime} /member:GET/ get member info api starting...`);

    const email = req.params.email;
    console.log(`${logtime} /member:GET/ Email address: ${email}`);

    if (await !Member.isEmailValid(email)) {
        console.log(`${logtime} /member:GET/ Invalid Email => ${email}`);
        res.status(406).set({
            'content-Type': 'application/json',
            'X-Powered-By': 'Sercre',
            'X-Babylonia-Media-Type': 'Babylonia.v1',
            'Status': '406 Not Acceptable'
        }).json({ message: "Invalid Email" });
        return;
    }

    let query = `SELECT * FROM ${process.env.DB_MEMBERTABLE} WHERE email = '${email}'`;
    console.log(`${logtime}/member:GET/ Select member query => ${query}`);

    await pool.query(query, (err, results) => {
        console.log(`${logtime} /member:GET/ get users data by email`);
        if (err) {
            console.log(`${logtime} /member:GET/ error => ${err}`);
            res.status(400).set({
                'content-Type': 'application/json',
                'X-Powered-By': 'Sercre',
                'X-Babylonia-Media-Type': 'Babylonia.v1',
                'Status': '400 Bad Request'
            }).json({ message: err });
        } else {
            if (results.rowCount === 0) {
                console.log(`${logtime} /member:GET/ error => Email is not found`);
                res.status(204).set({
                    'content-Type': 'application/json',
                    'X-Powered-By': 'Sercre',
                    'X-Babylonia-Media-Type': 'Babylonia.v1',
                    'Status': '204 No Content'
                }).json({ message: "Email is not found" });
            } else {
                console.log(`${logtime} /member:GET/ succeed => ${results.rows}`);
                res.status(200).set({
                    'content-Type': 'application/json',
                    'X-Powered-By': 'Sercre',
                    'X-Babylonia-Media-Type': 'Babylonia.v1',
                    'Status': '200 OK'
                }).json({ message: results.rows });
            }
        }
    });
});

/*GET list /v1/members list*/
router.get('/v1/member-emails/', async(req, res, next) => {
    console.log(`${logtime} /member:GET/ get member list api starting...`);

    let query = `SELECT email FROM ${process.env.DB_MEMBERTABLE}`;
    console.log(`${logtime}/member:GET/ Select member query => ${query}`);

    await pool.query(query, (err, results) => {
        console.log(`${logtime} /member:GET/ get users data by email`);
        if (err) {
            console.log(`${logtime} /member:GET/ error => ${err}`);
            res.status(400).set({
                'content-Type': 'application/json',
                'X-Powered-By': 'Sercre',
                'X-Babylonia-Media-Type': 'Babylonia.v1',
                'Status': '400 Bad Request'
            }).json({ message: err });
        } else {
            if (results.rowCount === 0) {
                console.log(`${logtime} /member:GET/ error => Email is not found`);
                res.status(204).set({
                    'content-Type': 'application/json',
                    'X-Powered-By': 'Sercre',
                    'X-Babylonia-Media-Type': 'Babylonia.v1',
                    'Status': '204 No Content'
                }).json({ message: "Email is not found" });
            } else {
                console.log(`${logtime} /member:GET/ succeed => ${results.rows}`);
                res.status(200).set({
                    'content-Type': 'application/json',
                    'X-Powered-By': 'Sercre',
                    'X-Babylonia-Media-Type': 'Babylonia.v1',
                    'Status': '200 OK'
                }).json({ message: results.rows });
            }
        }
    });
});

/*GET list /v1/members list*/
router.get('/v1/member-list', async(req, res, next) => {
    console.log(`${logtime} /member:GET/ get member list api starting...`);

    let query = `SELECT * FROM ${process.env.DB_MEMBERTABLE}`;
    console.log(`${logtime}/member:GET/ Select member query => ${query}`);

    await pool.query(query, (err, results) => {
        console.log(`${logtime} /member:GET/ get users data by email`);
        if (err) {
            console.log(`${logtime} /member:GET/ error => ${err}`);
            res.status(400).set({
                'content-Type': 'application/json',
                'X-Powered-By': 'Sercre',
                'X-Babylonia-Media-Type': 'Babylonia.v1',
                'Status': '400 Bad Request'
            }).json({ message: err });
        } else {
            if (results.rowCount === 0) {
                console.log(`${logtime} /member:GET/ error => Email is not found`);
                res.status(204).set({
                    'content-Type': 'application/json',
                    'X-Powered-By': 'Sercre',
                    'X-Babylonia-Media-Type': 'Babylonia.v1',
                    'Status': '204 No Content'
                }).json({ message: "Email is not found" });
            } else {
                console.log(`${logtime} /member:GET/ succeed => ${results.rows}`);
                res.status(200).set({
                    'content-Type': 'application/json',
                    'X-Powered-By': 'Sercre',
                    'X-Babylonia-Media-Type': 'Babylonia.v1',
                    'Status': '200 OK'
                }).json({ message: results.rows });
            }
        }
    });
});

/*PUT update /v1/member/:email*/
router.put('/v1/member', async(req, res, next) => {
    console.log(`${logtime} /member:PUT/ update member api starting...`);

    const { email, name, password, nickname, authtype } = req.body;
    const newpassword = req.body.newpassword;

    let old_member = new Member.memberClass(email, name, password, '', nickname, authtype);
    let old_member_db = '';

    // 이전 사용자 정보 취득
    let query = `SELECT * FROM members_info WHERE email = '${old_member.email}'`;
    await pool.query(query, (err, results) => {
        console.log(`${logtime} /member:PUT/ update users data by email`);
        if (err) {
            console.log(`${logtime} /member:PUT/ error => ${err}`);
            res.status(400).set({
                'content-Type': 'application/json',
                'X-Powered-By': 'Sercre',
                'X-Babylonia-Media-Type': 'Babylonia.v1',
                'Status': '400 Bad Request'
            }).json({ message: err });
            return;
        } else {
            if (results.rowCount === 0) {
                console.log(`${logtime} /member:PUT/ error => Email is not found`);
                res.status(204).set({
                    'content-Type': 'application/json',
                    'X-Powered-By': 'Sercre',
                    'X-Babylonia-Media-Type': 'Babylonia.v1',
                    'Status': '204 No Content'
                }).json({ message: "Email is not found" });
            } else {
                console.log(`${logtime} /member:PUT/ succeed => ${results.rows}`);
                old_member_db = results.rows[0];

                old_member.password = old_member_db.password;
                if (!old_member.comparePassword(old_member.nohash_password)) {
                    console.log(`${logtime} /member:PUT/ error => password is not match`);
                    res.status(412).set({
                        'content-Type': 'application/json',
                        'X-Powered-By': 'Sercre',
                        'X-Babylonia-Media-Type': 'Babylonia.v1 ',
                        'Status': '412 Precondition Failed'
                    }).json({ message: 'password is not match' });
                    return;
                }

                if (newpassword) {
                    if (!Member.pw_schema.validate(newpassword)) {
                        console.log(`${logtime} /member:PUT/ Invalid new Password => ${newpassword}`);
                        res.status(406).set({
                            'content-Type': 'application/json',
                            'X-Powered-By': 'Sercre',
                            'X-Babylonia-Media-Type': 'Babylonia.v1',
                            'Status': '406 Not Acceptable'
                        }).json({ message: "Invalid new Password" });
                        return;
                    }
                    old_member.nohash_password = newpassword;
                    old_member.encodePassword();
                }

                let new_query = `UPDATE members_info SET name = '${old_member.name}', password = '${old_member.password}', nickname = '${old_member.nickname}', used_yn = true WHERE email = '${old_member.email}'`;
                console.log(`${logtime} /member:PUT/ update member query => ${new_query}`);

                pool.query(new_query, (err, results2) => {
                    console.log(`${logtime} /member:PUT/ Update users data...`);
                    if (err) {
                        console.log(`${logtime} /member:PUT/ error => ${err}`);
                        res.status(400).set({
                            'content-Type': 'application/json',
                            'X-Powered-By': 'Sercre',
                            'X-Babylonia-Media-Type': 'Babylonia.v1',
                            'Status': '400 Bad Request'
                        }).json({ message: err });
                    } else {
                        console.log(`${logtime} /member:PUT/ success => ${old_member.email}`);
                        console.log(`${logtime} /member:PUT/ succeed => ${results2.rows}`);
                        res.status(200).set({
                            'content-Type': 'application/json',
                            'X-Powered-By': 'Sercre',
                            'X-Babylonia-Media-Type': 'Babylonia.v1',
                            'Status': '200 OK'
                        }).json({ message: "OK" });
                    }
                });

            }
        }
    });
});

require('date-utils');
const dt = new Date();
const logtime = dt.toFormat(`YYYY-MM-DD HH24:MI:SS`);

module.exports = router;