import _ from 'lodash';


/**
 * A file controller can be passed onto a picker and provides behavior to share state between pickers.
 *
 * @param {Object} config {
 *  limit: {
 *    images:
 *    documents:
 *  }
 *  categories: Partup.helpers.files.categories.CAT
 * }
 * @class _FileController
 */
class _FileController {
    constructor(config) {
        const calculateLimit = (collection, val) => {
            this.limitReached.set((val === 0 && this[collection].get().length === 0));
        };

        this.limit = _.defaults(config.limit, {
            images: 4,
            documents: 2,
        });
        this.categories = config.categories || Partup.helpers.files.categories.all;
        this.uploading = new ReactiveVar(false);
        this.imagesRemaining = new ReactiveVar(this.limit.images, (oldVal, newVal) => calculateLimit('documentsRemaining', newVal));
        this.documentsRemaining = new ReactiveVar(this.limit.documents, (oldVal, newVal) => calculateLimit('imagesRemaining', newVal));
        this.haveFiles = new ReactiveVar(false);
        this.limitReached = new ReactiveVar(false);
        
        this.files = new ReactiveVar([], (oldVal, newVal) => {
            this.haveFiles.set(newVal && newVal.length > 0);
            if (newVal) {
                this.imagesRemaining.set(
                    this.limit.images - _.filter(newVal, file => Partup.helpers.files.isImage(file)).length,
                );
                this.documentsRemaining.set(
                    this.limit.documents - _.filter(newVal, file => !Partup.helpers.files.isImage(file)).length,
                );
            }
        });

        // When a user removes a file from the widget it's already uploaded
        // In the case of an existing entity we can't yet remove it from the collection (user can still press cancel)
        // We store the references the user removes here and clean up afterwards, see 'removeAllFilesBesides'
        this.removedFromCache = new ReactiveVar([]);

        // internal sub handler
        this._subs = {};
    }
    
    /**
     * insert a dropbox or googledrive file to the Files collection,
     * it's very important this file is transformed (and thus has a service attached)!
     *
     * @memberof _FileController
     * @param {File} file dropbox or googledrive file, see 'Partup.helpers.files.FILE_SERVICES'
     */
    insertFileToCollection(file) {
        const self = this;
        const baseError = {
            caller: 'fileController:insertFileToCollection',
        };

        return new Promise((resolve, reject) => {
            if (file) {
                if (this.canAdd(file).length) {
                    const allowedServices = [
                        Partup.helpers.files.FILE_SERVICES.DROPBOX,
                        Partup.helpers.files.FILE_SERVICES.GOOGLEDRIVE,
                    ];
                    if (!file.service || !_.includes(allowedServices, file.service)) {
                        reject({
                            ...baseError,
                            code: 1,
                            message: `this file has an invalid file service: '${file.service}', see 'Partup.helpers.files.FILE_SERVICES' for more information`,
                        });
                    } else if (Partup.helpers.files.isImage(file)) {
                        Meteor.call('images.insertByUrl', file, function(error, result) {
                            if (error) {
                                reject(error);
                            } else if (!result || !result._id) {
                                reject({
                                    ...baseError,
                                    code: 1,
                                    message: "meteor method 'images.insertByUrl' failed, no _id in result",
                                });
                            } else {
                                const imageId = result._id;

                                self._subs[imageId] = Meteor.subscribe('images.one', imageId, {
                                    onReady() {
                                        const insertedImage = Images.findOne(imageId);

                                        if (insertedImage) {
                                            resolve(insertedImage);
                                        } else {
                                            reject({
                                                ...baseError,
                                                code: 1,
                                                message: `cannot find image with _id: ${imageId} after inserting`,
                                            });
                                        }
                                    },
                                });
                            }
                        });
                    } else {
                        Meteor.call('files.insert', file, function(error, result) {
                            if (error) {
                                reject(error);
                            } else if (!result || !result._id) {
                                reject({
                                    ...baseError,
                                    message: "method 'files.insert' failed, no _id in result",
                                });
                            } else {
                                // Don't need to fetch dropbox or drive files, all data is already present.
                                resolve(Object.assign({
                                    _id: result._id,
                                }, file));
                            }
                        });
                    }
                } else {
                    reject({
                        ...baseError,
                        code: 1,
                        message: 'cannot add file to collection, canAdd() returned false',
                    });
                }
            } else {
                reject({
                    ...baseError,
                    code: 1,
                    message: 'input[file] undefined',
                });
            }
        });
    }

    // This will only work if a file is present in the cache!!!!!
    // It needs to figure out which collection
    removeFileFromCollection(file, collection) {
        const baseError = {
            caller: 'fileController:removeFileFromCollection',
        };

        return new Promise((resolve, reject) => {
            if (file) {
                const fileId = file._id || file;
                check(fileId, String);
    
                let col = collection;
                if (!collection) {
                    const foundFile = _.find(_.concat(this.files.get(), this.removedFromCache.get()), ({ _id }) => _id === fileId);
                    if (foundFile) {
                        col = Partup.helpers.files.isImage(foundFile) ? 'images' : 'files';
                    } else {
                        reject({
                            ...baseError,
                            code: 1,
                            message: `collection: ${collection} not valid and couldn't find file with _id: ${fileId} in the cache`,
                        });
                    }
                }

                if (col === 'images' || col === 'files') {
                    Meteor.call(`${col}.remove`, fileId, function(error, result) {
                        if (error) {
                            reject(error);
                        } else if (!result || !result._id) {
                            reject({
                                ...baseError,
                                code: 1,
                                message: `meteor method '${col}.remove' failed, no _id in result`,
                            });
                        } else {
                            resolve(result._id);
                        }
                    });
                } else {
                    reject({
                        ...baseError,
                        code: 1,
                        message: `collection not supported ${col}`,
                    });
                }
            } else {
                reject({
                    ...baseError,
                    code: 1,
                    message: 'input[file] undefined',
                });
            }
        });
    }

    /**
     * @param {File|[File]} files A file, or array of files to be added to the cache
     * @memberof _FileController
     */
    addFilesToCache(files) {
        if (files) {
            const fileArray = Array.isArray(files) ? files : [files];

            _.each(fileArray, (file) => {
                if (this.canAdd(file).length) {
                    this.files.set(_.concat(this.files.get(), file));
                } else {
                    // If we can't add a file, it's already uploaded and needs to be removed again.
                    // This can happen because of race conditions.
                    // Must pass a collection because the controller does not have the file in cache.
                    const collection = Partup.helpers.files.isImage(file) ? 'images' : 'files';
                    this.removeFileFromCollection(file._id, collection)
                        .catch((error) => { throw error; });
                }
            });
        } else {
            throw {
                code: 0,
                message: 'addFilesToCache: input undefined',
            };
        }
    }

    /**
     * @param {String|[String]} fileIds a _id or an array of _ids
     * @memberof _FileController
     */
    removeFilesFromCache(fileIds) {
        if (fileIds) {
            const ids = Array.isArray(fileIds) ? fileIds : [fileIds];
            const files = _.filter(this.files.get(), file => !_.includes(ids, file._id));
            this.removedFromCache.set(_.concat(this.removedFromCache.get(), _.filter(this.files.get(), file => _.includes(ids, file._id))));
            this.files.set(files);
        } else {
            throw {
                code: 0,
                message: 'removeFilesFromCache: input undefined',
            };
        }
    }

    removeAllFiles() {
        this.removeAllFilesBesides();
    }

    /**
     * @param {[String]} [fileIds] the files to exclude when removing the files remaining in the cache.
     * @memberof _FileController
     */
    removeAllFilesBesides(fileIds = []) {
        const filesToRemove =
            _.filter(_.concat(this.files.get(), this.removedFromCache.get()), file => !_.includes(fileIds, file._id));

        _.each(filesToRemove, (file) => {
            this.removeFileFromCollection(file._id)
                .then(id => this.removeFilesFromCache(id))
                .catch((error) => { throw error; }); // sis not important for the user.
        });
    }

    /**
     * Checks if there's still room for more files according to the set limit
     *
     * @param {File} file
     * @param {Function} callback fired for each file that would exceed the limit.
     * @returns {Boolean}
     * @memberof _FileController
     */
    canAdd(files, callback) {
        const fileArray = Array.isArray(files) ? files : [files];
        let imagesRemaining = this.imagesRemaining.get();
        let documentsRemaining = this.documentsRemaining.get();

        const filesThatCanBeAdded = _.filter(fileArray, (file) => {
            if (Partup.helpers.files.isImage(file)) {
                if (imagesRemaining) {
                    --imagesRemaining;
                    return true;
                } else if (callback) {
                    callback(file);
                }
            } else if (documentsRemaining) {
                --documentsRemaining;
                return true;
            } else if (callback) {
                callback(file);
            }
            return false;
        });

        return filesThatCanBeAdded;
    }

    clearFileCache() {
        this.files.set([]);
        this.removedFromCache.set([]);
    }

    clearAllSubscribtions() {
        _.each(this._subs, sub => sub.stop());

        while (this._subs && this._subs.length) {
            this._subs.pop();
        }
    }

    reset() {
        this.clearFileCache();
        this.clearAllSubscribtions();
        this.uploading.set(false);
    }

    destroy() {
        this.reset();
    }
}

FileController = _FileController;
