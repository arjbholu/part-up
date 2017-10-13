Template.filePicker.onCreated(function() {
    this.controller = this.data.controller;
    this.expanded = new ReactiveVar(false);
});

Template.filePicker.onRendered(function() {
    const template = this;

    this.limitReached = new ReactiveVar(false, function(oldVal, newVal) {
        const $expandEl = $('[data-expand-picker]');
        const disabledClass = 'expand-disabled';
        if (newVal) {
            $expandEl.addClass(disabledClass);
        } else {
            $expandEl.removeClass(disabledClass);
        }
        template.expanded.set(!newVal);
    });

    this.autorun(() => {
        const controller = template.controller;
        const imageLimit = controller.images.get().length >= controller.limit.images;
        const documentLimit = controller.documents.get().length >= controller.limit.documents;
        template.limitReached.set(imageLimit && documentLimit);
    });
});

Template.filePicker.onDestroyed(function() {
    this.controller.reset();
    this.expanded.set(false);
});

Template.filePicker.helpers({
    expanded() {
        return Template.instance().expanded.get();
    },
    images() {
        return Template.instance().controller.images.get();
    },
    documents() {
        return Template.instance().controller.documents.get();
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
    uploadProgress() {
        return 'UPLOADING!';
    },
    imagesRemaining() {
        const controller = Template.instance().controller;
        return controller.limit.images - controller.images.get().length;
    },
    documentsRemaining() {
        const controller = Template.instance().controller;
        return controller.limit.documents - controller.documents.get().length;
    },
    haveFiles() {
        const controller = Template.instance().controller;
        return controller.images.get().length > 0 || controller.documents.get().length > 0;
    },
});

Template.filePicker.events({
    'click [data-expand-picker]'(event, templateInstance) {
        if (!templateInstance.limitReached.get()) {
            templateInstance.expanded.set(!templateInstance.expanded.get());
        }
    },
    'click [data-remove-upload]'(event, templateInstance) {
        const fileId = $(event.target).data('remove-upload');
        templateInstance.controller.removeFile(fileId);
    },
});
