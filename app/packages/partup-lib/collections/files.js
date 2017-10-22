import _ from 'lodash';
import { Random } from 'meteor/random';

/**
 * Files are entities stored under each object that contains one or more files
 *
 * @namespace Files
 * @memberOf Collection
 */
Files = new Meteor.Collection('cfs.files.filerecord'); // Collection name is for backwards compatibility

/**
 * Find files for an update
 *
 * @memberOf Files
 * @param {Update} update
 * @return {Mongo.Cursor}
 */
Files.findForUpdate = function(update) {
    const files = update.type_data.files || [];
    return Files.find({ _id: { $in: files } });
};

Files.getForUpdate = function (updateId) {
    return new Promise((resolve, reject) => {
        let files = [];

        const update = Updates.findOne(updateId);
        if (update && update.type_data) {
            const fileIds = update.type_data.documents;

            if (fileIds) {
                files = Files.find({ _id: { $in: fileIds } });
                if (!files) {
                    reject();
                }
            }
        }

        resolve(files);
    });
};

Files.dropboxToPartupFile = (dropboxFile) => {
    let file = {
        _id: Random.id(),
        name: dropboxFile.name,
        type: Partup.helpers.files.info[Partup.helpers.files.getExtension(dropboxFile)].mime,
        bytes: dropboxFile.bytes,
        service: 'dropbox',
    };
    if (Partup.helpers.files.isImage(file)) {
        file = Object.assign(file, {
            link: `${dropboxFile.link.slice(0, -1)}1`,
        });
    } else {
        file = Object.assign(file, {
            link: dropboxFile.link,
        });
    }
    return file;
};

Files.driveToPartupFile = (driveFile) => {
    let file = {
        _id: Random.id(),
        name: driveFile.name,
        type: driveFile.mimeType,
        bytes: (!isNaN(driveFile.sizeBytes)) ? parseInt(driveFile.sizeBytes) : 0,
        service: 'googledrive',
    };
    if (Partup.helpers.files.isImage(file)) {
        file = Object.assign(file, {
            link: `https://docs.google.com/uc?id=${driveFile.id}`,
        });
    } else {
        file = Object.assign(file, {
            link: driveFile.url.toString(),
        });
    }
    return file;
};
