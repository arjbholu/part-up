Package.describe({
    name: 'partup-client-files',
    version: '0.0.1',
    summary: 'All ui related code to deal with files',
    documentation: null,
});

Package.onUse(function (api) {
    api.use([
        'meteorhacks:subs-manager',
    ], ['client', 'server']);

    api.use([
        'ecmascript',
        'templating',
        'reactive-var',
        'aldeed:autoform',
        'partup-lib',
    ], 'client');

    api.addFiles([
        'file-controller.js',

        'pickers/device-picker/device-picker.html',
        'pickers/device-picker/device-picker.js',
        'pickers/dropbox-picker/dropbox-picker.html',
        'pickers/dropbox-picker/dropbox-picker.js',
        'pickers/drive-picker/drive-picker.html',
        'pickers/drive-picker/drive-picker.js',

        'renderers/document-renderer/document-renderer.html',
        'renderers/document-renderer/document-renderer.js',

        'widgets/file-picker/file-picker.html',
        'widgets/file-picker/file-picker.js',
    ], 'client');

    api.export([
        'FileController',
    ]);
});
