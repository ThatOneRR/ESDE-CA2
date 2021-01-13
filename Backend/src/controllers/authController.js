const user = require('../services/userService');
const auth = require('../services/authService');
const bcrypt = require('bcrypt');
const config = require('../config/config');
const jwt = require('jsonwebtoken');
const errorHelper = require('../helpers/errorHelper');
const { createJSONResponse, Status } = require('../helpers/jsonFormatter');

exports.processLogin = async (req, res, next) => {
    let email = req.body.email;
    let password = req.body.password;
    try {
        let results = await auth.authenticate(email);
        if (results.length == 1) {
            if (password == null) {
                return res.status(500).json(createJSONResponse('Invalid password', Status.FAIL, null));
            }
            if (results[0] == null) {
                var json = createJSONResponse('Missing entry', Status.ERROR, null);
                try {
                    await errorHelper.logError({ 'email': email, 'password': password }, json, 'Missing entry logging in for ' + email);
                } catch (error) {
                    console.log(error);
                    console.log("Failed to perform log error protocol");
                }
                return res.status(500).json(json);
            }
            if (bcrypt.compareSync(password, results[0].user_password) == true) {
                let data = {
                    user_id: results[0].user_id,
                    role_name: results[0].role_name,
                    token: jwt.sign({ id: results[0].user_id }, config.JWTKey, {
                        expiresIn: 86400 //Expires in 24 hrs
                    })
                }; //End of data variable setup
                return res.status(200).json(createJSONResponse('Successful login', Status.SUCCESS, data));
            } else {
                return res.status(500).json(createJSONResponse('Invalid password', Status.FAIL, null));
                // return res.status(500).json({ message: error });
            } //End of passowrd comparison with the retrieved decoded password.
        } //End of checking if there are returned SQL results
    } catch (error) {
        return res.status(500).json(error);
    } //end of try
};

// If user submitted data, run the code in below
exports.processRegister = (req, res, next) => {
    console.log('processRegister running');
    let fullName = req.body.fullName;
    let email = req.body.email;
    let password = req.body.password;

    bcrypt.hash(password, 10, async (err, hash) => {
        if (err) {
            console.log("Unable to hash password");
            let json = createJSONResponse('Unable to complete registration', Status.ERROR, null);
            return res.status(500).json(json);
        } else {
            try {
                results = await user.createUser(fullName, email, hash);
                console.log(results);
                return res.status(200).json(createJSONResponse('Completed registration', Status.SUCCESS, null));
            } catch (error) {
                console.log('processRegister method : catch block section code is running');
                console.log(error, '=======================================================================');
                return res.status(500).json(error);
            }
        }
    });
}; //End of processRegister