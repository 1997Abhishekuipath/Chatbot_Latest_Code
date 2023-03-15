const net = require('net');
let tcpClient;

class SocketUtil {
    constructor(host, port) {
        this.host = host;
        this.port = port;
        this.initializeTcpSocketClient();
    }

    initializeTcpSocketClient() {
        let options = {
            'host': this.host,
            'port': this.port
        };

        function initializeClient() {
            tcpClient = new net.Socket();

            tcpClient.connect(options, function () {
                console.log('Bot Webhook TCP Client connected');
            });

            tcpClient.on('error', function (err) {
                console.log(err);
            });

            tcpClient.on('close', function () {
                console.log('Bot Webhook TCP Client closed');
                setTimeout(function () {
                    console.log('Bot Webhook TCP Client Reconnecting');
                    initializeClient();
                }, 10000);
            });

            tcpClient.on('data', function (data) {
                //console.log('Server Response: ' + data);
                // const type = json.type;
                // const notifications = json.notifications;
                // const userIdentity = json.userIdentity;
                // if (type == constants.NOTIFICATION) {
                //     emitNotification(userIdentity, notifications);
                // }
            });
        }

        initializeClient();
    };

    sendData(data) {
        try {
            if (tcpClient) {
                console.log("SENDING DATA::::::::::::::::::")
                console.log(JSON.stringify(data));
                tcpClient.write(JSON.stringify(data));
            }
        } catch (err) {
            console.log(err);
        }
    };
}

module.exports = SocketUtil;