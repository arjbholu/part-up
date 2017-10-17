/**
 * Publish an image
 *
 * @param {String} networkId
 */
Meteor.publish('images.one', function(imageId) {
    check(imageId, String);

    this.unblock();

    return Images.find({_id: imageId}, {limit: 1});
});

Meteor.publish('images.many', function(partupId, imageIds) {
    check(partupId, String);
    check(imageIds, [String]);
    this.unblock();

    if (Meteor.user()) {
        return Images.find({ _id: { $in: imageIds } });
    }
    throw new Meteor.Error(0, 'unauthorized');
});
