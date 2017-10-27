import { format } from 'winston';

// even though the options parameter is not used, it won't work without it..
const noFormat = format((info, options = {}) => {
    return info;
});

export default noFormat;
