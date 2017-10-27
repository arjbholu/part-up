import Transport from 'winston-transport';
import { noop } from 'lodash';

class ConsoleTransport extends Transport {
    constructor(options = {}) {
        super(options);

        this._levels = options.levels;
        this._format = options.format;
    }

    log(info, callback = noop) {
        this.emit('logged', info);

        if (window && window.console) {
            if (this._levels && this._levels.includes(info.level)) {
                const log = this._format ? this._format.transform(info) : info;

                window.console[log.level] ?
                    window.console[log.level](info) :
                window.console.log(log);

                callback();
            }
        }
    }
}

export default ConsoleTransport;
