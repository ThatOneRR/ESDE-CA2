const config = require('../config/config');
const pool = require('../config/database');
const { createJSONResponse, Status } = require('../helpers/jsonFormatter');

module.exports.authenticate = (email) => {
    return new Promise((resolve, reject) => {
        pool.getConnection((err, connection) => {
            if (err) {
                reject(createJSONResponse('Connection error', Status.ERROR, null));
            } else {
                try {
                    if (!/^[a-zA-Z0-9._-]*@[a-zA-Z0-9._-]*$/.test(email)) {
                        return reject(createJSONResponse('Invalid email', Status.FAIL, null));
                    }
                    connection.query(`SELECT user.user_id, fullname, email, user_password, role_name, user.role_id FROM user INNER JOIN role ON user.role_id=role.role_id AND email=?`, [email], (err, rows) => {
                        if (err) {
                            reject({ 'message': 'Query error', 'status': 'error', 'data': err });
                        } else {
                            if (rows.length == 1) {
                                console.log(rows);
                                resolve(rows);
                            } else {
                                reject(createJSONResponse('Duplicate entries', Status.ERROR, null));
                            }
                        }
                        connection.release();
                    });
                } catch (error) {
                    reject(createJSONResponse('Unknown error', Status.ERROR, null));
                }
            }
        }); //End of getConnection
    });

} //End of authenticate