Template.devicePicker.onRendered(function() {
    const template = this;

    this.controller = this.data.controller;
    if (!this.controller) {
        throw new Error('devicePicker: cannot operate without a FileController');
    }

    const $trigger = $('[data-browse-device]');
    if (!$trigger) {
        throw new Error('devicePicker: expected to find a html element with the "data-browse-device" attribute');
    }

    const pluploadConfig = {
        config: {
            browse_button: $trigger[0],
        },
        types: template.controller.categories,
        hooks: {
            FilesAdded(uploader, files) {
                if (template.controller.canAdd(files, (removedFile) => {
                    Partup.client.notify.info(TAPi18n.__('upload-info-limit-reached', { filename: removedFile.name }));
                    uploader.removeFile(removedFile);
                }));
                if (uploader.files.length > 0) {
                    template.controller.uploading.set(true);
                    uploader.start();
                }
            },
            FileUploaded(uploader, file, result) {
                if (!result) return;
                const response = JSON.parse(result.response);

                if (response.error) {
                    template.controller.uploading.set(false);
                    Partup.client.notify.error(TAPi18n.__(response.error.reason), { filename: file.name });
                    return;
                }
                if (!response.fileId) {
                    template.controller.uploading.set(false);
                    Partup.client.notify.error(TAPi18n.__('upload-error-100'), { filename: file.name });
                    return;
                }

                if (Partup.helpers.files.isImage(file)) {
                    template.subscribe('images.one', response.fileId, {
                        onReady() {
                            const image = Images.findOne({ _id: response.fileId });
                            if (image) {
                                template.controller.addFilesToCache(image);
                            } else {
                                throw new Error('devicePicker: could not find image');
                            }
                        },
                    });
                } else {
                    template.subscribe('files.one', response.fileId, {
                        onReady() {
                            const doc = Files.findOne({ _id: response.fileId });
                            if (doc) {
                                template.controller.addFilesToCache(doc);
                            } else {
                                throw new Error('devicePicker: could not find file');
                            }
                        },
                    });
                }
            },
            UploadComplete(uploader) {
                template.controller.uploading.set(false);
                while (uploader.files.length) {
                    uploader.files.pop();
                }
            },
        },
    };

    const $dropArea = $('[data-drop-area]');
    if ($dropArea) {
        pluploadConfig.config.drop_element = $dropArea[0];
    }

    this.uploader = new Pluploader(pluploadConfig);
    this.initTimeout = setTimeout(() => this.uploader.init(), 2000);
});

Template.devicePicker.onDestroyed(function() {
    clearTimeout(this.initTimeout);
    this.uploader.destroy();
});
