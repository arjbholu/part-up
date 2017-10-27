import tapi18nFormat from './tapi18n';

Tinytest.add('tapi18nFormat is not undefined after invoke', function (test) {
    test.isNotUndefined(tapi18nFormat());
});

Tinytest.add('tapi18nFormat has a transform function', function (test) {
    test.isNotUndefined(tapi18nFormat().transform);
});
