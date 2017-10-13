import _ from 'lodash';

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
    var files = update.type_data.files || [];
    return Files.find({_id: {$in: files}});
};

Files.toAttachedFile = function(file) {
    const newFile = _.pick(file, ['_id', 'name', 'type', 'link', 'isPartupFile']);

    // Any additional mappings done here
    if (!newFile.type && file.mimeType) {
        newFile.type = file.mimeType;
    }

    return newFile;

    // if (check(newFile, Partup.schemas.forms.fileAttached)) {
    //     return newFile;
    // }

    // console.log(newFile);
    // return undefined;
};
