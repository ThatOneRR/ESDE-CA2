// Creating an enum for status in JSON Responses
module.exports.Status = Object.freeze({ 'SUCCESS': 0, 'FAIL': 1, 'ERROR': 2 });

// Formatter function for constructing JSON Responses
module.exports.createJSONResponse = (message, status, data) => {
    if (status == 2) data = null;
    return { 'message': message, 'status': status, 'data': data }
}