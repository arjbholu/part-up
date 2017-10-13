/**
 * Partup new message template
 */

Template.newMessage.onCreated(function () {
    const template = this;
    const isExistingUpdate = this.data instanceof Update;

    this.partupId = isExistingUpdate ?
        this.data.partup_id :
    this.data.partupId;

    this.update = isExistingUpdate ?
        this.data :
    new Update();

    this.state = {
        submitting: new ReactiveVar(false),
    };

    this.fileController = new FileController({
        images: 4,
        documents: 2,
    });

    if (isExistingUpdate) {
        const images = this.update.type_data.images;
        if (images) {
            _.each(images, image => {
                template.subscribe('images.one', image._id, {
                    onReady() {
                        const img = Images.findOne({ _id: image._id });
                        template.fileController.images.set(_.concat(template.fileController.images.get(), img));
                    },
                });
            });
        }
        const documents = this.update.type_data.documents;
        if (documents) {
            template.fileController.documents.set(_.concat(template.fileController.documents.get(), documents));
        }
    }

    this.destroy = () => {
        if (this.mentionsInput) {
            this.mentionsInput.destroy();
        }
    };
});

Template.newMessage.onDestroyed(function () {
    this.destroy();
});

Template.newMessage.helpers({
    form() {
        const self = this;
        return {
            id() {
                return self._id ? 'editMessageForm' : 'newMessageForm';
            },
            schema() {
                return Partup.schemas.forms.newMessage;
            },
            doc() {
                if (self._id) {
                    return {
                        text: self.type_data.new_value,
                        images: self.type_data.images || [],
                        documents: self.type_data.documents || [],
                    };
                }
                return undefined;
            },
        };
    },
    fileController() {
        return Template.instance().fileController;
    },
});

Template.newMessage.events({
    'click [data-dismiss]'(event, templateInstance) {
        templateInstance.destroy();
    },
});

/**
 * Runs when an 'afFieldInput' get's rendered.
 */
Template.afFieldInput.onRendered(function () {
    // We only want to respond if it's the message input;
    if (!this.data.hasOwnProperty('data-message-input')) {
        return undefined;
    }

    const parentTemplate = this.parent();
    const currentValue = parentTemplate.data._id ?
        parentTemplate.data.message :
    undefined;

    if (parentTemplate.mentionsInput) {
        parentTemplate.mentionsInput.destroy();
    }

    const input = parentTemplate.find('[data-message-input]');
    parentTemplate.mentionsInput = Partup.client.forms.MentionsInput(input, {
        partupId: parentTemplate.partupId,
        autoFocus: true,
        autoAjustHeight: true,
        prefillValue: currentValue,
    });

    return true;
});

AutoForm.hooks({
    newMessageForm: {
        onSubmit(insertDoc) {
            const self = this;
            const newMessageTemplate = Template.instance().parent();

            newMessageTemplate.state.submitting.set(true);

            const message = Object.assign({
                text: newMessageTemplate.mentionsInput.getValue(),
                images: _.map(newMessageTemplate.fileController.images.get(), img => img._id),
                documents: newMessageTemplate.fileController.documents.get(),
            }, insertDoc);

            // Close popup before call, why? people lose their message if it fails..
            Partup.client.popup.close();
            Partup.client.updates.setWaitForUpdate(true);

            Meteor.call('updates.messages.insert', newMessageTemplate.partupId, message, function(error, result) {
                newMessageTemplate.state.submitting.set(false);
                Partup.client.updates.setWaitForUpdate(false);

                if (error) {
                    Partup.client.notify.error(error.reason);
                    self.done(new Error(error.message));
                    return;
                }

                Partup.client.updates.addUpdateToUpdatesCausedByCurrentUser(result._id);
                if (result.warning) {
                    Partup.client.notify.warning(TAPi18n.__(`warning-${result.warning}`));
                }

                analytics.track('new message created', {
                    partupId: newMessageTemplate.partupId,
                });

                try {
                    AutoForm.resetForm('newMessageForm');
                } catch (err) {}

                newMessageTemplate.mentionsInput.reset();
                newMessageTemplate.fileController.reset();
                self.done();
                Partup.client.events.emit('partup:updates:message_added');
            });

            return false;
        },
    },
    editMessageForm: {
        onSubmit(insertDoc) {
            const self = this;
            const newMessageTemplate = Template.instance().parent();

            newMessageTemplate.state.submitting.set(true);

            const message = Object.assign({
                text: newMessageTemplate.mentionsInput.getValue(),
                images: _.map(newMessageTemplate.fileController.images.get(), img => img._id),
                documents: newMessageTemplate.fileController.documents.get(),
            }, insertDoc);

            Partup.client.popup.close();

            Meteor.call('updates.messages.update', newMessageTemplate.update._id, message, function(error, result) {
                newMessageTemplate.state.submitting.set(false);

                if (error) {
                    Partup.client.notify.error(error.reason);
                    self.done(new Error(error.message));
                    return;
                }

                try {
                    AutoForm.resetForm('editMessageForm');
                } catch (err) {}

                newMessageTemplate.mentionsInput.reset();
                newMessageTemplate.fileController.reset();
                self.done();
            });

            return false;
        },
    },
});
