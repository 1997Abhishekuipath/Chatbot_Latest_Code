var path = require('path').resolve;
var request = require('request');
var kaseyaHashCalculater = require('./kaseyaHashCalculater');

class KaseyaAuthHeader extends kaseyaHashCalculater {

    constructor(kasayaAuthConfig) {
        if (!kasayaAuthConfig) {
            throw 'config not define';
        }
        let userName = kasayaAuthConfig["USERNAME"];
        let password = kasayaAuthConfig["PASSWORD"];
        super(userName, password);
        this.AuthURL = kasayaAuthConfig["AUTH_URL"];
        this.refreshTime(kasayaAuthConfig.REFRESH_TOKEN_TIME, this);
    }

    _genrateToken() {
        let args = {
            headers: {"Authorization": `Basic ${this._basicAuthString}`} // request headers
        }
        return new Promise((res, rej) => {
            let url = this.AuthURL;
            let method = 'GET'
            let option = {
                uri: url,
                method: method,
                ...args
            };
            console.log('the response is ', option)
            request(option, (err, response, body) => {
                if (err) {
                    throw err;
                }
                body = JSON.parse(body);
                console.log(body);
                let token = body.Result["Token"];
                if (token) {
                    res(token);
                } else {
                    rej('token not genrated');
                }
            })
        })
    }

    async authHeader(reset = false) {
        var header;
        console.log('rest', global.token, reset, (global.token && !reset));
        if (global.token && !reset) {
            console.log('token from previous call')
            header = {
                headers: {
                    Authorization: `Bearer ${global.token}`
                }
            }
        } else {
            global.token = await this._genrateToken();
            console.log('Token for Rest Api Is', global.token);
            header = {
                headers: {
                    Authorization: `Bearer ${global.token}`
                }
            }
        }
        return header;
    }

    refreshTime(time, self) {
        setInterval(() => {
            console.log('TOKEN REFRESH');
            self.authHeader(true);
        }, time);
    }
}

module.exports = KaseyaAuthHeader;
