const MongoUtil = require('../../../common/libs/mongo-util');

class UserUtil {
    constructor(url) {
        this.mongoUtil = new MongoUtil(url);
    }

    async fetchUserDetailsByIdentity(userIdentity) {
        console.log("FETCH USER DETAILS BY USER IDENTITY");
        try {
            let query = { userIdentity: userIdentity };
            console.log("querrrrrrrrrrry", query)
            let fields = {};
            let result = await this.mongoUtil.findRecord("AllUserProfile", query, fields);
            console.log(query, result)
            return result;
        } catch (err) {
            throw new Error(err)
        }
    };
    async fetchUserDetailsByEmail(userMail) {
        console.log("FETCH USER DETAILS BY USER IDENTITY");
        try {
            let query = { userEmail: userMail };
            console.log("querrrrrrrrrrry", query)
            let fields = {};
            let result = await this.mongoUtil.findRecord("resource_portal_data", query, fields);
            console.log(query, result)
            return result;
        } catch (err) {
            throw new Error(err)
        }
    };

    async fetchUserDetailsByGUID(EmployeeUID) {
        console.log("FETCH USER DETAILS BY USER IDENTITY", EmployeeUID);
        console.log("yyyyyyyyyyyyyyyyyyyyyyyyyy")
        try {
            let query = { EmployeeUID : EmployeeUID };
            let fields = {};
            let result = await this.mongoUtil.findRecord("resource_portal_data", query, fields);
            // console.log(query,"qwert", result)
            return result;
        } catch (err) {
            throw new Error(err)
        }
    };
    async fetchUserDetailsByAgentGUID(userIdentity) {
        
        console.log("FETCH USER DETAILS BY USER IDENTITY", userIdentity);
        console.log("guidddddddddddddddddddddddddd")
        try {
            let query = { userIdentity : userIdentity };
            let fields = {};
            let result = await this.mongoUtil.findRecord("resource_portal_data", query, fields);
            console.log(query,"qwert", result)
            return result;
        } catch (err) {
            throw new Error(err)
        }
    };




    
    async addNewUser(userinfo) {
        console.log("FETCH USER DETAILS BY USER IDENTITY", userinfo);
        try {
            let query =  {"userIdentity":userinfo.user_identity};
            let fields = { $set: userinfo };
            console.log("user to be added",query , fields )
            let result = await this.mongoUtil.updateRecordWithUpsert("AllUserProfile", query, fields);
            console.log("new record ",query, fields ,result)
            return result;
        } catch (err) {
            throw new Error(err)
        }
    };

    async fetchUserDetailsByIdentity2(userIdentity, param) {
        
        console.log("FETCH USER DETAILS BY USER IDENTITY",userIdentity,param);
        console.log("RRRRIIITTTUUUUU")
        try {
            let query = { userIdentity: userIdentity };
            let fields = {};
            if (param.COMPONENT === "EJIJO") {
                let query = { userIdentity: userIdentity, Type: "Flexi" };
                let fields = {};
                let result1 = await this.mongoUtil.findRecord("AllUserProfile", query, fields);
                return result1;
            }
            let result = await this.mongoUtil.findRecord("IT_userProfile", query, fields);

            if (param.OPTIONS === "HMS" || param.USER_QUERY === "HMS") {
                let query = { userEmail: result[0].userEmail, Type: "HMS" };
                let fields = {};
                let result1 = await this.mongoUtil.findRecord("AllUserProfile", query, fields);
                return result1;
            } else if (param.OPTIONS === "CRM" || param.USER_QUERY === "CRM") {
                let query = { userEmail: result[0].userEmail, Type: "CRM" };
                let fields = {};
                let result1 = await this.mongoUtil.findRecord("AllUserProfile", query, fields);
                return result1;
            } else if (param.OPTIONS === "IT" || param.USER_QUERY === "IT") {
                let query = { userIdentity: userIdentity, Type: "PCVisor" };
                let fields = {};
                let result1 = await this.mongoUtil.findRecord("AllUserProfile", query, fields);
                return result1;
            }
            else {
                let query = { userIdentity: userIdentity };
                let fields = {};
                let result1 = await this.mongoUtil.findRecord("AllUserProfile", query, fields);
                return result1;
            }


        } catch (err) {
            throw new Error(err)
        }
    };

    async storeotp(userEmail, otp) {
        console.log("Store OTP");
        try {
            console.log("inside mongo otp update and find block")
            let query = { userEmail: userEmail };
            let fields = { $set: { OTP: otp } };
            await this.mongoUtil.updateRecords("AllUserProfile", query, fields);
            let fields2 = {};
            let result = await this.mongoUtil.findRecord("AllUserProfile", query, fields2);
            return result;
        } catch (err) {
            throw new Error(err)
        }
    };

    async fetchUserDetailsByEmailid(userEmail) {
        console.log("FETCH USER DETAILS BY EMAIL");
        try {
            let query = { userEmail: userEmail };
            let fields = {};
            let result = await this.mongoUtil.findRecord("AllUserProfile", query, fields);
            return result;
        } catch (err) {
            throw new Error(err)
        }
    };
    async fetchPCVUserDetailsByEmailid(userEmail) {
        console.log("FETCH PCVISOR USER DETAILS BY EMAIL");
        try {
            let query = { userEmail: userEmail, userIdentity: { $ne: null } };
            console.log("query", query)
            let fields = {};
            let result = await this.mongoUtil.findRecord("AllUserProfile", query, fields);
            console.log(result);
            if (result === [] || result == null) {
                console.log("result was empty");
                query = { userEmail: userEmail }
                result = await this.mongoUtil.findRecord("AllUserProfile", query, fields);
            }
            return result;
        } catch (err) {
            throw new Error(err)
        }
    };

    async fetchUserDetailsByEmailid2(userEmail, param) {
        console.log("FETCH USER DETAILS BY EMAIL 2");
        console.log("inside fetch user try");
        console.log(userEmail)
        try {
            if (param.COMPONENT === "EJIJO") {
                let query = { userEmail: userEmail, Type: "Flexi" };
                let fields = {};
                let result1 = await this.mongoUtil.findRecord("AllUserProfile", query, fields);
                return result1;
            }
            if (param.OPTIONS === "HMS" || param.USER_QUERY === "HMS") {
                console.log("inside fetch user HMS");
                let query = { userEmail: userEmail, Type: "HMS" };
                let fields = {};
                let result1 = await this.mongoUtil.findRecord("AllUserProfile", query, fields);
                console.log("result1", result1)
                return result1;
            } else if (param.OPTIONS === "CRM" || param.USER_QUERY === "CRM") {
                let query = { userEmail: userEmail, Type: "CRM" };
                let fields = {};
                let result1 = await this.mongoUtil.findRecord("AllUserProfile", query, fields);
                return result1;
            } else if (param.OPTIONS === "IT" || param.USER_QUERY === "IT") {
                let query = { userEmail: userEmail, Type: "PCVisor" };
                let fields = {};
                let result1 = await this.mongoUtil.findRecord("AllUserProfile", query, fields);
                return result1;
            }
            else if (param.COMPONENT != undefined) {
                let query = { userEmail: userEmail, Type: "PCVisor" };
                let fields = {};
                let result1 = await this.mongoUtil.findRecord("AllUserProfile", query, fields);
                console.log("result for user is ", result1)
                return result1;
            }
            else {
                let query = { userEmail: userEmail };
                let fields = {};
                let result1 = await this.mongoUtil.findRecord("AllUserProfile", query, fields);
                console.log("result for user is ", result1)
                return result1;
            }
            // return result;
        } catch (err) {
            throw new Error(err)
        }
    };

    ///////////////////////hms chatbot user service//////////////////////////////////////
    ///////////////////////fetch hostid details from db//////////////////////
    async fetchhostidDetails(userQuery) {
        console.log("FETCH host id DETAILS BY hostname");
        try {
            console.log("Inside hostid mongo block", userQuery);
            //let abc = '/.*'+userQuery+'.*/'
            let regexpattern = "/" + userQuery + "/";
            let query = { hostname: userQuery }
            let fields = {};
            console.log("query is", query);
            let result = await this.mongoUtil.findRecord("Hawkeye_host", query, fields);
            // console.log("result is", result);
            return result;
        } catch (err) {
            console.log("Inside mongo error block", err);
            throw new Error(err)
        }
    };

    ///////////////////////////////////////fetch user details from db/////////////////////////////////////////////
    async fetchUserDetails(userEmail) {
        console.log("FETCH USER DETAILS BY USER EMAIL");
        try {
            console.log("Inside mongo block", userEmail);
            let query = { Useremailid: userEmail };
            let fields = {};
            console.log("query is", query);
            let result = await this.mongoUtil.findRecord("Hawkeye_User", query, fields);
            console.log("result is", result);
            return result;
        } catch (err) {
            console.log("Inside mongo error block", err);
            throw new Error(err)
        }
    };

    async checkcount(userEmail, count) {
        console.log("check OTP count");
        try {
            let ts = new Date();
            let query = { userEmail: userEmail };
            let fields = { $set: { Count: `${count}`, Verified: 'Not verified' } };
            console.log('checkcount fields', query, fields)
            await this.mongoUtil.updateRecords("AllUserProfile", query, fields);
            // console.log('checkcount result', result);
            return "success";
        } catch (err) {
            console.log('checkcount result error');
            throw new Error(err)
        }
    };

    async updatecount(userEmail, count) {
        console.log("check OTP count");
        try {
            let ts = new Date();
            let query = { userEmail: userEmail };
            let fields = { $set: { Count: `${count}`, Verificationtime: `${ts}`, Verified: 'verified' } };
            await this.mongoUtil.updateRecords("AllUserProfile", query, fields);
            return "success";
        } catch (err) {
            throw new Error(err)
        }
    };
    //////////////////////fetch host details from db/////////////////////////////
    async fetchhostDetails(userQuery) {
        console.log("FETCH host DETAILS BY hostgroupname");
        try {
            console.log("Inside mongo block", userQuery);
            //let abc = '/.*'+userQuery+'.*/'
            let regexpattern = "/" + userQuery + "/";
            console.log("regexpattern", regexpattern)
            let query = { groupname: userQuery }
            let fields = {};
            console.log("query is", query);
            let result = await this.mongoUtil.findRecord("Hawkeye_hostgroup", query, fields);
            // console.log("result is", result);
            return result;
        } catch (err) {
            console.log("Inside mongo error block", err);
            throw new Error(err)
        }
    };

    ////////////////fetch active users from db///////////////
    async fetchactiveuserDetails() {
        // console.log("FETCH active users DETAILS");
        try {
            let query = { users_status: '0' };
            let fields = {};
            console.log("query is", query);
            let result = await this.mongoUtil.findRecord("Hawkeye_User", query, fields);
            // console.log("result is", result);
            return result;
        } catch (err) {
            console.log("Inside mongo error block", err);
            throw new Error(err)
        }
    };


    ///////////////fetch web details from db/////////////
    async fetchwebDetails(weburl) {
        console.log("FETCH web DETAILS");
        try {
            let regexpattern = "/" + weburl + "/";
            let query = { "url": weburl };
            let fields = {};
            console.log("query is", query);
            let result = await this.mongoUtil.findRecord("Hawkeye_web", query, fields);
            // console.log("result is", result);
            return result;
        } catch (err) {
            console.log("Inside mongo error block", err);
            throw new Error(err)
        }
    };

    async updateweb(url, id) {
        console.log("insert url", url);
        try {
            let dataRecord = [];
            let userdata;
            userdata = {
                "id": id,
                "url": url
            }
            console.log("userdata is", userdata)
            dataRecord.push(userdata);

            console.log("Hi i am in sync loop", dataRecord);

            if (dataRecord.length > 0) {
                console.log("INSERTING DATA IN Hawkeye_web");
                //await this.mongoUtil.emptyCollection('Hawkeye_web');
                await this.mongoUtil.insertRecords('Hawkeye_web', dataRecord);
            }
        } catch (err) {
            throw new Error(err)
        }
    };

    async insertuser(user, type, logintime) {
        console.log("insert user", user, type, logintime);
        try {
            let dataRecord = [];
            let userdata;
            userdata = {
                "userName": user,
                "type": type,
                "logintime": logintime
            }
            console.log("userdata is", userdata)
            dataRecord.push(userdata);

            console.log("Hi i am in sync loop", dataRecord);

            if (dataRecord.length > 0) {
                console.log("INSERTING DATA IN Hawkeye_activeuserdata");
                //await this.mongoUtil.emptyCollection('Hawkeye_currentUser');
                await this.mongoUtil.insertRecords('Hawkeye_currentUser', dataRecord);
            }
        } catch (err) {
            throw new Error(err)
        }
    };

    async updatewebcode(code, id, url) {
        try {
            let query = { id: id, url: url };
            let fields = { $set: { code: `${code}` } };
            await this.mongoUtil.updateRecord("Hawkeye_web", query, fields);
            return "success";
        } catch (err) {
            throw new Error(err)
        }
    };

    async updatewebhost(code, id, url, hostname) {
        try {
            let query = { id: id, url: url, code: code };
            let fields = { $set: { hostname: `${hostname}` } };
            await this.mongoUtil.updateRecord("Hawkeye_web", query, fields);
            return "success";
        } catch (err) {
            throw new Error(err)
        }
    };

    /////////////fetch hostid web details//////////////
    async fetchhostidwebDetails(hostname) {
        console.log("FETCH host id web DETAILS BY hostname");
        try {
            console.log("Inside hostid web mongo block", hostname)
            let regexpattern = "/" + hostname + "/";
            let query = { hostname: hostname }
            let fields = {};
            console.log("query is", query);
            let result = await this.mongoUtil.findRecord("Hawkeye_host", query, fields);
            // console.log("result is", result);
            return result;
        } catch (err) {
            console.log("Inside mongo error block", err);
            throw new Error(err)
        }
    };

    /////////////////////hms end user services/////////////////////////////////////////////////////////////

    async fetchUserDetailsByTicketId(ticketId) {
        console.log("FETCH USER DETAILS BY TICKET ID");
        try {
            console.log("TICKET " + ticketId);
            let array1 = [];
            let lookup1 = {
                $lookup: {
                    from: "IT_tickets",
                    localField: "userIdentity",
                    foreignField: "userIdentity",
                    as: "fromTickets"
                }
            };

            let replaceRoot1 = {
                $replaceRoot: {
                    newRoot: { $mergeObjects: [{ $arrayElemAt: ["$fromTickets", 0] }, "$$ROOT"] }
                }
            };

            let match1 = {
                $match: {
                    ticketId: ticketId
                }
            };

            let project1 = {
                $project: {
                    _id: 0,
                    userName: 1,
                    userIdentity: 1,
                    userEmail: 1,
                    mgrIdentity: 1,
                    mgrEmail: 1
                }
            };

            array1.push(lookup1);
            array1.push(replaceRoot1);
            array1.push(match1);
            array1.push(project1);

            let r2 = await this.mongoUtil.findAggregatedRecords("IT_userProfile", array1);
            return r2;
        } catch (err) {
            throw new Error(err)
        }
    };
}

module.exports = UserUtil;