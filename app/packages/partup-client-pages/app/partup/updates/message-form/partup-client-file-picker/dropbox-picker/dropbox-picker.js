Template.dropboxPicker.onRendered(function () {
    const template = this;
    this.controller = this.data.controller;
    if (!this.controller) {
        throw new Error('dropboxPicker: cannot operate without a FileController');
    }

    const $trigger = $('[data-browse-dropbox]');
    if (!$trigger) {
        throw new Error('dropboxPicker: expected to find a html element with the "data-browse-dropbox" attribute');
    }


    const pickerCallback = (dropboxFiles) => {
        const uploadPromises = [];

        _.each(dropboxFiles, (data) => {
            const file = Files.dropboxToPartupFile(data);
            
            if (template.controller.canAdd(file)) {
                template.controller.uploading.set(true);

                const uploadPromise = new Promise((resolve, reject) => {
                    if (Partup.helpers.files.isImage(file)) {
                        Meteor.call('images.insertByUrl', file, function(error, result) {
                            if (error || !(result && result._id)) {
                                reject(error);
                            } else {
                                const imageId = result._id;

                                template.subscribe('images.one', imageId, {
                                    onReady() {
                                        const image = Images.findOne({ _id: imageId });
                                        if (image) {
                                            resolve(image);
                                        } else {
                                            reject(new Error('dropboxPicker: cannot find image'));
                                        }
                                    },
                                });
                            }
                        });
                    } else {
                        Meteor.call('files.insert', file, function(error, result) {
                            if (error || !(result && result._id)) {
                                reject(error || 'dropboxPicker: files.insert result missing _id');
                            } else {
                                resolve(file);
                            }
                        });
                    }
                }).then((fileResult) => {
                    template.controller.addFile(fileResult);
                });

                uploadPromises.push(uploadPromise);
            }
        });

        Promise.all(uploadPromises).then(() => template.controller.uploading.set(false));
    };

    const open = () => {
        let dropboxClient;
        const accessToken = Cookies.get('dropbox-accessToken');

        if (accessToken) {
            dropboxClient = new Dropbox({ accessToken });
            Dropbox.choose({
                success: pickerCallback,
                linkType: 'preview',
                multiselect: true,
                extensions: _.map(Partup.helpers.files.extensions.all, ext => `.${ext}`),
            });
        } else {
            dropboxClient = new Dropbox({ clientId: $('#dropboxjs').attr('data-app-key') });
            const authUrl = dropboxClient.getAuthenticationUrl(`${new URL(window.location).origin}/dropbox/oauth_receiver.html`);

            const width = 800; const height = 600;
            const top = (screen.width / 2) - (width / 2);
            const left = (screen.height / 2) - (height / 2);

            window.open(authUrl, 'dropbox', `toolbar=no, location=no, directories=no, status=no, menubar=no, scrollbars=no, resizable=no, copyhistory=no, width=${width}, height=${height}, top=${top}, left=${left}`);
        }
    };

    window.setData = () => {
        setTimeout(function () {
            if (!Partup.client.browser.isSafari()) {
                open();
            }
        }, 0);
    };

    $trigger.on('click', open);
});
