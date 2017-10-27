import './plogger';

Tinytest.add('plogger is initialized', function (test) {
    plogger.init('production');
    expect(plogger._initialized).to.equal(true);
});

Tinytest.add('plogger has functions for each level', function (test) {
    plogger.init('production');
    test.isNotUndefined(plogger.error);
    test.isNotUndefined(plogger.warn);
    test.isNotUndefined(plogger.info);
    test.isNotUndefined(plogger.success);
    test.isNotUndefined(plogger.debug);
});

