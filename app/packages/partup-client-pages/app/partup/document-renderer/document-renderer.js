import {FileUploader} from 'meteor/partup-lib';

Template.DocumentRenderer.helpers({
    getSvgIcon: FileUploader.getSvgIcon,
    bytesToSize: FileUploader.bytesToSize,
    previewLink: function(file) {
        console.log(file);
        if (file.isPartupFile) {
            return Partup.helpers.url.getFileUrl(file);
        }
        // TODO Refactor to not use new URL() anymore, this requires a polyfill for IE
        var client = new URL(file.link).host;

        if (client.indexOf('dropbox') > -1) {
            return Partup.helpers.DropboxRenderer().createPreviewLinkFromDirectLink(file.link, file.name);
        } else if (client.indexOf('google') > -1) {
            return Partup.helpers.GoogleDriveRenderer().createPreviewLinkFromDirectLink(file.link);
        } else { /* perhaps partup 404 no file found */ return ''; }
    }
});
