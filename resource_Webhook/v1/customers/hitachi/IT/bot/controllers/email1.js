var https = require('https');
'use strict';
process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';

//var crmwebapihost = 'https://hisysmc.crm5.dynamics.com';

//var crmwebapihost =crmwebapihost.split('/')[0];
//set these values to retrieve the oauth token
var crmorg = 'https://hisysmctest31.crm5.dynamics.com/';
var clientid = '563f94e4-7717-448b-8d46-11cbe67f1332';
var username = 'demo@hisysmc.onmicrosoft.com';
var password = 'DA@#$1234';
var tokenendpoint = 'https://login.microsoftonline.com/eab54462-2228-4c20-9650-c2fcbbb45c4d/oauth2/token';
var client_secret = '9Q1wx7_MTtYfzGF6g_ZdX4quy_a_l98389';

// //remove https from tokenendpoint url
var tokenendpoint = tokenendpoint.toLowerCase().replace('https://', '');

// //get the authorization endpoint host name
var authhost = tokenendpoint.split('/')[0];

// //get the authorization endpoint path
var authpath = '/' + tokenendpoint.split('/').slice(1).join('/');

//build the authorization request
//if you want to learn more about how tokens work, see IETF RFC 6749 - https://tools.ietf.org/html/rfc6749
var reqstring = 'client_id=' + clientid;
reqstring += '&resource=' + encodeURIComponent(crmorg);
reqstring += '&username=' + encodeURIComponent(username);
reqstring += '&password=' + encodeURIComponent(password);
reqstring += '&client_secret=' + encodeURIComponent(client_secret);
reqstring += '&grant_type=password';

//set the token request parameters
var tokenrequestoptions = {
        host: authhost,
        path: authpath,
        // method: 'POST',
        headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': Buffer.byteLength(reqstring)


        }
};

class Email1 {
        constructor(config) {
                this.config = config;
                this.TokenSyncJob2 = this.TokenSyncJob2.bind(this);
                this.OpportunityLoss = this.OpportunityLoss.bind(this);

        }

        async TokenSyncJob2() {
                var crmwebapipath = '/api/data/v9.1/systemusers?$select=internalemailaddress'; //basic query to select contacts
                var crmwebapihost = 'https://hisysmc.crm5.dynamics.com';
                var crmwebapihost = crmwebapihost.toLowerCase().replace('https://', '');
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

        //////////////////////////////////////customer////////////////////////////////////////

        async TokenSyncJob21() {
                var crmwebapipath = '/api/data/v9.1/accounts?$select=name,emailaddress1,websiteurl,address1_composite,numberofemployees,createdon,modifiedon,address1_postalcode&$expand=owninguser($select=fullname)'; //basic query to select contacts
                var crmwebapihost = 'https://hisysmc.crm5.dynamics.com';
                var crmwebapihost = crmwebapihost.toLowerCase().replace('https://', '');
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

        async OpportunityWon(param, useremail) {
                useremail = "jay.khanna.ep@hitachi-systems.com";
                var crmwebapipath = '/api/data/v9.1/systemusers?$select=systemuserid&$filter=internalemailaddress%20eq%20%27' + useremail + '%27'; //basic query to select contacts
                // var crmwebapipath = '/api/data/v9.1/systemusers?$select=systemuserid'; //basic query to select contacts
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
                                                if (completeresponse) {
                                                        var collection = JSON.parse(completeresponse).value;
                                                        // var collection = completeresponse;
                                                        console.log("collection", collection)
                                                        //loop through the results and write out the fullname
                                                        try {
                                                                collection.forEach(function (row, i) {
                                                                        var fileScope = row['systemuserid'];
                                                                        console.log(fileScope, 'hello');
                                                                        var crmwebapihost1 = 'https://hisysmc.crm5.dynamics.com';
                                                                        var crmwebapipath1 = '/api/data/v9.0/opportunities?fetchXml=<fetch%20top="5"%20aggregate="true"%20output-format="xml-platform"%20mapping="logical"%20distinct="false"%20>%20<entity%20name="opportunity"%20>%20<attribute%20name="name"%20alias="PotentialCustomerName"%20groupby="true"%20/>%20<attribute%20name="new_potentialcustomer"%20alias="PotentialCustomer"%20groupby="true"%20/>%20<attribute%20name="actualvalue"%20alias="Topline"%20aggregate="sum"%20/>%20<attribute%20name="new_bottomline_for_product_base"%20alias="Bottpmline"%20aggregate="sum"%20/>%20<order%20alias="Topline"%20descending="true"%20/>%20<filter%20type="and">%20<condition%20attribute="statecode"%20operator="eq"%20value="1"%20/>%20<condition%20attribute="ownerid"%20operator="eq"%20uiname="Jay%20Khanna"%20uitype="systemuser"%20value="{' + fileScope + '}"%20/>%20</filter>%20</entity>%20</fetch>';
                                                                        console.log("getting the user output data in opportunity won")
                                                                        var data = UserOutput(crmwebapihost1, crmwebapipath1);

                                                                        resolve(data);

                                                                }
                                                                        //console.log(fileScope);

                                                                );

                                                        }
                                                        catch (e) {
                                                                throw console.error(e);
                                                        }
                                                }
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

        async OpportunityLoss(param, useremail) {
                useremail = "jay.khanna.ep@hitachi-systems.com"
                var crmwebapipath = '/api/data/v9.1/systemusers?$select=systemuserid&$filter=internalemailaddress%20eq%20%27' + useremail + '%27'; //basic query to select contacts
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
                                                        console.log(fileScope, 'hello');
                                                        var crmwebapihost1 = 'https://hisysmc.crm5.dynamics.com';
                                                        var crmwebapipath1 = '/api/data/v9.0/opportunities?fetchXml=<fetch%20top="5"%20aggregate="true"%20output-format="xml-platform"%20mapping="logical"%20distinct="false"%20>%20<entity%20name="opportunity"%20>%20<attribute%20name="name"%20alias="PotentialCustomerName"%20groupby="true"%20/>%20<attribute%20name="new_potentialcustomer"%20alias="PotentialCustomer"%20groupby="true"%20/>%20<attribute%20name="actualvalue"%20alias="Topline"%20aggregate="sum"%20/>%20<attribute%20name="new_bottomline_for_product_base"%20alias="Bottpmline"%20aggregate="sum"%20/>%20<order%20alias="Topline"%20descending="true"%20/>%20<filter%20type="and">%20<condition%20attribute="statecode"%20operator="eq"%20value="2"%20/>%20<condition%20attribute="ownerid"%20operator="eq"%20uiname="Jay%20Khanna"%20uitype="systemuser"%20value="{' + fileScope + '}"%20/>%20</filter>%20</entity>%20</fetch>';
                                                        console.log("getting the user output data in opportunity loss")
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

        async Accountname(param, useremail) {
                useremail = "jay.khanna.ep@hitachi-systems.com";
                var crmwebapipath = '/api/data/v9.1/systemusers?$select=systemuserid&$filter=internalemailaddress%20eq%20%27' + useremail + '%27'; //basic query to select contacts
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
                                                        var key = param.any;
                                                        key = key.replace(/ /g, "%20");

                                                        console.log(key)
                                                        var crmwebapihost1 = 'https://hisysmc.crm5.dynamics.com';
                                                        console.log('param right--------------------------------', param.any)
                                                        var crmwebapipath1 = 'https://hisysmc.crm5.dynamics.com/api/data/v9.0/accounts?fetchXml=%3Cfetch%20version=%221.0%22%20output-format=%22xml-platform%22%20mapping=%22logical%22%20distinct=%22false%22%3E%20%3Centity%20name=%22account%22%3E%20%3Cattribute%20name=%22name%22%20/%3E%20%3Cattribute%20name=%22new_segment%22%20/%3E%20%3Cattribute%20name=%22numberofemployees%22%20/%3E%20%3Cattribute%20name=%22emailaddress1%22%20/%3E%20%3Cattribute%20name=%22industrycode%22%20/%3E%20%3Cattribute%20name=%22ownershipcode%22%20/%3E%20%3Cattribute%20name=%22ownerid%22%20/%3E%20%3Cattribute%20name=%22customertypecode%22%20/%3E%20%3Cattribute%20name=%22createdon%22%20/%3E%20%3Cattribute%20name=%22address1_city%22%20/%3E%20%3Cattribute%20name=%22address2_city%22%20/%3E%20%3Cattribute%20name=%22new_unsualorsuspicious%22%20/%3E%20%3Cattribute%20name=%22new_mkdenialtest2%22%20/%3E%20%3Cattribute%20name=%22new_enduserenduse%22%20/%3E%20%3Cattribute%20name=%22new_enduser%22%20/%3E%20%3Cattribute%20name=%22new_embargoed%22%20/%3E%20%3Cattribute%20name=%22new_designated%22%20/%3E%20%3Cattribute%20name=%22new_defense%22%20/%3E%20%3Cattribute%20name=%22modifiedon%22%20/%3E%20%3Cattribute%20name=%22modifiedby%22%20/%3E%20%3Cattribute%20name=%22new_customercategory%22%20/%3E%20%3Cattribute%20name=%22accountid%22%20/%3E%20%3Corder%20descending=%22true%22%20attribute=%22createdon%22%20/%3E%20%3Cfilter%20type=%22and%22%3E%20%3Ccondition%20attribute=%22statecode%22%20operator=%22eq%22%20value=%220%22%20/%3E%20%3Ccondition%20attribute=%22ownerid%22%20operator=%22eq%22%20uiname=%22Jay%20Khanna%22%20uitype=%22systemuser%22%20value=%22{' + fileScope + '}%22%20/%3E%20%3Ccondition%20attribute=%22name%22%20operator=%22like%22%20value=%22%' + key + '%%22%20/%3E%20%3C/filter%3E%20%3Clink-entity%20name=%22systemuser%22%20from=%22systemuserid%22%20to=%22owninguser%22%20visible=%22false%22%20link-type=%22outer%22%20alias=%22a_5e98d04200bb494ab231eadc8d4a94ec%22%3E%20%3Cattribute%20name=%22new_locationid%22%20/%3E%20%3C/link-entity%3E%20%3C/entity%3E%20%3C/fetch%3E';
                                                        console.log("getting the user output data in opportunity won", crmwebapipath1)
                                                        var data = UserOutput(crmwebapihost1, crmwebapipath1);
                                                        console.log("accoubt namae data+++++++++++++++", data)
                                                        resolve(data);
                                                        //console.log(fileScope)
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
                                                                        console.log('complete response', completeresponse)
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

        async Accountemail(param) {
                let useremail = "jay.khanna.ep@hitachi-systems.com";
                var crmwebapipath = '/api/data/v9.1/systemusers?$select=systemuserid&$filter=internalemailaddress%20eq%20%27' + useremail + '%27'; //basic query to select contacts
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

        async Accounturl(param) {
                let useremail = "jay.khanna.ep@hitachi-systems.com"
                var crmwebapipath = '/api/data/v9.1/systemusers?$select=systemuserid&$filter=internalemailaddress%20eq%20%27' + useremail + '%27'; //basic query to select contacts
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
                                                        var crmwebapipath1 = '/api/data/v9.1/accounts?$select=websiteurl&$filter=_owninguser_value%20eq%20' + fileScope + '&$top=5';
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

        //////////////////////////////////////total won///////////////////////////////////

        async Totalwon(param, useremail) {
                useremail = "jay.khanna.ep@hitachi-systems.com"
                var crmwebapipath = '/api/data/v9.1/systemusers?$select=systemuserid&$filter=internalemailaddress%20eq%20%27' + useremail + '%27'; //basic query to select contacts
                var crmwebapihost = 'https://hisysmc.crm5.dynamics.com';
                var crmwebapihost = crmwebapihost.toLowerCase().replace('https://', '');
                let fileScope = '';
                console.log("EXECUTING TOKEN CREATE SCHEDULER");
                try {

                        //get token
                        var Result = await this.getToken();
                        console.log("token data", Result)
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
                                                        var crmwebapipath1 = '/api/data/v9.0/opportunities?fetchXml=<fetch%20version="1.0"%20output-format="xml-platform"%20mapping="logical"%20distinct="false"%20aggregate="true">%20<entity%20name="opportunity">%20<attribute%20name="actualvalue"%20aggregate="sum"%20alias=%27Topline%27/>%20<attribute%20name="new_bottomline"%20aggregate="sum"%20alias=%27Bottomline%27%20/>%20<filter%20type="and">%20<condition%20attribute="statecode"%20operator="eq"%20value="1"%20/>%20<condition%20attribute="ownerid"%20operator="eq"%20uiname="Jay%20Khanna"%20uitype="systemuser"%20value="%7B' + fileScope + '%7D"%20/>%20</filter>%20</entity>%20</fetch>';
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
        //////////////////////////////////////total loss///////////////////////////////////////
        async Totalloss(param, useremail) {
                useremail = "jay.khanna.ep@hitachi-systems.com"
                var crmwebapipath = '/api/data/v9.1/systemusers?$select=systemuserid&$filter=internalemailaddress%20eq%20%27' + useremail + '%27'; //basic query to select contacts
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
                                                        var crmwebapipath1 = '/api/data/v9.0/opportunities?fetchXml=<fetch%20version="1.0"%20output-format="xml-platform"%20mapping="logical"%20distinct="false"%20aggregate="true">%20<entity%20name="opportunity">%20<attribute%20name="actualvalue"%20aggregate="sum"%20alias=%27Topline%27/>%20<attribute%20name="new_bottomline"%20aggregate="sum"%20alias=%27Bottomline%27%20/>%20<filter%20type="and">%20<condition%20attribute="statecode"%20operator="eq"%20value="2"%20/>%20<condition%20attribute="ownerid"%20operator="eq"%20uiname="Jay%20Khanna"%20uitype="systemuser"%20value="%7B' + fileScope + '%7D"%20/>%20</filter>%20</entity>%20</fetch>';
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
        //////////////////////////////////////total open///////////////////////////////
        async Totalopen(param, useremail) {
                useremail = "jay.khanna.ep@hitachi-systems.com"
                var crmwebapipath = '/api/data/v9.1/systemusers?$select=systemuserid&$filter=internalemailaddress%20eq%20%27' + useremail + '%27'; //basic query to select contacts
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
                                                        var crmwebapipath1 = '/api/data/v9.0/opportunities?fetchXml=<fetch%20version="1.0"%20output-format="xml-platform"%20mapping="logical"%20distinct="false"%20aggregate="true">%20<entity%20name="opportunity">%20<attribute%20name="actualvalue"%20aggregate="sum"%20alias=%27Topline%27/>%20<attribute%20name="new_bottomline"%20aggregate="sum"%20alias=%27Bottomline%27%20/>%20<filter%20type="and">%20<condition%20attribute="statecode"%20operator="eq"%20value="0"%20/>%20<condition%20attribute="ownerid"%20operator="eq"%20uiname="Jay%20Khanna"%20uitype="systemuser"%20value="%7B' + fileScope + '%7D"%20/>%20</filter>%20</entity>%20</fetch>';
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

        ////////////////////////////////////customer revenue//////////////////////////

        async Totalrevenue() {
                useremail = "jay.khanna.ep@hitachi-systems.com"

                // var crmwebapipath = '/api/data/v9.1/systemusers?$select=systemuserid&$filter=internalemailaddress%20eq%20%27jay.khanna.ep@hitachi-systems.com%27'; //basic query to select contacts
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
                                                        var crmwebapipath1 = '/api/data/v9.0/opportunities?fetchXml=<fetch%20version="1.0"%20output-format="xml-platform"%20mapping="logical"%20distinct="false"%20aggregate="true">%20<entity%20name="opportunity">%20<attribute%20name="actualvalue"%20aggregate="sum"%20alias=%27Topline%27/>%20<attribute%20name="new_bottomline"%20aggregate="sum"%20alias=%27Bottomline%27%20/>%20<filter%20type="and">%20<condition%20attribute="statecode"%20operator="eq"%20value="0"%20/>%20<condition%20attribute="ownerid"%20operator="eq"%20uiname="Jay%20Khanna"%20uitype="systemuser"%20value="%7B' + fileScope + '%7D"%20/>%20</filter>%20</entity>%20</fetch>';
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

        ////////////////////////////////////update contact/////////////////////////////////
        async Updatecontact(param) {
                var crmwebapipath = '/api/data/v9.1/contacts(59a8bbed-bd75-e611-80f7-3863bb347b20)'; //basic query to select contacts
                var crmwebapihost = 'https://hisysmctest31.crm5.dynamics.com';
                var crmwebapihost = crmwebapihost.toLowerCase().replace('https://', '');
                console.log("EXECUTING TOKEN CREATE SCHEDULER");
                try {

                        //get token
                        var Result = await this.getToken();

                        var contactObj = {};
                        contactObj["firstname"] = param.USER_QUERY;
                        // contactObj["lastname"]=" test1234";
                        var requestdata = JSON.stringify(contactObj);
                        var contentlength = Buffer.byteLength(JSON.stringify(contactObj));
                        //console.log("token data",Result)
                        var crmrequestoptions = {
                                host: crmwebapihost,
                                path: crmwebapipath,
                                method: 'PATCH',
                                headers: {
                                        'Authorization': 'Bearer ' + Result,
                                        'Content-Type': 'application/json',
                                        'Content-Length': contentlength,
                                        'OData-MaxVersion': '4.0',
                                        'OData-Version': '4.0'
                                }
                        };

                        //set the crm request parameters


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
                                                console.log(completeresponse);
                                                console.log('success!')
                                                resolve(completeresponse);
                                        });
                                });
                                crmrequest.write(requestdata);
                                console.log(requestdata);

                                crmrequest.on('error', function (e) {
                                        console.error(e);
                                });



                                //close the web api request
                                crmrequest.end();
                        });

                } catch (e) {
                        throw new Error(e)
                }
        }
        async Updatecontact1(param) {
                var crmwebapipath = '/api/data/v9.1/contacts(59a8bbed-bd75-e611-80f7-3863bb347b20)'; //basic query to select contacts
                var crmwebapihost = 'https://hisysmctest31.crm5.dynamics.com';
                var crmwebapihost = crmwebapihost.toLowerCase().replace('https://', '');
                console.log("EXECUTING TOKEN CREATE SCHEDULER");
                try {

                        //get token
                        var Result = await this.getToken();

                        var contactObj = {};
                        // contactObj["firstname"]=param.USER_QUERY;
                        contactObj["lastname"] = param.USER_QUERY;
                        console.log(contactObj);
                        var requestdata = JSON.stringify(contactObj);
                        var contentlength = Buffer.byteLength(JSON.stringify(contactObj));
                        //console.log("token data",Result)
                        var crmrequestoptions = {
                                host: crmwebapihost,
                                path: crmwebapipath,
                                method: 'PATCH',
                                headers: {
                                        'Authorization': 'Bearer ' + Result,
                                        'Content-Type': 'application/json',
                                        'Content-Length': contentlength,
                                        'OData-MaxVersion': '4.0',
                                        'OData-Version': '4.0'
                                }
                        };

                        //set the crm request parameters


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
                                                console.log(completeresponse);
                                                console.log('success!')
                                                //parse the response JSON
                                                // var collection = JSON.parse(completeresponse).value;
                                                // resolve(collection);
                                                //  console.log(collection);
                                                //loop through the results and write out the fullname
                                                //  collection.forEach(function (column, i) {
                                                //          var result = column['internalemailaddress'];
                                                //         // console.log(result)
                                                //       resolve(result);

                                                // });
                                        });
                                });
                                crmrequest.write(requestdata);
                                console.log(requestdata);
                                crmrequest.on('error', function (e) {
                                        console.error(e);
                                });



                                //close the web api request
                                crmrequest.end();
                        });

                } catch (e) {
                        throw new Error(e)
                }
        }


        async getToken() {
                //make the token request
                //console.log(tokenrequestoptions)
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
                                        // console.log(token);
                                });
                        });
                        tokenrequest.on('error', function (e) {
                                console.error(e);
                        });

                        //post the token request data
                        tokenrequest.write(reqstring);

                        //close the token request
                        tokenrequest.end();
                });
        }



}
module.exports = Email1;