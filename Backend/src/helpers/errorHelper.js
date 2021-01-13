const fileSystem = require('fs');
const path = require('path');

// Log errors to file with timestamp accurate up to milliseconds
module.exports.logError = (values, response, error) => {
    return new Promise((resolve, reject) => {
        var date = new Date();
        var pathStr = path.resolve(__dirname + '../../../logs/' + date.toUTCString().replace(' GMT', ' ' + date.getMilliseconds() + ' GMT').replace(/,/g, '').replace(/\W/g, '-') + '.txt');
        var contents = 'Function Input Values:\n', propCount = 0;
        for (var property in values) {
            const value = values[property];
            contents += property + ': ' + value + "\n";
            propCount++;
        }
        if (propCount == 0) contents += "- None -\n";
        propCount = 0;
        contents += '\nResponse JSON Object:\n';
        for (var property in response) {
            const value = response[property];
            contents += property + ': ' + value + "\n";
            propCount++;
        }
        if (propCount == 0) contents += "- None -";
        if (error) console.log(error);
        fileSystem.writeFile(pathStr, contents, 'utf8', (writeError) => {
            if (writeError) {
                return reject({ 'message': 'Error occured while logging error', 'status': 'error', 'data': writeError });
            }
            return resolve({ 'message': 'Successfully logged error to ' + pathStr, 'status': 'success', 'data': writeError });
        });
    });
}
