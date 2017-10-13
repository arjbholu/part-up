import {FileUploader} from 'meteor/partup-lib';


if (Meteor.isClient) {

    Template.DropboxChooser.onRendered(function () {

        /**
         * part-up webapp, Dropbox Developer console
         */

        var mediaUploader = Template.instance().data.mediaUploader;

        var $mediaTrigger = jQuery('[data-dropbox-chooser]');

        $mediaTrigger.click(mediaUploadTrigger);

        window.setData = function () {
            setTimeout(function () {
                if (!Partup.client.browser.isSafari()) {
                    mediaUploadTrigger();
                }
            }, 0);
        };

        function mediaUploadTrigger() {
            var dropboxClient;
            if (Cookies.get('dropbox-accessToken')) {
                dropboxClient = new Dropbox({accessToken: Cookies.get('dropbox-accessToken')});
                Dropbox.choose({
                    success: function (files) {
                        onFileChange.apply(Dropbox, [files, dropboxClient]);
                    },
                    linkType: "preview", // or "direct"
                    multiselect: true, // or true
                    extensions: getExtensions()
                });
            } else {
                dropboxClient = new Dropbox({clientId: jQuery('#dropboxjs').attr('data-app-key')});
                var authUrl = dropboxClient.getAuthenticationUrl(new URL(window.location).origin + "/dropbox/oauth_receiver.html");
                popupCenter(authUrl, 'dropbox', 800, 600);
            }
        }

        function popupCenter(url, title, w, h) {
            var left = (screen.width / 2) - (w / 2);
            var top = (screen.height / 2) - (h / 2);
            return window.open(url, title, 'toolbar=no, location=no, directories=no, status=no, menubar=no, scrollbars=no, resizable=no, copyhistory=no, width=' + w + ', height=' + h + ', top=' + top + ', left=' + left);
        }

        function getExtensions() {
            if (mediaUploader.uploadedPhotos.get().length >= mediaUploader.maxPhotos) {
                return FileUploader.allowedExtensions.docs
            }
            else if (mediaUploader.uploadedDocuments.get().length >= mediaUploader.maxDocuments) {
                return FileUploader.allowedExtensions.images
            }
            else {
                return FileUploader.getAllExtensions();
            }
        }

        function allowImageUpload(mediaUploader, file) {
            return (FileUploader.fileNameIsImage(file.name)
            && mediaUploader.uploadedPhotos.get().length < mediaUploader.maxPhotos)
        }

        function allowDocumentUpload(mediaUploader, file) {
            return (FileUploader.fileNameIsDoc(file.name)
            && mediaUploader.uploadedDocuments.get().length < mediaUploader.maxDocuments);
        }

        function onFileChange(files, dropboxClient) {
            
            mediaUploader.uploadingDocuments.set(true);      
            
            files.forEach(function (file) {
                uploaded = mediaUploader.uploadedDocuments.get();
                file._id = new Meteor.Collection.ObjectID()._str; // Uploaded doc needs a new id
                console.log(file);
                uploaded.push(file);
                mediaUploader.uploadedDocuments.set(uploaded);
            }); 
            
            mediaUploader.uploadingDocuments.set(false);       
        }
    });
}
