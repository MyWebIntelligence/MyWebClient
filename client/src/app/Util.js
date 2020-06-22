let timer = null;

const delay = (callback, arg) => {
    clearTimeout(timer);
    timer = setTimeout((value) => {
        callback(value);
    }, 400, arg);
};

const log = message => {
    console.log(`[${(new Date()).toLocaleTimeString()}] - ${message}`);
};

const placeholders = params => {
    if (Array.isArray(params)) {
        return params.map(_ => '?').join(',');
    }
    return '?';
};

module.exports = {delay, log, placeholders};