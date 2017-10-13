import { Random } from 'meteor/random';

Template.dropboxPicker.onRendered(function () {
    const template = this;

    const $trigger = $('[data-browse-dropbox]');
    if (!$trigger) {
        throw new Error('dropboxPicker: expected to find a html element with the "data-browse-dropbox" attribute');
    }

    this.controller = this.data.controller;
    if (!this.controller) {
        throw new Error('dropboxPicker: cannot operate without a FileController');
    }

    const open = () => {
        let dropboxClient;
        const accessToken = Cookies.get('dropbox-accessToken');

        if (accessToken) {
            dropboxClient = new Dropbox({ accessToken });
            Dropbox.choose({
                success(files) {
                    template.controller.uploading.set(true);
                    files.forEach((file) => {
                        const newFile = Object.assign({
                            _id: Random.id(), // new Meteor.Collection.ObjectID()._str,
                        }, file);
                        template.controller.addFile(newFile);
                    });
                    template.controller.uploading.set(false);
                },
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
