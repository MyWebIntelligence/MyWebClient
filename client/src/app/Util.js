let timer = null;

export const delay = (callback, arg) => {
    clearTimeout(timer);
    timer = setTimeout((value) => {
        callback(value);
    }, 400, arg);
};