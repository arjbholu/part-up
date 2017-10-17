import _ from 'lodash';

class _FileController {
    constructor(config) {
        this.limit = _.defaults(config.limit, {
            images: 4,
            documents: 2,
        });
        this.categories = config.categories || Partup.helpers.files.categories.all;
        this.uploading = new ReactiveVar(false);
        this.limitReached = new ReactiveVar(false);
        this.imagesRemaining = new ReactiveVar(this.limit.images, (oldVal, newVal) => {
            if (newVal && this.documentsRemaining.get()) {
                this.haveFiles.set(true);
            } else {
                this.haveFiles.set(false);
            }
            if (newVal === 0 && this.documentsRemaining.get() === 0) {
                this.limitReached.set(true);
            } else {
                this.limitReached.set(false);
            }
        });
        this.documentsRemaining = new ReactiveVar(this.limit.documents, (oldVal, newVal) => {
            if (newVal && this.imagesRemaining.get()) {
                this.haveFiles.set(true);
            } else {
                this.haveFiles.set(false);
            }
            if (newVal === 0 && this.imagesRemaining.get() === 0) {
                this.limitReached.set(true);
            } else {
                this.limitReached.set(false);
            }
        });
        this.haveFiles = new ReactiveVar(false);
        
        this.files = new ReactiveVar([], (oldVal, newVal) => {
            if (newVal) {
                this.imagesRemaining.set(
                    this.limit.images - _.filter(newVal, file => Partup.helpers.files.isImage(file)).length,
                );
                this.documentsRemaining.set(
                    this.limit.documents - _.filter(newVal, file => !Partup.helpers.files.isImage(file)).length,
                );
            }
        });

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
                if (!this.canAdd(file)) {
                    reject({
                        ...baseError,
                        reason: 'upload-error-limit_reached',
                    });
                } else {
                    check(file, Partup.schemas.entities.file);
                    const allowedServices = [
                        Partup.helpers.files.FILE_SERVICES.DROPBOX,
                        Partup.helpers.files.FILE_SERVICES.GOOGLEDRIVE,
                    ];
                    if (!file.service || !_.includes(allowedServices, file.service)) {
                        reject({
                            ...baseError,
                            reason: `this file has an invalid file service '${file.service}'`,
                        });
                    } else if (Partup.helpers.files.isImage(file)) {
                        Meteor.call('images.insertByUrl', file, function(error, result) {
                            if (error) {
                                reject(error);
                            } else if (!result || !result._id) {
                                reject({
                                    ...baseError,
                                    reason: 'method files.insert failed, no _id in result',
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
                                                reason: 'Could not find image after inserting',
                                            });
                                        }
                                    },
                                });
                            }
                        });
                    } else {
                        // // If we decide not to put dropbox & drive files into our Files collection:
                        // resolve(Object.assign({
                            // _id: Random.id(),
                        // }, file))

                        Meteor.call('files.insert', file, function(error, result) {
                            if (error) {
                                reject(error);
                            } else if (!result || !result._id) {
                                reject({
                                    ...baseError,
                                    reason: 'method files.insert failed, no _id in result',
                                });
                            } else {
                                // Don't need to fetch dropbox or drive files, all data is already present.
                                resolve(Object.assign({
                                    _id: result._id,
                                }, file));
                                // self._subs[fileId] = Meteor.subscribe('files.one', fileId, {
                                //     onReady() {
                                //         const insertedFile = Files.find({ _id: fileId });
                                //         if (insertedFile) {
                                //             resolve(insertedFile);
                                //         } else {
                                //             reject({
                                //                 ...baseError,
                                //                 reason: 'Could not find file after inserting',
                                //             });
                                //         }
                                //     },
                                // });
                            }
                        });
                    }
                }
            } else {
                reject({
                    ...baseError,
                    reason: 'input[file] undefined',
                });
            }
        });
    }

    // This will only work if a file is present in the cache!!!!!
    // It needs to figure out which collection
    removeFileFromCollection(file, collection) {
        // removing it from the collection means that we also need to remove it when it's uploaded to own servers.
        const baseError = {
            caller: 'fileController:removeFileFromCollection',
        };

        if (file) {
            // an ID may also be passed instead of a file, we need to extract / find it.
            const fileId = file._id ?
                file._id :
            file;

            let col = collection;
            if (!collection) {
                col = Partup.helpers.files.isImage(_.find(this.files.get(), f => f._id === fileId)) ?
                    'images' :
                'files';
            }
             
            if (col === 'images' || col === 'files') {
                return new Promise((resolve, reject) => {
                    Meteor.call(`${col}.remove`, fileId, function(error, result) {
                        if (result && result._id) {
                            resolve(result._id);
                        } else {
                            reject({
                                ...baseError,
                                reason: `cannot remove file from ${col} with _id: ${fileId}`,
                            });
                        }
                    });
                });
            }
        }
        return new Error({
            ...baseError,
            reason: `collection: ${collection} or fileId ${fileId} undefined`,
        });
    }

    /**
     * @param {File|[File]} files A file, or array of files to be added to the cache
     * @memberof _FileController
     */
    addFilesToCache(files) {
        if (files) {
            const fileArray = Array.isArray(files) ?
                files :
            [files];

            _.each(fileArray, (file) => {
                if (this.canAdd(file)) {
                    this.files.set(_.concat(this.files.get(), file));
                } else {
                    const collection = Partup.helpers.files.isImage(file) ?
                        'images' :
                    'files';
                    this.removeFileFromCollection(file._id, collection)
                        .catch(error => console.log(error));
                }
            });
        } else {
            throw new Error('fileController: addFile() input undefined');
        }
    }

    /**
     * @param {String|[String]} fileIds a file _id or an array of file _ids
     * @memberof _FileController
     */
    removeFilesFromCache(fileIds) {
        if (fileIds) {
            ids = Array.isArray(fileIds) ?
                fileIds :
            [fileIds];

            const files = _.filter(this.files.get(), file => !_.includes(fileIds, file._id));
            this.files.set(files);
        }
    }

    removeAllFiles() {
        this.removeAllFilesBesides();
    }

    // Warning! this will remove all files where the _id is not in the given array of fileIds
    removeAllFilesBesides(fileIds = []) {
        const filesToRemove = _.filter(this.files.get(), file => _.includes(fileIds, file._id));

        _.each(filesToRemove, (file) => {
            this.removeFileFromCollection(file._id)
                .then(removed => this.removeFilesFromCache(removed))
                .catch(error => console.error(error));
        });
    }

    canAdd(file) {
        return Partup.helpers.files.isImage(file) ?
            this.imagesRemaining.get() > 0 :
            this.documentsRemaining.get() > 0;
    }
    clearFileCache() {
        this.files.set([]);
    }
    clearAllSubscribtions() {
        _.each(this._subs, sub => sub.stop());
        
        // TODO: make proper implementation to delete all subs
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
        this.clearFileCache();
        this.clearAllSubscribtions();
        // When subscriptions are managed here we can use this to clean up.
    }
}

FileController = _FileController;
