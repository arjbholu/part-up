/**
 * Publish a file
 *
 * @param {String} fileId
 */
Meteor.publish('files.one', function(fileId) {
    check(fileId, String);

    this.unblock();

    return Files.find({_id: fileId}, {limit: 1});
});

Meteor.publish('files.many', function(partupId, fileIds) {
    check(partupId, String);
    check(fileIds, [String]);
    this.unblock();

    if (Meteor.user()) {
        return Files.find({ _id: { $in: fileIds } });
    }
    return false;
});
