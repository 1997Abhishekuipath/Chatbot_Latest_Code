let NotificationUtil = require('./notification');
let ApprovalUtil = require('./approval');
let TicketUtil = require('./ticket');
let ExecutionUtil = require('./execution');
let ProcedureUtil = require('./procedure');
let UserUtil = require('./user');
let ExtensionUtil = require('./extension');
const Constants = require('../libs/constants');
const CommonUtil = require('../../../common/libs/common-util');
const notification = require('../libs/notification');
//const SocketUtil = require('../../../common/services/sockets');



class AppService {
    constructor(config) {
        console.log("CONFIG PARAMS:::::::");
        console.log("HELLO");
        console.log(config.get('tcp:port'));
        this.commonUtil = CommonUtil;
        this.constants = Constants;
        this.extensionUtil = new ExtensionUtil(config.get('mongodb:url'));
        this.userUtil = new UserUtil(config.get('mongodb:url'));
        this.notificationUtil = new NotificationUtil(config.get('mongodb:url'));
        this.procedureUtil = new ProcedureUtil(config.get('mongodb:url'));
        this.approvalUtil = new ApprovalUtil(config.get('mongodb:url'));
        this.executionUtil = new ExecutionUtil(
            config.get('mongodb:url'),
            config.get('automation:config')
        );
        this.ticketUtil = new TicketUtil(
            config.get('mongodb:url'),
            config.get('serviceDesk:platform'),
            config.get('serviceDesk:config'));

        this.config = config;
        //this.socketUtil = new SocketUtil(config.get('tcp:host'),config.get('tcp:port'));
    }

    async fetchNotifications(userIdentity) {
        try {
            let notifications = await this.notificationUtil.fetchNotifications(userIdentity);
            return notifications;
        } catch (e) {
            throw new Error(e)
        }
    };

    async updateNotifications(userIdentity) {
        console.log('UPDATE NOTIFICATIONS');
        let json = {};
        try {
            let response = await this.notificationUtil.updateNotifications(userIdentity);
            return response;
        } catch (e) {
            throw new Error(e)
        }
    };

    async updateApprovalStatus(notification, comment, status) {
        console.log("UPDATING APPROVAL STATUS");
        try {
            let response = await this.approvalUtil.updateApproval(
                notification.ticketId,
                notification.procedureId,
                status, comment);

            return response;
        } catch (e) {
            throw new Error(e)
        }
    };

    async updateExecutionStatus(ticketId, procedureId, status, startTime, endTime) {
        console.log("UPDATING EXECUTION STATUS");
        try {
            let r = await this.executionUtil.updateExecutionStatus(
                ticketId, procedureId, status, startTime, endTime);
            return "SUCCESS";
        } catch (e) {
            throw new Error(e)
        }
    };

    async checkProcedureIsManual(procedureId) {
        console.log("CHECK MANUAL STATUS FOR PROCEDURE");
        try {
            let isManual = true;
            let response = await this.procedureUtil.fetchProcedureDetail(procedureId);
            if (response && response[0]) {
                isManual = response[0].isManual;
            }
            return isManual;
        } catch (e) {
            throw new Error(e)
        }
    };

    executeAction(userIdentity, procedureId) {
        console.log("EXECUTE ACTION");
        return this.executionUtil.executeAction(userIdentity, procedureId);
    };


    async fetchProcedureDetail(procedureId) {
        try {
            let r = await this.procedureUtil.fetchProcedureDetail(procedureId);
            return r;
        } catch (e) {
            throw new Error(e)
        }
    };

    async fetchUserDetailsByTicketId(ticketId) {
        try {
            let r = await this.userUtil.fetchUserDetailsByTicketId(ticketId);
            return r;
        } catch (e) {
            throw new Error(e)
        }
    };

    async fetchActionList() {
        console.log("FETCHING ACTION LIST");
        try {
            let result = await this.procedureUtil.fetchActionList();
            return result;
        } catch (err) {
            throw new Error(err)
        }
    };

    async fetchFaqList() {
        console.log("FETCHING FAQ LIST");
        try {
            let result = await this.procedureUtil.fetchFaqList();
            return result;
        } catch (err) {
            throw new Error(err)
        }
    };

    async fetchTroubleshootList() {
        console.log("FETCHING TROUBLESHOOT LIST");
        try {
            let result = await this.procedureUtil.fetchTroubleshootList();
            return result;
        } catch (err) {
            throw new Error(err)
        }
    };

    async fetchProcedureListByAction(action,category) {
        console.log("FETCHING COMPONENT LIST");
        try {
            
            let result = await this.procedureUtil.fetchProcedureListByAction(action,category);
            return result;
        } catch (err) {
            throw new Error(err)
        }
    };

    async fetchProcedureDetailByActionComponent(action, component, category) {
        try {
            let r = await this.procedureUtil.fetchProcedureDetailByActionComponent(action, component, category);
            return r;
        } catch (e) {
            console.log("error in fetchProcedureDetailByActionComponent", e)
            let response = `No category/component found for the option you chose. <br>
                <b>Please contact IT team.</b>`;
            json = await this.nlpHandler.fetchHtmlJson(response);
            json = await this.nlpHandler.fetchFinalResponse(json, param);
            return json;
        }
    };
    async fetchProcedureDetailforcomponent(action, component, category) {
        try {
            console.log('action, component , category', action, component, category)
            let r = await this.procedureUtil.fetchProcedureDetailforcomponent(action, component, category);
            return r;
        } catch (e) {
            console.log("error in fetchProcedureDetailforcomponent", e)
            let response = `No category/component found for the option you chose. <br>
                <b>Please contact IT team.</b>`;
            json = await this.nlpHandler.fetchHtmlJson(response);
            json = await this.nlpHandler.fetchFinalResponse(json, param);
            return json;
        }
    };
    async fetchProcedureDetailForAction(action) {
        try {
            let r = await this.procedureUtil.fetchProcedureDetailForAction(action);
            return r;
        } catch (e) {
            console.log("error in fetchProcedureDetailByActionComponent", e)
            let response = `No category/component found for the option you chose. <br>
                <b>Please contact IT team.</b>`;
            json = await this.nlpHandler.fetchHtmlJson(response);
            json = await this.nlpHandler.fetchFinalResponse(json, param);
            return json;
        }
    };
    async fetchUserDetailsByIdentity(userIdentity) {
        try {
            console.log("got id",userIdentity)
            let userProfile = await this.userUtil.fetchUserDetailsByIdentity(userIdentity);
            return userProfile;
        } catch (e) {
            // throw new Error(e)
            let response = `PC Visor Agent has not been installed on your machine or Machine Group has been changed.<br>
                <b>Please contact IT Team.</b>`;
            let json = {};
            json = await this.nlpHandler.fetchHtmlJson(response);
            json = await this.nlpHandler.fetchFinalResponse(json, param);
            return json;
        }
    };
    async fetchUserDetailsByEmail(userEmail) {
        try {
            console.log("got mail",userEmail)
            let userProfile = await this.userUtil.fetchUserDetailsByEmail(userEmail);
            return userProfile;
        } catch (e) {
            // throw new Error(e)
            let response = `PC Visor Agent has not been installed on your machine or Machine Group has been changed.<br>
                <b>Please contact IT Team.</b>`;
            let json = {};
            json = await this.nlpHandler.fetchHtmlJson(response);
            json = await this.nlpHandler.fetchFinalResponse(json, param);
            return json;
        }
    };

    async fetchUserDetailsByGUID(EmployeeUID) {
        try {
            console.log("got id",EmployeeUID)
            let userProfile = await this.userUtil.fetchUserDetailsByGUID(EmployeeUID);
            return userProfile;
        } catch (e) {
            // throw new Error(e)
            let response = `PC Visor Agent has not been installed on your machine or Machine Group has been changed.<br>
                <b>Please contact IT Team.</b>`;
            let json = {};
            json = await this.nlpHandler.fetchHtmlJson(response);
            json = await this.nlpHandler.fetchFinalResponse(json, param);
            return json;
        }
    };

    async fetchUserDetailsByAgentGUID(userIdentity) {
        try {
            console.log("got id",userIdentity)
            let userProfile = await this.userUtil.fetchUserDetailsByAgentGUID(userIdentity);
            return userProfile;
        } catch (e) {
            // throw new Error(e)
            let response = `PC Visor Agent has not been installed on your machine or Machine Group has been changed.<br>
                <b>Please contact IT Team.</b>`;
            let json = {};
            json = await this.nlpHandler.fetchHtmlJson(response);
            json = await this.nlpHandler.fetchFinalResponse(json, param);
            return json;
        }
    };    



    async addNewUserDetailsByIdentity(userinfo) {
        try {
            console.log("got id",userinfo)
            let userProfile = await this.userUtil.addNewUser(userinfo);
            return userProfile;
        } catch (e) {
            // throw new Error(e)
            let response = `PC Visor Agent has not been installed on your machine or Machine Group has been changed.<br>
                <b>Please contact IT Team.</b>`;
            let json = {};
            json = await this.nlpHandler.fetchHtmlJson(response);
            json = await this.nlpHandler.fetchFinalResponse(json, param);
            return json;
        }
    };

    async fetchUserDetailsByIdentity2(userIdentity, param) {
        try {
            let userProfile = await this.userUtil.fetchUserDetailsByIdentity2(userIdentity, param);
            return userProfile;
        } catch (e) {
            // throw new Error(e)
            let response = `PC Visor Agent has not been installed on your machine or Machine Group has been changed.<br>
                <b>Please contact IT Team.</b>`;
            let json = {};
            json = await this.nlpHandler.fetchHtmlJson(response);
            json = await this.nlpHandler.fetchFinalResponse(json, param);
            return json;
        }
    };
    async fetchUserTicket(userIdentity, ticket_id) {
        try {
            let userTicket = await this.ticketUtil.fetchTicketDetails(userIdentity, ticket_id);
            return userTicket;
        }
        catch (e){
            console.log("fetchUserTicket error" , userIdentity , ticket_id)
            let response = `No tickets found.`;
            let json = {};
            json = await this.nlpHandler.fetchHtmlJson(response);
            json = await this.nlpHandler.fetchFinalResponse(json, param);
            return json;
        }
    }
    async fetchEmailUserDetails(userEmail) {
        try {
            let userProfile = await this.userUtil.fetchUserDetailsByEmailid(userEmail);
            return userProfile;
        } catch (e) {
            // throw new Error(e)
            let response = `<b>Your Email is not registered.</b><br>
                               Please contact IT Team.`;
            let json = {};
            json = await this.nlpHandler.fetchHtmlJson(response);
            json = await this.nlpHandler.fetchFinalResponse(json, param);
            return json;
        }
    };

    async fetchPCVEmailUserDetails(userEmail) {
        try {
            let userProfile = await this.userUtil.fetchPCVUserDetailsByEmailid(userEmail);
            return userProfile;
        } catch (e) {
            // throw new Error(e)
            let response = `<b>Your Email is not registered.</b><br>
                               Please contact IT Team.`;
            let json = {};
            json = await this.nlpHandler.fetchHtmlJson(response);
            json = await this.nlpHandler.fetchFinalResponse(json, param);
            return json;
        }
    };

    async storeotp(userEmail, otp) {
        try {
            console.log("Inside otp store service block")
            let userProfile = await this.userUtil.storeotp(userEmail, otp);
            console.log("store otp service userprofile is", userProfile)
            return userProfile;
        } catch (e) {
            // throw new Error(e)
            console.log("inside store otp service catch block")
            let response = `<b>OTP did not get generate,</b>
                               Please contact Admin Team.`;
            let json = {};
            json = await this.nlpHandler.fetchHtmlJson(response);
            json = await this.nlpHandler.fetchFinalResponse(json, param);
            return json;
        }
    };

    async fetchUserDetails2(userEmail, param) {
        try {
            let userProfile = await this.userUtil.fetchUserDetailsByEmailid2(userEmail, param);
            return userProfile;
        } catch (e) {
            // throw new Error(e)
            let json = {};
            let response = `<b>Your Email is not registered.</b><br>
                               Please contact IT Team.`;
            json = await this.nlpHandler.fetchHtmlJson(response);
            json = await this.nlpHandler.fetchFinalResponse(json, userEmail);
            return json;
        }
    };

    ////////////////////////hms chatbot services///////////////////////////////////////////////
    ////////////////////fetch hostid mongo details service/////////////////////
    async fetchhostidDetails(userQuery) {
        try {
            console.log("Its is hostid service", userQuery);
            let userProfile = await this.userUtil.fetchhostidDetails(userQuery);
            console.log("hostid fetchhostiddetails", userProfile);
            return userProfile;
        } catch (e) {
            console.log("Inside catch of service");
            // throw new Error(e)
            let response = `<b>Your Email is not registered.</b><br>
                               Please contact Admin Team.`;
            let json = {};
            //json = await this.nlpHandler.fetchHtmlJson(response);
            //json = await this.nlpHandler.fetchFinalResponse(json, param);
            return json;
        }
    };

    ////////////////////////////////fetch User Details///////////////////////////////////////////////
    async fetchUserDetails(userEmail) {
        try {
            console.log("Its is userEmail service", userEmail);
            let userProfile = await this.userUtil.fetchUserDetails(userEmail);
            console.log("User profile", userProfile);
            return userProfile;
        } catch (e) {
            console.log("Inside catch of service");
            // throw new Error(e)
            let response = `<b>Your Email is not registered.</b><br>
                               Please contact Admin Team.`;
            let json = {};
            //json = await this.nlpHandler.fetchHtmlJson(response);
            //json = await this.nlpHandler.fetchFinalResponse(json, param);
            return json;
        }
    };

    async checkcount(userEmail, count) {
        try {
            let userProfile = await this.userUtil.checkcount(userEmail, count);
            return userProfile;
        } catch (e) {
            // throw new Error(e)
            let response = `<b>OTP did not get generate,</b>
                               Please contact Admin Team.`;
            let json = {};
            json = await this.nlpHandler.fetchHtmlJson(response);
            json = await this.nlpHandler.fetchFinalResponse(json, param);
            return json;
        }
    };
    async updatecount(userEmail, count) {
        try {
            let userProfile = await this.userUtil.updatecount(userEmail, count);
            return userProfile;
        } catch (e) {
            // throw new Error(e)
            let response = `<p>Your account has not been verified</p>`;
            let json = {};
            json = await this.nlpHandler.fetchHtmlJson(response);
            json = await this.nlpHandler.fetchFinalResponse(json, param);
            return json;
        }
    };

    //////////////////////////////////////////////////////////////////////////////////////////

    async fetchUIpathProcedure() {
        try {
            let r = await this.procedureUtil.fetchUIprocessname();
            return r;
        } catch (e) {
            console.log("error in fetchProcedureDetailByActionComponent",e)
                let response = `No category/component found for the option you chose. <br>
                <b>Please contact IT team.</b>`;
                        json = await this.nlpHandler.fetchHtmlJson(response);
                        json = await this.nlpHandler.fetchFinalResponse(json, param);
                        return json;
        }
    };

    async fetchProcedureProcessName(process_name) {
        console.log("FETCHING COMPONENT LIST", process_name);
        try {
            let result = await this.procedureUtil.fetchUIpathprocessname(process_name);
            return result;
        } catch (err) {
            throw new Error(err)
        }
    };



    




    ///////////////////////fetch host mongo details service//////////////////////////////
    async fetchhostDetails(userQuery) {
        try {
            console.log("Its is userQuery service", userQuery);
            let userProfile = await this.userUtil.fetchhostDetails(userQuery);
            console.log("User profile fetchhostdetails", userProfile);
            return userProfile;
        } catch (e) {
            console.log("Inside catch of service");
            // throw new Error(e)
            let response = `<b>Your Email is not registered.</b><br>
                               Please contact Admin Team.`;
            let json = {};
            //json = await this.nlpHandler.fetchHtmlJson(response);
            //json = await this.nlpHandler.fetchFinalResponse(json, param);
            return json;
        }
    };

    async fetchhostgroups(userEmail) {
        console.log("FETCHING hostgroup list");
        try {
            let result = await this.procedureUtil.fetchhostgroups(userEmail);
            return result;
        } catch (err) {
            throw new Error(err)
        }
    };

    async fetchhostgroups1(array) {
        console.log("FETCHING hostgroup1 list");
        try {
            let result = await this.procedureUtil.fetchhostgroups1(array);
            return result;
        } catch (err) {
            throw new Error(err)
        }
    };

    async fetchhostgroups2(array1) {
        console.log("FETCHING hostgroup2 name list");
        try {
            let result = await this.procedureUtil.fetchhostgroups2(array1);
            return result;
        } catch (err) {
            throw new Error(err)
        }
    };

    async fetchhostgroupsall() {
        console.log("FETCHING hostgroup2 all list");
        try {
            let result = await this.procedureUtil.fetchhostgroupsall();
            return result;
        } catch (err) {
            throw new Error(err)
        }
    };

    async fetchhostenable() {
        console.log("FETCHING host enable list");
        try {
            let result = await this.procedureUtil.fetchhostenable();
            return result;
        } catch (err) {
            throw new Error(err)
        }
    };

    async fetchhostdisable() {
        console.log("FETCHING host disable list");
        try {
            let result = await this.procedureUtil.fetchhostdisable();
            return result;
        } catch (err) {
            throw new Error(err)
        }
    };

    async fetchlastlog(userid) {
        //console.log("FETCHING user login list");
        try {
            let result = await this.procedureUtil.fetchlastlog(userid);
            return result;
        } catch (err) {
            throw new Error(err)
        }
    };

    async fetchnewlastlog() {
        console.log("FETCHING user login list");
        try {
            let result = await this.procedureUtil.fetchnewlastlog();
            console.log("FETCHIN", result);
            return result;
        } catch (err) {
            throw new Error(err)
        }
    };

    async fetchitemdetails(triggerid) {
        //console.log("FETCHING user login list");
        try {
            let result = await this.procedureUtil.fetchitemdetails(triggerid);
            return result;
        } catch (err) {
            throw new Error(err)
        }
    };

    async fetchhostnamedetails(hostid) {
        //console.log("FETCHING user login list");
        try {
            let result = await this.procedureUtil.fetchhostnamedetails(hostid);
            return result;
        } catch (err) {
            throw new Error(err)
        }
    };

    //////////////fetch active users mongo service////////////
    async fetchactiveuserDetails() {
        try {

            let userProfile = await this.userUtil.fetchactiveuserDetails();
            //console.log("User profile fetchactiveuserdetails",userProfile);
            return userProfile;
        } catch (e) {
            //console.log("Inside catch of service");
            // throw new Error(e)
            let response = `<b>Your Email is not registered.</b><br>
                               Please contact Admin Team.`;
            let json = {};
            //json = await this.nlpHandler.fetchHtmlJson(response);
            //json = await this.nlpHandler.fetchFinalResponse(json, param);
            return json;
        }
    };

    /////////////////fetch web details///////////
    async fetchwebDetails(weburl) {
        try {
            let userProfile = await this.userUtil.fetchwebDetails(weburl);
            console.log("User profile", userProfile);
            return userProfile;
        } catch (e) {
            console.log("Inside catch of service");
            // throw new Error(e)
            let response = `<b>Your Email is not registered.</b><br>
                               Please contact Admin Team.`;
            let json = {};
            //json = await this.nlpHandler.fetchHtmlJson(response);
            //json = await this.nlpHandler.fetchFinalResponse(json, param);
            return json;
        }
    };

    async updateweb(url, id) {
        try {
            let userProfile = await this.userUtil.updateweb(url, id);
            return userProfile;
        } catch (e) {
            // throw new Error(e)
            let response = `<p>Your account has not been verified</p>`;
            let json = {};
            json = await this.nlpHandler.fetchHtmlJson(response);
            json = await this.nlpHandler.fetchFinalResponse(json, param);
            return json;
        }
    };

    async insertuser(user, type, logintime) {
        try {
            let userProfile = await this.userUtil.insertuser(user, type, logintime);
            return userProfile;
        } catch (e) {
            // throw new Error(e)
            let response = `<p>Your account has not been verified</p>`;
            let json = {};
            json = await this.nlpHandler.fetchHtmlJson(response);
            json = await this.nlpHandler.fetchFinalResponse(json, param);
            return json;
        }
    };

    async updatewebcode(code, id, url) {
        try {
            let userProfile = await this.userUtil.updatewebcode(code, id, url);
            return userProfile;
        } catch (e) {
            // throw new Error(e)
            let response = `<p>Your account has not been verified</p>`;
            let json = {};
            json = await this.nlpHandler.fetchHtmlJson(response);
            json = await this.nlpHandler.fetchFinalResponse(json, param);
            return json;
        }
    };

    async updatewebhost(code, id, url, hostname) {
        try {
            let userProfile = await this.userUtil.updatewebhost(code, id, url, hostname);
            return userProfile;
        } catch (e) {
            // throw new Error(e)
            let response = `<p>Your account has not been verified</p>`;
            let json = {};
            json = await this.nlpHandler.fetchHtmlJson(response);
            json = await this.nlpHandler.fetchFinalResponse(json, param);
            return json;
        }
    };

    /////////////////fetch hostid web details////////////////
    async fetchhostidwebDetails(hostname) {
        try {
            console.log("Its is hostid web service", hostname);
            let userProfile = await this.userUtil.fetchhostidwebDetails(hostname);
            console.log("hostid fetchhostidwebdetails", userProfile);
            return userProfile;
        } catch (e) {
            console.log("Inside catch of service");
            // throw new Error(e)
            let response = `<b>Your Email is not registered.</b><br>
                               Please contact Admin Team.`;
            let json = {};
            //json = await this.nlpHandler.fetchHtmlJson(response);
            //json = await this.nlpHandler.fetchFinalResponse(json, param);
            return json;
        }
    };


    //////////////////////////hms chatbot services end////////////////////////////////////////////////////////////

    async createApproval(userIdentity,
        mgrIdentity,
        procedureId,
        ticketId,
        userReason) {
        console.log("CREATE APPROVAL");
        try {
            let approval = {
                userIdentity: userIdentity,
                mgrIdentity: mgrIdentity,
                procedureId: procedureId,
                ticketId: ticketId,
                approvalStatus: Constants.constants().APPROVAL_STATUS.PENDING,
                comment: '',
                userReason: userReason,
                createdOn: CommonUtil.getCurrentTimestamp()
            };

            let r = await this.approvalUtil.createApproval(approval);
            return r;
        } catch (e) {
            throw new Error(e)
        }
    };

    async createExecution(userIdentity,
        procedureId,
        ticketId,
        status,
        summary) {
        console.log("CREATE EXECUTION");
        console.log("user identity", userIdentity)
        try {
            let execution = {
                userIdentity: userIdentity,
                procedureId: procedureId,
                ticketId: ticketId,
                summary: summary,
                executionStatus: status ? status : Constants.constants().EXECUTION_STATUS.PENDING,
                startTime: status === Constants.constants().EXECUTION_STATUS.RUNNING ? CommonUtil.getCurrentTimestamp() : '',
                endTime: '',
                createdOn: CommonUtil.getCurrentTimestamp()
            };

            let r = await this.executionUtil.createExecution(execution);
            return r;
        } catch (e) {
            throw new Error(e)
        }
    };

    async fetchTicketCategories() {
        console.log("FETCHING TICKET CATEGORY LIST");
        try {
            let result = await this.ticketUtil.fetchTicketCategories();
            return result;
        } catch (err) {
            throw new Error(err)
        }
    };

    async fetchTicketSubCategories(category) {
        console.log("FETCHING TICKET SUB CATEGORY LIST");
        try {
            let result = await this.ticketUtil.fetchTicketSubCategories(category);
            return result;
        } catch (err) {
            throw new Error(err)
        }
    };

    async fetchExecutionDetails(status) {
        console.log("FETCHING EXECUTION DETAILS");
        try {
            let result = await this.executionUtil.fetchExecutionDetails(status);
            return result;
        } catch (err) {
            throw new Error(err)
        }
    };

    async fetchProcedureLogs(userIdentity) {
        let procedures = [];
        console.log("FETCHING USER PROCEDURE LOGS");
        try {
            let data = await this.executionUtil.fetchProcedureLogs(userIdentity);
            let res = JSON.parse(data.body);
            let records = res.Result;

            if (records && records.length > 0) {
                for (let index = 0; index < records.length; index++) {
                    let procedure = {};

                    const procedureExists = procedures.find(
                        p => p.procedureName === records[index].ScriptName.trim()
                    );

                    //Take latest Procedure Response
                    if (!procedureExists) {
                        if ((records[index].Status).includes('Success')) {
                            procedure.status = Constants.constants().EXECUTION_STATUS.COMPLETED;
                        } else {
                            procedure.status = Constants.constants().EXECUTION_STATUS.FAILED;
                        }
                        procedure.procedureName = records[index].ScriptName.trim();
                        procedure.endTime = records[index].LastExecutionTime;
                        procedure.userIdentity = userIdentity;
                        procedures.push(procedure);
                    }
                }
            }
            return procedures;
        } catch (err) {
            throw new Error(err)
        }
    };

    async fetchTicketStatus(userIdentity, status) {
        try {
            let result = await this.ticketUtil.fetchTicketStatus(userIdentity, status);
            return result;
        } catch (e) {
            throw new Error(e)
        }
    };
    async fetchTicketDetails(userIdentity, ticket_id) {
        try {
            let result = await this.ticketUtil.fetchTicketDetails(userIdentity, ticket_id);
            return result;
        } catch (e) {
            throw new Error(e)
        }
    };
    async fetchActionId(mode, name) {
        console.log("action id is");
        try {
            let r = await this.procedureUtil.fetchActionId(mode, name);
            return r;
        } catch (e) {
            throw new Error(e)
        }
    };
    
    async fetchMediaId(mode, name) {
        console.log("action id is");
        try {
            let r = await this.procedureUtil.fetchMediaId(mode, name);
            return r;
        } catch (e) {
            throw new Error(e)
        }
    };

    async fetchGroupId(name) {
        console.log("action id is");
        try {
            let r = await this.procedureUtil.fetchGroupId(name);
            return r;
        } catch (e) {
            throw new Error(e)
        }
    };



    async executeNotification(param) {
        console.log("EXECUTING NOTIFICATION");
        try {
            //Prepare Notification Detail
            let detail = {};
            switch (param.CATEGORY) {
                case Constants.constants().NOTIFICATION_CATEGORY.APPROVAL_REQUEST:
                    detail = await notification.approvalRequest(param);
                    break;
                case Constants.constants().NOTIFICATION_CATEGORY.APPROVAL_RESPONSE:
                    detail = await notification.approvalResponse(param);
                    break;
                case Constants.constants().NOTIFICATION_CATEGORY.EXECUTION_REQUEST:
                    detail = await notification.executionRequest(param);
                    break;
                case Constants.constants().NOTIFICATION_CATEGORY.EXECUTION_RESPONSE:
                    detail = await notification.executionResponse(param);
                    break;
                case Constants.constants().NOTIFICATION_CATEGORY.TICKET_CREATE:
                    detail = await notification.ticketCreate(param);
                    break;
                case Constants.constants().NOTIFICATION_CATEGORY.TICKET_CREATE_MANUAL:
                    detail = await notification.ticketCreatedForManualProcedure(param);
                    break;
                case Constants.constants().NOTIFICATION_CATEGORY.TICKET_CLOSE:
                    detail = await notification.ticketClose(param);
                    break;
                case Constants.constants().NOTIFICATION_CATEGORY.TICKET_CONFIRMATION:
                    detail = await notification.ticketConfirmation(param);
                    break;
                case Constants.constants().NOTIFICATION_CATEGORY.TICKET_ERROR:
                    detail = await notification.ticketError(param);
                    break;
            }

            //Create Notification in DB
            let notificationDoc = {
                userIdentity: param.USER_IDENTITY,
                procedureId: param.PROCEDURE_ID,
                ticketId: '',
                type: param.TYPE,
                details: detail,
                notificationStatus: Constants.constants().NOTIFICATION_STATUS.NOT_SEEN,
                createdOn: CommonUtil.getCurrentTimestamp()
            };

            let r = await this.notificationUtil.createNotification(notificationDoc);

            //Send Notification
            let data = {
                type: 'PUSH_NOTIFICATION',
                userIdentity: param.USER_IDENTITY,
                notification: [notificationDoc]
            };

            //this.socketUtil.sendData(data);

            return r;
        } catch (e) {
            console.log(e.stack);
            throw new Error(e)
        }
    };
}

module.exports = AppService;