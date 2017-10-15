Meteor.methods({
    /**
     * Insert a Message
     *
     * @param {string} partupId
     * @param {mixed[]} fields
     */
    'updates.messages.insert': function(partupId, fields) {
        check(partupId, String);
        console.log(fields);
        check(fields, Partup.schemas.forms.message);

        this.unblock();

        var upper = Meteor.user();
        if (!upper) throw new Meteor.Error(401, 'unauthorized');

        var partup = Partups.findOneOrFail(partupId);
        var newMessage = Partup.transformers.update.fromFormNewMessage(fields, upper, partup._id);
        newMessage.type = 'partups_message_added';

        try {
            newMessage._id = Updates.insert(newMessage);

            // Make user Supporter if it's not yet an Upper or Supporter of the Partup
            if (!partup.hasUpper(upper._id) && !partup.hasSupporter(upper._id)) {
                partup.makeSupporter(upper._id);

                Event.emit('partups.supporters.inserted', partup, upper);
            }

            Event.emit('partups.messages.insert', upper, partup, newMessage, fields.text);
            var mentionsWarning = Partup.helpers.mentions.exceedsLimit(fields.text);
            return {
                _id: newMessage._id,
                warning: mentionsWarning || undefined
            };
        } catch (error) {
            Log.error(error);
            throw new Meteor.Error(400, 'message_could_not_be_inserted');
        }
    },

    /**
     * Update a Message
     *
     * @param {string} updateId
     * @param {mixed[]} fields
     */
    'updates.messages.update': function(updateId, fields) {
        check(updateId, String);
        check(fields, Partup.schemas.forms.newMessage);

        this.unblock();

        const upper = Meteor.user();
        if (!upper) throw new Meteor.Error(401, 'unauthorized');

        try {
            const message = Updates.findOne({_id: updateId, upper_id: upper._id});
            if (message) {
                let hasUrl = fields.text.match(/[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/);
                hasUrl = hasUrl && hasUrl.length > 0 ? true : false;
                const hasDocuments = fields.documents && fields.documents.length > 0 ? true : false;

                // delete any removed files
                const newDocuments = lodash.get(fields, 'documents', []);
                const removeFiles = lodash.get(message, 'type_data.documents', [])
                    .filter(({_id}) => !lodash.find(newDocuments, {_id}))
                    .forEach(({_id}) => Partup.server.services.files.remove(_id));

                Updates.update({_id: message._id}, {$set: {
                    type_data: {
                        old_value: message.type_data.new_value,
                        new_value: fields.text,
                        images: fields.images,
                        documents: fields.documents
                    },
                    has_documents: hasDocuments,
                    has_links: hasUrl,
                    updated_at: new Date()
                }});
            }
        } catch (error) {
            Log.error(error);
            throw new Meteor.Error(400, 'partup_message_could_not_be_updated');
        }
    },

    /**
     * Remove a message
     *
     * @param {string} messageId
     */
    'updates.messages.remove': function(messageId) {
        check(messageId, String);

        this.unblock();

        var upper = Meteor.user();
        if (!upper) throw new Meteor.Error(401, 'unauthorized');

        try {
            var message = Updates.findOne({_id: messageId, upper_id: upper._id});
            if (message) {
                // Don't remove when message has comments
                if (message.comments && message.comments.length > 0) throw new Meteor.Error(400, 'partup_message_already_has_comments');

                // Check for attachments
                var files = message.type_data.files || [];
                if (files.length > 0) {
                    files.forEach(function(fileId) {
                        Partup.server.services.files.remove(fileId);
                    });
                }

                Updates.remove({_id: message._id});
            }
        } catch (error) {
            Log.error(error);
            throw new Meteor.Error(400, 'partup_message_could_not_be_removed');
        }
    }
});
