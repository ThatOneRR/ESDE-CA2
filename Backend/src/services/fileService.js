//Reference: https://cloudinary.com/documentation/node_integration
const cloudinary = require('cloudinary').v2;
const config = require('../config/config');
const pool = require('../config/database')
cloudinary.config({
    cloud_name: config.cloudinaryCloudName,
    api_key: config.cloudinaryApiKey,
    api_secret: config.cloudinaryApiSecret,
    upload_preset: 'upload_to_design'
});
const { createJSONResponse, Status } = require('../helpers/jsonFormatter');

module.exports.uploadFile = (file) => {
    console.log(file);
    return new Promise((resolve, reject) => {
        // upload image here
        cloudinary.uploader.upload(file.path, { upload_preset: 'upload_to_design' })
            .then((result) => {
                //Inspect whether I can obtain the file storage id and the url from cloudinary
                //after a successful upload.
                //console.log({imageURL: result.url, publicId: result.public_id});
                let data = { imageURL: result.url, publicId: result.public_id, status: 'success' };
                resolve(data);
                return;
            }).catch((error) => {
                // let message = 'fail';
                reject(createJSONResponse('Failed to upload file', Status.ERROR, null));
                // callback(error, null);
                return;
            });
    });
} //End of uploadFile

module.exports.createFileData = (imageURL, publicId, userId, designTitle, designDescription) => {
    console.log('createFileData method is called.');
    return new Promise((resolve, reject) => {
        //I referred to https://www.codota.com/code/javascript/functions/mysql/Pool/getConnection
        //to prepare the following code pattern which does not use callback technique (uses Promise technique)
        pool.getConnection((err, connection) => {
            if (err) {
                console.log('Database connection error ', err);
                return reject(createJSONResponse('Database connection error', Status.ERROR, null));
            } else {
                console.log('Executing query');
                let query = `INSERT INTO file ( cloudinary_file_id, cloudinary_url , 
                 design_title, design_description,created_by_id ) 
                 VALUES (?,?,?,?,?) `;

                connection.query(query, [publicId, imageURL, designTitle, designDescription, userId], (err, rows) => {
                    connection.release();
                    if (err) {
                        console.log('Error on query on creating record inside file table', err);
                        return reject(createJSONResponse('Upload file error', Status.ERROR, jsonResult));
                    } else {
                        return resolve(rows);
                    }
                });
            }
        });
    }); //End of new Promise object creation

} //End of createFileData

module.exports.getFileData = (userId, pageNumber, search) => {
    const page = pageNumber;
    if (search == null) { search = ''; };
    const limit = 4; //Due to lack of test files, I have set a 3 instead of larger number such as 10 records per page
    const offset = (page - 1) * limit;
    let designFileDataQuery = '';
    //If the user did not provide any search text, the search variable
    //should be null. The following console.log should output undefined.
    //console.log(search);
    //-------------- Code which does not use stored procedure -----------
    //Query for fetching data with page number and offset (and search)
    //--------------------------------------------------------------------
    //designFileDataQuery = `CALL sp_get_paged_file_records(?,?,?,?, @total_records); SELECT @total_records total_records;`;

    return new Promise((resolve, reject) => {
        //I referred to https://www.codota.com/code/javascript/functions/mysql/Pool/getConnection
        //to prepare the following code pattern which does not use callback technique (uses Promise technique)
        pool.getConnection((err, connection) => {
            if (err) {
                console.log('Database connection error ', err);
                reject(createJSONResponse('Database connection error', Status.ERROR, null));
            } else {
                console.log('Executing query to obtain 1 page of 3 data');
                if (!/^[a-zA-Z0-9\s@._-]*$/.test(search)) {
                    return reject(createJSONResponse('Invalid input', Status.FAIL, null));
                }
                // if ((search == '') || (search == null)) {
                //     console.log('Prepare query without search text');
                //     designFileDataQuery = `SELECT file_id,cloudinary_url,design_title,design_description FROM file  WHERE created_by_id=${userId}  LIMIT ${limit} OFFSET ${offset}; SET @total_records =(SELECT count(file_id) FROM file WHERE created_by_id= ${userId}   );SELECT @total_records total_records; `;
                // } else {
                //     designFileDataQuery = `SELECT file_id,cloudinary_url,design_title,design_description FROM file  WHERE created_by_id=${userId} AND design_title LIKE '%${search}%'  LIMIT ${limit} OFFSET ${offset}; SET @total_records =(SELECT count(file_id) FROM file WHERE created_by_id= ${userId} AND design_title LIKE '%${search}%' );SELECT @total_records total_records;`;
                // }
                var data;
                if ((search == '') || (search == null)) {
                    console.log('Prepare query without search text');
                    designFileDataQuery = `SELECT file_id,cloudinary_url,design_title,design_description FROM file  WHERE created_by_id=? LIMIT ? OFFSET ?; SET @total_records =(SELECT count(file_id) FROM file WHERE created_by_id=?   );SELECT @total_records total_records; `;
                    data = [userId, limit, offset, userId];
                } else {
                    designFileDataQuery = `SELECT file_id,cloudinary_url,design_title,design_description FROM file  WHERE created_by_id=? AND design_title LIKE ? LIMIT ? OFFSET ?; SET @total_records =(SELECT count(file_id) FROM file WHERE created_by_id=? AND design_title LIKE ? ); SELECT @total_records total_records;`;
                    data = [userId, '%' + search + '%', limit, offset, userId, '%' + search + '%'];
                }
                connection.query(designFileDataQuery, data, (err, results) => {
                    if (err) {
                        console.log('Error on query on reading data from the file table', err);
                        reject(createJSONResponse('Database query error', Status.ERROR, null));
                    } else {
                        //The following code which access the SQL return value took 2 hours of trial
                        //and error.
                        console.log('Accessing total number of rows : ', results[2][0].total_records);
                        resolve(results);
                    }
                    connection.release();
                });
            }
        });
    }); //End of new Promise object creation

} //End of getFileData