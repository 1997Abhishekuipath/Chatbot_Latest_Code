const datetime = require('node-datetime');

class CommonUtil {
    constructor(){
    }


    static getCurrentTimestamp() {
        const d = new Date();
        return d;
    };

    static getCurrentTimestampString() {
        const d = new Date();
        const timestamp = d.toLocaleString();
        return timestamp;
    };

    static getCurrentMilliseconds () {
        const dt = datetime.create();
        return dt.now();
    };

    static convertToTitleCase(str) {
        str = str.toLowerCase().split(' ');
        for (var i = 0; i < str.length; i++) {
            str[i] = str[i].charAt(0).toUpperCase() + str[i].slice(1);
        }
        return str.join(' ');
    };

    static pickRandomValue(array) {
        let value = array[Math.floor(Math.random() * array.length)];
        return value;
    };

}

module.exports = CommonUtil;