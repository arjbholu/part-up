/**
 * Images are entities stored under each object that contains one or more images
 *
 * @namespace Images
 * @memberOf Collection
 */
Images = new Meteor.Collection('cfs.images.filerecord'); // Collection name is for backwards compatibility

/**
 * Find the images for a partup
 *
 * @memberOf Images
 * @param {Partup} partup
 * @return {Mongo.Cursor}
 */
Images.findForPartup = function(partup) {
    return Images.find({_id: partup.image}, {limit: 1});
};

/**
 * Find the images for a user
 *
 * @memberOf Images
 * @param {User} user
 * @return {Mongo.Cursor}
 */
Images.findForUser = function(user) {
    return Images.find({_id: user.profile.image}, {limit: 1});
};

/**
 * Find the images for a network
 *
 * @memberOf Images
 * @param {Network} network
 * @return {Mongo.Cursor}
 */
Images.findForNetwork = function(network) {
    return Images.find({_id: {'$in': [network.background_image, network.image, network.icon, lodash.get(network, 'content.video_placeholder_image')]}}, {limit: 4});
};

/**
 * Find the images for a notification
 *
 * @memberOf Images
 * @param {Notification} notification
 * @return {Mongo.Cursor}
 */
Images.findForNotification = function(notification) {
    var images = [];

    switch (notification.type) {
        case 'partups_messages_inserted': images = [get(notification, 'type_data.creator.image')]; break;
        case 'partups_activities_inserted': images = [get(notification, 'type_data.creator.image')]; break;
        case 'partups_contributions_inserted': images = [get(notification, 'type_data.creator.image')]; break;
        case 'partups_contributions_proposed': images = [get(notification, 'type_data.creator.image')]; break;
        case 'partups_networks_accepted': images = [get(notification, 'type_data.creator.image')]; break;
        case 'partups_networks_invited': images = [get(notification, 'type_data.inviter.image')]; break;
        case 'partups_networks_new_pending_upper': images = [get(notification, 'type_data.pending_upper.image')]; break;
        case 'partups_supporters_added': images = [get(notification, 'type_data.supporter.image')]; break;
        case 'partup_activities_invited': images = [get(notification, 'type_data.inviter.image')]; break;
        case 'invite_upper_to_partup': images = [get(notification, 'type_data.inviter.image')]; break;
        case 'partups_contributions_accepted': images = [get(notification, 'type_data.accepter.image')]; break;
        case 'partups_contributions_rejected': images = [get(notification, 'type_data.rejecter.image')]; break;
        case 'partups_user_mentioned': images = [get(notification, 'type_data.mentioning_upper.image')]; break;
        case 'contributions_ratings_inserted': images = [get(notification, 'type_data.rater.image')]; break;
        case 'partups_new_comment_in_involved_conversation': images = [get(notification, 'type_data.commenter.image')]; break;
        case 'partups_networks_new_upper': images = [get(notification, 'type_data.upper.image')]; break;
        case 'partups_networks_upper_left': images = [get(notification, 'type_data.upper.image')]; break;
        case 'multiple_comments_in_conversation_since_visit': images = [get(notification, 'type_data.latest_upper.image')]; break;
        case 'partups_multiple_updates_since_visit': images = [get(notification, 'type_data.latest_upper.image')]; break;
        case 'networks_multiple_new_uppers_since_visit': images = [get(notification, 'type_data.network.image')]; break;
        case 'partup_created_in_network': images = [get(notification, 'type_data.creator.image')]; break;
        case 'partups_partner_request': images = [get(notification, 'type_data.requester.image')]; break;
        case 'partups_partner_accepted': images = [get(notification, 'type_data.accepter.image')]; break;
        case 'partups_partner_rejected': images = [get(notification, 'type_data.rejecter.image')]; break;
        default: return;
    }

    return Images.find({_id: {'$in': images}});
};

/**
 * Find images for an update
 *
 * @memberOf Images
 * @param {Update} update
 * @return {Mongo.Cursor}
 */
Images.findForUpdate = function(update) {
    var images = [];

    switch (update.type) {
        case 'partups_image_changed': images = [update.type_data.old_image, update.type_data.new_image]; break;
        case 'partups_message_added': images = update.type_data.images || []; break;
        default: return;
    }

    return Images.find({_id: {'$in': images}});
};

Images.getForUpdate = function (update) {
    return new Promise((resolve, reject) => {
        let images = [];

        if (update && update.type_data) {
            let imageIds;

            switch (update.type) {
                case 'partups_image_changed':
                    imageIds = [update.type_data.old_image, update.type_data.new_image];
                    break;
                case 'partups_message_added':
                    imageIds = update.type_data.images;
                    break;
                default:
                    break;
            }

            if (imageIds) {
                images = Images.find({ _id: { $in: imageIds } });
                if (!images) {
                    reject();
                }
            }
        }

        resolve(images);
    });
};

/**
 * Find images for the comments in an update
 *
 * @memberOf Images
 * @param {Update} update
 * @return {Mongo.Cursor}
 */
Images.findForUpdateComments = function(update) {
    update = update || {};

    var imageIds = (update.comments || []).map(function(comment) {
        return comment.creator.image;
    });

    return Images.find({_id: {'$in': imageIds}});
};

Images.findForTile = function(tile) {
    return Images.find({_id: tile.image_id}, {limit: 1});
};

Images.findForSwarm = function(swarm) {
    return Images.find({_id: swarm.image}, {limit: 1});
};

Images.findForContentBlock = function(contentBlock) {
    return Images.find({_id: contentBlock.image});
};

Images.findForCursors = function(cursors, options) {
    var imageIds = cursors.map(function(obj) {
        var documents = obj.cursor.fetch();
        return documents.map(function(item) {
            return lodash.get(item, obj.imageKey);
        });
    }).reduce(function(accumilator, curr) {
        return accumilator.concat(curr);
    }, []).filter(function(item) {
        return !!item;
    });
    return Images.find({_id: { $in: imageIds}}, options)
};

Images.allow({
    insert: function(userId, document) {
        return !!userId;
    }
});

