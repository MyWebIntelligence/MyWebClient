let timer = null

const delay = (time, callback, arg) => {
    clearTimeout(timer)
    timer = setTimeout((value) => {
        callback(value)
    }, time, arg)
}

module.exports = { delay }