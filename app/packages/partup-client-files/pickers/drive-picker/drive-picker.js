import _ from 'lodash';

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
    
    this.controller = this.data.controller;
    if (!this.controller) {
        throw new Error('drivePicker: cannot operate without a FileController');
    }

    const $trigger = $('[data-browse-drive]');
    if (!$trigger) {
        throw new Error('drivePicker: expected to find a html element with the "data-browse-drive" attribute');
    }

    function pickerCallback(data) {
        const uploadPromises = [];
        const settingPromises = [];

        if (data[google.picker.Response.ACTION] === google.picker.Action.PICKED) {

            // Files first need to be transformed in order for canAdd to work.
            const transformedFiles = _.map(data.docs, Partup.helpers.files.transform.googledrive);
            const files = template.controller.canAdd(transformedFiles, (removedFile) => {
                Partup.client.notify.info(TAPi18n.__('upload-info-limit-reached', { filename: removedFile.name }));
                _.remove(data.docs, d => d.name === removedFile.name);
            });
            
            // We need the original docs to set permissions for the ids.
            _.each(data.docs, file => settingPromises.push(drivePicker.setDefaultPermission(file)));

            Promise.all(settingPromises)
                .then(() => {
                    template.controller.uploading.set(true);
                    
                    _.each(files, (file) => {
                        const uploadPromise =
                            template.controller.insertFileToCollection(file)
                                .then(inserted => template.controller.addFilesToCache(inserted))
                                .catch((error) => { Partup.client.notify.error(TAPi18n.__(`upload-error-${error.code}`)); });

                        uploadPromises.push(uploadPromise);
                    });

                    Promise.all(uploadPromises)
                        .then(() => template.controller.uploading.set(false))
                        .catch((error) => { throw error; });
                }).catch((error) => { throw error; });
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

    function open() {
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
            $trigger.off('click', open);
            $trigger.on('click', open);
        });
    });
});
