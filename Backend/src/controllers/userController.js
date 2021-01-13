const userManager = require('../services/userService');
const fileDataManager = require('../services/fileService');
const config = require('../config/config');
const validator = require('validator');
const { escape } = require('mysql');
const { createJSONResponse, Status } = require('../helpers/jsonFormatter');

exports.processDesignSubmission = async(req, res, next) => {
    let designTitle = req.body.designTitle;
    let designDescription = req.body.designDescription;
    let userId = req.body.userId;
    let file = req.body.file;

    if (!/^[a-zA-Z0-9\s@._-]*$/.test(designTitle)) {
        return res.status(500).json(createJSONResponse('Invalid title', Status.FAIL, null));
    }
    if (!/^[a-zA-Z0-9x\s@._-]*$/.test(designDescription)) {
        return res.status(500).json(createJSONResponse('Invalid description', Status.FAIL, null));
    }

    try {
        let result = await fileDataManager.uploadFile(file);
        console.log('check result variable in fileDataManager.upload code block', result);
        // console.log('check error variable in fileDataManager.upload code block', error);
        let uploadResult = result;
        //Update the file table inside the MySQL when the file image
        //has been saved at the cloud storage (Cloudinary)
        let imageURL = uploadResult.imageURL;
        let publicId = uploadResult.publicId;
        console.log('check uploadResult before calling createFileData in try block', uploadResult);
        try {
            var result2 = await fileDataManager.createFileData(imageURL, publicId, userId, designTitle, designDescription);
            console.log('Inspecting result variable inside fileDataManager.uploadFile code');
            if (result2) {
                console.log(result2);
                return res.status(200).json(createJSONResponse('File submission complete', Status.SUCCESS, { 'message': 'File submission complete', 'imageURL': imageURL }));
            }
        } catch (error) {
            res.status(500).json(error);
        }
    } catch (error) {
        res.status(500).json(error);
    }
} //End of processDesignSubmission

exports.processGetSubmissionData = async (req, res, next) => {
    let pageNumber = req.params.pagenumber;
    let search = req.params.search;
    console.log(search);
    let userId = req.body.userId;
    try {
        let results = await fileDataManager.getFileData(userId, pageNumber, search);
        console.log('Inspect result variable inside processGetSubmissionData code\n', results);
        if (results) {
            results[0].forEach((element, index) => {
                element.design_title = validator.escape(element.design_title);
                element.design_description = validator.escape(element.design_description);
            });
            var jsonResult = {
                'number_of_records': results[0].length,
                'page_number': pageNumber,
                'filedata': results[0],
                'total_number_of_records': results[2][0].total_records
            }
            return res.status(200).json(createJSONResponse('Finished fetching results', Status.SUCCESS, jsonResult));
        }
    } catch (error) {
        return res.status(500).json(error);
    }

}; //End of processGetSubmissionData

exports.processGetUserData = async (req, res, next) => {
    let pageNumber = req.params.pagenumber;
    let search = req.params.search;

    try {
        let results = await userManager.getUserData(pageNumber, search);
        console.log('Inspect result variable inside processGetUserData code\n', results);
        if (results) {
            var jsonResult = {
                'number_of_records': results[0].length,
                'page_number': pageNumber,
                'userdata': results[0],
                'total_number_of_records': results[2][0].total_records
            }
            return res.status(200).json(createJSONResponse('Finished fetching results', Status.SUCCESS, jsonResult));
        }
    } catch (error) {
        let message = 'Server is unable to process your request.';
        return res.status(500).json(error);
    }

}; //End of processGetUserData

exports.processGetOneUserData = async (req, res, next) => {
    let recordId = req.params.recordId;
    try {
        let results = await userManager.getOneUserData(recordId);
        console.log('Inspect result variable inside processGetOneUserData code\n', results);
        if (results) {
            var jsonResult = {
                'userdata': results[0],
            }
            return res.status(200).json(createJSONResponse('Finished fetching results', Status.SUCCESS, jsonResult));
        }
    } catch (error) {
        return res.status(500).json(error);
    }

}; //End of processGetOneUserData

exports.processUpdateOneUser = async (req, res, next) => {
    console.log('processUpdateOneUser running');
    //Collect data from the request body 
    let recordId = req.body.recordId;
    let newRoleId = req.body.roleId;
    try {
        results = await userManager.updateUser(recordId, newRoleId);
        console.log(results);
        return res.status(200).json(createJSONResponse('Update complete', Status.SUCCESS, null));
    } catch (error) {
        console.log('processUpdateOneUser method : catch block section code is running');
        console.log(error, '=======================================================================');
        return res.status(500).json(error);
    }


}; //End of processUpdateOneUser

exports.processGetOneDesignData = async (req, res, next) => {
    let recordId = req.params.fileId;
    try {
        let results = await userManager.getOneDesignData(recordId);
        console.log('Inspect result variable inside processGetOneFileData code\n', results);
        if (results) {
            var jsonResult = {
                'filedata': results[0],
            }
            return res.status(200).json(createJSONResponse('Finished fetching results', Status.SUCCESS, jsonResult));
        }
    } catch (error) {
        return res.status(500).json(error);
    }

}; //End of processGetOneDesignData

exports.processUpdateOneDesign = async (req, res, next) => {
    console.log('processUpdateOneFile running');
    //Collect data from the request body 
    let fileId = req.body.fileId;
    let designTitle = req.body.designTitle;
    let designDescription = req.body.designDescription;
    try {
        results = await userManager.updateDesign(fileId, designTitle, designDescription);
        console.log(results);
        return res.status(200).json(createJSONResponse('Update complete', Status.SUCCESS, jsonResult));
    } catch (error) {
        console.log('processUpdateOneUser method : catch block section code is running');
        console.log(error, '=======================================================================');
        return res.status(500).json(error);
    }


}; //End of processUpdateOneDesign