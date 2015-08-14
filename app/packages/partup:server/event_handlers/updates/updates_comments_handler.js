var d = Debug('event_handlers:updates_comments_handler');

/**
 * Generate a Notification for the upper for the first comment posted on a message/update
 */
Event.on('updates.comments.inserted', function(upper, partup, update, comment) {
    // Parse message for user mentions
    var mentions = Partup.helpers.mentions.extract(comment.content);
    mentions.forEach(function(user) {
        // Retrieve the user from the database (ensures that the user does indeed exists!)
        user = Meteor.users.findOne(user._id);
        if (partup.isViewableByUser(user._id)) {
            // Set the notification details
            var notificationOptions = {
                userId: user._id,
                type: 'partups_user_mentioned',
                typeData: {
                    mentioning_upper: {
                        _id: upper._id,
                        name: upper.profile.name,
                        image: upper.profile.image
                    },
                    update: {
                        _id: update._id
                    },
                    partup: {
                        _id: partup._id,
                        name: partup.name,
                        slug: partup.slug
                    }
                }
            };

            // Send the notification
            Partup.server.services.notifications.send(notificationOptions);

            // Compile the E-mail template and send the email
            SSR.compileTemplate('userMentionedInPartupEmail', Assets.getText('private/emails/UserMentionedInPartup.' + User(user).getLocale() + '.html'));
            var url = Meteor.absoluteUrl() + 'partups/' + partup.slug + '/updates/' + update._id;

            Email.send({
                from: Partup.constants.EMAIL_FROM,
                to: User(user).getEmail(),
                subject: 'Part-up mention in "' + partup.name + '"' ,
                html: SSR.render('userMentionedInPartupEmail', {
                    name: user.name,
                    mentioningUpper: upper.profile.name,
                    partupName: partup.name,
                    url: url
                })
            });
        }
    });

    // We only want to continue if the update currently has
    // no comments which means that it's the first comment
    var comments = update.comments || [];

    // We want to find out if the comment is the first one, but
    // we'll need to filter out the system messages and the
    // messages created by the creator of the update
    comments = comments.filter(function(comment) {
        return comment.type !== 'system' && comment.creator._id !== update.upper_id;
    });

    if (comments.length > 0) {
        d('Not the first comment, so not generating a notification for the owner of the update, length: ', comments.length);
        return;
    }

    // We are not going to generate a notification if the creator
    // of the message was the same as the creator of the update
    if (comment.creator._id === update.upper_id) {
        d('The creator of the comment is also the creator of the update, so we wont generate a notification.');
        return;
    }

    if (!update.system) {
        // Set the notification details
        var notificationOptions = {
            userId: update.upper_id,
            type: 'updates_first_comment',
            typeData: {
                commenter: {
                    _id: comment.creator._id,
                    name: comment.creator.name,
                    image: comment.creator.image
                },
                partup: {
                    _id: partup._id,
                    name: partup.name,
                    slug: partup.slug
                }
            }
        };

        // Send the notification
        Partup.server.services.notifications.send(notificationOptions);
    }
});
