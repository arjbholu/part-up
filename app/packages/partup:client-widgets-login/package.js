Package.describe({
    name: 'partup:client-widgets-login',
    version: '0.0.1',
    summary: '',
    documentation: null
});

Package.onUse(function(api) {
    api.use([
        'tap:i18n'
    ], ['client', 'server']);

    api.use([
        'templating',
        'aldeed:autoform',
        'accounts-password',
        'partup:lib',
    ], 'client');

    api.addFiles([
        'package-tap.i18n',

        'WidgetLoginPlaceholders.js',
        'WidgetLogin.html',
        'WidgetLogin.js',

        'i18n/en.i18n.json',
        'i18n/nl.i18n.json'
    ], 'client');

    api.addFiles([
        'package-tap.i18n',
        'i18n/en.i18n.json',
        'i18n/nl.i18n.json'
    ], 'server');
});