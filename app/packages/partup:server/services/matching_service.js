/**
 @namespace Partup server matching service
 @name Partup.server.services.matching
 @memberof Partup.server.services
 */
Partup.server.services.matching = {
    /**
     * Match uppers for a given activity
     *
     * @param {String} activityId
     * @param {Object} searchOptions
     * @param {Number} searchOptions.locationId
     * @param {String} searchOptions.query
     *
     * @return {[String]}
     */
    matchUppersForActivity: function(activityId, searchOptions) {
        var activity = Activities.findOneOrFail(activityId);
        var partup = Partups.findOneOrFail(activity.partup_id);

        var selector = {};
        var options = {};
        var searchOptionsProvided = searchOptions.locationId || searchOptions.query;

        if (!searchOptionsProvided) {
            // Match the uppers on the tags used in the partup
            var tags = partup.tags || [];
            selector['profile.tags'] = {'$in': tags};
        }

        // Sort the uppers on participation_score
        options['sort'] = {'participation_score': -1};

        var results = Meteor.users.find(selector, options).fetch();

        // If there are no results, we remove some matching steps (only when no search options were provided)
        if (!searchOptionsProvided) {
            var iteration = 0;
            while (results.length === 0) {
                if (iteration === 0) delete selector['profile.tags'];

                results = Meteor.users.find(selector, options).fetch();
                iteration++;
            }
        }

        return results;
    },

    /**
     * Match uppers for a given network
     *
     * @param {String} networkId
     * @param {Object} searchOptions
     * @param {Number} searchOptions.locationId
     * @param {String} searchOptions.query
     *
     * @return {[String]}
     */
    matchUppersForNetwork: function(networkId, searchOptions) {
        var network = Networks.findOneOrFail(networkId);

        var selector = {};
        var options = {};
        var searchOptionsProvided = searchOptions.locationId || searchOptions.query;

        if (!searchOptionsProvided) {
            // Match the uppers on the tags used in the network
            var tags = network.tags || [];
            selector['profile.tags'] = {'$in': tags};
        }

        // Sort the uppers on participation_score
        options['sort'] = {'participation_score': -1};

        var results = Meteor.users.find(selector, options).fetch();

        // If there are no results, we remove some matching steps (only when no search options were provided)
        if (!searchOptionsProvided) {
            var iteration = 0;
            while (results.length === 0) {
                if (iteration === 0) delete selector['profile.tags'];

                results = Meteor.users.find(selector, options).fetch();
                iteration++;
            }
        }

        return results;
    }
};
