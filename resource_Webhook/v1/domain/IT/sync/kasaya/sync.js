const MssqlUtil = require('../../../../common/libs/mssql-util');
const MongoUtil = require('../../../../common/libs/mongo-util');
const MysqlUtil = require('../../../../common/libs/mysql-util');
const email = require('../../../../customers/hitachi/IT/bot/controllers/email');
const email1 = require('../../../../customers/hitachi/IT/bot/controllers/email1');
const apirequest = require('../../../../common/libs/rest-util');
const { query } = require('express');

class SyncUtil {
    constructor(config, path, data, options) {
        this.config = config;
        this.mssqlUtil = new MssqlUtil(config);
        this.MysqlUtil = new MysqlUtil(config);
        this.mongoUtil = new MongoUtil(config.get("mongodb:url"));
        this.executeUserSync = this.executeUserSync.bind(this);
        this.executePCUserSync = this.executePCUserSync.bind(this);
        this.email = new email(config);
        this.email1 = new email1(config);
        this.apiRequest = new apirequest(path, data, options);
    }

    async executePCUserSync(param) {
        try {

            const query = param.QUERY;
            let result = await this.mssqlUtil.executeQuery(query);
            let dataRecord = result //User Record
            let data;
            for (let j = 0; j < result.length; j++) {
                let ID = JSON.stringify(result[j].agentGuid);//Converting string for string Data in MongoDB
                data = {
                    "Type": "PCVisor",
                    "customerGroup": result[j].groupName,
                    "machineName": result[j].displayName,
                    "groupReverseName": result[j].reverseName,
                    "machGroupGuid": result[j].machGroupGuid,
                    "identityType": "agentId",
                    "mgrContact": "",
                    "mgrDepartment": "",
                    "mgrEmail": result[j].mgrEmail,
                    "mgrIdentity": "",
                    "mgrName": result[j].mgrName,
                    "number": result[j].contactPhone || '000000000000',
                    "userDepartment": "",
                    "userEmail": result[j].contactEmail || "noDataInPCV@db.com",
                    "userIdentity": ID,
                    "userName": result[j].contactName,
                    "voip": "000000"

                };
                dataRecord.push(data);
            }

            if (dataRecord.length > 0) {
                // console.log("INSERTING DATA IN IT_userProfile");
                await this.mongoUtil.emptyCollection('res_userProfile');
                await this.mongoUtil.insertRecords('res_userProfile', dataRecord);
                let query = { Type: "PCVisor" };
                // await this.mongoUtil.RemoveRecords('AllUserProfile', query);
                // await this.mongoUtil.insertRecords('AllUserProfile', dataRecord);
            }
            return "SUCCESS";
        } catch (e) {
            throw new Error(e)
        }
    };


    async executeUserSync(param) {
        try {

            const query = param.QUERY;
            let result = await this.MysqlUtil.executeQuery(query);
            //  console.log("Getting user data")
            let dataRecord = []; //User Record
            let data;
            for (let j = 0; j < result.length; j++) {
                data = {
                    "Type": "Flexi",
                    "id": result[j].id,
                    "EMPID": result[j].EMPID,
                    "userName": result[j].EMPName,
                    "userEmail": result[j].email,
                    "Designation": result[j].Designation,
                    "Department": result[j].Department,
                    "SubDepartment": result[j].Sub_Department,
                    "number": result[j].Mobile_Number,
                    "userIdentity": result[j].agentGuid
                };
                dataRecord.push(data);
            }

            if (dataRecord.length > 0) {
                //  console.log("INSERTING DATA IN Users");
                await this.mongoUtil.emptyCollection('Users');
                await this.mongoUtil.insertRecords('Users', dataRecord);
                let query = { Type: "Flexi" };
                await this.mongoUtil.RemoveRecords('AllUserProfile', query);
                await this.mongoUtil.insertRecords('AllUserProfile', dataRecord);
            }
            return "SUCCESS";
        } catch (e) {
            throw new Error(e)
        }
    };


   
    /////////////////////////////////////////////////////////////////////////////////////////
    async executeUserResource(param) {

        try {



            const query = param.QUERY;

            let result = await this.mssqlUtil.executeQuery(query);

             console.log("Getting user data", result[0])

             let dataRecord = []; //User Record

             let data;

            for (let j = 0; j < result.length; j++) {

                data = {

                    "Type": "resource",

                    "EMPID": result[j].EmpID,

                    "userName": result[j].UserName,

                    "userEmail": result[j].EmailID,

                    // "Designation": result[j].Designation,

                    // "Department": result[j].Department,

                    // "SubDepartment": result[j].Sub_Department,

                    "number": result[j].MobileNo,

                    "userIdentity": result[j].AgentGuid,

                    "EmployeeUID":result[j].EmployeeUID

                };

                dataRecord.push(data);

            }
            if (dataRecord.length > 0) {

                console.log("INSERTING DATA IN Users");

              // await this.mongoUtil.emptyCollection('Users');

              // await this.mongoUtil.insertRecords('Users', result);

              //  let query = { Type: "Flexi" };

              // await this.mongoUtil.RemoveRecords('resource_portal_data');

              console.log("&&&&&&&&&&&&&&&&&&&&&", typeof(result))

              // console.log(result)

              let rr = await this.mongoUtil.insertRecords('resource_portal_data', dataRecord);

              // console.log("rr",rr)

           }

        return result;

      } catch (e) {

          throw new Error(e)

      }

  };
    
    ///////////////////////////////////////////////////////////////////////////////////////////



    async executeMobPassword(data) {
        try {

            let result = await this.MysqlUtil.executeMobPassword(data);
            console.log("Updating user password")

            return result;
        } catch (e) {
            throw new Error(e)
        }
    };

    async executeResourcePassword(respassword, empid) {
        try {
            let query = `update Presales_User_Master set Pass = '${respassword}' where EmpID = '${empid}'`
            let result = await this.mssqlUtil.UpdateRespassword(query);
            console.log("hi i ma here")
            return "SUCCESS";
        } catch (e) {
            throw new Error(e)
        }
    };
    async TokenFetchJob() {
        //console.log("EXECUTING TOKEN SYNC SCHEDULER");
        try {
            var path = "http://10.83.150.241/demo/api_jsonrpc.php";
            var options = {
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                }
            }  // request headers
            var data = {
                "jsonrpc": "2.0",

                "method": "user.login",
                "params": {
                    "user": "Admin",
                    "password": "zabbix"
                },
                "id": 1,
                "auth": null
            }
            var result = await this.apiRequest.postRequest(path, data, options);
            var newtoken = result.result;
            return newtoken;
            console.log(newtoken)
        } catch (e) {
            throw new Error(e)
        }
    };

    //////////////////////////////////////crm////////////////////////////////////

    async TokenFetchJob2() {
        //console.log("EXECUTING TOKEN SYNC SCHEDULER");
        try {
            console.log("EXECUTING TOKEN SYNC SCHEDULER");
            let result = await this.email1.TokenSyncJob2();
            let dataRecord = []; //User Record
            let data;
            for (let j = 0; j < result.length; j++) {

                data = {
                    "Type": "CRM",
                    "userEmail": result[j].internalemailaddress
                }
                dataRecord.push(data);
            }
            //console.log("Hi i am in sync loop",dataRecord);

            if (dataRecord.length > 0) {
                console.log("INSERTING DATA IN CRM_userProfile");
                await this.mongoUtil.emptyCollection('CRM_userProfile');
                await this.mongoUtil.insertRecords('CRM_userProfile', dataRecord);
                let query = { Type: "CRM" };
                await this.mongoUtil.RemoveRecords('AllUserProfile', query);
                await this.mongoUtil.insertRecords('AllUserProfile', dataRecord);
            }
            //token = result;
            // let result1 = {"email":`${token}`}
            // console.log("inside it action list",token)
            // let variable = await this.webhookService.fetchProcedureListByAction(token)
            // console.log("testing the result",result);

            //2nd token in the above statement is the name of the column in DB
            // and first one is the array token defined one step above
            // return variable;
        } catch (e) {
            throw new Error(e)
        }
    };

    ///////////////////////////customer////////////////////////////////////

    async TokenFetchJob12() {
        //console.log("EXECUTING TOKEN SYNC SCHEDULER");
        try {
            console.log("EXECUTING TOKEN SYNC SCHEDULER");
            let result = await this.email.TokenSyncJob21();
            let dataRecord = []; //User Record
            let data;
            for (let j = 0; j < result.length; j++) {

                data = {
                    "customerName": result[j].name,
                    "userOwning": result[j].owninguser.fullname,
                    "userEmail": result[j].emailaddress1,
                    "customerWeburl": result[j].websiteurl,
                    "customerAddress": result[j].address1_composite,
                    "customerPincode": result[j].address1_postalcode,
                    "userEmployees": result[j].numberofemployees,
                    "usercreatedon": result[j].createdon,
                    "usermodifiedon": result[j].modifiedon
                }
                dataRecord.push(data);
            }
            console.log("Hi i am in sync loop", dataRecord);

            if (dataRecord.length > 0) {
                console.log("INSERTING DATA IN CRM_userProfile");
                await this.mongoUtil.emptyCollection('CRM_customerProfile');
                await this.mongoUtil.insertRecords('CRM_customerProfile', dataRecord);

            }
            //token = result;
            // let result1 = {"email":`${token}`}
            // console.log("inside it action list",token)
            // let variable = await this.webhookService.fetchProcedureListByAction(token)
            // console.log("testing the result",result);

            //2nd token in the above statement is the name of the column in DB
            // and first one is the array token defined one step above
            // return variable;
        } catch (e) {
            throw new Error(e)
        }
    };
    ///////////////////////////////////////get user function////////////////////////////////////////////////
    async getuserforaccess() {
        console.log("Inside Fetch user data")
        try {
            var result = await this.TokenFetchJob();
            console.log(result)
            var path = "http://10.83.150.241/demo/api_jsonrpc.php";
            var options = {
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                }
            }  // request headers
            var data = {

                "jsonrpc": "2.0",
                "method": "user.get",
                "params": {

                    "output": ["userid", "alias", "name", "surname", "roleid"],
                    "selectUsrgrps": "extend",
                    "getAccess": "extend",
                    "selectRole":"extend",
                },
                "auth": result,
                "id": 1
            }
            var result1 = await this.apiRequest.postRequest(path, data, options);
            //console.log(result1)
            var hostgroup = result1.result;
            console.log("user data is", hostgroup.length)


            //    for(let j=0; j<hostgroup[i].usrgrps.length; j++){
            //         console.log("hostgroup j is",hostgroup[i].usrgrps[j].usrgrpid)
            //     }
            //    }
            //console.log(hostgroup);
            let dataRecord = [];
            let userdata;
            for (let i = 0; i < hostgroup.length; i++) {
                for (let j = 0; j < hostgroup[i].usrgrps.length; j++) {
                    //console.log("user data is",hostgroup[i].userid)
                    //console.log("hostgroup j is",hostgroup[i].usrgrps[j].usrgrpid)
                    userdata = {
                        "Userid": hostgroup[i].userid,
                        "userName": hostgroup[i].alias,
                        "Useremailid": hostgroup[i].name,
                        "number": hostgroup[i].surname,
                        "users_status": hostgroup[i].users_status,
                        "Usergroupid": hostgroup[i].usrgrps[j].usrgrpid,
                        "Usergroupname": hostgroup[i].usrgrps[j].name,
                        "usertype": hostgroup[i].roleid

                    }
                    //   console.log("userdata is",userdata)
                    dataRecord.push(userdata);
                }
            }
            // console.log("Hi i am in sync loop",dataRecord);

            if (dataRecord.length > 0) {
                // console.log("INSERTING DATA IN Hawkeye_User");
                await this.mongoUtil.emptyCollection('Hawkeye_Useraccess');
                await this.mongoUtil.insertRecords('Hawkeye_Useraccess', dataRecord);

            }

        }
        catch (e) {
            throw new Error(e)
        }
    };
    ///////////////////////////get auditlogon time function///////////////
    async getuserlastlogin() {
        console.log("Inside Fetch user auditlogin data")
        try {
            await this.mongoUtil.emptyCollection('Hawkeye_userlogin');
            let query = {};
            let fields = {};
            let user = await this.mongoUtil.findRecord("Hawkeye_User", query, fields);
            for (let i = 0; i < user.length; i++) {
                let userid = (user[i].Userid);
                var result = await this.TokenFetchJob();
                //console.log(result)
                var path = "http://10.83.150.241/demo/api_jsonrpc.php";
                var options = {
                    headers: {
                        "Content-Type": "application/json",
                        "Accept": "application/json"
                    }
                }  // request headers
                var data = {

                    "jsonrpc": "2.0",
                    "method": "auditlog.get",
                    "params": {
                        "userids": userid,
                        "output": ["auditid", "clock", "userid", "action", "ip"],
                        "filter": {
                            "action": '3'
                        },
                        "sortfield": ["clock"],
                        "sortorder": "DESC",
                        "limit": 1


                    },
                    "auth": result,
                    "id": 1
                }
                var result1 = await this.apiRequest.postRequest(path, data, options);
                var hostgroup = result1.result;
                let dataRecord = [];
                let userdata;
                if (hostgroup[0] !== undefined) {
                    userdata = {
                        "userid": userid,
                        "logintime": hostgroup[0].clock

                    }
                    dataRecord.push(userdata);
                    if (dataRecord.length > 0) {

                        await this.mongoUtil.insertRecords('Hawkeye_userlogin', dataRecord);

                    }
                }
                else {
                    userdata = {
                        "userid": userid,
                        "logintime": "Never logged in"

                    }
                    dataRecord.push(userdata);
                    if (dataRecord.length > 0) {
                        await this.mongoUtil.insertRecords('Hawkeye_userlogin', dataRecord);

                    }
                }
            }
        }
        catch (e) {
            throw new Error(e)
        }
    };
    /////////////////////////get user syncing verification function//////////////////
    async getuser() {
        console.log("Inside Fetch user data")
        try {
            var result = await this.TokenFetchJob();
            console.log(result)
            var path = "http://10.83.150.241/demo/api_jsonrpc.php";
            var options = {
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                }
            }  // request headers
            var data = {

                "jsonrpc": "2.0",
                "method": "user.get",
                "params": {

                    "output": ["userid", "alias", "name", "surname", "roleid"],
                    "selectUsrgrps": "extend",
                    "getAccess": "extend",
                    "selectRole":"extend",
                },
                "auth": result,
                "id": 1
            }
            var result1 = await this.apiRequest.postRequest(path, data, options);
            console.log("hms result ", result1);
            var hostgroup = result1.result;
            //   console.log("user data is",hostgroup.length)
            let dataRecord = [];
            let userdata;

            for (let j = 0; j < hostgroup.length; j++) {
            // console.log("USERTYPE" , hostgroup[j].type)

                userdata = {
                    "Type": "HMS",
                    "Userid": hostgroup[j].userid,
                    "userName": hostgroup[j].alias,
                    "userEmail": hostgroup[j].name,
                    "number": hostgroup[j].surname,
                    "users_status": hostgroup[j].users_status,
                    "usertype": hostgroup[j].roleid
                }
                //    console.log("userdata is",userdata)
                dataRecord.push(userdata);
            }
            //  console.log("Hi i am in sync loop",dataRecord);

            if (dataRecord.length > 0) {
                console.log("INSERTING DATA IN Hawkeye_User");
                await this.mongoUtil.emptyCollection('Hawkeye_User');
                await this.mongoUtil.insertRecords('Hawkeye_User', dataRecord);
                let query = { Type: "HMS" };
                await this.mongoUtil.RemoveRecords('AllUserProfile', query);
                await this.mongoUtil.insertRecords('AllUserProfile', dataRecord);
                console.log("done inserting data for hms")

            }

        }
        catch (e) {
            throw new Error(e)
        }
    };



    ///////////////////////////////////////////////////////////////////////////////////////////

    async accesstoken() {
        let path = "https://account.uipath.com/oauth/token";

        let options = {
            headers: {

                "Content-Type": "application/json",

                "X-UIPATH-TenantName": "Preet"
            }

        }  // request header

        let data = {

            "grant_type": "refresh_token",

            "client_id": "8DEv1AMNXczW3y4U15LL3jYf62jK93n5",

            "refresh_token": "ADdO06gT_a5AFs7N5qZMaC_jmX0V0R4ViXMQVAS8XThxD"

        }

        let result1 = await this.apiRequest.postRequest(path, data, options);

        //    console.log("api ressssAAAa", result1.access_token)
        let access_token = result1.access_token
        console.log(access_token)

        return access_token

    }


    async folders() {

        let token = await this.accesstoken()
        // console.log("component token", token)

        let path = "https://cloud.uipath.com/hitacqobltpm/DefaultTenant/odata/Folders";

        let options = {
            headers: {

                "Content-Type": "application/json",

                "X-UIPATH-TenantName": "DefaultTenant",

                "Authorization": `Bearer  ${token}`
            }

        }  // request header

        let data = {

            "grant_type": "refresh_token",

            "client_id": "8DEv1AMNXczW3y4U15LL3jYf62jK93n5",

            "refresh_token": "ADdO06gT_a5AFs7N5qZMaC_jmX0V0R4ViXMQVAS8XThxD"

        }

        let folder = await this.apiRequest.getRequest(path, options);


        await this.mongoUtil.emptyCollection('UIPATH_Data');
        await this.mongoUtil.insertRecords('UIPATH_Data', folder.value);


        return folder

    }

    async run_process() {

        let token = await this.accesstoken()
        let folder_data = await this.folders()


        await this.mongoUtil.emptyCollection('UIPATH_FolderData');
        for (let i = 0; i < folder_data.value.length; i++) {

            let ID_list = []

            let ID = folder_data.value[i].Id

            let path = "https://cloud.uipath.com/hitacqobltpm/DefaultTenant/odata/Releases?filter=Processkey";

            let options = {
                headers: {

                    "Content-Type": "application/json",

                    "X-UIPATH-TenantName": "DefaultTenant",

                    "Authorization": `Bearer  ${token}`,

                    "X-UIPATH-OrganizationUnitId": ID
                }

            }
            // request header

            let data = {

                "grant_type": "refresh_token",
    
                "client_id": "8DEv1AMNXczW3y4U15LL3jYf62jK93n5",
    
                "refresh_token": "ADdO06gT_a5AFs7N5qZMaC_jmX0V0R4ViXMQVAS8XThxD"
    
            }
            // console.log("abc2",ID)

            var folder_result = await this.apiRequest.getRequest(path, options);


            console.log("api result", folder_result)

            let dataRecord = [];
            let store_data;

            for (let j = 0; j < folder_result.value.length; j++) {

                store_data = {
                    "process_key": folder_result.value[j].Key,
                    "process_name": folder_result.value[j].Name,
                    "Folder_ID": ID

                }

                dataRecord.push(store_data);
            }



            await this.mongoUtil.insertRecords('UIPATH_FolderData', dataRecord);

        }


    }

    async triggerProcess(procedure) {

        let token = await this.accesstoken()
        // let folder_data = await this.folders()

        // let ID = folder_data.folder_id.value[1].Id

        let path = "https://cloud.uipath.com/hitacqobltpm/DefaultTenant/odata/Jobs/UiPath.Server.Configuration.OData.StartJobs";

        // console.log(folder_data.Id)
        let options = {
            headers: {

                "Content-Type": "application/json",

                "X-UIPATH-TenantName": "DefaultTenant",

                "Authorization": `Bearer  ${token}`,

                "X-UIPATH-OrganizationUnitId": procedure.Folder_ID
            }

        }  // request header



        let data = {

            "startInfo": {

                "ReleaseKey": `${procedure.process_key}`,

                "Strategy": "ModernJobsCount",

                "JobsCount": 1,

                "InputArguments": "{}"

            }

        }
        var result1 = await this.apiRequest.postRequest(path, data, options);



        //    console.log("api result",result1)

        let process_ID = result1.value[0].Id
        let process_status = result1.value[0].State
        let process_name = result1.value[0].ReleaseName
        console.log("process_ID", process_ID)

        let datarecord = [];

        let process_data = {
            "process_ID": process_ID,
            "process_name": process_name,
            "process_status": process_status,
            // "userEmail": userEmail
        }


        datarecord.push(process_data);


        await this.mongoUtil.insertRecords('process_status_record', datarecord);


        return result1, process_ID


    }

    async fetchPId() {
        console.log("FETCHING PROCESS ID");


        let query = {};

        let fields = {};
        let result = await this.mongoUtil.findRecord("process_status_record", query, fields);
        let P_ID = []

        let data;
        // console.log(result.length)
        for (let i = 0; i < result.length; i++) {
            P_ID.push(result[i].process_ID)
        }





        //   data.push(P_ID)
        //   console.log(P_ID)
        return P_ID

    };

    async job_status() {

        let token = await this.accesstoken()
        let process_ID = await this.fetchPId()
        let d = new Date();
        d.setDate(d.getDate() - 3);
        console.log("abcc",d.toISOString());

        let path = "https://cloud.uipath.com/hitacqobltpm/DefaultTenant/odata/Jobs?$filter=CreationTime gt " + d.toISOString();


        let options = {
            headers: {

                "Content-Type": "application/json",

                "X-UIPATH-TenantName": "Preet",

                "Authorization": `Bearer  ${token}`,

            }

        }

        let process = await this.apiRequest.getRequest(path, options);
        // let api_data_id = [];
        // let api_data_status = [];
        // let matched_id = [];
        // console.log(process)
        for (let i = 0 ; i < process_ID.length ; i++){
        for (let j = 0; j < process.value.length; j++) 
            {   
                if(process_ID[i]==process.value[j].Id){
                    // console.log(process.value[j].State)
                
                let query = { process_ID : process_ID[i] }
                let values = { $set: { process_status : process.value[j].State } }
                await this.mongoUtil.updateRecords("process_status_record", query, values);

            }}}
             
        //     for (let j = 0 ; j < process_ID.length ; j++){
        //     for (let i = 0; i < process.value.length; i++) {

        //         { if(process_ID[j]==api_data_id[i]){
        //             api_data_status.push(process.value[i].State)
        //             matched_id.push(process.value[i].Id)
        //             }
    
        //         }

        // }}
        // console.log(api_data_id)
        // console.log(process_ID)


        let current_status = process.value[process.value.length - 1].State


        // for (let i = 0; i < process_ID.length  ; i++) {
            
        //         // console.log(temp)                                   //to update status in mongodb
                
        //         let query = { process_ID : process_ID[i] }
        //         let values = { $set: { process_status : api_data_status[i] } }
        //         console.log(api_data_status[i])
        //         // console.log(i,temp)
        //         // console.log(process.value[i].State,process.value[i].Id);
        //         // console.log(i , temp)
        //         await this.mongoUtil.updateRecords("process_status_record", query, values);

               // console.log(i , temp)

        // }


        return current_status

    }


    async fetch_process_status() {

        let query = {};

        let fields = {};
        let result = await this.mongoUtil.findRecord("process_status_record", query, fields);
        

        

        return result

    }






    ////////////////////////////////get host syncing data////////////////////////////////////
    async gethostsyncing() {
        console.log("Inside get host syncing data")
        try {
            var result = await this.TokenFetchJob();
            // console.log(result)
            var path = "http://10.83.150.241/demo/api_jsonrpc.php";
            var options = {
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                }
            }  // request headers
            var data = {

                "jsonrpc": "2.0",
                "method": "host.get",
                "params": {

                    "output": ["hostid", "host", "status"],
                    "selectGroups": "extend"

                },
                "auth": result,
                "id": 1
            }
            var result1 = await this.apiRequest.postRequest(path, data, options);
            //  console.log(result1)
            var hostgroup = result1.result;
            //  console.log(hostgroup);
            let dataRecord = [];
            let userdata;
            for (let j = 0; j < hostgroup.length; j++) {
                for (let i = 0; i < hostgroup[j].groups.length; i++) {
                    let hostname = hostgroup[j].host.toUpperCase();
                    hostname = hostname.replace(" - ", "-");
                    hostname = hostname.replace("- ", "-");
                    hostname = hostname.replace(" -", "-");
                    console.log(hostname)

                    userdata = {
                        "hostid": hostgroup[j].hostid,
                        "hostname": hostname,
                        "hoststatus": hostgroup[j].status,
                        "groupid": hostgroup[j].groups[i].groupid

                    }
                    dataRecord.push(userdata);
                }
            }
            //    console.log("Hi i am in sync loop",dataRecord);

            if (dataRecord.length > 0) {
                //  console.log("INSERTING DATA IN Hawkeye_host");
                await this.mongoUtil.emptyCollection('Hawkeye_host');
                await this.mongoUtil.insertRecords('Hawkeye_host', dataRecord);
            }

        }
        catch (e) {
            throw new Error(e)
        }
    };

    //////////////////////////get hostgroup data///////////////////////////////////////////////////
    async gethostgroup() {
        console.log("Inside Fetch host group data")
        try {
            var result = await this.TokenFetchJob();
            // console.log(result)
            var path = "http://10.83.150.241/demo/api_jsonrpc.php";
            var options = {
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                }
            }  // request headers
            var data = {

                "jsonrpc": "2.0",
                "method": "hostgroup.get",
                "params": {
                    "output": ["groupid", "name"]
                },
                "auth": result,
                "id": 1
            }
            var result1 = await this.apiRequest.postRequest(path, data, options);
            var hostgroup = result1.result;

            let dataRecord = [];
            let userdata;
            for (let j = 0; j < hostgroup.length; j++) {

                let groupname = hostgroup[j].name.toUpperCase();
                groupname = groupname.replace(" - ", "-");
                groupname = groupname.replace("- ", "-");
                groupname = groupname.replace(" -", "-");

                userdata = {
                    "groupid": hostgroup[j].groupid,
                    "groupname": groupname

                }
                dataRecord.push(userdata);
            }
            // console.log("Hi i am in sync loop",dataRecord);

            if (dataRecord.length > 0) {
                //  console.log("INSERTING DATA IN Hawkeye_User");
                await this.mongoUtil.emptyCollection('Hawkeye_hostgroup');
                await this.mongoUtil.insertRecords('Hawkeye_hostgroup', dataRecord);
            }

        }
        catch (e) {
            throw new Error(e)
        }
    };

    ///////////////////////////////////////////////////////////////////////////////////////////////
    ///////////////////////////////get host details/////////////////////////////////////////////////
    async gethost(hostgroupid) {
        console.log("Inside Fetch host details data")
        try {
            var result = await this.TokenFetchJob();
            //console.log(result)
            console.log("get host details user query", hostgroupid)
            var path = "http://10.83.150.241/demo/api_jsonrpc.php";
            var options = {
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                }
            }  // request headers
            var data = {

                "jsonrpc": "2.0",
                "method": "host.get",
                "params": {
                    "groupids": hostgroupid,
                    "output": ["hostid", "host", "status"]

                },
                "auth": result,
                "id": 1
            }
            //  console.log(data)
            var result1 = await this.apiRequest.postRequest(path, data, options);
            // console.log(result1)
            var host = result1.result;
            return host;
        }
        catch (e) {
            throw new Error(e)
        }
    };
    ////////////////////gethost enable /////////////////////
    async gethostenable(hostgroupid) {
        console.log("Inside Fetch host details data")
        try {
            var result = await this.TokenFetchJob();
            //console.log(result)
            console.log("get host details user query", hostgroupid)
            var path = "http://10.83.150.241/demo/api_jsonrpc.php";
            var options = {
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                }
            }  // request headers
            var data = {

                "jsonrpc": "2.0",
                "method": "host.get",
                "params": {
                    "groupids": hostgroupid,
                    "output": ["hostid", "host", "status"],
                    "filter": {
                        "status": 1
                    }

                },
                "auth": result,
                "id": 1
            }
            //  console.log(data)
            var result1 = await this.apiRequest.postRequest(path, data, options);
            console.log(result1)
            var host = result1.result;
            return host;
        }
        catch (e) {
            throw new Error(e)
        }
    };

    async gethostdisable(hostgroupid) {
        console.log("Inside Fetch host details data")
        try {
            var result = await this.TokenFetchJob();
            //console.log(result)
            console.log("get host details user query", hostgroupid)
            var path = "http://10.83.150.241/demo/api_jsonrpc.php";
            var options = {
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                }
            }  // request headers
            var data = {

                "jsonrpc": "2.0",
                "method": "host.get",
                "params": {
                    "groupids": hostgroupid,
                    "output": ["hostid", "host", "status"],
                    "filter": {
                        "status": 0
                    }

                },
                "auth": result,
                "id": 1
            }
            //  console.log(data)
            var result1 = await this.apiRequest.postRequest(path, data, options);
            // console.log(result1)
            var host = result1.result;
            return host;
        }
        catch (e) {
            throw new Error(e)
        }
    };
    ///////////////////////////////CPU Utilization///////////////////////////
    async getcpuUtil(hostid) {
        console.log("Inside Fetch Cpu utilization data")
        try {
            var result = await this.TokenFetchJob();
            //console.log(result)
            //console.log("get host details user query",hostgroupid)
            var path = "http://10.83.150.241/demo/api_jsonrpc.php";
            var options = {
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                }
            }  // request headers
            var data = {

                "jsonrpc": "2.0",
                "method": "item.get",
                "params": {


                    "output": ["itemid", "name", "lastvalue", "key_"],

                    "filter": {

                        "hostid": hostid
                    },
                    "search": {
                        "key_": "cpu.util"
                    },
                },
                "auth": result,
                "id": 1
            }
            //   console.log(data)
            var result1 = await this.apiRequest.postRequest(path, data, options);
            // console.log(result1)
            var host = result1.result;
            return host;
        }
        catch (e) {
            throw new Error(e)
        }
    };
    ///////////////////////////get memory utilization sync///////////////
    async getmemoryUtil(hostid) {
        console.log("Inside Fetch memory utilization data")
        try {
            var result = await this.TokenFetchJob();
            //console.log(result)
            //console.log("get host details user query",hostgroupid)
            var path = "http://10.83.150.241/demo/api_jsonrpc.php";
            var options = {
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                }
            }  // request headers
            var data = {

                "jsonrpc": "2.0",
                "method": "item.get",
                "params": {


                    "output": ["itemid", "name", "lastvalue"],

                    "filter": {
                        "key_": "vm.memory.size[pused]",
                        "hostid": hostid
                    },

                },
                "auth": result,
                "id": 1
            }
            //   console.log(data)
            var result1 = await this.apiRequest.postRequest(path, data, options);
            //return result1;
            var host = result1.result;
            console.log(result1, host)
            return host;
        }
        catch (e) {
            throw new Error(e)
        }
    };
    //////////////////////////////get severity wise problems//////////////////////////////
    async getproblemUtil(hostid) {
        console.log("Inside problem of host data")
        try {
            var result = await this.TokenFetchJob();
            //console.log(result)
            //console.log("get host details user query",hostgroupid)
            var path = "http://10.83.150.241/demo/api_jsonrpc.php";
            var options = {
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                }
            }  // request headers
            var data = {

                "jsonrpc": "2.0",
                "method": "problem.get",
                "params": {


                    "output": ["eventid", "name", "severity", "clock", "r_clock"],
                    "selectAcknowledges": "extend",
                    "hostids": hostid,
                    "limit": 10
                },
                "auth": result,
                "id": 1
            }
            // console.log(data)
            var result1 = await this.apiRequest.postRequest(path, data, options);
            // console.log(result1)
            var host = result1.result;
            //  console.log(host)
            return host;
        }
        catch (e) {
            throw new Error(e)
        }
    };
    /////////////////////top 5 CPU UTIL/////////////////////////////////////////
    async getTopCpuUtil() {
        console.log("Inside top 5 cpu utilization data")
        try {
            var result = await this.TokenFetchJob();
            //console.log(result)
            //console.log("get host details user query",hostgroupid)
            var path = "http://10.83.150.241/demo/api_jsonrpc.php";
            var options = {
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                }
            }  // request headers
            var data = {

                "jsonrpc": "2.0",
                "method": "item.get",
                "params": {


                    "output": ["itemid", "name", "lastvalue"],

                    "filter": {
                        "key_": "system.cpu.util"

                    },
                    "sortfield": "name"



                },
                "auth": result,
                "id": 1
            }
            console.log(data)
            var result1 = await this.apiRequest.postRequest(path, data, options);
            console.log(result1)
            var host = result1.result;
            //return host;
        }
        catch (e) {
            throw new Error(e)
        }
    };
    /////////////////////////icmp ping availability////////////////////////////////////
    async geticmpPingUtil(hostid) {
        console.log("Inside icmp ping data")
        try {
            var result = await this.TokenFetchJob();
            //console.log(result)
            //console.log("get host details user query",hostgroupid)
            var path = "http://10.83.150.241/demo/api_jsonrpc.php";
            var options = {
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                }
            }  // request headers
            var data = {

                "jsonrpc": "2.0",
                "method": "item.get",
                "params": {


                    "output": ["itemid", "name", "lastvalue", "key_"],

                    "filter": {
                        "hostid": hostid
                    },
                    "search": {
                        "key_": "icmp"
                    },
                },
                "auth": result,
                "id": 1
            }
            console.log(data)
            var result1 = await this.apiRequest.postRequest(path, data, options);
            console.log(result1)
            var host = result1.result;
            return host;
        }
        catch (e) {
            throw new Error(e)
        }
    };
    /////////////////////Top 5 Memory Utilization////////////////////////////////////////
    async getTopMemoryUtil() {
        console.log("Inside top 5 memory utilization data")
        try {
            var result = await this.TokenFetchJob();
            //console.log(result)
            //console.log("get host details user query",hostgroupid)
            var path = "http://10.83.150.241/demo/api_jsonrpc.php";
            var options = {
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                }
            }  // request headers
            var data = {

                "jsonrpc": "2.0",
                "method": "item.get",
                "params": {


                    "output": ["itemid", "name", "lastvalue"],

                    "filter": {
                        "key_": "vm.memory.size[pused]"

                    },
                    "sortfield": "name"



                },
                "auth": result,
                "id": 1
            }
            console.log(data)
            var result1 = await this.apiRequest.postRequest(path, data, options);
            console.log(result1)
            var host = result1.result;
            //return host;
        }
        catch (e) {
            throw new Error(e)
        }
    };
    /////////////////////////TOP 5 triggers/////////////////////////////////////////////
    async getTopTriggerUtil() {
        console.log("Inside top 5 triggers data")
        try {
            var result = await this.TokenFetchJob();
            //console.log(result)
            //console.log("get host details user query",hostgroupid)
            var path = "http://10.83.150.241/demo/api_jsonrpc.php";
            var options = {
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                }
            }  // request headers
            var data = {

                "jsonrpc": "2.0",
                "method": "problem.get",
                "params": {

                    "output": "extend"
                    //"output": ["eventid","name","severity","hostid"],
                },
                "auth": result,
                "id": 1
            }
            console.log(data)
            var result1 = await this.apiRequest.postRequest(path, data, options);
            console.log(result1)
            var host = result1.result;
            //return host;
        }
        catch (e) {
            throw new Error(e)
        }
    };
    ////////////////////////////////////////////////////////////////////////////////////////////////
    async getusergroup() {
        console.log("Inside host group creation sync")
        try {
            var result = await this.TokenFetchJob();
            //console.log(result)
            //console.log("get host details user query",param.USER_QUERY)
            var path = "http://10.83.150.241/demo/api_jsonrpc.php";
            var options = {
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                }
            }  // request headers
            var data = {

                "jsonrpc": "2.0",
                "method": "usergroup.get",
                "params": {

                    "output": "extend",
                    "status": 0,
                    "selectRights": "extend",
                    "selectUsers": "extend"
                },
                "auth": result,
                "id": 1
            }
            var result1 = await this.apiRequest.postRequest(path, data, options);
            //  console.log(result1)
            var host = result1.result;
            //console.log(host)
            let dataRecord = [];
            let userdata;
            for (let i = 0; i <= 1; i++) {
                userdata = {
                    "Usergroupid": host[i].usrgrpid,
                    "Usergroupname": host[i].name,

                }
                dataRecord.push(userdata);
            }
            for (let i = 2; i < host.length; i++) {
                console.log("host is", host[0])
                for (let j = 0; j < host[i].rights.length; j++) {
                    console.log("hostgroup j is", host[0].rights[0])

                    userdata = {
                        "Usergroupid": host[i].usrgrpid,
                        "Usergroupname": host[i].name,
                        "permission": host[i].rights[j].permission,
                        "hostgroupid": host[i].rights[j].id

                    }
                    dataRecord.push(userdata);
                }
            }
            //console.log("Hi i am in sync loop",dataRecord);

            if (dataRecord.length > 0) {
                //  console.log("INSERTING DATA IN Hawkeye_User");
                await this.mongoUtil.emptyCollection('Hawkeye_usergroup');
                await this.mongoUtil.insertRecords('Hawkeye_usergroup', dataRecord);
            }
        }
        catch (e) {
            throw new Error(e)
        }
    };
    ///////////////////////////////////////hostgroup creation///////////////////////////////////////
    async hostgroupcreation(param) {
        console.log("Inside host group creation sync")
        try {
            var result = await this.TokenFetchJob();
            //console.log(result)
            //console.log("get host details user query",param.USER_QUERY)
            var path = "http://10.83.150.241/demo/api_jsonrpc.php";
            var options = {
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                }
            }  // request headers
            var data = {

                "jsonrpc": "2.0",
                "method": "hostgroup.create",
                "params": {
                    "name": param.any
                },
                "auth": result,
                "id": 1
            }
            var result1 = await this.apiRequest.postRequest(path, data, options);
            console.log(result1)
            var host = result1.result;
            console.log(host)
            return result1;
        }
        catch (e) {
            throw new Error(e)
        }
    };
    //////////////////////////host group deletion//////////////////////////////////////////
    async hostgroupdeletion(param) {
        console.log("Inside host group deletion sync")
        try {
            var result = await this.TokenFetchJob();
            //console.log(result)
            console.log("get host details user query", param.any)
            var path = "http://10.83.150.241/demo/api_jsonrpc.php";
            var options = {
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                }
            }  // request headers
            var data = {
                "jsonrpc": "2.0",
                "method": "hostgroup.delete",
                "params": [
                    param.any
                ],
                "auth": result,
                "id": 1
            }
            var result1 = await this.apiRequest.postRequest(path, data, options);
            console.log(result1)

            var host = result1.result;
            console.log(host)
            return result1;
        }
        catch (e) {
            throw new Error(e)
        }
    };
    /////////////////////////////zabbixactionlist sync//////////////////////////////////////
    async enablezabbixactionlist(param) {
        console.log("Inside ENABLE zabbix action sync")
        try {
            var result = await this.TokenFetchJob();
            //console.log(result)
            //console.log("get host details user query",param.USER_QUERY)
            var path = "http://10.83.150.241/demo/api_jsonrpc.php";
            var options = {
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                }
            }  // request headers
            var data = {
                "jsonrpc": "2.0",
                "method": "action.get",
                "params": {

                    "output": ["actionid", "name", "status"],
                    "filter": {
                        "status": 1
                    }

                },
                "auth": result,
                "id": 1
            }
            var result1 = await this.apiRequest.postRequest(path, data, options);
            console.log("result enable action", result1)
            var host = result1.result;
            let dataRecord;
            let userdata;
            let query_statement;
            for (let j = 0; j < host.length; j++) {
                userdata = {
                    "name": host[j].name.toUpperCase(),
                    "actionid": host[j].actionid,
                    "status": host[j].status,
                    "mode": "ENABLE"
                }
                query_statement = { "actionid": host[j].actionid }
                dataRecord = { $set: userdata }
                await this.mongoUtil.updateRecordWithUpsert('zabbix_action', query_statement, dataRecord);
                console.log("done inserting data for zabbix_action");
                // dataRecord.push(userdata);
            }
            //  console.log("Hi i am in sync loop",dataRecord);

            // if (dataRecord.length > 0) {
            //     console.log("INSERTING DATA IN Zabbix action list");
            //     // await this.mongoUtil.emptyCollection('zabbix_action');
            //     await this.mongoUtil.insertRecords('zabbix_action', dataRecord);
            //     // console.log("done inserting data for zabbix_action")
            // }

            return host;
        }
        catch (e) {
            throw new Error(e)
        }
    };
    ////////////////////////////disable zabbixactionlist/////////////////////////////////////
    async disablezabbixactionlist(param) {
        console.log("Inside DISABLE zabbix action sync")
        try {
            var result = await this.TokenFetchJob();
            //console.log(result)
            //console.log("get host details user query",param.USER_QUERY)
            var path = "http://10.83.150.241/demo/api_jsonrpc.php";
            var options = {
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                }
            }  // request headers
            var data = {
                "jsonrpc": "2.0",
                "method": "action.get",
                "params": {

                    "output": ["actionid", "name", "status"],
                    "filter": {
                        "status": 0
                    }

                },
                "auth": result,
                "id": 1
            }
            var result1 = await this.apiRequest.postRequest(path, data, options);
            console.log("result disable", result1)
            var host = result1.result;
            let dataRecord;
            let userdata;
            let query_statement;

            for (let j = 0; j < host.length; j++) {
                userdata = {
                    "name": host[j].name.toUpperCase(),
                    "actionid": host[j].actionid,
                    "status": host[j].status,
                    "mode": "DISABLE"
                }
                query_statement = { "actionid": host[j].actionid }
                dataRecord = { $set: userdata }
                await this.mongoUtil.updateRecordWithUpsert('zabbix_action', query_statement, dataRecord);
                console.log("done inserting data for zabbix_action");
            }
            //  console.log("Hi i am in sync loop",dataRecord);

            // if (dataRecord.length > 0) {
            //     console.log("INSERTING DATA IN Zabbix action list");
            //     // await this.mongoUtil.emptyCollection('zabbix_action');
            //     await this.mongoUtil.insertRecords('zabbix_action', dataRecord);
            //     console.log("done inserting data for zabbix_action")
            // }

            return host;
        }
        catch (e) {
            throw new Error(e)
        }
    };
    /////////////////////////zabbixaction enable////////////////////////////////////////////
    async zabbixactionenable(param) {
        console.log("Inside zabbix action sync")
        try {
            var result = await this.TokenFetchJob();
            //console.log(result)
            //console.log("get host details user query",param.USER_QUERY)
            var path = "http://10.83.150.241/demo/api_jsonrpc.php";
            var options = {
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                }
            }  // request headers
            var data = {
                "jsonrpc": "2.0",
                "method": "action.update",
                "params": {
                    "actionid": param.any,
                    "status": "0"
                },
                "auth": result,
                "id": 1
            }
            var result1 = await this.apiRequest.postRequest(path, data, options);
            console.log(result1);
            var host = result1.result;
            return host;
        }
        catch (e) {
            throw new Error(e)
        }
    };
    //////////////////////////////zabbixactiondisable sync //////////////////////////////////
    async zabbixactiondisable(param) {
        console.log("Inside zabbix action disable sync")
        try {
            var result = await this.TokenFetchJob();
            //console.log(result)
            console.log("get host details user query", param.any)
            var path = "http://10.83.150.241/demo/api_jsonrpc.php";
            var options = {
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                }
            }  // request headers
            var data = {
                "jsonrpc": "2.0",
                "method": "action.update",
                "params": {
                    "actionid": param.any,
                    "status": "1"
                },
                "auth": result,
                "id": 1
            }
            var result1 = await this.apiRequest.postRequest(path, data, options);
            var host = result1.result;
            return host;
        }
        catch (e) {
            throw new Error(e)
        }
    };
    /////////////////////Host Enable//////////////////////////////////////////////////////////
    async zabbixhostenable(hostid) {
        console.log("Inside zabbix host enable sync")
        try {
            var result = await this.TokenFetchJob();
            //console.log(result)
            //console.log("get host details user query",param.USER_QUERY)
            var path = "http://10.83.150.241/demo/api_jsonrpc.php";
            var options = {
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                }
            }  // request headers
            var data = {
                "jsonrpc": "2.0",
                "method": "host.update",
                "params": {
                    "hostid": hostid,
                    "status": "0"
                },
                "auth": result,
                "id": 1
            }
            var result1 = await this.apiRequest.postRequest(path, data, options);
            var host = result1.result;
            //  console.log(result1)
            return result1;
        }
        catch (e) {
            throw new Error(e)
        }
    };
    //////////////////////////////////////host disable////////////////////////////////////////////
    async zabbixhostdisable(param) {
        console.log("Inside zabbix host disable sync")
        try {
            var result = await this.TokenFetchJob();
            //console.log(result)
            //console.log("get host details user query",param.USER_QUERY)
            var path = "http://10.83.150.241/demo/api_jsonrpc.php";
            var options = {
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                }
            }  // request headers
            var data = {
                "jsonrpc": "2.0",
                "method": "host.update",
                "params": {
                    "hostid": param.any,
                    "status": "1"
                },
                "auth": result,
                "id": 1
            }
            var result1 = await this.apiRequest.postRequest(path, data, options);
            var host = result1.result;
            return result1;
        }
        catch (e) {
            throw new Error(e)
        }
    };
    //////////////////get alert for host ////////////////////////////////////////////
    async getzabbixalert() {
        console.log("Inside get alert for sync")
        try {
            var result = await this.TokenFetchJob();
            //console.log(result)
            //console.log("get host details user query",param.USER_QUERY)
            var path = "http://10.83.150.241/demo/api_jsonrpc.php";
            var options = {
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                }
            }  // request headers
            var data = {
                "jsonrpc": "2.0",
                "method": "alert.get",
                "params": {

                    "output": ["alertid", "subject"]

                },
                "auth": result,
                "id": 1
            }
            var result1 = await this.apiRequest.postRequest(path, data, options);
            console.log("result1", result1)
            var host = result1.result;
            console.log(host);
        }
        catch (e) {
            throw new Error(e)
        }
    };
    //////////////////////////////get zabbix media type////////////////////////////////////////
    async getzabbixmedia() {
        console.log("Inside get zabbix media sync")
        try {
            var result = await this.TokenFetchJob();
            //console.log(result)
            //console.log("get host details user query",param.USER_QUERY)
            var path = "http://10.83.150.241/demo/api_jsonrpc.php";
            var options = {
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                }
            }  // request headers
            var data = {
                "jsonrpc": "2.0",
                "method": "mediatype.get",
                "params": {

                    "output": ["mediatypeid", "type", "name", "status"],
                    "filter": {
                        "status": 1
                    }

                },
                "auth": result,
                "id": 1
            }
            var result1 = await this.apiRequest.postRequest(path, data, options);
            console.log("result1", result1.result)
            var host = result1.result;
            console.log("result1", result1.result , typeof(host))
            let dataRecord;
            let userdata;
            let query_statement;
            if(host){
            for (let j = 0; j < host.length; j++) {
                userdata = {
                    "name": host[j].name.toUpperCase(),
                    "mediatypeid": host[j].mediatypeid,
                    "status": host[j].status,
                    "mode": "ENABLE",
                    "type": host[j].type
                }
                query_statement = { "mediatypeid": host[j].mediatypeid }
                dataRecord = { $set: userdata }
                await this.mongoUtil.updateRecordWithUpsert('media_action', query_statement, dataRecord);
                console.log("done inserting data for media_action");
            }
            return host;
        }
        return host;
        }
        catch (e) {
            throw new Error(e)
        }
    }
    /////////////////////get zabbix media list for disable////////////////
    async getzabbixmediadisablelist() {
        console.log("Inside get zabbix media sync")
        try {
            var result = await this.TokenFetchJob();
            //console.log(result)
            //console.log("get host details user query",param.USER_QUERY)
            var path = "http://10.83.150.241/demo/api_jsonrpc.php";
            var options = {
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                }
            }  // request headers
            var data = {
                "jsonrpc": "2.0",
                "method": "mediatype.get",
                "params": {

                    "output": ["mediatypeid", "type", "name", "status"],
                    "filter": {
                        "status": 0
                    }

                },
                "auth": result,
                "id": 1
            }
            var result1 = await this.apiRequest.postRequest(path, data, options);
            console.log("result1", result1)
            var host = result1.result;
            console.log("type n lenght", typeof(host), host.length);
            let dataRecord;
            let userdata;
            let query_statement;
            if(host){
            for (let j = 0; j < host.length; j++) {
                console.log("media action db entry ", j , host[j].mediatypeid)
                userdata = {
                    "name": host[j].name.toUpperCase(),
                    "mediatypeid": host[j].mediatypeid,
                    "status": host[j].status,
                    "mode": "DISABLE",
                    "type": host[j].type
                }
                query_statement = {"mediatypeid": host[j].mediatypeid}
                dataRecord = { $set: userdata }
                await this.mongoUtil.updateRecordWithUpsert('media_action', query_statement, dataRecord);
                console.log("done inserting data for media_action" , userdata);
            }
            return host;
        }
            return host;
        }
        catch (e) {
            throw new Error(e)
        }
    };
    //////////////////////////////zabbix media enable//////////////////////////////////// 
    async zabbixmediaenable(param) {
        console.log("Inside zabbix media enable sync")
        try {
            var result = await this.TokenFetchJob();
            //console.log(result)
            //console.log("get host details user query",param.USER_QUERY)
            var path = "http://10.83.150.241/demo/api_jsonrpc.php";
            var options = {
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                }
            }  // request headers
            var data = {
                "jsonrpc": "2.0",
                "method": "mediatype.update",
                "params": {
                    "mediatypeid": param.any,
                    "status": "0"
                },
                "auth": result,
                "id": 1
            }
            var result1 = await this.apiRequest.postRequest(path, data, options);
            var host = result1.result;
            return host;
        }
        catch (e) {
            throw new Error(e)
        }
    };
    ////////////////////////////////////zabbix media disable////////////////////////////////
    async zabbixmediadisable(param) {
        console.log("Inside zabbix media disable sync")
        try {
            var result = await this.TokenFetchJob();
            //console.log(result)
            //console.log("get host details user query",param.USER_QUERY)
            var path = "http://10.83.150.241/demo/api_jsonrpc.php";
            var options = {
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                }
            }  // request headers
            var data = {
                "jsonrpc": "2.0",
                "method": "mediatype.update",
                "params": {
                    "mediatypeid": param.any,
                    "status": "1"
                },
                "auth": result,
                "id": 1
            }
            var result1 = await this.apiRequest.postRequest(path, data, options);
            var host = result1.result;
            return result1;
        }
        catch (e) {
            throw new Error(e)
        }
    };
    /////////////////event based on time and host///////////////////////
    async geteventlist(final, final1) {
        //console.log("Inside get zabbix events sync")
        try {
            var result = await this.TokenFetchJob();
            var path = "http://10.83.150.241/demo/api_jsonrpc.php";
            var options = {
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                }
            }  // request headers
            var data = {
                "jsonrpc": "2.0",
                "method": "problem.get",
                "params": {

                    "output": ["eventid", "clock", "name", "severity", "source", "object", "objectid"],
                    "time_from": final1,
                    "time_till": final,
                    //"sortfield": ["eventid"],
                    //"sortorder": "desc",
                    //"limit": 10

                },
                "auth": result,
                "id": 1
            }
            var result1 = await this.apiRequest.postRequest(path, data, options);
            console.log("result1", result1)
            var host = result1.result;
            return host;
        }
        catch (e) {
            throw new Error(e)
        }
    };//
    ////////////////website monitoring///////////////////////////////////////////
    async webscenario(url, code, hostid) {
        console.log("Inside zabbix web scenario sync")
        try {
            var result = await this.TokenFetchJob();
            //console.log(result)
            //console.log("get host details user query",param.USER_QUERY)
            var path = "http://10.83.150.241/demo/api_jsonrpc.php";
            var options = {
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                }
            }  // request headers
            var data = {
                "jsonrpc": "2.0",
                "method": "httptest.create",
                "params": {
                    "name": url,
                    "hostid": hostid,
                    "steps": [
                        {
                            "name": "Test",
                            "url": url,
                            "status_codes": code,
                            "no": 1
                        }
                    ]
                },
                "auth": result,
                "id": 1
            }
            var result1 = await this.apiRequest.postRequest(path, data, options);
            console.log("result1", result1)
            var host = result1.result;
            return result1;
        }
        catch (e) {
            throw new Error(e)
        }
    };
    ///////////////////////////website monitoring get////////////////////////
    async webscenarioget(url, hostid) {
        console.log("Inside zabbix web scenario get")
        try {
            var result = await this.TokenFetchJob();
            //console.log(result)
            //console.log("get host details user query",param.USER_QUERY)
            var path = "http://10.83.150.241/demo/api_jsonrpc.php";
            var options = {
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                }
            }  // request headers
            var data = {
                "jsonrpc": "2.0",
                "method": "httptest.get",
                "params": {
                    "hostids": hostid,
                    "output": ["httptestid"],
                    "filter": {
                        "name": url
                    }

                },
                "auth": result,
                "id": 1
            }
            var result1 = await this.apiRequest.postRequest(path, data, options);
            console.log("result1", result1)
            var host = result1.result;
            return host;
        }
        catch (e) {
            throw new Error(e)
        }
    };
    ////////////website monitoring removal//////////////
    async webscenariodeletion(httptestid) {
        console.log("Inside zabbix web scenario sync")
        try {
            var result = await this.TokenFetchJob();
            //console.log(result)
            //console.log("get host details user query",param.USER_QUERY)
            var path = "http://10.83.150.241/demo/api_jsonrpc.php";
            var options = {
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                }
            }  // request headers
            var data = {
                "jsonrpc": "2.0",
                "method": "httptest.delete",
                "params": [
                    httptestid
                ],
                "auth": result,
                "id": 1
            }
            var result1 = await this.apiRequest.postRequest(path, data, options);
            console.log("result1", result1)
            var host = result1.result;
            return result1;
        }
        catch (e) {
            throw new Error(e)
        }
    };
    //////////////////Audit log lastlogin time////////////////////////////////////////////////////
    async auditlog(userid) {
        //console.log("Inside get zabbix user audit log")
        try {
            var result = await this.TokenFetchJob();
            var path = "http://10.83.150.241/demo/api_jsonrpc.php";
            var options = {
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                }
            }  // request headers
            var data = {
                "jsonrpc": "2.0",
                "method": "auditlog.get",
                "params": {
                    "userids": userid,
                    "output": ["auditid", "clock", "userid", "action", "ip"],
                    "filter": {
                        "action": '3'
                    },
                    "sortfield": ["clock"],
                    "sortorder": "DESC",
                    "limit": 1


                },
                "auth": result,
                "id": 1
            }
            var result1 = await this.apiRequest.postRequest(path, data, options);
            // console.log("result1",result1)
            var host = result1.result;
            return host;
        }
        catch (e) {
            console.log(e)
            throw new Error(e)
        }
    };
    ////////////////////trigger sync////////////////////////////
    async triggersync(triggerid) {
        //console.log("Inside trigger syncing data")
        try {
            var result = await this.TokenFetchJob();
            // console.log(result)
            var path = "http://10.83.150.241/demo/api_jsonrpc.php";
            var options = {
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                }
            }  // request headers
            var data = {

                "jsonrpc": "2.0",
                "method": "trigger.get",
                "params": {
                    "triggerids": triggerid,
                    "output": ["triggerid"],
                    "selectFunctions": "extend"

                },
                "auth": result,
                "id": 1
            }
            var result1 = await this.apiRequest.postRequest(path, data, options);
            console.log(result1)
            var hostgroup = result1.result;
            let dataRecord = [];
            let userdata;
            if (hostgroup[0] !== undefined) {
                for (let j = 0; j < hostgroup.length; j++) {
                    for (let i = 0; i < hostgroup[j].functions.length; i++) {
                        //         //let hostname = hostgroup[j].host.toUpperCase();

                        userdata = {
                            "triggerid": hostgroup[j].triggerid,
                            "itemid": hostgroup[j].functions[i].itemid
                        }
                        dataRecord.push(userdata);
                    }
                }
                // //    console.log("Hi i am in sync loop",dataRecord);

                if (dataRecord.length > 0) {
                    //  console.log("INSERTING DATA IN Hawkeye_host");
                    //await this.mongoUtil.emptyCollection('Hawkeye_trigger');
                    await this.mongoUtil.insertRecords('Hawkeye_trigger', dataRecord);
                }
            }
            else {
                userdata = {
                    "triggerid": triggerid,
                    "itemid": "not found"

                }
                dataRecord.push(userdata);
                if (dataRecord.length > 0) {
                    //  console.log("INSERTING DATA IN Hawkeye_host");
                    //await this.mongoUtil.emptyCollection('Hawkeye_trigger');
                    await this.mongoUtil.insertRecords('Hawkeye_trigger', dataRecord);
                }

            }
        }
        catch (e) {
            throw new Error(e)
        }
    };

    async itemsync(itemid) {
        //console.log("Inside item syncing data")
        try {
            var result = await this.TokenFetchJob();
            // console.log(result)
            var path = "http://10.83.150.241/demo/api_jsonrpc.php";
            var options = {
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                }
            }  // request headers
            var data = {

                "jsonrpc": "2.0",
                "method": "item.get",
                "params": {
                    "itemids": itemid,
                    "output": ["itemid", "hostid"]

                },
                "auth": result,
                "id": 1
            }
            var result1 = await this.apiRequest.postRequest(path, data, options);
            //console.log(result1)
            var hostgroup = result1.result;
            return hostgroup;
            //     let dataRecord=[];
            //      let userdata;
            //      for (let j = 0; j <hostgroup.length; j++) {
            //              for(let i=0; i<hostgroup[j].functions.length; i++){
            // //         //let hostname = hostgroup[j].host.toUpperCase();

            //      userdata= {
            //           "triggerid" : hostgroup[j].triggerid,
            //           "itemid": hostgroup[j].functions[i].itemid

            //         }
            //            dataRecord.push(userdata);
            //     }
            //  }
            // // //    console.log("Hi i am in sync loop",dataRecord);

            //      if(dataRecord.length > 0){
            //       //  console.log("INSERTING DATA IN Hawkeye_host");
            //          await this.mongoUtil.emptyCollection('Hawkeye_trigger');
            //          await this.mongoUtil.insertRecords('Hawkeye_trigger',dataRecord);
            //      }

        }
        catch (e) {
            throw new Error(e)
        }
    };


}



module.exports = SyncUtil;