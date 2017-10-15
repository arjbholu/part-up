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
        
        this.images = new ReactiveVar([], (oldVal, newVal) => this.imagesRemaining.set(this.limit.images - newVal.length));
        this.documents = new ReactiveVar([], (oldVal, newVal) => this.documentsRemaining.set(this.limit.documents - newVal.length));
    }

    /**
     * 
     * BIG ISSUE!
     * A file will already be uploaded when this method is invoked (in the case of images and files where service is partup).
     * If it fails the 'canAdd' method it has to be removed but it's not sure it's already uploaded as we don't upload dropbox and drive files ourselves.
     * This can happen because of promises and race conditions when uploading multiple files at the same time.
     * 
     * @param {any} files 
     * @memberof _FileController
     */
    addFile(files) {
        if (files) {
            const fileArray = Array.isArray(files) ?
                files :
            [files];

            const newImages = [];
            const newFiles = [];

            _.each(fileArray, (file) => {
                if (this.canAdd(file)) {
                    if (Partup.helpers.files.isImage(file)) {
                        newImages.push(file);
                    } else {
                        newFiles.push(file);
                    }
                }
            });

            if (newImages.length) {
                this.images.set(_.concat(this.images.get(), newImages));
            }
            if (newFiles.length) {
                this.documents.set(_.concat(this.documents.get(), newFiles));
            }
        } else {
            throw new Error('fileController: addFile() input undefined');
        }
    }
    removeFile(data) {
        if (data) {
            const self = this;
            ids = Array.isArray(data) ?
                data :
            [data];

            const imageIds = _.map(_.filter(this.images.get(), img => !_.includes(ids, img._id)), i => i._id);
            if (imageIds.length) {
                Meteor.call('images.remove', imageIds, function(error) {
                    if (error) {
                        Partup.client.notify.error(error);
                    } else {
                        const images = _.filter(self.images.get(), img => !_.includes(imageIds, img._id));
                        self.images.set(images);
                    }
                });
            }
            
            const documentIds = _.map(_.filter(this.documents.get(), doc => !_.includes(ids, doc._id)), d => d._id);
            if (documentIds.length) {
                Meteor.call('files.remove', documentIds, function(error) {
                    if (error) {
                        Partup.client.notify.error(error);
                    } else {
                        const documents = _.filter(self.documents.get(), doc => !_.includes(documentIds, doc._id));
                        self.documents.set(documents);
                    }
                });
            }
        }
    }
    canAdd(file) {
        return Partup.helpers.files.isImage(file) ?
            this.imagesRemaining.get() > 0 :
            this.documentsRemaining.get() > 0;
    }
    reset() {
        this.removeFile(this.images.get());
        this.removeFile(this.documents.get());
        this.uploading.set(false);
    }
    destroy() {
        this.reset();
        // When subscriptions are managed here we can use this to clean up.
    }
}

FileController = _FileController;
