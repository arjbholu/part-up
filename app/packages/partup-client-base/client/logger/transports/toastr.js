import Transport from 'winston-transport';
import { noop } from 'lodash';

class ToastrTransport extends Transport {
    constructor(options = {}) {
        super(options);

        this._levels = options.levels;
        this._format = options.format;
    }

    log(info, callback = noop) {
        this.emit('logged', info);

        if (window && toastr) {
            const log = this._format ? this._format.transform(info) : info;
            const toast = toastr[log.level];

            if (toast) {
                if (this._levels) {
                    if (this._levels.includes(log.level)) {
                        toast(log.message);
                        callback();
                    }
                } else {
                    toast(log.message);
                    callback();
                }
            }
        }
    }
}

export default ToastrTransport;
