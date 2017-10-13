import _ from 'lodash';

class _FileController {
    constructor(limit, categories) {
        this.limit = _.defaults(limit, {
            images: 4,
            documents: 2,
        });
        this.categories = categories;
        this.images = new ReactiveVar([]);
        this.documents = new ReactiveVar([]);
        this.uploading = new ReactiveVar(false);
        this.limitReached = new ReactiveVar(false);
    }

    addFile(file) {
        if (!file) {
            throw new Error('fileController: addFile() input undefined');
        }
        let newFile = file;
        if (this.canAdd(newFile)) {
            const category = Partup.helpers.files.getCategory(newFile);
            if (category === 'image') {
                this.images.set(_.concat(this.images.get(), newFile));
            } else {
                newFile = Files.toAttachedFile(file);
                if (newFile) {
                    this.documents.set(_.concat(this.documents.get(), newFile));
                }
            }
        }
        if (!this.canAdd(newFile)) {
            this.limitReached.set(true);
        }
    }
    removeFile(file) {
        if (_.includes(this.images.get(), file)) {
            this.images.set(_.filter(this.images.get(), image => image === file));
        } else if (_.includes(this.documents.get(), file)) {
            this.documents.set(_.filter(this.documents.get(), doc => doc === file));
        }
        if (this.canAdd(file)) {
            this.limitReached.set(false);
        }
    }
    canAdd(file) {
        console.log(file);
        switch (Partup.helpers.files.getCategory(file)) {
            case Partup.helpers.files.categories.image:
                return this.images.get().length < this.limit.images;
            default:
                return this.documents.get().length < this.limit.documents;
        }
    }
    reset() {
        this.images.set([]);
        this.documents.set([]);
        this.uploading.set(false);
    }
}

FileController = _FileController;
