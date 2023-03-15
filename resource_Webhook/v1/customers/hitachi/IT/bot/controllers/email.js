var https = require('http');
'use strict';
process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';
//var crmwebapihost = 'https://hisysmc.crm5.dynamics.com';

//var crmwebapihost =crmwebapihost.split('/')[0];
//set these values to retrieve the oauth token
var crmorg = 'http://10.83.150.241/demo/api_jsonrpc.php';
var username = 'Admin';
var password = 'zabbix';
//      var username = 'Admin';
//      var password = 'ytrewq@123';
var tokenendpoint = 'http://10.83.150.241/demo/api_jsonrpc.php';


// //remove https from tokenendpoint url
var tokenendpoint = tokenendpoint.toLowerCase().replace('http://', '');

// //get the authorization endpoint host name
var authhost = tokenendpoint.split('/')[0];

// //get the authorization endpoint path
var authpath = '/' + tokenendpoint.split('/').slice(1).join('/');

//build the authorization request
//if you want to learn more about how tokens work, see IETF RFC 6749 - https://tools.ietf.org/html/rfc6749


//set the token request parameters

class Email {
        constructor(config) {
                this.config = config;
                this.TokenSyncJob2 = this.TokenSyncJob2.bind(this);
                this.OpportunityLoss = this.OpportunityLoss.bind(this);

        }

        async TokenSyncJob2() {
                console.log("EXECUTING TOKEN CREATE SCHEDULER");
                try {

                        //get token
                        var Result = await this.getToken();
                        //console.log("token data",Result)
                        var requestheaders = {
                                'Authorization': 'Bearer ' + Result,
                                'OData-MaxVersion': '4.0',
                                'OData-Version': '4.0',
                                'Accept': 'application/json',
                                'Content-Type': 'application/json; charset=utf-8',
                                'Prefer': 'odata.maxpagesize=500',
                                'Prefer': 'odata.include-annotations=OData.Community.Display.V1.FormattedValue'
                        };

                        //set the crm request parameters
                        var crmrequestoptions = {
                                host: crmwebapihost,
                                path: crmwebapipath,
                                method: 'GET',
                                headers: requestheaders
                        };

                        //make the web api request
                        return new Promise((resolve) => {
                                var crmrequest = https.request(crmrequestoptions, function (response) {
                                        //make an array to hold the response parts if we get multiple parts
                                        var responseparts = [];
                                        response.setEncoding('utf8');
                                        response.on('data', function (chunk) {
                                                //add each response chunk to the responseparts array for later
                                                responseparts.push(chunk);
                                        });
                                        response.on('end', function () {
                                                //once we have all the response parts, concatenate the parts into a single string
                                                var completeresponse = responseparts.join('');

                                                //parse the response JSON
                                                var collection = JSON.parse(completeresponse).value;
                                                resolve(collection);
                                                //  console.log(collection);
                                                //loop through the results and write out the fullname
                                                //  collection.forEach(function (column, i) {
                                                //          var result = column['internalemailaddress'];
                                                //         // console.log(result)
                                                //       resolve(result);

                                                // });
                                        });
                                });
                                crmrequest.on('error', function (e) {
                                        console.error(e);
                                });
                                //close the web api request
                                crmrequest.end();
                        })
                } catch (e) {
                        throw new Error(e)
                }
        }

        async OpportunityWon() {
                var crmwebapipath = '/api/data/v9.1/systemusers?$select=systemuserid&$filter=internalemailaddress%20eq%20%27jay.khanna.ep@hitachi-systems.com%27'; //basic query to select contacts
                var crmwebapihost = 'https://hisysmc.crm5.dynamics.com';
                var crmwebapihost = crmwebapihost.toLowerCase().replace('https://', '');
                let fileScope = '';
                console.log("EXECUTING TOKEN CREATE SCHEDULER");
                try {

                        //get token
                        var Result = await this.getToken();
                        //console.log("token data",Result)
                        var requestheaders = {
                                'Authorization': 'Bearer ' + Result,
                                'OData-MaxVersion': '4.0',
                                'OData-Version': '4.0',
                                'Accept': 'application/json',
                                'Content-Type': 'application/json; charset=utf-8',
                                'Prefer': 'odata.maxpagesize=500',
                                'Prefer': 'odata.include-annotations=OData.Community.Display.V1.FormattedValue'
                        };

                        //set the crm request parameters
                        var crmrequestoptions = {
                                host: crmwebapihost,
                                path: crmwebapipath,
                                method: 'GET',
                                headers: requestheaders
                        };


                        return new Promise((resolve) => {
                                //make the web api request
                                var crmrequest = https.request(crmrequestoptions, function (response) {
                                        //make an array to hold the response parts if we get multiple parts
                                        var responseparts = [];
                                        response.setEncoding('utf8');
                                        response.on('data', function (chunk) {
                                                //add each response chunk to the responseparts array for later
                                                responseparts.push(chunk);
                                        });
                                        response.on('end', function () {
                                                //once we have all the response parts, concatenate the parts into a single string
                                                var completeresponse = responseparts.join('');

                                                //parse the response JSON
                                                var collection = JSON.parse(completeresponse).value;

                                                //loop through the results and write out the fullname
                                                collection.forEach(function (row, i) {
                                                        var fileScope = row['systemuserid'];
                                                        var crmwebapihost1 = 'https://hisysmc.crm5.dynamics.com';
                                                        var crmwebapipath1 = '/api/data/v9.1/opportunities?$select=actualclosedate,name,estimatedvalue_base,new_bottomline_for_product_base&$top=3&$expand=new_potentialcustomer($select=name)&$filter=_owninguser_value%20eq%20' + fileScope + '%20and%20statecode%20eq%201';
                                                        console.log("getting the user output data in opportunity won")
                                                        var data = UserOutput(crmwebapihost1, crmwebapipath1);
                                                        resolve(data);

                                                        //console.log(fileScope);

                                                });

                                        });

                                });
                                function UserOutput(crmwebapihost1, crmwebapipath1) {
                                        //console.log(fileScope);
                                        console.log("i an inside user output function")
                                        try {
                                                var crmwebapihost1 = crmwebapihost1.toLowerCase().replace('https://', '');
                                                var crmrequestoptions1 = {
                                                        host: crmwebapihost1,
                                                        path: crmwebapipath1,
                                                        method: 'GET',
                                                        headers: requestheaders
                                                };
                                                return new Promise((resolve) => {
                                                        //make the web api request
                                                        var crmrequest1 = https.request(crmrequestoptions1, function (response) {
                                                                //make an array to hold the response parts if we get multiple parts
                                                                var responseparts = [];
                                                                response.setEncoding('utf8');
                                                                response.on('data', function (chunk) {
                                                                        //add each response chunk to the responseparts array for later
                                                                        responseparts.push(chunk);
                                                                });
                                                                response.on('end', function () {
                                                                        //once we have all the response parts, concatenate the parts into a single string
                                                                        var completeresponse = responseparts.join('');

                                                                        //parse the response JSON
                                                                        console.log('hellllllllllllllllo')
                                                                        var collection1 = JSON.parse(completeresponse).value;
                                                                        //console.log(collection1);
                                                                        resolve(collection1);

                                //loop through the results and write out the fullname
      /*                          collection.forEach(function (row, i) {
                        var result12 = row ['name'];
                        console.log(result12);
                        return result12;
                       //console.log('hello',fileScope)
        
                   */  });

                                                        });
                                                        crmrequest1.end();

                                                });

                                        } catch (error) {
                                                console.log("error in useroutput", error)
                                        }
                                }
                                crmrequest.end();
                        })
                }
                catch (e) {
                        throw new Error(e)
                }
        }


        //////////////////////////////////////////opportunity loss//////////////////////////////////////////////

        async OpportunityLoss() {
                var crmwebapipath = '/api/data/v9.1/systemusers?$select=systemuserid&$filter=internalemailaddress%20eq%20%27jay.khanna.ep@hitachi-systems.com%27'; //basic query to select contacts
                var crmwebapihost = 'https://hisysmc.crm5.dynamics.com';
                var crmwebapihost = crmwebapihost.toLowerCase().replace('https://', '');
                let fileScope = '';
                console.log("EXECUTING TOKEN CREATE SCHEDULER");
                try {

                        //get token
                        var Result = await this.getToken();
                        //console.log("token data",Result)
                        var requestheaders = {
                                'Authorization': 'Bearer ' + Result,
                                'OData-MaxVersion': '4.0',
                                'OData-Version': '4.0',
                                'Accept': 'application/json',
                                'Content-Type': 'application/json; charset=utf-8',
                                'Prefer': 'odata.maxpagesize=500',
                                'Prefer': 'odata.include-annotations=OData.Community.Display.V1.FormattedValue'
                        };

                        //set the crm request parameters
                        var crmrequestoptions = {
                                host: crmwebapihost,
                                path: crmwebapipath,
                                method: 'GET',
                                headers: requestheaders
                        };


                        return new Promise((resolve) => {
                                //make the web api request
                                var crmrequest = https.request(crmrequestoptions, function (response) {
                                        //make an array to hold the response parts if we get multiple parts
                                        var responseparts = [];
                                        response.setEncoding('utf8');
                                        response.on('data', function (chunk) {
                                                //add each response chunk to the responseparts array for later
                                                responseparts.push(chunk);
                                        });
                                        response.on('end', function () {
                                                //once we have all the response parts, concatenate the parts into a single string
                                                var completeresponse = responseparts.join('');

                                                //parse the response JSON
                                                var collection = JSON.parse(completeresponse).value;

                                                //loop through the results and write out the fullname
                                                collection.forEach(function (row, i) {
                                                        var fileScope = row['systemuserid'];
                                                        var crmwebapihost1 = 'https://hisysmc.crm5.dynamics.com';
                                                        var crmwebapipath1 = '/api/data/v9.1/opportunities?$select=actualclosedate,name,estimatedvalue_base,new_bottomline_for_product_base&$top=3&$expand=new_potentialcustomer($select=name)&$filter=_owninguser_value%20eq%20' + fileScope + '%20and%20statecode%20eq%202';
                                                        console.log("getting the user output data in opportunity won")
                                                        var data = UserOutput(crmwebapihost1, crmwebapipath1);
                                                        resolve(data);

                                                        //console.log(fileScope);

                                                });

                                        });

                                });
                                function UserOutput(crmwebapihost1, crmwebapipath1) {
                                        //console.log(fileScope);
                                        console.log("i an inside user output function")
                                        try {
                                                var crmwebapihost1 = crmwebapihost1.toLowerCase().replace('https://', '');
                                                var crmrequestoptions1 = {
                                                        host: crmwebapihost1,
                                                        path: crmwebapipath1,
                                                        method: 'GET',
                                                        headers: requestheaders
                                                };
                                                return new Promise((resolve) => {
                                                        //make the web api request
                                                        var crmrequest1 = https.request(crmrequestoptions1, function (response) {
                                                                //make an array to hold the response parts if we get multiple parts
                                                                var responseparts = [];
                                                                response.setEncoding('utf8');
                                                                response.on('data', function (chunk) {
                                                                        //add each response chunk to the responseparts array for later
                                                                        responseparts.push(chunk);
                                                                });
                                                                response.on('end', function () {
                                                                        //once we have all the response parts, concatenate the parts into a single string
                                                                        var completeresponse = responseparts.join('');

                                                                        //parse the response JSON
                                                                        console.log('hellllllllllllllllo')
                                                                        var collection1 = JSON.parse(completeresponse).value;
                                                                        //console.log(collection1);
                                                                        resolve(collection1);

                                     //loop through the results and write out the fullname
           /*                          collection.forEach(function (row, i) {
                             var result12 = row ['name'];
                             console.log(result12);
                             return result12;
                            //console.log('hello',fileScope)
             
                        */  });

                                                        });
                                                        crmrequest1.end();

                                                });

                                        } catch (error) {
                                                console.log("error in useroutput", error)
                                        }
                                }
                                crmrequest.end();
                        })
                }
                catch (e) {
                        throw new Error(e)
                }
        }


        ///////////////////////////////account name///////////////////////////////////////////////

        async Accountname() {
                var crmwebapipath = '/api/data/v9.1/systemusers?$select=systemuserid&$filter=internalemailaddress%20eq%20%27jay.khanna.ep@hitachi-systems.com%27'; //basic query to select contacts
                var crmwebapihost = 'https://hisysmc.crm5.dynamics.com';
                var crmwebapihost = crmwebapihost.toLowerCase().replace('https://', '');
                let fileScope = '';
                console.log("EXECUTING TOKEN CREATE SCHEDULER");
                try {

                        //get token
                        var Result = await this.getToken();
                        //console.log("token data",Result)
                        var requestheaders = {
                                'Authorization': 'Bearer ' + Result,
                                'OData-MaxVersion': '4.0',
                                'OData-Version': '4.0',
                                'Accept': 'application/json',
                                'Content-Type': 'application/json; charset=utf-8',
                                'Prefer': 'odata.maxpagesize=500',
                                'Prefer': 'odata.include-annotations=OData.Community.Display.V1.FormattedValue'
                        };

                        //set the crm request parameters
                        var crmrequestoptions = {
                                host: crmwebapihost,
                                path: crmwebapipath,
                                method: 'GET',
                                headers: requestheaders
                        };


                        return new Promise((resolve) => {
                                //make the web api request
                                var crmrequest = https.request(crmrequestoptions, function (response) {
                                        //make an array to hold the response parts if we get multiple parts
                                        var responseparts = [];
                                        response.setEncoding('utf8');
                                        response.on('data', function (chunk) {
                                                //add each response chunk to the responseparts array for later
                                                responseparts.push(chunk);
                                        });
                                        response.on('end', function () {
                                                //once we have all the response parts, concatenate the parts into a single string
                                                var completeresponse = responseparts.join('');

                                                //parse the response JSON
                                                var collection = JSON.parse(completeresponse).value;

                                                //loop through the results and write out the fullname
                                                collection.forEach(function (row, i) {
                                                        var fileScope = row['systemuserid'];
                                                        var crmwebapihost1 = 'https://hisysmc.crm5.dynamics.com';
                                                        var crmwebapipath1 = '/api/data/v9.1/accounts?$select=name&$filter=_owninguser_value%20eq%20' + fileScope + '&$top=5';
                                                        console.log("getting the user output data in opportunity won")
                                                        var data = UserOutput(crmwebapihost1, crmwebapipath1);
                                                        resolve(data);

                                                        //console.log(fileScope);

                                                });

                                        });

                                });
                                function UserOutput(crmwebapihost1, crmwebapipath1) {
                                        //console.log(fileScope);
                                        console.log("i an inside user output function")
                                        try {
                                                var crmwebapihost1 = crmwebapihost1.toLowerCase().replace('https://', '');
                                                var crmrequestoptions1 = {
                                                        host: crmwebapihost1,
                                                        path: crmwebapipath1,
                                                        method: 'GET',
                                                        headers: requestheaders
                                                };
                                                return new Promise((resolve) => {
                                                        //make the web api request
                                                        var crmrequest1 = https.request(crmrequestoptions1, function (response) {
                                                                //make an array to hold the response parts if we get multiple parts
                                                                var responseparts = [];
                                                                response.setEncoding('utf8');
                                                                response.on('data', function (chunk) {
                                                                        //add each response chunk to the responseparts array for later
                                                                        responseparts.push(chunk);
                                                                });
                                                                response.on('end', function () {
                                                                        //once we have all the response parts, concatenate the parts into a single string
                                                                        var completeresponse = responseparts.join('');

                                                                        //parse the response JSON
                                                                        console.log('hellllllllllllllllo')
                                                                        var collection1 = JSON.parse(completeresponse).value;
                                                                        //console.log(collection1);
                                                                        resolve(collection1);

                                     //loop through the results and write out the fullname
           /*                          collection.forEach(function (row, i) {
                             var result12 = row ['name'];
                             console.log(result12);
                             return result12;
                            //console.log('hello',fileScope)
             
                        */  });

                                                        });
                                                        crmrequest1.end();

                                                });

                                        } catch (error) {
                                                console.log("error in useroutput", error)
                                        }
                                }
                                crmrequest.end();
                        })
                }
                catch (e) {
                        throw new Error(e)
                }
        }
        ////////////////////////////////////account email////////////////////////////////////////////

        async Accountemail() {
                var crmwebapipath = '/api/data/v9.1/systemusers?$select=systemuserid&$filter=internalemailaddress%20eq%20%27jay.khanna.ep@hitachi-systems.com%27'; //basic query to select contacts
                var crmwebapihost = 'https://hisysmc.crm5.dynamics.com';
                var crmwebapihost = crmwebapihost.toLowerCase().replace('https://', '');
                let fileScope = '';
                console.log("EXECUTING TOKEN CREATE SCHEDULER");
                try {

                        //get token
                        var Result = await this.getToken();
                        //console.log("token data",Result)
                        var requestheaders = {
                                'Authorization': 'Bearer ' + Result,
                                'OData-MaxVersion': '4.0',
                                'OData-Version': '4.0',
                                'Accept': 'application/json',
                                'Content-Type': 'application/json; charset=utf-8',
                                'Prefer': 'odata.maxpagesize=500',
                                'Prefer': 'odata.include-annotations=OData.Community.Display.V1.FormattedValue'
                        };

                        //set the crm request parameters
                        var crmrequestoptions = {
                                host: crmwebapihost,
                                path: crmwebapipath,
                                method: 'GET',
                                headers: requestheaders
                        };


                        return new Promise((resolve) => {
                                //make the web api request
                                var crmrequest = https.request(crmrequestoptions, function (response) {
                                        //make an array to hold the response parts if we get multiple parts
                                        var responseparts = [];
                                        response.setEncoding('utf8');
                                        response.on('data', function (chunk) {
                                                //add each response chunk to the responseparts array for later
                                                responseparts.push(chunk);
                                        });
                                        response.on('end', function () {
                                                //once we have all the response parts, concatenate the parts into a single string
                                                var completeresponse = responseparts.join('');

                                                //parse the response JSON
                                                var collection = JSON.parse(completeresponse).value;

                                                //loop through the results and write out the fullname
                                                collection.forEach(function (row, i) {
                                                        var fileScope = row['systemuserid'];
                                                        var crmwebapihost1 = 'https://hisysmc.crm5.dynamics.com';
                                                        var crmwebapipath1 = '/api/data/v9.1/accounts?$select=emailaddress1&$filter=_owninguser_value%20eq%20' + fileScope + '&$top=5';
                                                        console.log("getting the user output data in opportunity won")
                                                        var data = UserOutput(crmwebapihost1, crmwebapipath1);
                                                        resolve(data);

                                                        //console.log(fileScope);

                                                });

                                        });

                                });
                                function UserOutput(crmwebapihost1, crmwebapipath1) {
                                        //console.log(fileScope);
                                        console.log("i an inside user output function")
                                        try {
                                                var crmwebapihost1 = crmwebapihost1.toLowerCase().replace('https://', '');
                                                var crmrequestoptions1 = {
                                                        host: crmwebapihost1,
                                                        path: crmwebapipath1,
                                                        method: 'GET',
                                                        headers: requestheaders
                                                };
                                                return new Promise((resolve) => {
                                                        //make the web api request
                                                        var crmrequest1 = https.request(crmrequestoptions1, function (response) {
                                                                //make an array to hold the response parts if we get multiple parts
                                                                var responseparts = [];
                                                                response.setEncoding('utf8');
                                                                response.on('data', function (chunk) {
                                                                        //add each response chunk to the responseparts array for later
                                                                        responseparts.push(chunk);
                                                                });
                                                                response.on('end', function () {
                                                                        //once we have all the response parts, concatenate the parts into a single string
                                                                        var completeresponse = responseparts.join('');

                                                                        //parse the response JSON
                                                                        console.log('hellllllllllllllllo')
                                                                        var collection1 = JSON.parse(completeresponse).value;
                                                                        //console.log(collection1);
                                                                        resolve(collection1);

                                     //loop through the results and write out the fullname
           /*                          collection.forEach(function (row, i) {
                             var result12 = row ['name'];
                             console.log(result12);
                             return result12;
                            //console.log('hello',fileScope)
             
                        */  });

                                                        });
                                                        crmrequest1.end();

                                                });

                                        } catch (error) {
                                                console.log("error in useroutput", error)
                                        }
                                }
                                crmrequest.end();
                        })
                }
                catch (e) {
                        throw new Error(e)
                }
        }
        ///////////////////////////////////////account url///////////////////////////////////

        async Accounturl() {
                var crmwebapipath = '/api/data/v9.1/systemusers?$select=systemuserid&$filter=internalemailaddress%20eq%20%27jay.khanna.ep@hitachi-systems.com%27'; //basic query to select contacts
                var crmwebapihost = 'https://hisysmc.crm5.dynamics.com';
                var crmwebapihost = crmwebapihost.toLowerCase().replace('https://', '');
                let fileScope = '';
                console.log("EXECUTING TOKEN CREATE SCHEDULER");
                try {

                        //get token
                        var Result = await this.getToken();
                        //console.log("token data",Result)
                        var requestheaders = {
                                'Authorization': 'Bearer ' + Result,
                                'OData-MaxVersion': '4.0',
                                'OData-Version': '4.0',
                                'Accept': 'application/json',
                                'Content-Type': 'application/json; charset=utf-8',
                                'Prefer': 'odata.maxpagesize=500',
                                'Prefer': 'odata.include-annotations=OData.Community.Display.V1.FormattedValue'
                        };

                        //set the crm request parameters
                        var crmrequestoptions = {
                                host: crmwebapihost,
                                path: crmwebapipath,
                                method: 'GET',
                                headers: requestheaders
                        };



                        //make the web api request
                        var crmrequest = https.request(crmrequestoptions, function (response) {
                                //make an array to hold the response parts if we get multiple parts
                                var responseparts = [];
                                response.setEncoding('utf8');
                                response.on('data', function (chunk) {
                                        //add each response chunk to the responseparts array for later
                                        responseparts.push(chunk);
                                });
                                response.on('end', function () {
                                        //once we have all the response parts, concatenate the parts into a single string
                                        var completeresponse = responseparts.join('');

                                        //parse the response JSON
                                        var collection = JSON.parse(completeresponse).value;

                                        //loop through the results and write out the fullname
                                        collection.forEach(function (row, i) {
                                                fileScope = row['systemuserid'];
                                                var crmwebapihost1 = 'https://hisysmc.crm5.dynamics.com';
                                                var crmwebapipath1 = '/api/data/v9.1/accounts?$select=websiteurl&$filter=_owninguser_value%20eq%20' + fileScope + '&$top=5';

                                                //useroutput(fileScope);



                                                console.log(fileScope);



                                        });

                                });

                        });

                        crmrequest.end();
                } catch (e) {
                        throw new Error(e)
                }
        }

        //////////////////////////////////////total won///////////////////////////////////

        async Totalwon() {
                var crmwebapipath = '/api/data/v9.1/systemusers?$select=systemuserid&$filter=internalemailaddress%20eq%20%27jay.khanna.ep@hitachi-systems.com%27'; //basic query to select contacts
                var crmwebapihost = 'https://hisysmc.crm5.dynamics.com';
                var crmwebapihost = crmwebapihost.toLowerCase().replace('https://', '');
                let fileScope = '';
                console.log("EXECUTING TOKEN CREATE SCHEDULER");
                try {

                        //get token
                        var Result = await this.getToken();
                        //console.log("token data",Result)
                        var requestheaders = {
                                'Authorization': 'Bearer ' + Result,
                                'OData-MaxVersion': '4.0',
                                'OData-Version': '4.0',
                                'Accept': 'application/json',
                                'Content-Type': 'application/json; charset=utf-8',
                                'Prefer': 'odata.maxpagesize=500',
                                'Prefer': 'odata.include-annotations=OData.Community.Display.V1.FormattedValue'
                        };

                        //set the crm request parameters
                        var crmrequestoptions = {
                                host: crmwebapihost,
                                path: crmwebapipath,
                                method: 'GET',
                                headers: requestheaders
                        };



                        //make the web api request
                        var crmrequest = https.request(crmrequestoptions, function (response) {
                                //make an array to hold the response parts if we get multiple parts
                                var responseparts = [];
                                response.setEncoding('utf8');
                                response.on('data', function (chunk) {
                                        //add each response chunk to the responseparts array for later
                                        responseparts.push(chunk);
                                });
                                response.on('end', function () {
                                        //once we have all the response parts, concatenate the parts into a single string
                                        var completeresponse = responseparts.join('');

                                        //parse the response JSON
                                        var collection = JSON.parse(completeresponse).value;

                                        //loop through the results and write out the fullname
                                        collection.forEach(function (row, i) {
                                                fileScope = row['systemuserid'];
                                                var crmwebapihost1 = 'https://hisysmc.crm5.dynamics.com';
                                                var crmwebapipath1 = '/api/data/v9.0/opportunities?fetchXml=<fetch%20version="1.0"%20output-format="xml-platform"%20mapping="logical"%20distinct="false"%20aggregate="true">%20<entity%20name="opportunity">%20<attribute%20name="actualvalue"%20aggregate="sum"%20alias=%27Topline%27/>%20<attribute%20name="new_bottomline"%20aggregate="sum"%20alias=%27Bottomline%27%20/>%20<filter%20type="and">%20<condition%20attribute="statecode"%20operator="eq"%20value="1"%20/>%20<condition%20attribute="ownerid"%20operator="eq"%20uiname="Jay%20Khanna"%20uitype="systemuser"%20value="%7B' + fileScope + '%7D"%20/>%20</filter>%20</entity>%20</fetch>';

                                                // useroutput(fileScope);



                                                console.log(fileScope);



                                        });

                                });

                        });

                        crmrequest.end();
                } catch (e) {
                        throw new Error(e)
                }
        }


        async getToken() {
                //make the token request
                //console.log(tokenrequestoptions)
                var jsonObject = JSON.stringify({
                        "user": "Admin",
                        "password": "zabbix",
                        // "roles": "*",
                        "duration": "30d"
                });
                // "user": "neha",
                // "password": "zxc@123",
               
                var tokenrequestoptions = {
                        host: authhost,
                        path: authpath,
                        method: 'POST',
                        port: 80,
                        headers: {
                                'Content-Type': 'application/json',
                                'Content-Length': jsonObject.length


                        }
                };


                return new Promise((resolve) => {
                        let tokenrequest = https.request(tokenrequestoptions, function (response) {
                                //make an array to hold the response parts if we get multiple parts
                                var responseparts = [];
                                response.setEncoding('utf8');
                                response.on('data', function (chunk) {
                                        //add each response chunk to the responseparts array for later
                                        responseparts.push(chunk);
                                });
                                response.on('end', function () {
                                        //once we have all the response parts, concatenate the parts into a single string
                                        var completeresponse = responseparts.join('');
                                        var tokenresponse = JSON.parse(completeresponse);
                                        var token = tokenresponse.access_token;
                                        resolve(token);
                                        console.log(token);
                                });
                        });
                        tokenrequest.on('error', function (e) {
                                console.error(e);
                        });

                        //post the token request data
                        tokenrequest.write(jsonObject);

                        //close the token request
                        tokenrequest.end();
                });
        }
}
module.exports = Email;