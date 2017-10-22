import {strings} from 'meteor/partup-client-base';


Template.update_partups_message_added.helpers({
    messageContent: function () {
        var self = this;
        var rawNewValue = self.type_data.new_value;
        return strings.renderToMarkdownWithEmoji(rawNewValue);
    },

    hasNoComments: function () {
        if (this.comments) {
            return this.comments.length <= 0;
        } else {
            return true;
        }
    },
    editMessagePopupId: function () {
        return 'edit-message-' + this._id;
    },
    areDocumentIds(documents) {
        return (documents || []).filter(doc => typeof doc === 'string');
    },
});
