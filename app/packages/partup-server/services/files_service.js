const path = Npm.require('path');

/**
 @namespace Partup server files service
 @name Partup.server.services.files
 @memberof Partup.server.services
 */
Partup.server.services.files = {
    /**
     * Upload a file
     *
     * @param {String} filename
     * @param {String} body
     * @param {String} mimetype
     * @param {Object} options
     * @param {String} options._id
     * @param {Object} options.meta
     */
    upload(fileData, body, options) {
        const s3 = new AWS.S3({ params: { Bucket: process.env.AWS_BUCKET_NAME } });
        const extension = path.extname(fileData.name);
        const basename = path.basename(fileData.name, extension);
        const id = fileData._id || Random.id();

        const guid = `${basename.replace(/[^a-zA-Z0-9]/g, '').replace(/ /g, '.')} - ${id}${extension}`;
        
        const file = {
            _id: id,
            guid,
            name: fileData.name,
            type: fileData.type,
            createdAt: new Date(),
            meta: options ? options.meta : {},
            service: 'partup',
            link: Partup.helpers.url.getFileUrl(guid),
        };

        s3.putObjectSync({ Key: `files/'${guid}`, Body: body, ContentType: file.type });
        Files.insert(file);
        return file;
    },

    /**
     * Remove a file
     *
     * @param {String} id
     */
    remove(id) {
        const s3 = new AWS.S3({ params: { Bucket: process.env.AWS_BUCKET_NAME } });
        const file = Files.findOne(id);

        if (file) {
            // We need to be able to handle old and new file data
            const key = file.guid ?
                file.guid :
            file.name;

            if (key) {
                s3.deleteObjectSync({ Key: `files/${key}` });
                Files.remove(id);
                return {
                    _id: id,
                };
            }
        }
        return undefined;
    },
};
