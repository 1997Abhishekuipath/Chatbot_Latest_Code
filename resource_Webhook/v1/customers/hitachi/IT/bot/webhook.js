/****************Helper and services***************************/
const config = require('./libs/config-util');
const multer  = require('multer')
const upload = multer({ dest: 'uploads/' })
const AWS = require('aws-sdk');
const fs = require('fs');


/******************* ROUTES ************************************/
const webhook = require('./routes/webhook');

/*******************NPM Libraries*****************************/
const express = require('express');
const helmet = require('helmet');
const app = express();
const bodyParser = require("body-parser");
const cors = require('cors');
process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';
/****************************Middleware***********************************************/
app.use(helmet());
app.use(bodyParser.json({limit: '20mb'}));
app.use(bodyParser.urlencoded({limit: '20mb', extended: true}));
app.use(express.static(__dirname));
app.use(cors());

/**************************************************APM********************************************/
require('skyapm-nodejs').start({
    // Service name is showed in sky-walking-ui. Suggestion: set an unique name for each service, one
    // service's nodes share the same code.
    // this value cannot be empty.
    serviceName: 'testnew-nehA',
    // The identifier of the instance
    instanceName: 'testnew-nehA',
    // Collector agent_gRPC/grpc service addresses.
    // default value: localhost:11800
    directServers: '10.83.150.168:11800',
    authorization: '',
    maxBufferSize: 1000,
});

/*************************************************Routes********************************************/

//const Busboy = require('busboy');

// Enter copied or downloaded access ID and secret key here and the name of the bucket that you have created

const ID = 'AKIAXIG7GPH3PGX3KIVR';

const SECRET = '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';

const BUCKET_NAME = 'mansibuckethsi/mansifolder';
const uploadFile = (path , filename) => {

    // Read content from the file

    const fileContent = fs.readFileSync(path);



    // Setting up S3 upload parameters

    const params = {

        Bucket: BUCKET_NAME,

        Key: filename, // File name you want to save as in S3

        Body: fileContent

    };



    // Uploading files to the bucket

    s3.upload(params, function (err, data) {

        if (err) {

            throw err;

        }

        console.log(`File uploaded successfully. ${data.Location}`);

    });

};


const s3 = new AWS.S3({

    accessKeyId: ID,

    secretAccessKey: SECRET

});

// app.post('/file_upload', upload.any(), function (req, res, next) {
//   //  console.log("file uploaded", req.files[0])
//     console.log("file uploaded", req.body)
//     uploadFile(req.files[0].path ,req.files[0].originalname,req.body);
//     // req.file is the `avatar` file
//     // req.body will hold the text fields, if there were any
//     app.use('/webhook',webhook);
//     console.log("web session",req.body.web_session)
//     webhookController.execute
//     res.send("file received")
// })

  
const VerifyToken = require('../../../../common/services/verify-token');
const verifyToken = new VerifyToken(config);
//app.use(verifyToken.verify);
app.use('/webhook',webhook);

/*******************************Server Hosting*****************************************/
const server = app.listen(config.get('server:port'), function() {
    console.log('Node server is running..' + config.get('server:port'));
});
