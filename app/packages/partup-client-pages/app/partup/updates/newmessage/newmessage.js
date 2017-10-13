import { FileUploader } from 'meteor/partup-lib';
import { MediaUploader } from 'meteor/partup-client-media-uploader-button';

let mediaUploader;

Template.app_partup_updates_newmessage.onCreated(function () {
    var template = this;

    console.log('tpl data: ', this.data);
    if (this.data instanceof Update) {
        console.log('we have an update!');
    }

    template.partupId = this.data.partup_id || this.data.partupId;
    var images = this.data._id ? this.data.type_data.images : [];
    var documents = this.data._id && this.data.type_data.documents ? this.data.type_data.documents : [];

    mediaUploader = new MediaUploader(template, images, documents, {
        maxPhotos: 4, maxDocuments: 2
    });

});

Template.afFieldInput.onRendered(function () {
    // makes sure it only goes on if it's a mentions input
    if (!this.data.hasOwnProperty('data-message-input')) return;

    // comment template
    var template = this.parent();
    var currentValue = template.data._id ? template.data.type_data.new_value : undefined;

    // destroy other edit mentionsinputs to prevent conflicts
    if (template.mentionsInput) template.mentionsInput.destroy();

    var input = template.find('[data-message-input]');
    template.mentionsInput = Partup.client.forms.MentionsInput(input, {
        partupId: template.partupId,
        autoFocus: true,
        autoAjustHeight: true,
        prefillValue: currentValue
    });
});

Template.app_partup_updates_newmessage.onDestroyed(function () {
    var tpl = this;
    if (tpl.mentionsInput) tpl.mentionsInput.destroy();
});

// helpers
Template.app_partup_updates_newmessage.helpers({
    mediaUploader: function () { return mediaUploader; },
    formSchema: Partup.schemas.forms.newMessage,
    placeholders: {
        'text': function () {
            return TAPi18n.__('pages-app-partup-updates-newmessage-placeholder');
        }
    },
    uploadedPhotos: function () {
        return mediaUploader.uploadedPhotos.get();
    },
    uploadedDocuments: function () {
        return mediaUploader.uploadedDocuments.get();
    },
    hasUploadedMedia: function () {
        return (
            mediaUploader.uploadedPhotos.get().length ||
            mediaUploader.uploadedDocuments.get().length
        )
    },
    imagesLeft: function() {
      return  mediaUploader.maxPhotos - mediaUploader.uploadedPhotos.get().length;
    },
    documentsLeft: function() {
        return  mediaUploader.maxDocuments - mediaUploader.uploadedDocuments.get().length;
    },
    submitting: function () {
        return Template.instance().submitting.get();
    },
    state: function () {
        var self = this;
        var template = Template.instance();
        return {
            edit: function () {
                return self._id ? true : false;
            },
            formId: function () {
                return self._id ? 'editMessageForm' : 'newMessageForm';
            }
        };
    },
    formDoc: function () {
        if (!this._id) return;
        return {
            text: this.type_data.new_value,
            images: this.type_data.images || [],
            documents: this.type_data.documents || []
        };
    },
    getSvgIcon: FileUploader.getSvgIcon
});

// events
Template.app_partup_updates_newmessage.events({
    'click [data-dismiss]': function clearForm(event, template) {
        mediaUploader.uploadedPhotos.set([]);
        mediaUploader.uploadedDocuments.set([]);
    },
    'click [data-type="image"][data-remove-upload]': function removeUpload(event, template) {
        var imageId = $(event.currentTarget).data('remove-upload');
        // mediaUploader.uploadedPhotos.set([]);
        var uploadedPhotos = mediaUploader.uploadedPhotos.get();
        mout.array.remove(uploadedPhotos, imageId);
        mediaUploader.uploadedPhotos.set(uploadedPhotos);
        var total = mediaUploader.totalPhotos.get();
        total--;
        mediaUploader.totalPhotos.set(total);
    },
    'click [data-type="document"][data-remove-upload]': function removeUpload(event, template) {
        var documentId = $(event.currentTarget).data('remove-upload');
        var uploadedDocuments = mediaUploader.uploadedDocuments.get();
        uploadedDocuments = _.without(uploadedDocuments, _.findWhere(uploadedDocuments, {_id: documentId}));
        mediaUploader.uploadedDocuments.set(uploadedDocuments);
        var total = mediaUploader.totalDocuments.get();
        total--;
        mediaUploader.totalDocuments.set(total);
    }
});

/*************************************************************/
/* Widget form hooks */
/*************************************************************/
AutoForm.hooks({
    editMessageForm: {
        onSubmit: function (insertDoc, updateDoc, currentDoc) {
            var self = this;
            var parent = Template.instance().parent();
            var template = self.template.parent();

            parent.submitting.set(true);

            var updateId = parent.data._id;

            insertDoc.images = mediaUploader.uploadedPhotos.get();
            insertDoc.text = parent.mentionsInput.getValue();

            insertDoc.documents = mediaUploader.uploadedDocuments.get();

            console.log(insertDoc);

            // close popup before call is made, an error notifier
            // will be the feedback when it fails
            Partup.client.popup.close();

            Meteor.call('updates.messages.update', updateId, insertDoc, function (error, result) {
                parent.submitting.set(false);

                // Error
                if (error) {
                    Partup.client.notify.error(error.reason);
                    self.done(new Error(error.message));
                    return;
                }

                try {
                    AutoForm.resetForm('editMessageForm');
                } catch (err) {
                }
                template.mentionsInput.reset();
                self.done();
                parent.uploadedPhotos.set([]);
                parent.uploadedDocuments.set([]);
            });

            return false;
        }
    },
    newMessageForm: {
        onSubmit: function (insertDoc, updateDoc, currentDoc) {
            var self = this;
            var parent = Template.instance().parent();
            var template = self.template.parent();

            parent.submitting.set(true);

            var partupId = parent.data.partupId;
            insertDoc.images = parent.uploadedPhotos.get();
            insertDoc.text = parent.mentionsInput.getValue();

            insertDoc.documents = parent.uploadedDocuments.get();

            console.log(insertDoc);

            // close popup before call is made, an error notifier
            // will be the feedback when it fails
            Partup.client.popup.close();
            Partup.client.updates.setWaitForUpdate(true);

            Meteor.call('updates.messages.insert', partupId, insertDoc, function (error, result) {
                parent.submitting.set(false);
                Partup.client.updates.setWaitForUpdate(false);

                // Error
                if (error) {
                    Partup.client.notify.error(error.reason);
                    self.done(new Error(error.message));

                    return;
                }
                Partup.client.updates.addUpdateToUpdatesCausedByCurrentuser(result._id);
                if (result.warning) {
                    Partup.client.notify.warning(TAPi18n.__('warning-' + result.warning));
                }

                // Success
                analytics.track('new message created', {
                    partupId: partupId
                });
                try {
                    AutoForm.resetForm('newMessageForm');
                } catch (err) {
                }
                template.mentionsInput.reset();
                self.done();
                mediaUploader.uploadedPhotos.set([]);
                mediaUploader.uploadedDocuments.set([]);
                Partup.client.events.emit('partup:updates:message_added');
            });

            return false;
        }
    }
});
