var http = require('http');
var urlencode = require('urlencode');
// const { options } = require('../../../customers/hitachi/IT/bot/routes/webhook');
const axios = require("axios");
const { resolve } = require('path');

class SendMessage {
  constructor(config) {

    this.config = config;
    this.textmessage = this.textmessage.bind(this);

  }

  async textmessage(data) {
    console.log(data);
    // var msg = urlencode(`${data.msg}`);
    // // var toNumber = '91'+`${data.number}`;
    // var username = 'devendra.dubey.yq@hitachi-systems.com';
    // var hash = '5699a7dfbadca5176684aab78f7cac371b322d69589aca6b29ee34f0af318e8c'; 
    // // The hash key could be found under Help->All Documentation->Your hash key. Alternatively you can use your Textlocal password in plain text.
    // var sender = 'HITSYS';
    // var data = 'username=' + username + '&hash=' + hash + '&sender=' + sender + '&numbers=' + toNumber + '&message=' + msg;
    // var options = {
    // host: 'api.textlocal.in', path: '/send?' + data
    // };
    //  console.log(data);
    // callback = function (response) {
    // var str = '';//another chunk of data has been recieved, so append it to `str`
    // response.on('data', function (chunk) {
    //     str += chunk;
    // });//the whole response has been recieved, so we just print it out here
    // response.on('end', function () {
    //     console.log(str);
    // });
    // }//console.log('hello js'))

    //  http.request(options, callback).end();
    const tlClient = axios.create({
      baseURL: "https://api.textlocal.in/",
      params: {
        apiKey: "NDU0NjM3NGU1NjVhNjI3MDc4NjQ2OTQ1NmQ1NzRmNzM=", //Text local api key
        sender: "HITSYS"
      }
    });

    console.log("entered send verification");
    // console.log(data , );


    if (data && data.number) {
      const params = new URLSearchParams();
      // otp = "123456"
      params.append("numbers", [parseInt("91" + data.number)]);
      params.append(
        "message",
        `Please use the following OTP for verification ${data.otp}

Hitachi Systems Micro Clinic Pvt. Ltd.`
      );
      let res= new Promise((resolve, rejects) => {
        tlClient.post("/send", params)
          
      });

      res.then(response => 
        {
        console.log(response);
      return 'SUCCESS';
      })
      .catch(error => {
        console.log(error.message)
        return error.message
      })

    };
    // http.request(options).end();
    // console.log("i ma inside txt message")
  }
}

module.exports = SendMessage;