import { format } from 'winston';

const transform = (info) => {
    const message = info.reason || info.message; // Meteor.Error
    const args = info.args;

    info.message = TAPi18n.__(message, args);

    return info;
};

const tapi18nFormat = (options = {}) => {
    const levels = options.levels;

    return format((info, opts) => {
        if (levels) {
            if (levels.includes(info.level)) {
                return transform(info);
            }
        } else {
            return transform(info);
        }
        return info;
    })();
};

export default tapi18nFormat;
