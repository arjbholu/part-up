
Template.documentRenderer.onCreated(function () {
    const instance = this;
    this.documents = new ReactiveVar([]);

    this.subscribe('files.many', this.data.documents, {
        onReady() {
            Files.getForUpdate(instance.data.updateId)
                .then(fileData => instance.documents.set(fileData.fetch()));
        },
    });
});

Template.documentRenderer.helpers({
    documents() {
        return Template.instance().documents.get();
    },
    getSvgIcon(file) {
        return Partup.helpers.files.getSvgIcon(file);
    },
    bytesToSize(bytes) {
        // return FileUploader.bytesToSize(bytes);
    },
});
