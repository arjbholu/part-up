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

// Meteor.publish('images.many', function(partupId, imageIds) {
//     check(partupId, String);
//     check(imageIds, [String]);

//     const userId = Meteor.userId();
//     if (userId) {
//         const partup = Partups.findOne({ _id: partupId });

//         if (partup.hasSupporterOrUpper(userId)) {
//             this.unblock();
//             return Images.find({ _id: { $in: imageIds } });
//         }
//     }
//     return false;
// });