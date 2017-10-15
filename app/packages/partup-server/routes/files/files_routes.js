var Busboy = Npm.require('busboy');
var winston = Npm.require('winston');

// #region AWS config

AWS.config.accessKeyId = process.env.AWS_ACCESS_KEY_ID;
AWS.config.secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
AWS.config.region = process.env.AWS_BUCKET_REGION;

// #endregion

/**
 * File upload route for all files
 * 
 */
Router.route('/files/upload', { where: 'server' }).post(function() {
    var request = this.request;
    var response = this.response;
    var busboy = new Busboy({'headers': request.headers});

    response.setHeader('Content-Type', 'application/json');

    busboy.on('file', Meteor.bindEnvironment(function(fieldname, file, filename, encoding, mimetype) {
        const fileData = {
            name: filename,
            type: mimetype,
        };

        const category = Partup.helpers.files.getCategory(fileData);
        if (!category) {
            response.statusCode = 400;
            response.end(JSON.stringify({ error: { reason: 'upload-error-unknown_category' } }));
            return;
        }

        let fileSize = 0;
        const buffers = [];

        // Files are send as multipart-form so the data is seperated into multiple parts.
        file.on('data', Meteor.bindEnvironment(function(data) {
            fileSize += data.length;
            buffers.push(new Buffer(data));
        }));

        file.on('end', Meteor.bindEnvironment(function (data) {
            if (fileSize > Partup.helpers.files.max_file_size) {
                response.statusCode = 400;
                response.end(JSON.stringify({ error: { reason: 'upload-error-600' } }))
            }

            let body = Buffer.concat(buffers);

            // Try to get the fileinfo for the given extension and check if the signatures match.
            const ext = Partup.helpers.files.getExtension(fileData);
            const fileInfo = Partup.helpers.files.info[ext];

            let match = false;
            if (fileInfo) {
                for (var i = 0; i < fileInfo.signatures.length; i++) {
                    const element = fileInfo.signatures[i];
                    if (element) {
                        let bytes = '';
                        for (const val of body.slice(element.offset, element.size).values()) {
                            bytes += val;           
                        }
                        match = (function arrayEqual(a, b) {
                            if (a instanceof Array && b instanceof Array) {
                                if (a.length !== b.length) {
                                    return false;
                                }
                                for (var j = 0; j < a.length; j++) {
                                    if (!arrayEqual(a[j],b[j])) {
                                        return false;
                                    }
                                }
                                return true;
                            } else {
                                return a===b;
                            }
                        })(element, bytes);

                        // For now, log info about matching to improve this for the future
                        if (!match) {
                            let log = {
                                filename,
                                mimetype,
                                bytes
                            }
                            winston.info(`No match found for: ${JSON.stringify(log, null, 2)}`);
                        }
                    }
                }
            }

            let file;
            switch (category) {
                case 'image':
                    file = Partup.server.services.images.upload(filename, body, mimetype);
                    break;
                default:
                    file = Partup.server.services.files.upload(fileData, body);
                    break;
            }

            // Sadly in order to be backwards compatible the 'file' and 'image' keys are preserved until the old uploader is fully replaced
            // We now use fileId wherever we use this
            return response.end(JSON.stringify({ error: false, fileId: file._id, file: file._id, image: file._id }));
        }));
    }));

    request.pipe(busboy);
});
