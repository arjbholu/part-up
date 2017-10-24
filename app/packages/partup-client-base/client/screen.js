import { throttle, debounce } from 'lodash';
/**
 * Reactive screen size source
 *
 * @class screen
 * @memberof Partup.client
 */

Partup.client.screen = {
    _initialized: false,

    init() {
        if (!window || this._initialized) return;
        const updateSize = throttle(this.triggerUpdate, 16);

        window.addEventListener('resize', updateSize);
        window.addEventListener('orientationchange', updateSize);
        Meteor.defer(this.triggerUpdate);

        this._initialized = true;
    },

    /**
     * Current size reactive dict
     *
     * @memberof Partup.client.screen
     */
    size: new ReactiveDict(),

    /**
     * Trigger a size update
     *
     * @memberof Partup.client.screen
     */
    triggerUpdate() {
        Partup.client.screen.size.set('width', window.innerWidth);
        Partup.client.screen.size.set('height', window.innerHeight);
    },
};

Partup.client.screen.init();
