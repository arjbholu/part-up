/**
 @name partup.helpers.url
 @memberof Partup.helpers
 */
Partup.helpers.url = {
    stripWWW: function(url) {
        return url.replace(/^www\./gi, '');
    },
    stripHTTP: function(url) {
        return url.replace(/^.*?:\/\//gi, '');
    },
    capitalizeFirstLetter: function(string) {
        if (!string) return '';
        return string.charAt(0).toUpperCase() + string.slice(1);
    },
    getCleanUrl: function(url) {
        return this.capitalizeFirstLetter(this.stripWWW(this.stripHTTP(url)));
    },
    addHTTP: function(url) {
        if (!/^((http|https|ftp):\/\/)/.test(url)) {
            url = 'http://' + url;
        }
        return url;
    },
    getImageUrl: function(image, store) {
        store = store || '1200x520';
        var imageKey = lodash.get(image, 'copies[' + store + '].key');
        if (!imageKey) return undefined;

        // staging acceptance production aws image url
        return ['https://s3-',
            mout.object.get(Meteor, 'settings.public.aws.region'),
            '.amazonaws.com/',
            mout.object.get(Meteor, 'settings.public.aws.bucket'),
            '/',
            store,
            '/',
            imageKey
        ].join('');
    },

    /*
        supported formats are
        http://www.youtube.com/watch?v=0zM3nApSvMg&feature=feedrec_grec_index
        http://www.youtube.com/user/IngridMichaelsonVEVO#p/a/u/1/QdK8U-VIH_o
        http://www.youtube.com/v/0zM3nApSvMg?fs=1&amp;hl=en_US&amp;rel=0
        http://www.youtube.com/watch?v=0zM3nApSvMg#t=0m10s
        http://www.youtube.com/embed/0zM3nApSvMg?rel=0
        http://www.youtube.com/watch?v=0zM3nApSvMg
        http://youtu.be/0zM3nApSvMg
    */

    getYoutubeIdFromUrl: function(url) {
        var regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
        var match = url.match(regExp);
        if (match && match[2].length == 11) {
            return match[2];
        } else {
            return false;
        }
    },
    /*
        supported formats are
        http://vimeo.com/6701902
        http://vimeo.com/670190233
        http://player.vimeo.com/video/67019023
        http://player.vimeo.com/video/6701902
        http://player.vimeo.com/video/67019022?title=0&amp;byline=0&amp;portrait=0
        http://player.vimeo.com/video/6719022?title=0&amp;byline=0&amp;portrait=0
        http://vimeo.com/channels/vimeogirls/6701902
        http://vimeo.com/channels/vimeogirls/67019023
        http://vimeo.com/channels/staffpicks/67019026
        http://vimeo.com/15414122
        http://vimeo.com/channels/vimeogirls/66882931
    */

    getVimeoIdFromUrl: function(url) {
        var regExp = /(https?:\/\/)?(www\.)?(player\.)?vimeo\.com\/([a-z]*\/)*([0-9]{6,11})[?]?.*/;
        var match = url.match(regExp);
        if (match && match[5]) {
            return match[5];
        } else {
            return false;
        }
    },

    getFileUrl: function(fileGuid) {
        const guid = typeof fileGuid === 'string' ?
            fileGuid :
        fileGuid.guid || fileGuid.name;

        // staging acceptance production aws image url
        return ['https://s3-',
            mout.object.get(Meteor, 'settings.public.aws.region'),
            '.amazonaws.com/',
            mout.object.get(Meteor, 'settings.public.aws.bucket'),
            '/files/',
            guid,
        ].join('');
    },
};
