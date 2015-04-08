Partup.ui.socials = {

    /**
     * Generate a link to share a URL on Facebook
     *
     * @memberOf partup.ui
     * @param {String} urlToShare URL to be shared
     */
    generateFacebookShareUrl: function (urlToShare) {
        var base = "https://www.facebook.com/sharer/sharer.php";
        return base + "?s=100&p[url]=" + urlToShare;

        //TODO: use new facebook api
        //var appId = Meteor.settings.public.facebookAppId;
        //var domain = Meteor.absoluteUrl();
        //return 'https://www.facebook.com/v2.0/dialog/share?app_id=' + appId + '&display=popup&href=' + urlToShare + '&redirect_uri=' + domain + '/close';
    },

    /**
     * Generate a link to share a URL on Twitter
     *
     * @memberOf partup.ui
     * @param {String} messageToShare Message to be shared
     * @param {String} urlToShare URL to be shared
     */
    generateTwitterShareUrl: function (messageToShare, urlToShare) {
        return 'http://twitter.com/share?text=' + messageToShare + '&url=' + urlToShare + '&hashtags=part-up';
    },

    /**
     * Generate a link to share a URL on LinkedIn
     *
     * @memberOf partup.ui
     * @param {String} urlToShare URL to be shared
     */
    generateLinkedInShareUrl: function (urlToShare) {
        return 'https://www.linkedin.com/shareArticle?mini=true&url=' + urlToShare;
    }

};

