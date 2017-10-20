import _ from 'lodash';

/**
 * Partup messageForm template, can create and edit messages
 *
 * Requires one of the following params:
 * @param {String} partupId[optional] partupId
 * @param {Object} update[optional] dataContext
 *
 * @member {FileController} fileController a filecontroller instance
 * @member {ReactiveVar} isSubmitting a handler for submitting state
 */
Template.messageForm.onCreated(function () {
    const template = this;

    this.isExistingUpdate = this.data instanceof Update;

    this.partupId = this.isExistingUpdate ?
        this.data.partup_id :
    this.data.partupId;

    this.fileController = new FileController({
        limit: {
            images: 4,
            documents: 2,
        },
        multi_select: '*',
        categories: undefined,
    });

    this.update = this.isExistingUpdate ?
        this.data :
    new Update();
    
    if (this.isExistingUpdate) {
        const { type_data } = this.update;
        const { images, documents } = type_data;
        
        if (documents && documents.length) {
            this.subscribe('files.many', this.partupId, documents, {
                onReady() {
                    Files.getForUpdate(template.update)
                        .then(fileData => template.fileController.addFilesToCache(fileData.fetch()))
                        .catch(error => TAPi18n.__(`pu-error-files-${error.code}`));
                },
            });
        }
        if (images && images.length) {
            this.subscribe('images.many', this.partupId, images, {
                onReady() {
                    Images.getForUpdate(template.update)
                        .then(imageData => template.fileController.addFilesToCache(imageData.fetch()))
                        .catch(error => TAPi18n.__(`pu-error-files-${error.code}`));
                },
            });
        }
    }

    const state = {
        submitting: new ReactiveVar(false),
    };

    this.isSubmitting = function(val = undefined) {
        if (val !== undefined) {
            state.submitting.set(val);
        }
        return state.submitting.get();
    };

    this.reset = () => {
        if (this.mentionsInput) {
            this.mentionsInput.reset();
        }
        if (this.fileController) {
            this.fileController.reset();
        }
        this.isSubmitting(false);
    };

    this.destroy = () => {
        if (this.mentionsInput) {
            this.mentionsInput.destroy();
        }
        if (this.fileController) {
            this.fileController.destroy();
        }
    };
});

Template.messageForm.onRendered(function () {

    const removeFiles = () => {
        const { typeData } = template.update;
        
        if (typeData) {
            template.fileController.removeAllFilesBesides(_.concat(typeData.images, typeData.documents));
        } else {
            template.fileController.removeAllFilesBesides();
        }

        $('[data-dismiss]').on('click', removeFiles);
        this.destroy();
    };
    
    // Handled here because this template can't access the popup's close button via the ({events}).
    $('[data-dismiss]').on('click', removeFiles);
});

Template.messageForm.onDestroyed(function () {
    this.destroy();
});

Template.messageForm.helpers({
    form() {
        const template = Template.instance();
        return {
            id() {
                return template.update._id ? 'editMessageForm' : 'newMessageForm';
            },
            schema() {
                return Partup.schemas.forms.message;
            },
            doc() {
                return template.update._id ? {
                    text: template.update.type_data.new_value,
                    images: template.update.type_data.images || [],
                    documents: template.update.type_data.documents || [],
                } :
                undefined;
            },
        };
    },
    fileController() {
        return Template.instance().fileController;
    },
    isSubmitting() {
        return Template.instance().isSubmitting();
    },
    isExistingUpdate() {
        return Template.instance().isExistingUpdate;
    },
});

/**
 * Runs when an 'afFieldInput' get's rendered.
 */
Template.afFieldInput.onRendered(function () {
    // We only want to respond if it's the message input;
    if (this.data.hasOwnProperty('data-message-input')) {
        const messageForm = this.parent();
        const input = messageForm.find('[data-message-input]');

        if (messageForm.mentionsInput) {
            messageForm.mentionsInput.destroy();
        }

        messageForm.mentionsInput = Partup.client.forms.MentionsInput(input, {
            partupId: messageForm.partupId,
            autoFocus: true,
            autoAjustHeight: true,
            prefillValue: messageForm.data._id ? messageForm.update.type_data.new_value : undefined,
        });
    }
    return false;
});


AutoForm.hooks({
    newMessageForm: {
        onSubmit(insertDoc) {
            const self = this;
            const messageForm = Template.instance().parent();
            messageForm.isSubmitting(true);
            Partup.client.updates.setWaitForUpdate(true);

            const formData = _.assignIn(insertDoc, {
                text: messageForm.mentionsInput.getValue(),
                images: [],
                documents: [],
            });

            _.each(messageForm.fileController.files.get(), (file) => {
                if (Partup.helpers.files.isImage(file)) {
                    formData.images.push(file._id);
                } else {
                    formData.documents.push(file._id);
                }
            });

            Meteor.call('updates.messages.insert', messageForm.partupId, formData, function(error, result) {
                Partup.client.updates.setWaitForUpdate(false);
                
                if (error) {
                    Partup.client.notify.error(error.reason);
                    self.done(new Error(error.message));
                    return;
                }
                
                Partup.client.popup.close();
                messageForm.reset();
                
                Partup.client.updates.addUpdateToUpdatesCausedByCurrentuser(result._id);

                if (result.warning) {
                    Partup.client.notify.warning(TAPi18n.__(`warning-${result.warning}`));
                }
                
                analytics.track('new message created', {
                    partupId: messageForm.partupId,
                });
                
                try {
                    AutoForm.resetForm('newMessageForm');
                } catch (err) {}
                
                self.done();
                Partup.client.events.emit('partup:updates:message_added');
            });

            return false;
        },
    },
    editMessageForm: {
        onSubmit(insertDoc) {
            const self = this;
            const messageForm = Template.instance().parent();

            messageForm.isSubmitting(true);

            const formData = _.assignIn(insertDoc, {
                text: messageForm.mentionsInput.getValue(),
                images: [],
                documents: [],
            });

            _.each(messageForm.fileController.files.get(), (file) => {
                if (Partup.helpers.files.isImage(file)) {
                    formData.images.push(file._id);
                } else {
                    formData.documents.push(file._id);
                }
            });

            Meteor.call('updates.messages.update', messageForm.update._id, formData, function(error) {
                Partup.client.popup.close();
                messageForm.reset();
                
                if (error) {
                    Partup.client.popup.close();
                    Partup.client.notify.error(error.reason);
                    self.done(new Error(error.message));
                    return;
                }

                try {
                    AutoForm.resetForm('editMessageForm');
                } catch (err) { }

                self.done();
            });

            return false;
        },
    },
});
