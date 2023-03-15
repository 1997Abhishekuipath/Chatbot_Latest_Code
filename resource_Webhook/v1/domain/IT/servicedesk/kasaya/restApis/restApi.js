var request = require('request');
// var auth = require('./kasaya/auth/auth');

//http://220.227.107.89:80/api/v1.0
module.exports = class RestApi {

    constructor(config, auth) {
        this.config = config;
        if(auth) {
            this.auth = auth;
        }
    }

    restGet(endPoint) {
        return this.asyncRest(`${endPoint}`, "GET")
    }

    restPost(endPoint, data) {
        return this.asyncRest(`${endPoint}`, "POST", data)
    }

    restPut(endPoint, data) {
        return this.asyncRest(`${endPoint}`, "PUT", data)
    }

    _requestPromise(option) {
        return new Promise((res, rej) => {
            request(option, (error, response, body) => {
                if (error) {
                    console.error(`error:`, error);
                    return rej(error)
                }
                let status = response['statusCode'];
                let result = {body: body, ResponseCode: status}
                return res(result);
            });
        })

    }

    async asyncRest (url, method, data) {

        url = this.config.API_URL + url;
        var option = {
            uri: url,
            method: method
        }
        if (data) {
            option = Object.assign(option, data);
        }
        if(this.auth) {
            let header = await this.auth.authHeader();
            option = Object.assign(option, header);
        }
        var response = await this._requestPromise(option);
        let status = response['ResponseCode'];
        if(status == 404)  {
            //console.error(response);
            throw response.body;
        }
        if(status == 401 && this.auth) {
            let header = await this.auth.authHeader(true);
            option = Object.assign(option, header);
            response = await this._requestPromise(option);
            return response
        } else  {
            return response
        }
    }

}
