import Enum from 'enum';

/**
 * Template helpers for screen sizes
 */

/**
 * screen helper to use locally
 * @ignore
 */
const screenHelper = {
    breakpoints: new Enum({
        small: 500,
        medium_portrait: 600,
        medium_landscape: 900,
        large: 1200,
        extra_large: 1800,
    }),
    extractValue(templateInput) {
        return this.isNumber(Number(templateInput)) ?
            Number(templateInput) :
            this.breakpoints.get(templateInput).value;
    },
    checkExpression(expressionFunc, ...args) {
        _.each(args, (i) => {
            if (!this.isNumber(i)) {
                throw new Error('input is not a number or enum value');
            }
        });
        return expressionFunc();
    },
    isNumber(templateInput) {
        return typeof templateInput === 'number';
    },
};

/**
 * Template helpers
 */

/**
 * Check if the screen width is above the given value
 * @name screenWidthEqualOrBelow
 * @param size Enum see number or breakpoint value
 * @return Boolean true if the @param size is equal or higher than the screen size
 */
Template.registerHelper('screenWidthEqualOrBelow', function (size) {
    const screenSize = Partup.client.screen.size.get('width');

    const input = screenHelper.extractValue(size);
    return screenHelper.checkExpression(() => screenSize <= input, input);
});

/**
 * Check if the screen width is above the given value
 * @name screenWidthEqualOrAbove
 * @param size Enum number or breakpoint value
 * @return Boolean true if the @param size is equal or less than the screen size
 */
Template.registerHelper('screenWidthEqualOrAbove', function (size) {
    const screenSize = Partup.client.screen.size.get('width');

    const input = screenHelper.extractValue(size);
    const e = screenHelper.checkExpression(() => screenSize >= input, input);
    return e;
});

/**
 * Check if the screen width is above the given value
 * @name inRange
 * @param min number
 * @param max number
 * @return Boolean true if the screen sie is in range of @param min and @param max
 */
Template.registerHelper('inRange', function (min, max) {
    const screenSize = Partup.client.screen.size.get('width');

    const minVal = screenHelper.extractValue(min);
    const maxVal = screenHelper.extractValue(max);
    return screenHelper.checkExpression(() => screenSize >= minVal && screenSize <= maxVal, minVal, maxVal);
});

//////////
// LEGACY
//////////
var mobile = 320;
var phablet = 500;
var tablet = 768;
var desktop = 992;

Template.registerHelper('screenSize', function(sizeName) {
    var size = Partup.client.screen.size.get('width');
    var name = 'mobile';
    if (size >= tablet && size < desktop) {
        name = 'tablet';
    } else if (size >= desktop) {
        name = 'desktop';
    }

    return sizeName === name;
});

Template.registerHelper('screenSizeIsMaximumWidth', function(sizeName) {
    var size = Partup.client.screen.size.get('width');

    if (sizeName === 'desktop' && size <= desktop) return true;
    if (sizeName === 'tablet' && size <= tablet) return true;
    if (sizeName === 'phablet' && size <= phablet) return true;
    if (sizeName === 'mobile' && size <= mobile) return true;

    return false;
});

Template.registerHelper('screenSizeIsMinimalWidth', function(sizeName) {
    var size = Partup.client.screen.size.get('width');

    if (sizeName === 'mobile' && size >= mobile) return true;
    if (sizeName === 'phablet' && size >= phablet) return true;
    if (sizeName === 'tablet' && size >= tablet) return true;
    if (sizeName === 'desktop' && size >= desktop) return true;

    return false;
});
