Template.filePicker.onCreated(function() {
    this.controller = this.data.controller;
    this.expanded = new ReactiveVar(false);
});

Template.filePicker.onRendered(function() {
    this.autorun(() => {
        const limitReached = this.controller.limitReached.get();
        this.expanded.set(!limitReached);
    });
});

Template.filePicker.onDestroyed(function() {
    this.controller.destroy();
    this.expanded.set(false);
});

Template.filePicker.helpers({
    expanded() {
        return Template.instance().expanded.get();
    },
    images() {
        return _.filter(Template.instance().controller.files.get(), file => Partup.helpers.files.isImage(file));
    },
    documents() {
        return _.filter(Template.instance().controller.files.get(), file => !Partup.helpers.files.isImage(file));
    },
    getImageUrl(image) {
        return Partup.helpers.url.getImageUrl(image, '360x360');
    },
    getSvgIcon(doc) {
        return Partup.helpers.files.getSvgIcon(doc);
    },
    uploading() {
        return Template.instance().controller.uploading.get();
    },
    imagesRemaining() {
        return Template.instance().controller.imagesRemaining.get();
    },
    documentsRemaining() {
        return Template.instance().controller.documentsRemaining.get();
    },
    haveFiles() {
        return Template.instance().controller.haveFiles.get();
    },
});

Template.filePicker.events({
    'click [data-expand-picker]'(event, templateInstance) {
        if (!templateInstance.controller.limitReached.get()) {
            templateInstance.expanded.set(!templateInstance.expanded.get());
        }
    },
    'click [data-remove-upload]'(event, templateInstance) {
        const fileId = $(event.target).data('remove-upload');
        if (fileId) {
            templateInstance.controller.removeFileFromCollection(fileId)
                .then(removedId => templateInstance.controller.removeFilesFromCache(removedId))
                .catch((error) => { throw error; });
        } else {
            Partup.client.notify.error('could not remove file');
        }
    },
});
