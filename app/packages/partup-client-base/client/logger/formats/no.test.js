import noFormat from './no';

Tinytest.add('noFormat is not undefined', function (test) {
    test.isNotUndefined(noFormat());
});

Tinytest.add('noFormat will return the result as is', function() {
    const sut = {
        level: 'info',
        message: 'infomsg',
    };

    expect(sut).to.equal(noFormat().transform(sut));
});
