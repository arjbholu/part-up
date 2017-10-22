Package.describe({
    name: 'partup-client-update',
    version: '0.0.1',
    summary: '',
    documentation: null
});

Package.onUse(function(api) {

    api.use([
        'ecmascript',
        'templating',
        'partup-lib',
        'tracker',
        'reactive-dict',
        'aldeed:autoform',
        'partup-client-files',
    ], 'client');

    api.addFiles([

        'Update.html',
        'Update.js',

        'types/budget-changed.html',
        'types/budget-changed.js',
        'types/description-changed.html',
        'types/description-changed.js',
        'types/end-date-changed.html',
        'types/end-date-changed.js',
        'types/image-changed.html',
        'types/image-changed.js',
        'types/invited.html',
        'types/invited.js',
        'types/location-changed.html',
        'types/location-changed.js',
        'types/message-added.html',
        'types/message-added.js',
        'types/name-changed.html',
        'types/name-changed.js',
        'types/tags-added.html',
        'types/tags-added.js',
        'types/tags-changed.html',
        'types/tags-changed.js',
        'types/tags-removed.html',
        'types/tags-removed.js',
        'types/archived.html',
        'types/archived.js',
        'types/unarchived.html',
        'types/unarchived.js',
        'types/partner-request.html',
        'types/partner-request.js'
    ], 'client');

});
