import { Random } from 'meteor/random';

const drivePickerConfig = {
    developerKey: 'AIzaSyAN_WmzOOIcrkLCobAyUqTTQPRtAaD8lkM',
    clientId: '963161275015-ktpmjsjtr570htbmbkuepthb1st8o99o.apps.googleusercontent.com',
    scope: ['https://www.googleapis.com/auth/drive', 'https://www.googleapis.com/auth/drive.file'],
};

drivePicker = drivePicker || {};

drivePicker.setDefaultPermission = (file) => {
    const request = window.gapi.client.drive.permissions.create({
        fileId: file.id,
        sendNotificationEmail: false,
        transferOwnerShip: false,
        role: 'reader',
        type: 'anyone',
    });

    return new Promise((resolve, reject) => {
        request.execute((response) => {
            if (response.error) {
                reject(response.error);
            } else {
                resolve(response);
            }
        });
    });
};

Template.drivePicker.onRendered(function() {
    const template = this;
    let accessToken;

    const $trigger = $('[data-browse-drive]');
    if (!$trigger) {
        throw new Error('drivePicker: expected to find a html element with the "data-browse-drive" attribute');
    }

    this.controller = this.data.controller;
    if (!this.controller) {
        throw new Error('drivePicker: cannot operate without a FileController');
    }

    function pickerCallback(data) {
        const uploadPromises = [];
        const settingPromises = [];

        if (data[google.picker.Response.ACTION] === google.picker.Action.PICKED) {

            _.each(data.docs, file => settingPromises.push(drivePicker.setDefaultPermission(file)));

            Promise.all(settingPromises)
                .then(() => {
                    _.each(data.docs, (file) => {
                        let newFile = file;
                        newFile.bytes = (!isNaN(file.sizeBytes)) ? parseInt(file.sizeBytes) : 0;
                        newFile.icon = file.iconUrl.toString();
                        newFile.mimeType = file.mimeType.toString();
                        newFile.name = file.name.toString();

                        if (template.controller.canAdd(file)) {
                            const category = Partup.helpers.files.getCategory(file);

                            if (category === 'image') {
                                newFile.link = `https://docs.google.com/uc?id=${file.id}`;
                                newFile = _.pick(newFile, 'icon', 'bytes', 'link', 'name', 'mimeType');

                                uploadPromises.push(new Promise((resolve, reject) => {
                                    template.controller.uploading.set(true);
                                    Meteor.call('images.insertByUrl', newFile.link, function(error, result) {
                                        if (error || !result) {
                                            reject(error);
                                        } else {
                                            Meteor.subscribe('images.one', result._id, {
                                                onReady() {
                                                    const image = Images.findOne({ _id: result._id });
                                                    if (image) {
                                                        resolve(image);
                                                    }
                                                },
                                            });
                                        }
                                    });
                                }));
                            } else {
                                newFile.link = file.url.toString();
                                newFile = _.pick(newFile, 'icon', 'bytes', 'link', 'name', 'mimeType');
                                newFile._id = Random.id(); // new Meteor.Collection.ObjectID()._str;

                                uploadPromises.push(new Promise((resolve) => {
                                    template.controller.uploading.set(true);
                                    resolve(newFile);
                                }));
                            }
                        }

                        Promise.all(uploadPromises)
                            .then((files) => {
                                _.each(files, (file) => {
                                    template.controller.addFile(file);
                                });
                                template.controller.uploading.set(false);
                            })
                            .catch((error) => {
                                Partup.client.notify.error(TAPi18n.__(error.reason));
                                template.controller.uploading.set(false);
                            });
                    });
                })
                .catch((error) => {
                    Partup.client.notify.error(TAPi18n.__(error.reason));
                    template.controller.uploading.set(false);
                });
        }
    }

    function createPicker(accessToken) {
        if (accessToken) {
            const docksView = new google.picker.DocsView();
            docksView.setIncludeFolders(true);

            const pickerBuilder = new google.picker.PickerBuilder();
            
            pickerBuilder.enableFeature(google.picker.Feature.MULTISELECT_ENABLED);
            pickerBuilder.addView(docksView);
            pickerBuilder.addView(new google.picker.DocsUploadView());
            pickerBuilder.setOAuthToken(accessToken);
            pickerBuilder.setCallback(pickerCallback);

            pickerBuilder.setSize($(document).outerWidth(), $(document).outerHeight());

            const picker = pickerBuilder.build();
            picker.setVisible(true);
        }
    }

    function authorize() {
        const token = window.gapi.auth.getToken();
        if (token) {
            createPicker(token.access_token);
        } else {
            window.gapi.auth.authorize({
                client_id: drivePickerConfig.clientId,
                scope: drivePickerConfig.scope,
                immediate: false,
            }, (result) => {
                if (result && !result.error) {
                    accessToken = result.access_token;
                }
                createPicker(accessToken);
            });
        }
    }

    Promise.all([
        'auth',
        'picker',
        'client',
    ].map(api => new Promise((resolve) => {
        window.gapi.load(api, {
            callback() {
                resolve(api);
            },
        });
    }))).then(() => {
        window.gapi.client.load('drive', 'v3', () => {
            $trigger.off('click', authorize);
            $trigger.on('click', authorize);
        });
    });
});
