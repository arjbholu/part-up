import winston from 'winston';

import noFormat from './formats/no';
import tapi18nFormat from './formats/tapi18n';
import ConsoleTransport from './transports/console';
import ToastrTransport from './transports/toastr';

// Initialize 'Partup' for tests
if (!Partup || !Partup.client) {
    Partup = {
        client: {},
    };
}

plogger = {
    init(env) {
        if (this._initialized) {
            return;
        }

        const levels = {
            error: 0,
            warn: 1,
            info: 2,
            success: 3,
            debug: 4,
        };

        const logger = winston.loggers.add('partup');

        if (env === 'production') {
            logger.configure({
                levels,
                level: 'success',
                format: tapi18nFormat(),
                transports: [
                    new ToastrTransport(),
                ],
                exitOnError: false,
            });
        } else {
            logger.configure({
                levels,
                level: 'debug',
                format: noFormat(), // override default format that only works on the node server (uses Buffer)
                transports: [
                    new ToastrTransport({
                        levels: ['warn', 'info', 'success'],
                        format: tapi18nFormat(),
                    }),
                    new ConsoleTransport({
                        levels: ['error', 'debug'],
                    }),
                ],
                exitOnError: false,
            });
        }

        Object.keys(levels).forEach((level) => {
            this[level] = (...args) => {
                const logr = winston.loggers.get('partup');
                if (args.length === 1) {
                    logr[level](...args);
                } else if (args.length > 1) {
                    const log = {
                        message: args[0],
                        args: Object.assign({}, ...args.slice(1, 2)),
                    };
                    logr[level](log);
                }
            };
        });

        // // TODO, implement the Plog and Plerror log class
        // this.log = function (plog) {
        //     if (plog instanceof Plog) {
        //         const logr = winston.loggers.get('partup');
        //         logr.log(plog);
        //     } else {
        //         throw new Error('only plogs can be used to use the default log function');
        //     }
        // };

        this._initialized = true;
        Object.freeze(this._initialized);
    },
};

if (Meteor.isClient) {
    plogger.init(process.env.NODE_ENV);
    Partup.client.logger = plogger;
}
