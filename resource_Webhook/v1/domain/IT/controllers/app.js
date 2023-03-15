const Messages = require('../libs/messages');
const CommonUtil = require('../../../common/libs/common-util');
const Constants = require('../libs/constants');
const Intents = require('../libs/intents');
const NLPHandler = require('../../../common/nlp/nlp-handler');
const ResetADPassword = require('../libs/ResetADPassword');
const SyncUtil = require('../sync/kasaya/sync');
const bcrypt = require('bcryptjs');
var generator = require('generate-password');
const SendMessage = require('../libs/sendmessage')
const SendMail = require('../libs/sendmail')
const AESEncryption = require('../libs/encryption')
const Email1 = require('../../../customers/hitachi/IT/bot/controllers/email1');
const JSONTransport = require('nodemailer/lib/json-transport');
const { response } = require('express');
const { DateTime } = require('mssql');
class AppController {

    constructor(config, webhookService) {
        this.platform = config.get('nlp:platform');
        this.version = config.get('nlp:version');
        this.webhookService = webhookService;
        this.nlpHandler = new NLPHandler(config);
        this.resetad = new ResetADPassword(config);
        this.fetchNotifications = this.fetchNotifications.bind(this);
        this.updateNotifications = this.updateNotifications.bind(this);
        this.approveNotification = this.approveNotification.bind(this);
        this.confirmNotification = this.confirmNotification.bind(this);
        this.syncUtil = new SyncUtil(config);
        this.sendmessage = new SendMessage(config);
        this.sendmail = new SendMail(config);
        this.aesencryption = new AESEncryption(config);
        this.email1 = new Email1(config);

    }

    /****************** SCHEDULER *************************/
    async executeTicketSyncJob() {
        console.log("EXECUTING TICKET SYNC SCHEDULER");
        try {
            //1. Fetch Distinct [userIdentity,ticketId,procedureId,procedureName,
            // executionId,closingLevel]
            // for Running Executions [IT_executions,IT_procedures]
            let executions = await this.webhookService.fetchExecutionDetails(
                Constants.constants().EXECUTION_STATUS.RUNNING
            );
            console.log("execuuuuuution", executions)
            
            let userIdentities = [];
            if (executions && executions.length > 0) {
            
                for (let execution of executions) {
                    console.log(executions)
                    if (!userIdentities.includes(execution.userIdentity)) {
                        userIdentities.push(execution.userIdentity);
                    }
                }
            }

            //2. Fetch Procedure Logs [userIdentity] ==> [procedureName,ExecutionTime,status,
            // userIdentity]
            for (let userIdentity of userIdentities) {
                console.log("this is the user identity", userIdentity);
                let procedures = await this.webhookService.fetchProcedureLogs(userIdentity);
                //console.log("procedures === ", executions, procedures);
                console.log("Processing User Identity:: " + userIdentity);

                //Loop Procedures
                for (let procedure of procedures) {

                    //Update Executions Records
                    for (let execution of executions) {

                        if (execution.procedureName === procedure.procedureName) {

                            //Update Execution Status
                            const executionRes = await this.webhookService.updateExecutionStatus(
                                execution.ticketId,
                                execution.procedureId,
                                procedure.status,
                                null,
                                new Date(procedure.endTime)
                            );

                            //Create Execution Response Notification
                            let notifyParam = {
                                ACTION: execution.action,
                                COMPONENT: execution.component,
                                USER_NAME: '',
                                USER_EMAIL: '',
                                USER_IDENTITY: userIdentity,
                                TICKET_ID: execution.ticketId,
                                PROCEDURE_ID: execution.procedureId,
                                STATUS: procedure.status,
                                CATEGORY: Constants.constants().NOTIFICATION_CATEGORY.EXECUTION_RESPONSE,
                                TYPE: Constants.constants().NOTIFICATION_TYPE.VIEW
                            };

                            let res = await this.webhookService.executeNotification(notifyParam);

                            if (procedure.status === Constants.constants().EXECUTION_STATUS.COMPLETED) {
                                //Update Ticket Status [ticketId] where closingLevel = automatic
                                console.log("hi i am in completed status")
                                if (execution.closingLevel === Constants.constants().CLOSING_LEVEL.AUTOMATIC) {
                                    const ticketParam = {
                                        INCIDENT_NUMBER: execution.ticketId,
                                        STATUS: Constants.constants().TICKET_STATUS.CLOSED,
                                        ACTION: execution.action,
                                        SUMMARY: execution.summary
                                    };
                                    const r1 = await this.webhookService.updateTicket(ticketParam);
                                    notifyParam.CATEGORY = Constants.constants().NOTIFICATION_CATEGORY.TICKET_CLOSE;
                                    // let res = await this.webhookService.executeNotification(notifyParam);
                                }

                                else if (execution.closingLevel === Constants.constants().CLOSING_LEVEL.CONFIRMATION) {
                                    notifyParam.CATEGORY = Constants.constants().NOTIFICATION_CATEGORY.TICKET_CONFIRMATION;
                                    notifyParam.TYPE = Constants.constants().NOTIFICATION_TYPE.CONFIRMATION;
                                    // let res = await this.webhookService.executeNotification(notifyParam);
                                }
                            }

                        }
                    }//End of Execution loop

                }//End of Loop Procedures

            }//End of User Identity Loop

            return "SUCCESS";
        } catch (e) {
            throw new Error(e)
        }
    };


    /****************** NOTIFICATION  METHODS *************/

    async fetchNotifications(req, res) {
        console.log('FETCH NOTIFICATIONS');
        let json = {};
        try {
            const userIdentity = req.body.userIdentity;
            let notifications = await this.webhookService.fetchNotifications(userIdentity);

            json = {
                notifications: notifications,
                userIdentity: userIdentity
            };
            console.log(json);
            res.setHeader('Content-Type', 'application/json');
            res.send(json);
            res.end();
        } catch (e) {
            console.log('Error!', e);
            json = {
                "response": Messages.messages().RESPONSE.ERROR,
                "message": Messages.messages().ERROR.ERROR_OCCURRED
            };
            res.send(json);
            res.end();
        }
    };

    async updateNotifications(req, res) {
        console.log('UPDATE NOTIFICATION');
        let json = {};
        try {
            const userIdentity = req.body.userIdentity;
            let response = await this.webhookService.updateNotifications(userIdentity);
            json = {
                "response": Messages.messages().RESPONSE.SUCCESS,
                "message": Messages.messages().INFO.SUCCESS
            };
            res.setHeader('Content-Type', 'application/json');
            res.send(json);
            res.end();
        } catch (e) {
            console.log('Error!', e);
            json = {
                "response": Messages.messages().RESPONSE.ERROR,
                "message": Messages.messages().ERROR.ERROR_OCCURRED
            };
            res.send(json);
            res.end();
        }
    };

    async approveNotification(req, res) {
        console.log("NOTIFICATION APPROVAL");
        let json = {};
        try {
            const notification = req.body.notification;
            const comment = req.body.comment;
            const approvalStatus = req.body.approvalStatus;

            let r1 = await this.webhookService.updateApprovalStatus(
                notification.ticketId,
                notification.procedureId,
                approvalStatus,
                comment
            );
            let r2 = this.webhookService.fetchProcedureDetail(notification.procedureId);
            let r3 = this.webhookService.fetchUserDetailsByTicketId(notification.ticketId);

            let [approvalResult, procedureResult, userProfile] = await Promise.all([r1, r2, r3]);

            if (approvalStatus === Constants.constants().APPROVAL_STATUS.APPROVED) {
                //Execute Procedure
                let actionResponse = await this.webhookService.executeAction(
                    userProfile[0].userIdentity,
                    notification.procedureId
                );

                //Update Execution Status
                let executionResponse = await this.webhookService.updateExecutionStatus(
                    notification.ticketId,
                    notification.procedureId,
                    Constants.constants().EXECUTION_STATUS.RUNNING,
                    CommonUtil.getCurrentTimestamp(),
                    null
                );
            }

            //Create Notification Record
            let notifyParam = {
                ACTION: procedureResult[0].action,
                COMPONENT: procedureResult[0].component,
                USER_NAME: userProfile[0].userName,
                USER_EMAIL: userProfile[0].userEmail,
                USER_IDENTITY: userProfile[0].userIdentity,
                TICKET_ID: notification.ticketId,
                PROCEDURE_ID: notification.procedureId,
                STATUS: approvalStatus,
                CATEGORY: Constants.constants().NOTIFICATION_CATEGORY.APPROVAL_RESPONSE,
                TYPE: Constants.constants().NOTIFICATION_TYPE.VIEW,
                COMMENT: comment
            };

            // let res = await this.webhookService.executeNotification(notifyParam);

            json = { "response": Messages.messages().RESPONSE.SUCCESS, "message": Messages.messages().INFO.SUCCESS };
            res.setHeader('Content-Type', 'application/json');
            res.send(json);
            res.end();
        } catch (e) {
            console.log('Error!', e);
            json = {
                "response": Messages.messages().RESPONSE.ERROR,
                "message": Messages.messages().ERROR.ERROR_OCCURRED
            };
            res.send(json);
            res.end();
        }
    };

    async confirmNotification(req, res) {
        console.log("NOTIFICATION CONFIRM");
        let json = {};
        try {
            const notification = req.body.notification;
            const response = req.body.response;

            if (response === "Close") {
                //Update Ticket Status in DB & Service Desk
                const ticketParam = {
                    INCIDENT_NUMBER: notification.ticketId,
                    STATUS: Constants.constants().TICKET_STATUS.CLOSED
                };
                const r1 = await this.webhookService.updateTicket(ticketParam);
                let r2 = this.webhookService.fetchProcedureDetail(notification.procedureId);
                let r3 = this.webhookService.fetchUserDetailsByTicketId(notification.ticketId);


                let [ticketResult, procedureResult, userResult] = await Promise.all([r1, r2, r3]);

                let param = {
                    action: (procedureResult && procedureResult[0]) ? procedureResult[0].action : '',
                    component: (procedureResult && procedureResult[0]) ? procedureResult[0].component : '',
                    email: userResult[0].userEmail,
                    ticketId: notification.ticketId
                };

                let notifyParam = {
                    ACTION: procedureResult[0].action,
                    COMPONENT: procedureResult[0].component,
                    USER_NAME: userResult[0].userName,
                    USER_EMAIL: userResult[0].userEmail,
                    USER_IDENTITY: userResult[0].userIdentity,
                    TICKET_ID: notification.ticketId,
                    PROCEDURE_ID: notification.procedureId,
                    STATUS: '',
                    CATEGORY: Constants.constants().NOTIFICATION_CATEGORY.TICKET_CONFIRMATION,
                    TYPE: Constants.constants().NOTIFICATION_TYPE.CONFIRMATION
                };

                // let res = await this.webhookService.executeNotification(notifyParam);
            }

            json = {
                "response": Messages.messages().RESPONSE.SUCCESS,
                "message": Messages.messages().INFO.SUCCESS
            };
            res.setHeader('Content-Type', 'application/json');
            res.send(json);
            res.end();
        } catch (e) {
            console.log('Error!', e);
            json = {
                "response": Messages.messages().RESPONSE.ERROR,
                "message": Messages.messages().ERROR.ERROR_OCCURRED
            };
            res.send(json);
            res.end();
        }
    };

    /********************* NOTIFICATION METHOD ENDS **********************/


    /********************** COMMON METHODS *******************************/

    /********************** COMMON METHODS ENDS*******************************/


    /*
     1. IT_ACTION_INITIALIZER [DONE]
     After user selects action value in IT Action Initializer Intent,
     Here fetch Components list and Call IT_ACTION_COMPONENT Intent by passing
     slot filling response to ask choose component.
     */
    async handleItActionInitializer(param) {
        let json = {};
        try {
            //Fetch List of Components (IT_procedures)
            let procedures = await this.webhookService.fetchProcedureListByAction(param.ACTION);
            //Here Handle Custom Handling for Components,
            // Like Browser Clean, Temp Clean etc.(Within Loop)

            let buttons = [];
            for (let procedure of procedures) {

                //1. Handle for Browser
                if (param.ACTION === 'CLEAN' &&
                    param.USER_QUERY &&
                    param.USER_QUERY.toLowerCase().includes('browser')) {
                    if (Constants.constants().BROWSER.includes(procedure.component)) {
                        let button = {
                            "type": "postback",
                            "title": CommonUtil.convertToTitleCase(procedure.action),
                            "payload": CommonUtil.convertToTitleCase(procedure.component),
                            "text": procedure.text
                        };
                        buttons.push(button);
                    }
                }

                //In other cases
                else {
                    let button = {
                        "type": "postback",
                        "title": CommonUtil.convertToTitleCase(procedure.action),
                        "payload": CommonUtil.convertToTitleCase(procedure.component),
                        "text": procedure.text
                    };
                    buttons.push(button);
                }
            }

            if (buttons.length === 0) {
                let response = Messages.messages().NLP.NO_COMPONENT_FOUND;
                json = await this.nlpHandler.fetchTextJson(response);
                json = await this.nlpHandler.fetchFinalResponse(json, param);
            } else {
                let text = Messages.messages().NLP.BOT_ACTION_COMPONENT;
                let response = await this.nlpHandler.fetchSlotJson(text, true, buttons);
                json = await this.nlpHandler.fetchFinalResponse(response, param);
            }
            return json;
        } catch (err) {
            throw new Error(err);
        }
    };

    /*
     2. IT_ACTION_COMPONENT
     After user selects component value in IT Action Component Intent,
     Here Perform validations for procedure execution
     */
    async handleItActionComponent(param) {
        let json = {};
        try {
            console.log("INSIDE HANDLE IT Original ACTION COMPONENT");
            //  let [procedure,userProfile] =await  this.getProcedureAndUser(param);
            let [procedure] = await this.getProcedure(param);
            let [userProfile] = await this.getUser2(param);
            console.log("procedure is", procedure[0]);
            console.log("userProfile is", userProfile[0]);
            //Check if Procedure is Manual or Not
            //If Manual
            if (procedure[0].isManual) {
                //Create Ticket
                // if (this.webhookService.config.get('serviceDesk:t'))
                console.log("ticket process", param, procedure[0], userProfile[0], procedure[0].closingLevel)
                let ticketResponse = await this.createTicket(param, procedure[0], userProfile[0], procedure[0].closingLevel);

                if (ticketResponse.response === "SUCCESS") {
                    //Create Notification
                    let notifyParam = {
                        ACTION: param.ACTION,
                        COMPONENT: param.COMPONENT,
                        USER_NAME: userProfile[0].userName,
                        USER_EMAIL: userProfile[0].userEmail,
                        USER_IDENTITY: userProfile[0].userIdentity,
                        TICKET_ID: ticketResponse.ticketId,
                        PROCEDURE_ID: '',
                        STATUS: '',
                        CATEGORY: Constants.constants().NOTIFICATION_CATEGORY.TICKET_CREATE_MANUAL,
                        TYPE: Constants.constants().NOTIFICATION_TYPE.VIEW
                    };

                    // let res = await this.webhookService.executeNotification(notifyParam);

                    //Return Response
                    let response = `I cannot fulfill your request as it needs manual intervention. 
                    So I created ticket <b>${ticketResponse.ticketId}</b> for you. Our helpdesk staff will assist you soon.`;

                    json = await this.nlpHandler.fetchTextJson(response);
                    json = await this.nlpHandler.fetchFinalResponse(json, param);
                    return json;
                } else {
                    let response = `Sorry to inform you that ticket hasn't been created due 
                                    to temporary service desk issue. Please try again.`;

                    if (userProfile[0].userEmail === '' || userProfile[0].userEmail === 'noDataInPCV@db.com') {
                        response = `Sorry to inform you that ticket hasn't been created due to missing email 
                        configuration in your profile. Please get in touch with IT Support Team for same. `;
                    }

                    //Send Notification and Error Response
                    json = await this.nlpHandler.fetchTextJson(response);
                    json = await this.nlpHandler.fetchFinalResponse(json, param);
                    let notifyParam = {
                        ACTION: param.ACTION,
                        COMPONENT: param.COMPONENT,
                        USER_NAME: userProfile[0].userName,
                        USER_EMAIL: userProfile[0].userEmail,
                        USER_IDENTITY: userProfile[0].userIdentity,
                        TICKET_ID: '',
                        PROCEDURE_ID: '',
                        STATUS: '',
                        CATEGORY: Constants.constants().NOTIFICATION_CATEGORY.TICKET_ERROR,
                        TYPE: Constants.constants().NOTIFICATION_TYPE.VIEW
                    };
                    // let res = await this.webhookService.executeNotification(notifyParam);
                    return json;
                }
            }

            //If Not Manual,
            //Check for Approval Required,
            //If Approval Required, jump to IT_ACTION_APPROVAL Intent
            if (procedure[0].approvalRequired) {
                json = await this.handleItActionApproval(param, procedure, userProfile);
                return json;
            }
            //If Approval Not Required, jump to IT_ACTION_CONFIRMATION Intent
            else {
                let buttons = [
                    {
                        "type": "postback",
                        "title": 'Yes',
                        // "payload": `Yes ${param.ACTION}`,
                        "payload": 'Yes',
                        "text": ''
                    },
                    {
                        "type": "postback",
                        "title": 'No',
                        //  "payload": `No ${param.ACTION}`,
                        "payload": 'No',
                        "text": ''
                    }
                ];

                // let text = Messages.messages().NLP.BOT_ACTION_SLOT_CONFIRMATION_TEXT;
                let text = `Please confirm if you would like to proceed with action related to @component.`
                // text = text.replace('@action', CommonUtil.convertToTitleCase(param.ACTION));
                text = text.replace('@component', CommonUtil.convertToTitleCase(param.COMPONENT));
                console.log("------------------------- data in text", text);
                let intentDetectionConfidence ="99%";
                let response = await this.nlpHandler.fetchSlotJson(text, true, buttons,intentDetectionConfidence);
                json = await this.nlpHandler.fetchFinalResponse(response, param);

                return json;
            }
        } catch (err) {
            //Send error Notification to user
            //throw new Error(err);
            console.log("error in handleItActionComponent component", err)
            let response = `No category/component found for the option you chose. <br>
                <b>Please contact IT team.</b>`;
            json = await this.nlpHandler.fetchHtmlJson(response);
            json = await this.nlpHandler.fetchFinalResponse(json, param);
            return json;
        }
    };

    async loginActionComponent(param) {
        let json = {};
        try {
            console.log("INSIDE loginActionComponent");
            //  let [procedure,userProfile] =await  this.getProcedureAndUser(param);
            // let [procedure] = await this.getProcedureforcomponent(param);
            // let [userProfile] = await this.getUser2(param);
            // if (procedure == [])
            // console.log("procedure is", procedure[0]);
            // console.log("userProfile is", userProfile[0]);
            param.ACTION = param.ACTION.toUpperCase();
            param.COMPONENT = param.COMPONENT.toUpperCase();
            let [procedure] = await this.getProcedure(param);
            let [userProfile] = await this.getUser(param);
            let [userProfile2] = await this.getUser2(param);
            console.log("userProfile ==== ", userProfile);

            //generate random password 
            var password = generator.generate({
                length: 6,
                numbers: true
            });

            //Hashing algorithm
            var salt = bcrypt.genSaltSync(10);
            var hash = bcrypt.hashSync(password, salt);

            //base 64 encode
            'use strict';
            let buff = new Buffer(password);
            let base64 = buff.toString('base64');
            console.log('"' + password + '" converted to Base64 is "' + base64 + '"');

            let data = {
                email: userProfile2[0].userEmail,
                Name: userProfile2[0].userName,
                id: userProfile2[0].id,
                Password: password,
                Passbase64: base64,
                Passhash: hash
            }
            if (param.COMPONENT == "WINDOWS" || param.COMPONENT === "MAIL") {

                console.log("INSIDE AD Password Reset Function");
                // var sAMAccountName = param.USER_PROFILE.toUpperCase();
                // console.log("sAMAccountName", sAMAccountName)

                // var result = this.resetad.resetadpassword(sAMAccountName);

                // let response = `<p>Your temporary password has been sent to your registered Email ID.<br></p>`;
                // json = await this.nlpHandler.fetchHtmlJson(response);
                // json = await this.nlpHandler.fetchFinalResponse(json, param);

                let ticketResponse = await this.createTicket(param, procedure[0], userProfile[0], procedure[0].closingLevel);

                if (ticketResponse.response === "SUCCESS") {
                    //Execute Procedure
                    let actionResponse = await this.webhookService.executeAction(
                        //param.USER_IDENTITY,
                        userProfile[0].userIdentity,
                        procedure[0].procedureId
                    );
                    console.log("actionResponse === ", actionResponse);

                    //Create Execution Record
                    let executionResponse = await this.webhookService.createExecution(
                        userProfile[0].userIdentity,
                        procedure[0].procedureId,
                        ticketResponse.ticketId,
                        Constants.constants().EXECUTION_STATUS.RUNNING,
                        ticketResponse.summary
                    );

                    // let res = await this.webhookService.executeNotification(notifyParam);

                    //Return Response
                    let response = `This requires manual intervention. 
            So, I have created ticket <b>${ticketResponse.ticketId}</b> for same.`;

                    json = await this.nlpHandler.fetchTextJson(response);
                    json = await this.nlpHandler.fetchFinalResponse(json, param);
                    return json;
                } else {
                    //Send Notification and Error Response
                    let response = `Sorry to inform you that ticket hasn't been created due 
                            to temporary service desk issue. Please try again.`;

                    if (userProfile[0].userEmail === '' || userProfile[0].userEmail === 'noDataInPCV@db.com') {
                        response = `Sorry to inform you that ticket hasn't been created due to missing email 
                configuration in your profile. Please get in touch with IT Support Team for same. `;
                    }
                    json = await this.nlpHandler.fetchTextJson(response);
                    json = await this.nlpHandler.fetchFinalResponse(json, param);

                    // let res = await this.webhookService.executeNotification(notifyParam);

                    return json;
                }
            }
            else if (param.COMPONENT == "EJIJO" || param.COMPONENT == "RESOURCE PORTAL" || param.COMPONENT == "RESOURCE PORTAL") {
                if (param.COMPONENT == "EJIJO") {
                    await this.syncUtil.executeMobPassword(data)

                } else {
                    let empid = userProfile2[0].EMPID
                    let respassword = await this.aesencryption.encrypt(password)
                    console.log("resource password", respassword)
                    let resource = await this.syncUtil.executeResourcePassword(respassword, empid)
                }

                var msgdata = {
                    number: userProfile2[0].MobileNumber,
                    msg: `Your temporary password is as follows: ${password}. Please use the same for login.`
                }
                console.log("message", msgdata)
                let sendmessage = await this.sendmessage.textmessage(msgdata)
                let sendmail = await this.sendmail.mailmessage2(data)

                let response = `<p>Your temporary password has been sent to your regsitered Email ID/Mobile Number.<br></p>`;
                json = await this.nlpHandler.fetchHtmlJson(response);
                json = await this.nlpHandler.fetchFinalResponse(json, param);
                return json;

            }
        } catch (err) {
            //Send error Notification to user
            //throw new Error(err);
            console.log("error in handleItActionComponent component", err)
            let response = `No category/component found for the option you chose. <br>
                <b>Please contact IT team.</b>`;
            json = await this.nlpHandler.fetchHtmlJson(response);
            json = await this.nlpHandler.fetchFinalResponse(json, param);
            return json;
        }
    };
    async performItAction(param) {
        // if (param.CONFIRMATION === 'YES' && param.ACTION !== "LOGIN ISSUE") {
        console.log("performItAction");
        let json = {};
        try {
            param.ACTION = param.ACTION.toUpperCase();
            if (param.COMPONENT) {
                param.COMPONENT = param.COMPONENT.toUpperCase();
            }
            if (param.COMPONENT == 'USB' || param.COMPONENT == 'UAC' || param.COMPONENT == 'FIREWALL' || param.COMPONENT == 'ADMIN RIGHTS') {
                param.CATEGORY = param.CATEGORY.toUpperCase();
                param.ACTION = 'SECURITY';
                if (param.CATEGORY == 'ENABLE') {
                    param.CATEGORY = 'SECURITY ENABLE';
                }
                else if (param.CATEGORY == 'DISABLE') {
                    param.CATEGORY = 'SECURITY DISABLE';
                }
            }
            let [procedure] = await this.getProcedureforcomponent(param);
            let [userProfile] = await this.getUser2(param);
            console.log("procedure is", procedure[0]);
            console.log("userProfile is", userProfile[0]);

            //Create Ticket
            if (procedure[0].approvalRequired) {
                json = await this.handleItActionApproval(param, procedure, userProfile);
                return json;
            }
            else {
                let ticketResponse = await this.createTicket(param, procedure[0], userProfile[0], procedure[0].closingLevel);

                if (ticketResponse.response === "SUCCESS") {
                    //Execute Procedure
                    let actionResponse = await this.webhookService.executeAction(
                        //param.USER_IDENTITY,
                        userProfile[0].userIdentity,
                        procedure[0].procedureId
                    );
                    console.log("actionResponse === ", actionResponse);

                    //Create Execution Record
                    let executionResponse = await this.webhookService.createExecution(
                        userProfile[0].userIdentity,
                        procedure[0].procedureId,
                        ticketResponse.ticketId,
                        Constants.constants().EXECUTION_STATUS.RUNNING,
                        ticketResponse.summary
                    );

                    // let res = await this.webhookService.executeNotification(notifyParam);

                    //Return Response
                    let response = `I have triggered action requested by you. 
Also I have created ticket <b>${ticketResponse.ticketId}</b> for same.`;

                    json = await this.nlpHandler.fetchTextJson(response);
                    json = await this.nlpHandler.fetchFinalResponse(json, param);
                    return json;
                } else {
                    //Send Notification and Error Response
                    let response = `Sorry to inform you that ticket hasn't been created due 
                to temporary service desk issue. Please try again.`;

                    if (userProfile[0].userEmail === '' || userProfile[0].userEmail === 'noDataInPCV@db.com') {
                        response = `Sorry to inform you that ticket hasn't been created due to missing email 
    configuration in your profile. Please get in touch with IT Support Team for same. `;
                    }
                    json = await this.nlpHandler.fetchTextJson(response);
                    json = await this.nlpHandler.fetchFinalResponse(json, param);


                    // let res = await this.webhookService.executeNotification(notifyParam);
                    return json;
                }
            }
        }
        catch (err) {
            //Send error Notification to user
            //throw new Error(err);
            console.log("error in handleItActionComponent component", err)
            let response = `Sorry for inconvience. Please try again later.`;
            json = await this.nlpHandler.fetchHtmlJson(response);
            json = await this.nlpHandler.fetchFinalResponse(json, param);
            return json;
        }
    };

    async getTicketDetails(param) {
        console.log("getTicketDetails");
        let json = {};
        try {
            let [userProfile] = await this.getUser2(param);
            // let 
            console.log("userProfile is", userProfile[0]);
            let ticket_id = param.TICKET_ID.toUpperCase();
            let user_identity = userProfile[0].userIdentity
            let [userTicket] = await this.getUserTicket(user_identity, ticket_id)
            console.log(userTicket[0]);
            if (userTicket[0] === undefined || userTicket === [[]]) {
                let response = `Sorry, this ticket is not registered with your system. 
                Please check your ticket id.`;

                json = await this.nlpHandler.fetchTextJson(response);
                json = await this.nlpHandler.fetchFinalResponse(json, param);
                return json;


            }
            else if (userTicket[0].is_serviceRequest && param.ACTION === 'UPDATE') {
                let response = `Sorry, cannot update service request. 
                Only Incident ticket can be updated. `;

                json = await this.nlpHandler.fetchTextJson(response);
                json = await this.nlpHandler.fetchFinalResponse(json, param);
                return json;

            }

            else {
                //Send Notification and Error Response
                let [fetchTicketDetails] = await this.webhookService.getTicket(ticket_id)
                console.log('soap response', fetchTicketDetails[0])
                let date = new Date(fetchTicketDetails[0].CreateDateTime[0]._)
                var res = {
                    'IncidentNumber': fetchTicketDetails[0].IncidentNumber[0]._,
                    'Summary': fetchTicketDetails[0].Summary[0]._,
                    'Status': fetchTicketDetails[0].Stage[0]._,
                    'Submitter': fetchTicketDetails[0].Submitter[0]._,
                    'SubmitterEmail': fetchTicketDetails[0].SubmitterEmail[0]._,
                    'CreatedDate': date.getDate() + "/" + (date.getMonth() + 1) + "/" + date.getFullYear(),
                    'CreatedTime': date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds(),
                    "Assignee": fetchTicketDetails[0].AssigneeType[0]._
                }
                console.log("fetch ticket details", res)
                // console.log('resoltuion' , fetchTicketDetails[0].ServiceDeskDefinition[0].Resolution[0].Item)
                let response;
                console.log('param.ACTION', param.ACTION)
                if (param.ACTION === undefined || param.ACTION === 'GET' || !param.ACTION) {
                    response = `Your ticket no. : ${res.IncidentNumber}
                <br> Created on : ${res.CreatedDate} ${res.CreatedTime}
                <br> Submitted by : ${res.Submitter} 
                <br> email address: ${res.SubmitterEmail}.
                <br> Summary : ${res.Summary},
                <br>Status : ${res.Status}
                <br>Assigned to : ${res.Assignee}.
                `;
                    json = await this.nlpHandler.fetchTextJson(response);
                }
                else if (param.ACTION === 'UPDATE') {
                    response = {
                        "form":
                        {
                            "type": "form", "content":
                            {
                                "name": "ticketUpdate_form",
                                "fields":
                                    [
                                        { "name": "incident_no", "type": "text", "value": res.IncidentNumber, "required": "disabled", "display_name": "Incident Id" },
                                        { "name": "submitter_email", "type": "text", "value": res.SubmitterEmail, "required": "disabled", "display_name": "Submitter Email" },
                                        { "name": "summary", "type": "text", "value": res.Summary, "required": "disabled", "display_name": "Summary" },
                                        { "name": "assignee", "type": "text", "value": res.Assignee, "required": "disabled", "display_name": "Assignee" },
                                        { "name": "description_text", "type": "textarea", "required": "required", "display_name": "Ticket Description", "rows": 2 }
                                    ]
                            }
                        }
                    }
                    json = response;
                    console.log(json)
                }

                json = await this.nlpHandler.fetchFinalResponse(json, param);
                return json;
            }
        }

        catch (err) {
            //Send error Notification to user
            //throw new Error(err);
            console.log("error in get ticket details component", err)
            let response = `Sorry for cannot fetch details for service request.`;
            json = await this.nlpHandler.fetchHtmlJson(response);
            json = await this.nlpHandler.fetchFinalResponse(json, param);
            return json;
        }
    };
    async updateTicketDetails(param) {
        console.log("updateTicketDetails");
        let json = {};
        try {
            let [userProfile] = await this.getUser2(param);
            console.log("userProfile is", userProfile[0]);
            param.TICKET_ID = param.TICKET_ID.toUpperCase();
            console.log(param.TICKET_ID)
            let fetchTicketDetails = await this.webhookService.updateTicket(param)
            console.log('soap response', fetchTicketDetails)
            let response;
            if (fetchTicketDetails === 'SUCCESS') {
                response = `Your ticket no. : ${param.TICKET_ID} was updated successfully.`;

            }
            else {
                response = `Sorry , ticket ${param.TICKET_ID} wasn't updated successfully`;

            }
            json = await this.nlpHandler.fetchTextJson(response);
            json = await this.nlpHandler.fetchFinalResponse(json, param);
            return json;
        }

        catch (err) {
            //Send error Notification to user
            //throw new Error(err);
            console.log("error in get ticket details component", err)
            let response = `Sorry for inconvience. Please try again later.`;
            json = await this.nlpHandler.fetchHtmlJson(response);
            json = await this.nlpHandler.fetchFinalResponse(json, param);
            return json;
        }
    };

    async provideActionList(param) {
        // if (param.CONFIRMATION === 'YES' && param.ACTION !== "LOGIN ISSUE") {
        console.log("provideActionList");
        let json = {};
        try {
            let [procedures] = await this.getProcedureforcomponent(param);
            let [userProfile] = await this.getUser2(param);
            console.log("procedure is", procedures[0]);
            console.log("userProfile is", userProfile[0]);
            let buttons = [];
            for (let procedure of procedures) {
                let button = {
                    "type": "postback",
                    "title": procedure.text,
                    "payload": procedure.text,
                    "text": procedure.text
                };
                buttons.push(button);
            }
            let text = '';
            if (buttons.length === 0) {
                text = `Sorry, I don't have ${param.COMPONENT} listed with me.`;
            } else {
                text = Messages.messages().NLP.BOT_ACTION_SLOT_TEXT;
            }
            // let button = {
            //     "type": "postback",
            //     "title": `raise an issue with ${param.COMPONENT}`,
            //     "payload": `raise an issue with ${param.COMPONENT}`,
            //     "text": `raise an issue with ${param.COMPONENT}`
            // };
            buttons.push(button);
            let response = await this.nlpHandler.fetchSlotJson(text, true, buttons);
            json = await this.nlpHandler.fetchFinalResponse(response, param);
            return json;
            //Create Ticket
        }
        catch (err) {
            //Send error Notification to user
            //throw new Error(err);
            console.log("error in handleItActionComponent component", err)
            let response = `Sorry for inconvience. Please try again later.`;
            json = await this.nlpHandler.fetchHtmlJson(response);
            json = await this.nlpHandler.fetchFinalResponse(json, param);
            return json;
        }
    };
    async raiseTicket(param) {
        // if (param.CONFIRMATION === 'YES' && param.ACTION !== "LOGIN ISSUE") {
        console.log("raiseTicket");
        let json = {};
        try {

            let [procedure] = await this.getProcedureForAction(param);
            let [userProfile] = await this.getUser2(param);
            console.log("procedure is", procedure[0]);
            console.log("userProfile is", userProfile[0]);

            //Create Ticket
            if (param.COMPONENT == undefined) {
                param.COMPONENT == param.USER_QUERY
            }
            let ticketResponse = await this.createTicket(param, procedure[0], userProfile[0], procedure[0].closingLevel);

            if (ticketResponse.response === "SUCCESS") {
                //Execute Procedure
                let actionResponse = await this.webhookService.executeAction(
                    //param.USER_IDENTITY,
                    userProfile[0].userIdentity,
                    procedure[0].procedureId
                );
                console.log("actionResponse === ", actionResponse);

                //Create Execution Record
                let executionResponse = await this.webhookService.createExecution(
                    userProfile[0].userIdentity,
                    procedure[0].procedureId,
                    ticketResponse.ticketId,
                    Constants.constants().EXECUTION_STATUS.RUNNING,
                    ticketResponse.summary
                );

                // let res = await this.webhookService.executeNotification(notifyParam);

                //Return Response
                let response = `I have created ticket <b>${ticketResponse.ticketId}</b> for you. 
Our team will contact you soon.`;

                json = await this.nlpHandler.fetchTextJson(response);
                json = await this.nlpHandler.fetchFinalResponse(json, param);
                return json;
            }
            else {
                //Send Notification and Error Response
                let response = `Sorry to inform you that ticket hasn't been created due 
                to temporary service desk issue. Please try again.`;

                if (userProfile[0].userEmail === '' || userProfile[0].userEmail === 'noDataInPCV@db.com') {
                    response = `Sorry to inform you that ticket hasn't been created due to missing email 
    configuration in your profile. Please get in touch with IT Support Team for same. `;
                }
                json = await this.nlpHandler.fetchTextJson(response);
                json = await this.nlpHandler.fetchFinalResponse(json, param);


                // let res = await this.webhookService.executeNotification(notifyParam);
                return json;
            }

        }
        catch (err) {
            //Send error Notification to user
            //throw new Error(err);
            console.log("error in handleItActionComponent component", err)
            let response = `Sorry for inconvience. Please try again later.`;
            json = await this.nlpHandler.fetchHtmlJson(response);
            json = await this.nlpHandler.fetchFinalResponse(json, param);
            return json;
        }
    };
    /*
     3. IT_ACTION_APPROVAL
     After user provides reason for Action Requested,
     Here Perform operations for procedure execution
     */
    async handleItActionApproval(param, procedure, userProfile) {
        let json = {};
        try {
            // let [procedure,userProfile] =await  this.getProcedureAndUser(param);
            //Create Ticket
            console.log("this is the userPrfoile", userProfile)
            let ticketResponse = await this.creadteTicket(param, procedure[0], userProfile[0], procedure[0].closingLevel);

            if (ticketResponse.response === "SUCCESS") {
                //Create Approval Record
                let approvalResponse = await this.webhookService.createApproval(
                    param.USER_IDENTITY,
                    userProfile[0].mgrIdentity,
                    procedure[0].procedureId,
                    ticketResponse.ticketId,
                    param.REASON
                );

                //Create Execution Record
                let executionResponse = await this.webhookService.createExecution(
                    param.USER_IDENTITY,
                    procedure[0].procedureId,
                    ticketResponse.ticketId,
                    Constants.constants().EXECUTION_STATUS.PENDING,
                    ticketResponse.summary
                );


                //Create Notification Record
                let notifyParam = {
                    ACTION: param.ACTION,
                    COMPONENT: param.COMPONENT,
                    USER_NAME: userProfile[0].userName,
                    USER_EMAIL: userProfile[0].userEmail,
                    MGR_EMAIL: userProfile[0].mgrEmail,
                    USER_IDENTITY: userProfile[0].mgrIdentity,
                    TICKET_ID: ticketResponse.ticketId,
                    PROCEDURE_ID: procedure[0].procedureId,
                    STATUS: '',
                    CATEGORY: Constants.constants().NOTIFICATION_CATEGORY.APPROVAL_REQUEST,
                    TYPE: Constants.constants().NOTIFICATION_TYPE.APPROVAL,
                    REASON: param.REASON
                };

                // let res = await this.webhookService.executeNotification(notifyParam);

                //Return Response
                let response = `I have notified your manager regarding your request. 
                Also I have created ticket <b>${ticketResponse.ticketId}</b> for you.`;
                json = await this.nlpHandler.fetchTextJson(response);
                json = await this.nlpHandler.fetchFinalResponse(json, param);
                return json;
            } else {
                //Send Notification and Error Response
                let response = `Sorry to inform you that ticket hasn't been created due 
                                    to temporary service desk issue. Please try again.`;

                if (userProfile[0].userEmail === '' || userProfile[0].userEmail === 'noDataInPCV@db.com') {
                    response = `Sorry to inform you that ticket hasn't been created due to missing email 
                        configuration in your profile. Please get in touch with IT Support Team for same. `;
                }

                json = await this.nlpHandler.fetchTextJson(response);
                json = await this.nlpHandler.fetchFinalResponse(json, param);
                let notifyParam = {
                    ACTION: param.ACTION,
                    COMPONENT: param.COMPONENT,
                    USER_NAME: userProfile[0].userName,
                    USER_EMAIL: userProfile[0].userEmail,
                    MGR_EMAIL: userProfile[0].mgrEmail,
                    USER_IDENTITY: userProfile[0].mgrIdentity,
                    TICKET_ID: ticketResponse.ticketId,
                    PROCEDURE_ID: procedure[0].procedureId,
                    STATUS: '',
                    CATEGORY: Constants.constants().NOTIFICATION_CATEGORY.TICKET_ERROR,
                    TYPE: Constants.constants().NOTIFICATION_TYPE.VIEW,
                    REASON: param.REASON
                };
                // let res = await this.webhookService.executeNotification(notifyParam);
                return json;
            }


            return json;
        } catch (err) {
            //Send error Notification to user
            //throw new Error(err);
            console.log("error in handleItActionApproval", err)
            let response = `No category/component found for the option you chose. <br>
                <b>Please contact IT team.</b>`;
            json = await this.nlpHandler.fetchHtmlJson(response);
            json = await this.nlpHandler.fetchFinalResponse(json, param);
            return json;
        }
    };

    /*
     4. IT_ACTION_CONFIRMATION
     After user provides confirmation to proceed with the Request,
     Here Perform operations for procedure execution (without approval)
     */
    async handleItActionConfirmation(param) {
        let json = {}; 
        try {
            if (param.CONFIRMATION === 'NO') {
                //Return Thanks Response
                let response = `Ok Thanks, Happy to help you. To restart the conversation type hello/help`;
                json = await this.nlpHandler.fetchTextJson(response);
                json = await this.nlpHandler.fetchFinalResponse(json, param);
            }
            //If Yes
            param.ACTION = param.ACTION.toUpperCase();
            console.log('user-info-action',param.ACTION)
            if (param.CONFIRMATION === 'YES' && param.ACTION !== "LOGIN ISSUE") {
                
                
                param.COMPONENT = param.COMPONENT.toUpperCase();
                let [procedure] = await this.getProcedure(param);
                console.log('dfghdusigfh',procedure)
                console.log('user-info',param)
                // let [userProfile] = await this.getUser(param);
                let [userProfile] = await this.getUserByMail(param)
                let [userProfile2] = await this.getUser2(param);
                userProfile[0]['userEmail']=param.USER_EMAIL
                console.log("userProfile ==== mail", userProfile);
                
                console.log('dfghdusigfh',procedure)
                //Create Ticket
                
                let ticketResponse = await this.createTicket(param, procedure[0], userProfile[0], procedure[0].closingLevel);

                // if (ticketResponse.response === "SUCCESS") {
                    //Execute Procedure
                    let actionResponse = await this.webhookService.executeAction(
                        //param.USER_IDENTITY,
                        userProfile[0].userIdentity,
                        procedure[0].procedureId
                    );
                    console.log("actionResponse === ", actionResponse);

                    //Create Execution Record
                    let executionResponse = await this.webhookService.createExecution(
                        userProfile[0].userIdentity,
                        procedure[0].procedureId,
                        ticketResponse.ticketId,
                        Constants.constants().EXECUTION_STATUS.RUNNING,
                        ticketResponse.summary
                    );
                    console.log(executionResponse, "entry to execution Database")
                    // let res = await this.webhookService.executeNotification(notifyParam);

                    //Return Response
                    let response = `I have triggered action requested by you. 
        Also I have created ticket <b>${ticketResponse.ticketId}</b> for same.`;

                    json = await this.nlpHandler.fetchTextJson(response);
                    json = await this.nlpHandler.fetchFinalResponse(json, param);
                    return json;
                // }
            //      else {
            //         //Send Notification and Error Response
            //         let response = `Sorry to inform you that ticket hasn't been created due 
            //             to temporary service desk issue. Please try again.`;

            //         if (userProfile[0].userEmail === '' || userProfile[0].userEmail === 'noDataInPCV@db.com') {
            //             response = `Sorry to inform you that ticket hasn't been created due to missing email 
            // configuration in your profile. Please get in touch with IT Support Team for same. `;
            //         }
            //         json = await this.nlpHandler.fetchTextJson(response);
            //         json = await this.nlpHandler.fetchFinalResponse(json, param);


            //         // let res = await this.webhookService.executeNotification(notifyParam);
            //         return json;
            //     }
            }

            //If No,
            else if (param.CONFIRMATION === 'YES' && param.ACTION === "LOGIN ISSUE") {
                param.ACTION = param.ACTION.toUpperCase();
                param.COMPONENT = param.COMPONENT.toUpperCase();
                let [procedure] = await this.getProcedure(param);
                let [userProfile] = await this.getUserByMail(param);
                let [userProfile2] = await this.getUser2(param);
                console.log("userProfile ==== ", userProfile);
                console.log("userProfile222 ==== ", userProfile2);

                //generate random password 
                var password = generator.generate({
                    length: 6,
                    numbers: true
                });

                //Hashing algorithm
                var salt = bcrypt.genSaltSync(10);
                var hash = bcrypt.hashSync(password, salt);

                //base 64 encode
                'use strict';
                let buff = new Buffer(password);
                let base64 = buff.toString('base64');
                console.log('"' + password + '" converted to Base64 is "' + base64 + '"');

                let data = {
                    email: userProfile[0].userEmail,
                    Name: userProfile[0].userName,
                    id: userProfile[0].id,
                    Password: password,
                    Passbase64: base64,
                    Passhash: hash
                }
                if (param.COMPONENT == "WINDOWS" || param.COMPONENT === "MAIL") {

                    console.log("INSIDE AD Password Reset Function");
                    // var sAMAccountName = param.USER_PROFILE.toUpperCase();
                    // console.log("sAMAccountName", sAMAccountName)

                    // var result = this.resetad.resetadpassword(sAMAccountName);

                    // let response = `<p>Your temporary password has been sent to your registered Email ID.<br></p>`;
                    // json = await this.nlpHandler.fetchHtmlJson(response);
                    // json = await this.nlpHandler.fetchFinalResponse(json, param);

                    let ticketResponse = await this.createTicket(param, procedure[0], userProfile[0], procedure[0].closingLevel);

                    if (ticketResponse.response === "SUCCESS") {
                        //Execute Procedure
                        let actionResponse = await this.webhookService.executeAction(
                            //param.USER_IDENTITY,
                            userProfile[0].userIdentity,
                            procedure[0].procedureId
                        );
                        console.log("actionResponse === ", actionResponse);

                        //Create Execution Record
                        let executionResponse = await this.webhookService.createExecution(
                            userProfile[0].userIdentity,
                            procedure[0].procedureId,
                            ticketResponse.ticketId,
                            Constants.constants().EXECUTION_STATUS.RUNNING,
                            ticketResponse.summary
                        );

                        // let res = await this.webhookService.executeNotification(notifyParam);

                        //Return Response
                        let response = `This requires manual intervention. 
            So, I have created ticket <b>${ticketResponse.ticketId}</b> for same.`;

                        json = await this.nlpHandler.fetchTextJson(response);
                        json = await this.nlpHandler.fetchFinalResponse(json, param);
                        return json;
                    } else {
                        //Send Notification and Error Response
                        let response = `Sorry to inform you that ticket hasn't been created due 
                            to temporary service desk issue. Please try again.`;

                        if (userProfile[0].userEmail === '' || userProfile[0].userEmail === 'noDataInPCV@db.com') {
                            response = `Sorry to inform you that ticket hasn't been created due to missing email 
                configuration in your profile. Please get in touch with IT Support Team for same. `;
                        }
                        json = await this.nlpHandler.fetchTextJson(response);
                        json = await this.nlpHandler.fetchFinalResponse(json, param);

                        // let res = await this.webhookService.executeNotification(notifyParam);

                        return json;
                    }
                }
                else if (param.COMPONENT == "EJIJO" || param.COMPONENT == "RESOURCE PORTAL" || param.COMPONENT == "RESOURCE PORTAL") {
                    if (param.COMPONENT == "EJIJO") {
                        await this.syncUtil.executeMobPassword(data)

                    } else {
                        let empid = userProfile[0].EMPID
                        let respassword = await this.aesencryption.encrypt(password)
                        console.log("resource password", respassword)
                        let resource = await this.syncUtil.executeResourcePassword(respassword, empid)
                    }

                    var msgdata = {
                        number: userProfile[0].MobileNumber,
                        msg: `Your temporary password is as follows: ${password}. Please use the same for login.`
                    }
                    console.log("message", msgdata)
                    let sendmessage = await this.sendmessage.textmessage(msgdata)
                    let sendmail = await this.sendmail.mailmessage2(data)

                    let response = `<p>Your temporary password has been sent to your regsitered Email ID/Mobile Number.<br></p>`;
                    json = await this.nlpHandler.fetchHtmlJson(response);
                    json = await this.nlpHandler.fetchFinalResponse(json, param);
                    return json;

                }


            }


            return json;
        } catch (err) {
            //Send error Notification to user
            //throw new Error(err);
            console.log("error in handleItActionConfirmation", err)
            let response = `No category/component found for the option you chose. <br>
                <b>Please contact IT team.</b>`;
            json = await this.nlpHandler.fetchHtmlJson(response);
            json = await this.nlpHandler.fetchFinalResponse(json, param);
            return json;
        }
    };


    /*
     5. IT_ACTION_EXECUTE
     After user initiates Action Request like "I want to install 7 zip",
     Here Perform check for missing component value
     If component Missing, jump to IT_ACTION_COMPONENT intent
     If component not Missing, jump to
     */
    async handleItActionExecute(param) {
        let json = {};
        try {
            //If Component NOT Missing
            if (param.COMPONENT) {
                json = await this.handleItActionComponent(param);
                return json;
            }

            //If Component Missing,
            //Prepare Component Listing & jump to IT_ACTION_COMPONENT Intent
            if (!param.COMPONENT) {
                //Fetch Component Listing by action
                json = await this.handleItActionInitializer(param);
                return json;
            }
            return json;
        } catch (err) {
            throw new Error(err);
        }
    };


    /************************ TROUBLESHOOT *****************************************/
    /**********************************************************************/




    /*
    8. TICKET_LIST [DONE]
    After user asks for Ticket Status
    */
    async handleTicketStatus(param) {
        console.log("CALLING TICKET STATUS");
        let json = {};
        try {
            let [userProfile] = await this.getPCUser(param);
            let response = '';
            if (param.TICKET_STATUS == 'Open' || param.TICKET_STATUS == 'OPEN') { param.TICKET_STATUS = 'Open' }
            if (param.TICKET_STATUS == 'Closed' || param.TICKET_STATUS == 'CLOSED') { param.TICKET_STATUS = 'Closed' }
            console.log("ticket status", (param.TICKET_STATUS == 'Open' || param.TICKET_STATUS == 'Closed') ? param.TICKET_STATUS : null)
            let ticketRecords = await this.webhookService.fetchTicketStatus(
                // param.USER_IDENTITY,
                userProfile[0].userIdentity,
                (param.TICKET_STATUS == 'Open' || param.TICKET_STATUS == 'Closed') ? param.TICKET_STATUS : null
            );
            if (ticketRecords && ticketRecords.length > 0) {
                let data = '';
            
                for (let i = 0; i < ticketRecords.length; i++) {
                    let Type = "undefined";
                    if (ticketRecords[i].is_serviceRequest) {
                        Type = "Service Request";
                    }
                    else {
                        Type = "Incident";
                    }
                    data = data + `<tr><td>${ticketRecords[i].ticketId}</td><td>${ticketRecords[i].ticketStatus}</td><td>${Type}</td></tr>`;
                }
                let html = `
                <style>
                table.tickets_status, .tickets_status td, .tickets_status th {  
                  border: 1px solid #ddd;
                  text-align: left;
                }
                
                table.tickets_status {
                  border-collapse: collapse;
                  width: 235px;
                  margin: 2px;
                }
                
                .tickets_status th, .tickets_status td{
                  padding: 8px;
                }
                </style>
                <p>The tickets status are provided below</p>
                <table class="tickets_status">
                  <tr>
                    <th>TicketId</th>
                    <th>Status</th>
                    <th>Type</th>
                    </tr>
                  ${data}
                </table>`;
                
                
                // let html = 
                // `<!DOCTYPE html>
                // <html>
                // <head>
                // <meta name="viewport" content="width=device-width, initial-scale=1">
                // <style>
                // body {font-family: Arial, Helvetica, sans-serif;}
                
                
                
                // /* The Modal (background) */
                // .modal {
                //   display: none; /* Hidden by default */
                //   position: fixed; /* Stay in place */
                //   z-index: 1; /* Sit on top */
                //   padding-top: 100px; /* Location of the box */
                //   left: 0;
                //   top: 0;
                //   width: 100%; /* Full width */
                //   height: 100%; /* Full height */
                //   overflow: auto; /* Enable scroll if needed */
                //   opacity: none;
                //   background-color: rgb(100,0,0); /* Fallback color */
                //   background-color: rgba(0,0,0,0); /* Black w/ opacity */
                // }
                
                
                
                // /* Modal Content */
                // .modal-content {
                //   background: none;
                  
                //   margin: auto;
                //   padding: 0px;
                  
                //   width: 100%;
                // }
                
                
                
                // /* The Close Button */
                // .close {
                //   color: #aaaaaa;
                //   float: right;
                //   font-size: 28px;
                //   font-weight: bold;
                // }
                
                
                
                // .close:hover,
                // .close:focus {
                //   color: #000;
                //   text-decoration: none;
                //   cursor: pointer;
                // }
                // </style>
                // </head>
                // <body>
                
                
                
                // <p>Get to know more about IMS culture</p>
                
                
                
                // <!-- Trigger/Open The Modal -->
                // <button type="button"  id ="myBtn" class="quick_replies_class btn-dark">PLAY</button>
                
                
                
                
                // <!-- The Modal -->
                // <div id="myModal" class="modal">
                
                
                
                //  <!-- Modal content -->
                //   <div class="modal-content">
                //     <span class="close">&times;</span>
                //     <iframe width="400" height="410" src="https://www.youtube.com/embed/VGpZdUQXbeo" title="IMS case study" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
                
                //   </div>
                
                
                
                // </div>
                
                
                
                // <script>
                // // Get the modal
                // var modal = document.getElementById("myModal");
                
                
                
                // // Get the button that opens the modal
                // var btn = document.getElementById("myBtn");
                
                
                
                // // Get the <span> element that closes the modal
                // var span = document.getElementsByClassName("close")[0];
                
                
                
                // // When the user clicks the button, open the modal
                // btn.onclick = function() {
                //   modal.style.display = "block";
                // }
                
                
                
                // // When the user clicks on <span> (x), close the modal
                // span.onclick = function() {
                //   modal.style.display = "none";
                // }
                
                
                
                // // When the user clicks anywhere outside of the modal, close it
                // window.onclick = function(event) {
                //   if (event.target == modal) {
                //     modal.style.display = "none";
                //   }
                // }
                // </script>
                
                
                
                // </body>
                // </html>`
                json = await this.nlpHandler.fetchHtmlJson(html);
            } else {
                response = `Sorry, I could not find any support ticket created by you.`;
                json = await this.nlpHandler.fetchTextJson(response);
            }
            json = await this.nlpHandler.fetchFinalResponse(json, param);
            json.parameters.ticketStatus = null;
            return json;
        } catch (err) {
            throw new Error(err);
        }
    };

    /*
  9. Action List [DONE]
  After user selects action value in IT Action Initializer Intent,
  Here fetch Components list and Call IT_ACTION_COMPONENT Intent by passing
  slot filling response to ask choose component.
  */
    // async handleItList(param) {
    //     console.log("========inside action lit=====")
    //     let json = {};
    //     try {
    //             let [userProfile] =await this.getUser(param);
    //             console.log("")

    //             if (userProfile && userProfile.length > 0) {
    //                 let buttons = [
    //                 {
    //                     "type": "postback",
    //                     "title": 'Login Issue',
    //                    "payload": 'Facing Login issue',
    //                     "text": ''
    //                 },
    //                 {
    //                     "type": "postback",
    //                     "title": 'Installation/Update',
    //                    "payload": 'Please do Installation',
    //                     "text": ''
    //                 },
    //                 {
    //                     "type": "postback",
    //                     "title": 'Uninstallation',
    //                    "payload": 'Please do Uninstallation',
    //                     "text": ''
    //                 },
    //                 {
    //                     "type": "postback",
    //                     "title": 'Performance',
    //                    "payload": 'I am having performance issue',
    //                     "text": ''
    //                 },
    //                 {
    //                     "type": "postback",
    //                     "title": 'Network',
    //                    "payload": 'Network issue',
    //                     "text": ''
    //                 },
    //                 {
    //                     "type": "postback",
    //                     "title": 'Windows & Security',
    //                    "payload": 'help with windows security',
    //                     "text": ''
    //                 },
    //                 {
    //                     "type": "postback",
    //                     "title": 'Troubleshoot',
    //                    "payload": 'Troubleshoot',
    //                     "text": ''
    //                 },
    //                 {
    //                     "type": "postback",
    //                     "title": 'Windows Settings',
    //                    "payload": 'Settings',
    //                     "text": ''
    //                 },
    //                 {
    //                     "type": "postback",
    //                     "title": 'Ticket Status',
    //                    "payload": 'Ticket Status',
    //                     "text": ''
    //                 }
    //             ];
    //             if(param.INTENTNAME=="Intent_welcome"){

    //                 let text ="Do you need help with something else, please find the options again.";
    //                 let response = await this.nlpHandler.fetchSlotJson(text, true, buttons);
    //                 json = await this.nlpHandler.fetchFinalResponse(response, param);
    //                 return json;
    //             }else 
    //             {
    //                 let text =`Hi <b>${userProfile[0].userName}</b>, I can help you with the following mentioned options`;
    //                 let response = await this.nlpHandler.fetchSlotJson(text, true, buttons);
    //                 json = await this.nlpHandler.fetchFinalResponse(response, param);
    //                 return json;
    //             } 
    //         }
    //         else {
    //              let [userProfile2] =await this.getUser2(param);
    //              console.log(userProfile2)
    //             if (userProfile2 && userProfile2.length > 0) {
    //             let buttons = [
    //             {
    //                 "type": "postback",
    //                 "title": 'Login Issue',
    //                "payload": 'Facing Login issue',
    //                 "text": ''
    //             }
    //         ];

    //             let text =`Hi <b>${userProfile2[0].userName}</b>, I can help you with the following mentioned options`;
    //             let response = await this.nlpHandler.fetchSlotJson(text, true, buttons);
    //             json = await this.nlpHandler.fetchFinalResponse(response, param);
    //             return json;
    //     } else {
    //         let text ="Email address is not registered. Please contact application team.";
    //             let response = await this.nlpHandler.fetchSlotJson(text, true, buttons);
    //             json = await this.nlpHandler.fetchFinalResponse(response, param);
    //             return json;
    //     }
    //         }



    //     } catch (err) {
    //         console.log("error in ITlist",err)
    //         let response = `PC Visor Agent/Email adress has not been installed/registered on your machine or Machine Group has been changed.<br>
    //         <b>Please contact IT Team.</b>`;
    //                 json = await this.nlpHandler.fetchHtmlJson(response);
    //                 json = await this.nlpHandler.fetchFinalResponse(json, param);
    //                 return json;
    //     }
    // };

    async handleWelcomeList(param) {
        console.log("========inside actions list=====")
        let json = {};
        try {
            let [userProfile] = await this.getUser(param);
            // console.log("isseu outside")
             let useremail = userProfile[0].userEmail || userProfile[0].email;
             console.log(useremail)
            let verifiedtime = new Date(userProfile[0].Verificationtime);
            console.log("verified time is", verifiedtime);
            let te = new Date()
            console.log(te)
            var final = Math.abs(verifiedtime.getTime() / 1000 - te.getTime() / 1000);
            console.log(final)
            if (final < 900 || param.USER_IDENTITY !== undefined) {
                if (userProfile && userProfile.length > 0) {
                    let buttons = [
                        // {
                        //     "type": "postback",
                        //     "title": 'Career Opportunities',
                        //     "payload": 'Career Opportunities',
                        //     "text": ''
                        // },
                        // {
                        //     "type": "postback",
                        //     "title": 'About PCVisor ',
                        //     "payload": 'About PCVisor',
                        //     "text": ''
                        // },
                        // {
                        //     "type": "postback",
                        //     "title": 'IMS Culture ',
                        //     "payload": 'IMS Culture',
                        //     "text": ''
                        // },
                        {
                            "type": "postback",
                            "title": 'IT Operations',
                            "payload": 'IT Operations',
                            "text": ''
                        },
                        {
                            "type": "postback",
                            "title": 'UIPATH',
                           "payload": 'UIPath',
                            "text": ''
                        }
                    ];
                    if (param.INTENTNAME == "Intent_welcome") {

                        let text = "Do you need help with something else, please find the options again.";
                        let response = await this.nlpHandler.fetchSlotJson(text, true, buttons);
                        json = await this.nlpHandler.fetchFinalResponse(response, param);
                        return json;
                    } else {
                        let text = `Hi,I can help you with the following mentioned options`;
                        let response = await this.nlpHandler.fetchSlotJson(text, true, buttons);
                        json = await this.nlpHandler.fetchFinalResponse(response, param);
                        // <b>${userProfile[0].userName || userProfile[0].username} </b>
                        return json;
                    }
                }
                else {
                    let text = "Email address is not registered. Please contact application team.";
                    let response = await this.nlpHandler.fetchTextJson(text);
                    json = await this.nlpHandler.fetchFinalResponse(response, param);
                    return json;
                }
            } else {
                let text = "Dear user, You need to verify your email address first.";
                let response = await this.nlpHandler.fetchTextJson(text);
                json = await this.nlpHandler.fetchFinalResponse(response, param);
                return json;
            }




        } catch (err) {
            console.log("error in ITlist", err)
            let response = `PC Visor Agent/Email adress has not been installed/registered on your machine or Machine Group has been changed.<br>
            <b>Please contact IT Team.</b>`;
            json = await this.nlpHandler.fetchHtmlJson(response);
            json = await this.nlpHandler.fetchFinalResponse(json, param);
            return json;
        }
    };


    async handleUserIdentity(param) {
        console.log("========inside User Identity=====")
        let json = {};
        try {
            if (param.USER_QUERY !== null) {
                let [userProfile] = await this.getUser(param);
                let useremail = userProfile[0].userEmail;
                console.log(useremail)
                let verifiedtime = new Date(userProfile[0].Verificationtime);
                console.log("user id is", verifiedtime);
                let te = new Date()
                console.log(te)
                var final = Math.abs(verifiedtime.getTime() / 1000 - te.getTime() / 1000);
                console.log(final)
                if (final < 900) {
                    let buttons = [
                        {
                            "type": "postback",
                            "title": 'IT Operations',
                            "payload": 'IT Operations',
                            "text": ''
                        },
                        {
                            "type": "postback",
                            "title": 'HMS',
                            "payload": 'HMS',
                            "text": ''
                        },
                        {
                            "type": "postback",
                            "title": 'CRM',
                            "payload": 'CRM',
                            "text": ''
                        },
                        {
                            "type": "postback",
                            "title": 'UIPATH',
                           "payload": 'UIPath',
                            "text": ''
                        }
                    ];
                    let text = `<p>
            Please find the following options again.</p>`
                    let response = await this.nlpHandler.fetchSlotJson(text, true, buttons);
                    json = await this.nlpHandler.fetchFinalResponse(response, param);
                    return json;

                }
                else {
                    let text = `<p>Your session has been expired, Request you to share your emailid again.</p>`
                    json = await this.nlpHandler.fetchHtmlJson(text);
                    json = await this.nlpHandler.fetchFinalResponse(json, param);
                    return json;
                }

            } else {
                let text = `<p><b>${param.TIME}</b>, I am your personal virtual assistant. Please mention your email address.</p>`
                json = await this.nlpHandler.fetchHtmlJson(text);
                json = await this.nlpHandler.fetchFinalResponse(json, param);
                return json;
            }
        } catch (err) {
            console.log("error in ITlist", err)
            let response = `Apologies for the incovenience, Please contact IT Team`;
            json = await this.nlpHandler.fetchHtmlJson(response);
            json = await this.nlpHandler.fetchFinalResponse(json, param);
            return json;
        }
    };

    /*
  9. Component List [DONE]
  After user selects action value in IT Action Initializer Intent,
  Here fetch Components list and Call IT_ACTION_COMPONENT Intent by passing
  slot filling response to ask choose component.
  */
    async handleItActionList(param) {
        let json = {};
        try {
            //Fetch List of Components (IT_procedures)
            let procedures;
            // let procedures = await this.webhookService.fetchProcedureListByAction(param.ACTION, param.CATEGORY);
            if(param.ACTION === 'INSTALL' || param.ACTION === 'UNINSTALL'){
                param.CATEGORY=''
                procedures = await this.webhookService.fetchProcedureListByAction(param.ACTION,param.CATEGORY)
            }
            else{
                procedures = await this.webhookService.fetchProcedureListByAction(param.ACTION, param.CATEGORY)
            }
            //Here Handle Custom Handling for Components,
            // Like Browser Clean, Temp Clean etc.(Within Loop)
            let buttons = [];
            for (let procedure of procedures) {
                let button = {
                    "type": "postback",
                    "title": procedure.text,
                    "payload": procedure.text,
                    "text": procedure.text
                };
                buttons.push(button);
            }

            if (buttons.length === 0) {
                let response = Messages.messages().NLP.NO_COMPONENT_FOUND;
                json = await this.nlpHandler.fetchTextJson(response);
                json = await this.nlpHandler.fetchFinalResponse(json, param);
            } else {
                let text = Messages.messages().NLP.BOT_ACTION_COMPONENT;
                let intentDetectionConfidence=param.intentDetectionConfidence
                let response = await this.nlpHandler.fetchSlotJson(text, true, buttons,intentDetectionConfidence);

                json = await this.nlpHandler.fetchFinalResponse(response, param);
            }
            return json;
        } catch (err) {
            //Send error Notification to user
            //throw new Error(err);
            console.log("error in loop2action component", err)
            let response = `No category/component found for the option you chose. <br>
                <b>Please contact IT team.</b>`;
            json = await this.nlpHandler.fetchHtmlJson(response);
            json = await this.nlpHandler.fetchFinalResponse(json, param);
            return json;
        }
    };


    /*
     10. IT_OTHER_COMPONENT
     */
    async handleOtherComponent(param) {
        let json = {};
        try {
            console.log("INSIDE HANDLE IT OTHER COMPONENT");
            // let [procedure,userProfile] =await  this.getProcedureAndUser(param);
            let [procedure] = await this.getProcedure(param);
            let [userProfile] = await this.getUser(param);

            let ticketResponse = await this.createTicket(param, procedure[0], userProfile[0], procedure[0].closingLevel);

            if (ticketResponse.response === "SUCCESS") {
                //Create Notification
                let notifyParam = {
                    ACTION: param.ACTION,
                    COMPONENT: param.COMPONENT,
                    USER_NAME: userProfile[0].userName,
                    USER_EMAIL: userProfile[0].userEmail,
                    USER_IDENTITY: userProfile[0].userIdentity,
                    TICKET_ID: ticketResponse.ticketId,
                    PROCEDURE_ID: '',
                    STATUS: '',
                    CATEGORY: Constants.constants().NOTIFICATION_CATEGORY.TICKET_CREATE_MANUAL,
                    TYPE: Constants.constants().NOTIFICATION_TYPE.VIEW
                };

                // let res = await this.webhookService.executeNotification(notifyParam);

                //Return Response
                let response = `I cannot fulfill your request as it needs manual intervention. 
                So I created ticket <b>${ticketResponse.ticketId}</b> for you. Our helpdesk staff will assist you soon.`;

                json = await this.nlpHandler.fetchTextJson(response);
                json = await this.nlpHandler.fetchFinalResponse(json, param);
                return json;
            } else {
                let response = `Sorry to inform you that ticket hasn't been created due 
                                to temporary service desk issue. Please try again.`;

                if (userProfile[0].userEmail === '' || userProfile[0].userEmail === 'noDataInPCV@db.com') {
                    response = `Sorry to inform you that ticket hasn't been created due to missing email 
                    configuration in your profile. Please get in touch with IT Support Team for same. `;
                }

                //Send Notification and Error Response
                json = await this.nlpHandler.fetchTextJson(response);
                json = await this.nlpHandler.fetchFinalResponse(json, param);
                let notifyParam = {
                    ACTION: param.ACTION,
                    COMPONENT: param.COMPONENT,
                    USER_NAME: userProfile[0].userName,
                    USER_EMAIL: userProfile[0].userEmail,
                    USER_IDENTITY: userProfile[0].userIdentity,
                    TICKET_ID: '',
                    PROCEDURE_ID: '',
                    STATUS: '',
                    CATEGORY: Constants.constants().NOTIFICATION_CATEGORY.TICKET_ERROR,
                    TYPE: Constants.constants().NOTIFICATION_TYPE.VIEW
                };
                // let res = await this.webhookService.executeNotification(notifyParam);
                return json;
            }

        } catch (err) {
            throw new Error(err);
        }
    };


    /*2. IT_ACTION_COMPONENT_CONV
       After user selects component value in IT Action Component Intent,
       Here Perform validations for procedure execution
       */
    async handleItActionComponentConv(param) {
        let json = {};
        try {
            console.log("INSIDE HANDLE IT ACTION COMPONENT CONV");
            // let [procedure,userProfile] =await  this.getProcedureAndUser(param);
            let [procedure] = await this.getProcedure(param);
            let [userProfile] = await this.getUser(param);
            console.log("++++++++++procedure++++++++++=", procedure)
            //Check if Procedure is Manual or Not
            //If Manual
            if (procedure[0].isManual === "TRUE") {
                //Create Ticket

                let ticketResponse = await this.createTicket(param, procedure[0], userProfile[0], procedure[0].closingLevel);

                if (ticketResponse.response === "SUCCESS") {
                    //Create Notification
                    let notifyParam = {
                        ACTION: param.ACTION,
                        COMPONENT: param.COMPONENT,
                        USER_NAME: userProfile[0].userName,
                        USER_EMAIL: userProfile[0].userEmail,
                        USER_IDENTITY: userProfile[0].userIdentity,
                        TICKET_ID: ticketResponse.ticketId,
                        PROCEDURE_ID: '',
                        STATUS: '',
                        CATEGORY: Constants.constants().NOTIFICATION_CATEGORY.TICKET_CREATE_MANUAL,
                        TYPE: Constants.constants().NOTIFICATION_TYPE.VIEW
                    };

                    // let res = await this.webhookService.executeNotification(notifyParam);

                    //Return Response
                    let response = `I cannot fulfill your request as it needs manual intervention. 
                So I created ticket <b>${ticketResponse.ticketId}</b> for you. Our helpdesk staff will assist you soon.`;

                    json = await this.nlpHandler.fetchTextJson(response);
                    json = await this.nlpHandler.fetchFinalResponse(json, param);
                    return json;
                } else {
                    let response = `Sorry to inform you that ticket hasn't been created due 
                                to temporary service desk issue. Please try again.`;

                    if (userProfile[0].userEmail === '' || userProfile[0].userEmail === 'noDataInPCV@db.com') {
                        response = `Sorry to inform you that ticket hasn't been created due to missing email 
                    configuration in your profile. Please get in touch with IT Support Team for same. `;
                    }

                    //Send Notification and Error Response
                    json = await this.nlpHandler.fetchTextJson(response);
                    json = await this.nlpHandler.fetchFinalResponse(json, param);
                    let notifyParam = {
                        ACTION: param.ACTION,
                        COMPONENT: param.COMPONENT,
                        USER_NAME: userProfile[0].userName,
                        USER_EMAIL: userProfile[0].userEmail,
                        USER_IDENTITY: userProfile[0].userIdentity,
                        TICKET_ID: '',
                        PROCEDURE_ID: '',
                        STATUS: '',
                        CATEGORY: Constants.constants().NOTIFICATION_CATEGORY.TICKET_ERROR,
                        TYPE: Constants.constants().NOTIFICATION_TYPE.VIEW
                    };
                    // let res = await this.webhookService.executeNotification(notifyParam);
                    return json;
                }
            }

            //If Not Manual,
            //Check for Approval Required,
            //If Approval Required, jump to IT_ACTION_APPROVAL Intent
            if (procedure[0].approvalRequired === "TRUE") {
                json = await this.handleItActionApproval(param);
                return json;
            }
            //If Approval Not Required, jump to IT_ACTION_CONFIRMATION Intent
            else {
                let buttons = [
                    {
                        "type": "postback",
                        "title": 'Yes',
                        // "payload": `Yes ${param.COMPONENT}`,
                        "payload": 'Yes',
                        "text": ''
                    },
                    {
                        "type": "postback",
                        "title": 'No',
                        // "payload": `No ${param.COMPONENT}`,
                        "payload": 'No',
                        "text": ''
                    }
                ];

                let text = Messages.messages().NLP.BOT_ACTION_SLOT_CONFIRMATION_TEXT;
                //      text = text.replace('@action', CommonUtil.convertToTitleCase(param.ACTION));
                //     text = text.replace('@component', CommonUtil.convertToTitleCase(param.COMPONENT));
                let response = await this.nlpHandler.fetchSlotJson(text, true, buttons);
                json = await this.nlpHandler.fetchFinalResponse(response, param);

                return json;

            }
        } catch (err) {
            //Send error Notification to user
            //throw new Error(err);
            console.log("error in handleItActionComponentConv", err)
            let response = `No category/component found for the option you chose. <br>
                <b>Please contact IT team.</b>`;
            json = await this.nlpHandler.fetchHtmlJson(response);
            json = await this.nlpHandler.fetchFinalResponse(json, param);
            return json;
        }
    };


    /* 4. IT_ACTION_CONFIRMATION
     After user provides confirmation to proceed with the Request,
     Here Perform operations for procedure execution (without approval)
     */
    async handleItActionConfirmationConv(param) {
        try {
            let json = {};
            // let [procedure,userProfile] =await  this.getProcedureAndUser(param);
            let [procedure] = await this.getProcedure(param);
            let [userProfile] = await this.getUser(param);
            //console.log("userProfile ==== ",userProfile);
            if (userProfile && userProfile.length > 0) {
                //If Yes
                if (param.CONFIRMATION === 'YES') {
                    //Create Ticket
                    let ticketResponse = await this.createTicket(param, procedure[0], userProfile[0], procedure[0].closingLevel);

                    if (ticketResponse.response === "SUCCESS") {
                        //Execute Procedure
                        let actionResponse = await this.webhookService.executeAction(
                            param.USER_IDENTITY,
                            procedure[0].procedureId
                        );

                        //Create Execution Record
                        let executionResponse = await this.webhookService.createExecution(
                            param.USER_IDENTITY,
                            procedure[0].procedureId,
                            ticketResponse.ticketId,
                            Constants.constants().EXECUTION_STATUS.RUNNING,
                            ticketResponse.summary
                        );


                        //Create Notification Record
                        let notifyParam = {
                            ACTION: param.ACTION,
                            COMPONENT: param.COMPONENT,
                            USER_NAME: userProfile[0].userName,
                            USER_EMAIL: userProfile[0].userEmail,
                            MGR_EMAIL: userProfile[0].mgrEmail,
                            USER_IDENTITY: userProfile[0].userIdentity,
                            MGR_IDENTITY: userProfile[0].mgrIdentity,
                            TICKET_ID: ticketResponse.ticketId,
                            PROCEDURE_ID: procedure[0].procedureId,
                            STATUS: '',
                            CATEGORY: Constants.constants().NOTIFICATION_CATEGORY.EXECUTION_REQUEST,
                            TYPE: Constants.constants().NOTIFICATION_TYPE.VIEW
                        };

                        // let res = await this.webhookService.executeNotification(notifyParam);

                        //Return Response
                        let response = `I have triggered action requested by you. 
     Also I have created ticket <b>${ticketResponse.ticketId}</b> for same.`;

                        json = await this.nlpHandler.fetchTextJson(response);
                        json = await this.nlpHandler.fetchFinalResponse(json, param);
                        return json;
                    } else {
                        //Send Notification and Error Response
                        let response = `Sorry to inform you that ticket hasn't been created due 
                     to temporary service desk issue. Please try again.`;

                        if (userProfile[0].userEmail === '' || userProfile[0].userEmail === 'noDataInPCV@db.com') {
                            response = `Sorry to inform you that ticket hasn't been created due to missing email 
         configuration in your profile. Please get in touch with IT Support Team for same. `;
                        }
                        json = await this.nlpHandler.fetchTextJson(response);
                        json = await this.nlpHandler.fetchFinalResponse(json, param);
                        let notifyParam = {
                            ACTION: param.ACTION,
                            COMPONENT: param.COMPONENT,
                            USER_NAME: userProfile[0].userName,
                            USER_EMAIL: userProfile[0].userEmail,
                            MGR_EMAIL: userProfile[0].mgrEmail,
                            USER_IDENTITY: userProfile[0].userIdentity,
                            MGR_IDENTITY: userProfile[0].mgrIdentity,
                            TICKET_ID: ticketResponse.ticketId,
                            PROCEDURE_ID: procedure[0].procedureId,
                            STATUS: '',
                            CATEGORY: Constants.constants().NOTIFICATION_CATEGORY.TICKET_ERROR,
                            TYPE: Constants.constants().NOTIFICATION_TYPE.VIEW
                        };

                        // // let res = await this.webhookService.executeNotification(notifyParam);
                        return json;
                    }
                }

                //If No,
                if (param.CONFIRMATION === 'NO') {
                    //Return Thanks Response
                    let response = `Ok Thanks, Happy to help you. To restart the conversation type hello/help`;
                    json = await this.nlpHandler.fetchTextJson(response);
                    json = await this.nlpHandler.fetchFinalResponse(json, param);
                    return json;
                }
            } else {
                let response = `<b>PC Visor Agent has not been installed on your machine or Machine Group has been changed.<br>
                 Please contact IT Team.</b>`;

                json = await this.nlpHandler.fetchHtmlJson(response);
                json = await this.nlpHandler.fetchFinalResponse(json, param);
                return json;

            }

        } catch (err) {
            //Send error Notification to user
            //throw new Error(err);
            console.log("error in handleItActionConfirmationConv", err)
            let response = `No category/component found for the option you chose. <br>
                <b>Please contact IT team.</b>`;
            json = await this.nlpHandler.fetchHtmlJson(response);
            json = await this.nlpHandler.fetchFinalResponse(json, param);
            return json;
        }
    };

    /////////////////////////hawkeye chatbot functions//////////////////////
    async handlehostoperations(param) {
        let json = {};
        try {
            console.log("Inside handle host operations function");
            let hostname = param.any.toUpperCase();
            hostname = hostname.replace(" - ", "-");
            hostname = hostname.replace("- ", "-");
            hostname = hostname.replace(" -", "-");
            console.log(hostname)

            let [host] = await this.gethostidmongo(hostname);

            console.log(host)

            let hostid = host[0].hostid;

            if (param.OPERATIONS == "CPU" || param.OPERATIONS == "CPU UTILIZATION") {
                let result = await this.syncUtil.getcpuUtil(hostid);
                if (JSON.stringify(result).indexOf('itemid') === -1) {
                    //let response = result.error.data;
                    let response = "Item is not configured for particular host.";

                    json = await this.nlpHandler.fetchHtmlJson(response);
                    json = await this.nlpHandler.fetchFinalResponse(json, param);

                    return json;

                }

                else {
                    let dataRecord = []; //User Record
                    let data;

                    for (let j = 0; j < 1; j++) {
                        let cputil = result[j].lastvalue + '%';
                        data = `<tr><td>${result[j].name}</td><td>${cputil}</td></tr>`;
                    }
                    for (let j = 1; j < result.length; j++) {
                        let cputil = result[j].lastvalue + '%';
                        data = data + `<tr><td>${result[j].name}</td><td>${cputil}</td></tr>`;
                    }
                    let html = `
        <style>
        table.tickets_status, .tickets_status td, .tickets_status th { 
        border: 1px solid #ddd;
        text-align: left;
        }
        
        table.tickets_status {
        border-collapse: collapse;
        width: 235px;
        margin: 2px;
        }
        
        .tickets_status th, .tickets_status td{
        padding: 8px;
        }
        </style>
        <p>Please Find CPU Usage</p>
        <table class="tickets_status">
        <tr>
        <th>Metric</th>
        <th>Value</th>
        
        
        </tr>
        ${data}
        </table>`;


                    json = await this.nlpHandler.fetchHtmlJson(html);
                    json = await this.nlpHandler.fetchFinalResponse(json, param);
                    return json;
                }
            }
            else if (param.OPERATIONS == "MEMORY") {
                let result = await this.syncUtil.getmemoryUtil(hostid);
                console.log(JSON.stringify(result));
                if (JSON.stringify(result).indexOf('itemid') === -1) {
                    //let response = result.error.data;
                    let response = "Item is not configured for particular host.";

                    json = await this.nlpHandler.fetchHtmlJson(response);
                    json = await this.nlpHandler.fetchFinalResponse(json, param);

                    return json;

                }
                else {
                    let dataRecord = []; //User Record
                    let data;

                    for (let j = 0; j < 1; j++) {
                        let memutil = result[j].lastvalue + '%';
                        data = `<tr><td>${result[j].name}</td><td>${memutil}</td></tr>`;
                    }
                    for (let j = 1; j < result.length; j++) {
                        let memutil = result[j].lastvalue + '%';
                        data = data + `<tr><td>${result[j].name}</td><td>${result[j].lastvalue}</td></tr>`;
                    }
                    let html = `
       <style>
       table.tickets_status, .tickets_status td, .tickets_status th { 
       border: 1px solid #ddd;
       text-align: left;
       }
       
       table.tickets_status {
       border-collapse: collapse;
       width: 235px;
       margin: 2px;
       }
       
       .tickets_status th, .tickets_status td{
       padding: 8px;
       }
       </style>
       <p>Please Find Memory Usage</p>
       <table class="tickets_status">
       <tr>
       <th>Metric</th>
       <th>Value</th>
       
       
       </tr>
       ${data}
       </table>`;


                    json = await this.nlpHandler.fetchHtmlJson(html);
                    json = await this.nlpHandler.fetchFinalResponse(json, param);
                    return json;
                }
            }
            else if (param.OPERATIONS == "TRIGGER") {
                let result = await this.syncUtil.getproblemUtil(hostid);
                console.log(result)
                if (JSON.stringify(result).indexOf('eventid') === -1) {
                    //let response = result.error.data;
                    let response = "Item is not configured for particular host.";

                    json = await this.nlpHandler.fetchHtmlJson(response);
                    json = await this.nlpHandler.fetchFinalResponse(json, param);

                    return json;

                }
                else {
                    let dataRecord = []; //User Record
                    let data;

                    for (let j = 0; j < 1; j++) {
                        var d2 = Math.abs(result[j].clock * 1000);
                        var timeValue = d2;
                        console.log(timeValue)
                        var d3 = new Date(+timeValue);
                        var d1 = new Date(d3).toLocaleString(undefined, { timeZone: 'Asia/Kolkata' });
                        if (!result[j].r_clock === '0') {
                            var d4 = Math.abs(result[j].r_clock * 1000);
                            var timeValue1 = d4;
                            console.log(timeValue1)
                            var d5 = new Date(+timeValue1);
                            var d6 = new Date(d5).toLocaleString(undefined, { timeZone: 'Asia/Kolkata' });
                            data = `<tr><td>${result[j].name}</td><td>${result[j].severity}</td><td>${d1}</td><td>${d6}</td><td>${result[j].acknowledges.message}</td></tr>`;
                        } else {
                            data = `<tr><td>${result[j].name}</td><td>${result[j].severity}</td><td>${d1}</td><td>${result[j].r_clock}</td><td>${result[j].acknowledges.message}</td></tr>`;
                        }
                    }
                    for (let j = 1; j < result.length; j++) {
                        var d2 = Math.abs(result[j].clock * 1000);
                        var timeValue = d2;
                        console.log(timeValue)
                        var d3 = new Date(+timeValue);
                        var d1 = new Date(d3).toLocaleString(undefined, { timeZone: 'Asia/Kolkata' });
                        if (!result[j].r_clock === '0') {
                            var d4 = Math.abs(result[j].r_clock * 1000);
                            var timeValue1 = d4;
                            console.log(timeValue1)
                            var d5 = new Date(+timeValue1);
                            var d6 = new Date(d5).toLocaleString(undefined, { timeZone: 'Asia/Kolkata' });
                            data = data + `<tr><td>${result[j].name}</td><td>${result[j].severity}</td><td>${d1}</td><td>${d6}</td><td>${result[j].acknowledges.message}</td></tr>`;
                        } else {
                            data = data + `<tr><td>${result[j].name}</td><td>${result[j].severity}</td><td>${d1}</td><td>${result[j].r_clock}</td><td>${result[j].acknowledges.message}</td></tr>`;
                        }
                    }
                    let html = `
        <style>
        table.tickets_status, .tickets_status td, .tickets_status th { 
        border: 1px solid #ddd;
        text-align: left;
        }
        
        table.tickets_status {
        border-collapse: collapse;
        width: 235px;
        margin: 2px;
        }
        
        .tickets_status th, .tickets_status td{
        padding: 8px;
        }
        </style>
        <p>Please Find Top Triggers</p>
        <table class="tickets_status">
        <tr>
        <th>Problem</th>
        <th>Severity</th>
        <th>StartTime</th>
        <th>Resol.Time</th>
        <th>Ack. Message</th>
        
        </tr>
        ${data}
        </table>`;


                    json = await this.nlpHandler.fetchHtmlJson(html);
                    json = await this.nlpHandler.fetchFinalResponse(json, param);
                    return json;
                }
            }
            else if (param.OPERATIONS == "SYSTEM") {
                let result = await this.syncUtil.geticmpPingUtil(hostid);
                if (JSON.stringify(result).indexOf('itemid') === -1) {
                    //let response = result.error.data;
                    let response = "Item is not configured for particular host.";

                    json = await this.nlpHandler.fetchHtmlJson(response);
                    json = await this.nlpHandler.fetchFinalResponse(json, param);

                    return json;

                }
                else {
                    let dataRecord = []; //User Record
                    let data;

                    for (let j = 0; j < 1; j++) {
                        if (result[j].key_ == 'icmpping' && result[j].lastvalue == '1') {
                            let icmpping = 'Up(1)';
                            data = `<tr><td>${result[j].name}</td><td>${icmpping}</td></tr>`;
                        }
                        else {
                            let icmpping = 'Down(0)';
                            data = `<tr><td>${result[j].name}</td><td>${icmpping}</td></tr>`;
                        }
                    }
                    for (let j = 1; j < result.length; j++) {
                        if (result[j].key_ == 'icmppingloss') {
                            let icmp = result[j].lastvalue + '%';

                            data = data + `<tr><td>${result[j].name}</td><td>${icmp}</td></tr>`;
                        } else if (result[j].key_ == 'icmppingsec') {
                            let icmp1 = (Math.round(result[j].lastvalue * 100) / 100).toFixed(2);
                            let icmp = icmp1 * 1000 + 'ms';
                            console.log(icmp)

                            data = data + `<tr><td>${result[j].name}</td><td>${icmp}</td></tr>`;
                        }
                    } let html = `
    <style>
    table.tickets_status, .tickets_status td, .tickets_status th { 
    border: 1px solid #ddd;
    text-align: left;
    }
    
    table.tickets_status {
    border-collapse: collapse;
    width: 235px;
    margin: 2px;
    }
    
    .tickets_status th, .tickets_status td{
    padding: 8px;
    }
    </style>
    <p>Please Find Availability Details</p>
    
    
    <table class="tickets_status">
    <tr>
    <th>Metric</th>
    <th>Value</th 
    </tr>
    ${data}
    </table>`;


                    json = await this.nlpHandler.fetchHtmlJson(html);
                    json = await this.nlpHandler.fetchFinalResponse(json, param);
                    return json;
                }
            }

            else {
                let text = 'Sorry no value found for the chosen host.';
                let response = await this.nlpHandler.fetchTextJson(text);
                json = await this.nlpHandler.fetchFinalResponse(response, param);


                return json;

            }
        } catch (e) {
            throw new Error(e)
        }
    };

    async gethostidmongo(param) {
        let req = this.webhookService.fetchhostidDetails(
            param
        );
        return Promise.all([req]);
    }

    async verifyOTP(param) {
        let json = {};
        try {
            let Count = "";
            // param.OTP = `'${param.USER_QUERY}'`;
            console.log("i am inside verify OTP loop")
            console.log('OTP', param.OTP)
            if (param.OTP == '') {
                param.OTP = param.any
            }
            let [userProfile] = await this.getPCUser(param);
            // let [userProfile2] = await this.getUser2(param);
            console.log("result", userProfile, param.OTP);

            if (userProfile[0].Count == '0')
                Count = '1'
            else if (userProfile[0].Count == '1')
                Count = '2'
            else if (userProfile[0].Count == '2')
                Count = '3'
            else Count = '3'

            //console.log("----------",Count)
            await this.checkcount(param, Count);
            console.log(param.OTP, userProfile[0].Count, userProfile[0].OTP)

            if (userProfile[0].Count != '3') {
                if (param.OTP == userProfile[0].OTP) {
                    Count = 0;
                    await this.updatecount(param, Count);
                    console.log("-----------i am inside loop", userProfile)

                    if (userProfile[0].Type == 'Flexi' || userProfile[0].Type == 'PCVisor' || userProfile[0].Type == 'CRM') {
                        let buttons = [
                            {
                                "type": "postback",
                                "title": 'IT Operations',
                                "payload": 'IT Operations',
                                "text": ''
                            },
                            {
                                "type": "postback",
                                "title": 'HMS',
                                "payload": 'HMS',
                                "text": ''
                            },
                            {
                                "type": "postback",
                                "title": 'CRM',
                                "payload": 'CRM',
                                "text": ''
                            },
                            {
                                "type": "postback",
                                "title": 'UIPATH',
                               "payload": 'UIPath',
                                "text": ''
                            }

                        ];

                        let text = `<p>Your Email has been verified.<br>
            I can help you with the following mentioned options:</p>`
                        let response = await this.nlpHandler.fetchSlotJson(text, true, buttons);
                        json = await this.nlpHandler.fetchFinalResponse(response, param);
                        //let response = `<p>Thank You for the verification.</p>`;

                        //json = await this.nlpHandler.fetchHtmlJson(response);
                        //json = await this.nlpHandler.fetchFinalResponse(json, param);
                        json.authentic_user = true;
                        json.userProfile = userProfile[0];
                        json.expected_entity = ['option'];
                        return json;

                    }
                    else if (userProfile[0].Type == 'HMS') {
                        let buttons = [
                            {
                                "type": "postback",
                                "title": 'HMS',
                                "payload": 'HMS',
                                "text": ''
                            }
                        ];

                        let text = `<p>Your Email has been verified.<br>
           I can help you with the following mentioned options:</p>`
                        let response = await this.nlpHandler.fetchSlotJson(text, true, buttons);
                        json = await this.nlpHandler.fetchFinalResponse(response, param);
                        json.authentic_user = true;
                        json.userProfile = userProfile[0];
                        return json;

                    }

                } else {
                    let response = `Entered token is incorrect.`;

                    json = await this.nlpHandler.fetchTextJson(response);
                    json = await this.nlpHandler.fetchFinalResponse(json, param);
                    json.authentic_user = false;
                    return json;
                }
            }
            else {
                let response = `You have outreached the 3 tries.`;

                json = await this.nlpHandler.fetchTextJson(response);
                json = await this.nlpHandler.fetchFinalResponse(json, param);
                return json;
            }
        } catch (err) {
            //Send error Notification to user
            //throw new Error(err);
            console.log("error in verifyOTP", err)
            let response = `Sorry For the inconvenience.`;
            json = await this.nlpHandler.fetchTextJson(response);
            json = await this.nlpHandler.fetchFinalResponse(json, param);
            json.authentic_user = false;
            return json;
        }
    };

    async handleCompleteList(param) {
        let json = {};
        try {
            // let [userProfile] = await this.getUser2(param);
            // console.log("userprofile is", userProfile)
           
            console.log("inside handlecompletelist", param.OPTIONS)
                    let buttons = [
                        // {
                        //     "type": "postback",
                        //     "title": 'Login Issue',
                        //     "payload": 'Facing Login issue',
                        //     "text": ''
                        // },
                        {
                            "type": "postback",
                            "title": 'Installation/Update',
                            "payload": 'Please show all available Installation',
                            "text": ''
                        },
                        {
                            "type": "postback",
                            "title": 'Uninstallation',
                            "payload": 'Please show all available Uninstallation',
                            "text": ''
                        },
                        {
                            "type": "postback",
                            "title": 'Performance',
                            "payload": 'I am having performance issue',
                            "text": ''
                        },
                        {
                            "type": "postback",
                            "title": 'Network',
                            "payload": 'Network issues',
                            "text": ''
                        },
                        {
                            "type": "postback",
                            "title": 'Windows & Security',
                            "payload": 'help with windows security',
                            "text": ''
                        },
                        {
                            "type": "postback",
                            "title": 'Troubleshoot',
                            "payload": 'Troubleshoot',
                            "text": ''
                        },
                        {
                            "type": "postback",
                            "title": 'Windows Settings',
                            "payload": 'Settings',
                            "text": ''
                        }
                        // {
                        //     "type": "postback",
                        //     "title": 'Ticket Status',
                        //     "payload": 'Ticket Status',
                        //     "text": ''
                        // }
                    ];
                    let intentDetectionConfidence=param.intentDetectionConfidence
                    let text = "Please select from the following options";
                    let response = await this.nlpHandler.fetchSlotJson(text, true, buttons,intentDetectionConfidence);
                    json = await this.nlpHandler.fetchFinalResponse(response, param);
                    console.log('jsonnnnn',json)
                    json.expected_entity = ['action']

                
            
            return json;
        } catch (err) {
            //Send error Notification to user
            //throw new Error(err);
            console.log("error in verifyOTP", err)
            let response = `Sorry For the inconvenience.`;
            json = await this.nlpHandler.fetchTextJson(response);
            json = await this.nlpHandler.fetchFinalResponse(json, param);
            return json;
        }
    };

    async handleJobCategories(param) {
        let json = {};
        try {
            // let [userProfile] = await this.getUser2(param);
            // console.log("userprofile is", userProfile)
            // console.log("inside handleJobCategories")



            let buttons = [
                {
                    "type": "postback",
                    "title": 'IT',
                    "payload": 'IT',
                    "text": ''
                },
                {
                    "type": "postback",
                    "title": 'Admin',
                    "payload": 'Admin',
                    "text": ''
                },
                {
                    "type": "postback",
                    "title": 'Management',
                    "payload": 'Management',
                    "text": ''
                }


            ];

            let text = `Please choose the best option for you:`
            let response = await this.nlpHandler.fetchSlotJson(text, true, buttons);
            json = await this.nlpHandler.fetchFinalResponse(response, param);


            return json;
        } catch (err) {
            //Send error Notification to user
            //throw new Error(err);
            console.log("error in handleJobCategories", err)
            let response = `Sorry For the inconvenience.`;
            json = await this.nlpHandler.fetchTextJson(response);
            json = await this.nlpHandler.fetchFinalResponse(json, param);
            return json;
        }
    };

    async handleJobSubcategories(param) {
        let json = {};
        try {
            console.log("inside handleJobSubcategories")
            let [userProfile] = await this.getUser(param);
            console.log("userprofile is", userProfile)
            if (param.USER_QUERY === "IT") {
                if (userProfile && userProfile.length > 0) {
                    {
                        let buttons = [
                            {
                                "type": "postback",
                                "title": 'Software Developer',
                                "payload": 'Software Developer',
                                "text": ''
                            },
                            {
                                "type": "postback",
                                "title": 'Full Stack Developer',
                                "payload": 'Full Stack Developer',
                                "text": ''
                            },
                            {
                                "type": "postback",
                                "title": 'Machine Learning Professionals',
                                "payload": 'Machine Learning Professionals',
                                "text": ''
                            },
                            {
                                "type": "postback",
                                "title": 'DevOps Engineer',
                                "payload": 'DevOps Engineer',
                                "text": ''
                            }

                        ];

                        let text = `Please select from the following options to help you find best opportunities.`
                        let response = await this.nlpHandler.fetchSlotJson(text, true, buttons);
                        json = await this.nlpHandler.fetchFinalResponse(response, param);


                    }

                }
                else {
                    let text = `Sorry, there is some error in IT options.`
                    let response = await this.nlpHandler.fetchTextJson(text);
                    json = await this.nlpHandler.fetchFinalResponse(response, param);
                }

            } else if (param.USER_QUERY === "Admin") {
                if (userProfile && userProfile.length > 0) {
                    let buttons = [
                        {
                            "type": "postback",
                            "title": 'Administrator',
                            "payload": 'Administrator',
                            "text": ''
                        },
                        {
                            "type": "postback",
                            "title": 'Administrative manager',
                            "payload": 'Administrative manager',
                            "text": ''
                        },
                        {
                            "type": "postback",
                            "title": 'Business administrator',
                            "payload": 'Business administrator',
                            "text": ''
                        },
                        {
                            "type": "postback",
                            "title": 'Administrative director',
                            "payload": 'Administrative director',
                            "text": ''
                        }


                    ];

                    let text = "Please select from the following options";
                    let response = await this.nlpHandler.fetchSlotJson(text, true, buttons);
                    json = await this.nlpHandler.fetchFinalResponse(response, param);
                    json.expected_entity = ['action']

                } else {
                    let text = `Sorry, there is some error in admin option.`
                    let response = await this.nlpHandler.fetchTextJson(text);
                    json = await this.nlpHandler.fetchFinalResponse(response, param);
                }
            }
            else if (param.USER_QUERY === "Management") {
                if (userProfile && userProfile.length > 0) {
                    let buttons = [
                        {
                            "type": "postback",
                            "title": 'Financial Manager',
                            "payload": 'Financial Manager',
                            "text": ''
                        },
                        {
                            "type": "postback",
                            "title": 'Human Resources Manager',
                            "payload": 'Human Resources Manager',
                            "text": ''
                        },
                        {
                            "type": "postback",
                            "title": 'Sales Manager',
                            "payload": 'Sales Manager',
                            "text": ''
                        },
                        {
                            "type": "postback",
                            "title": 'Accounting manager',
                            "payload": 'Accounting manager',
                            "text": ''
                        }


                    ];


                    let text = "Please select from the following options";
                    let response = await this.nlpHandler.fetchSlotJson(text, true, buttons);
                    json = await this.nlpHandler.fetchFinalResponse(response, param);
                } else {
                    let text = `Sorry, There is some error in management option `
                    let response = await this.nlpHandler.fetchTextJson(text);
                    json = await this.nlpHandler.fetchFinalResponse(response, param);
                }

            } else {

                let text = `Sorry, Can not help you with the selected option at the moment. Please contact It support.`
                let response = await this.nlpHandler.fetchTextJson(text);
                json = await this.nlpHandler.fetchFinalResponse(response, param);
            }
            return json;
        } catch (err) {
            //Send error Notification to user
            //throw new Error(err);
            console.log("error in handleJobSubcategories", err)
            let response = `Sorry For the inconvenience.`;
            json = await this.nlpHandler.fetchTextJson(response);
            json = await this.nlpHandler.fetchFinalResponse(json, param);
            return json;
        }
    };

    async handleimsvideo(param) {
        let json = {};
        try {
            console.log("Inside handle ims video")

            const html =
                `<p>Please click on below link to generate pdf report.<br> </p> 
                 <a href="http://10.83.150.208/zbxreport/" target="_blank">PDF Report</a> <br>
                 <p>Or copy paste url into your browser: http://10.83.152.221/zbxreport/</p>`
            


            json = await this.nlpHandler.fetchHtmlJson(html);
            json = await this.nlpHandler.fetchFinalResponse(json, param);
            return json;


        } catch (e) {
            throw new Error(e)
        }
    };
    
async handleExperience(param) {
        let json = {};
        try {
            // let [userProfile] = await this.getUser2(param);
            // console.log("userprofile is", userProfile)
            // console.log("inside handleJobCategories")



            let buttons = [
                {
                    "type": "postback",
                    "title": 'Experience',
                    "payload": 'Experience',
                    "text": ''
                },
                {
                    "type": "postback",
                    "title": 'Freshers',
                    "payload": 'Freshers',
                    "text": ''
                }

            ];

            let text = `Please select:`
            let response = await this.nlpHandler.fetchSlotJson(text, true, buttons);
            json = await this.nlpHandler.fetchFinalResponse(response, param);


            return json;
        } catch (err) {
            //Send error Notification to user
            //throw new Error(err);
            console.log("error in handle experience", err)
            let response = `Sorry For the inconvenience.`;
            json = await this.nlpHandler.fetchTextJson(response);
            json = await this.nlpHandler.fetchFinalResponse(json, param);
            return json;
        }
    };

    async handleJobmails(param) {
        let json = {};
        try {
            console.log("Inside handleJobmails")
            let [userProfile] = await this.getUser(param)
            console.log(param ,"Rituuuuuuuuuuuuuuuuuuuu")
            // let [procedure] = await this.getPolicyProcedure(param)
            var msgdata = {
                // number: userProfile[0].number,
                // Name: userProfile[0].userName,
                to: 'ritu.rani.hr@hitachi-systems.com',
                msg: `Hi,
                 ${userProfile[0].username} has applied for ${param.userQuery} role.<br><br>
                 Below are the necessary details of candidate with resume attached:<br><br>
                 Contact Number - ${userProfile[0].PhoneNo}<br><br>
                 Email - ${userProfile[0].email}<br><br>
                 Job role - ${param.userQuery}<br><br>
                `,
                file_dest : param.file_dest,
                file_name: param.file_name

                }
    
            console.log("after handle jobmails msgdata",msgdata.to)
           let sendmail= await this.sendmail.jobmessage(msgdata);
    
        //    let sendmessage = await this.sendmessage.textmessage(msgdata);
    
    
            let response = `<p>We have received the necessary details. Thank you for applying. </p>`;
            //console.log(response)
            json = await this.nlpHandler.fetchHtmlJson(response);
            json = await this.nlpHandler.fetchFinalResponse(json, param);
            return json;
    
        } catch (err) {
            //Send error Notification to user
            //throw new Error(err);
            console.log("error in handleJobmails function",err)
                let response = `Sorry For thr inconvenience.<br>
                Please contact Admin.`;
                        json = await this.nlpHandler.fetchHtmlJson(response);
                        json = await this.nlpHandler.fetchFinalResponse(json, param);
                        return json;
        }
    };


    ////////////////////////////////////////////////////////////////////////////////////////////////////
    async Tokenwon(param) {

        let json = {};

        console.log("PARAM-----------", param);

        try {
            if (param.OPPORTUNITY === 'Won' || param.OPPORTUNITY === 'won' || param.OPPORTUNITY === 'WON') {

                console.log("EXECUTING Won data");
                if (param.USER_EMAIL === undefined) {
                    let [userProfile2] = await this.getUser2(param);

                    var useremail = userProfile2[0].userEmail;
                    console.log(useremail)
                    var result = await this.email1.OpportunityWon(param, useremail);
                }
                else {
                    var useremail = param.USER_EMAIL;
                    var result = await this.email1.OpportunityWon(param, useremail);
                }


                console.log('result is', result)

                // console.log(result,'eeeeeeeeeeeeeeeeeeeeeeeeeeeee');
                // if (result !== null) {
                let dataRecord = []; //User Record
                let data;
                for (let j = 0; j < 1; j++) {
                    data = `<tr><td>${result[j].PotentialCustomerName}</td><td>${result[j].Topline}</td><td>${result[j].Bottpmline}</td></tr>`;
                }
                for (let j = 1; j < result.length; j++) {
                    data = data + `<tr><td>${result[j].PotentialCustomerName}</td><td>${result[j].Topline}</td><td>${result[j].Bottpmline}</td></tr>`;
                }
                let html = `
        <style>
        table.tickets_status, .tickets_status td, .tickets_status th {  
          border: 1px solid #ddd;
          text-align: left;
        }
        
        table.tickets_status {
          border-collapse: collapse;
          width: 235px;
          margin: 2px;
        }
        
        .tickets_status th, .tickets_status td{
          padding: 8px;
        }
        </style>
        <p>Opportunities Won(top5)</p>
        <table class="tickets_status">
          <tr>
            <th>Opportunity Name</th>

            <th>Topline</th>
            <th>Bottom Line</th>
          </tr>
          ${data}
        </table>`;

                //dataRecord.push("ClosedDate:",`"${data.ClosedDate}"`);

                // console.log("Hi i am in sync loop",dataRecord);

                //   if(dataRecord.length > 0){
                //console.log("INSERTING DATA IN CRM_userProfile");
                json = await this.nlpHandler.fetchHtmlJson(html);
                json = await this.nlpHandler.fetchFinalResponse(json, param);
                return json;

                // }
                // else {
                //     let response = 'no data found for won opportunities';

                //     json = await this.nlpHandler.fetchTextJson(response);
                //     json = await this.nlpHandler.fetchFinalResponse(json, param);

                //     return json;

                // }
            }
            else if (param.OPPORTUNITY === 'Loss' || param.OPPORTUNITY === 'loss') {
                if (param.USER_EMAIL === undefined) {
                    let [userProfile2] = await this.getUser2(param);

                    var useremail = userProfile2[0].userEmail;
                    console.log(abcd)
                    var result = await this.email1.OpportunityLoss(param, useremail);
                }
                else {
                    var useremail = param.USER_EMAIL;
                    var result = await this.email1.OpportunityLoss(param, useremail);
                }

                // let result = await this.email1.OpportunityLoss(param);
                console.log('result', result);
                let dataRecord = []; //User Record
                let data;
                for (let j = 0; j < 1; j++) {
                    data = `<tr><td>${result[j].PotentialCustomerName}</td><td>${result[j].Topline}</td><td>${result[j].Bottpmline}</td></tr>`;
                }
                for (let j = 1; j < result.length; j++) {
                    data = data + `<tr><td>${result[j].PotentialCustomerName}</td><td>${result[j].Topline}</td><td>${result[j].Bottpmline}</td></tr>`;
                }
                let html = `
             <style>
             table.tickets_status, .tickets_status td, .tickets_status th {  
               border: 1px solid #ddd;
               text-align: left;
             }
             
             table.tickets_status {
               border-collapse: collapse;
               width: 235px;
               margin: 2px;
             }
             
             .tickets_status th, .tickets_status td{
               padding: 8px;
             }
             </style>
             <p>Opportunities Loss(top 5)</p>
             <table class="tickets_status">
               <tr>
                 <th>Opportunity Name</th>

                 <th>Topline</th>
                 <th>Bottom Line</th>
               </tr>
               ${data}
             </table>`;

                //dataRecord.push("ClosedDate:",`"${data.ClosedDate}"`);

                // console.log("Hi i am in sync loop",dataRecord);

                //   if(dataRecord.length > 0){
                //console.log("INSERTING DATA IN CRM_userProfile");
                json = await this.nlpHandler.fetchHtmlJson(html);
                json = await this.nlpHandler.fetchFinalResponse(json, param);
                return json;
            }
            else {
                let text = "Sorry, Nothing found."
                json = await this.nlpHandler.fetchTextJson(text);
                json = await this.nlpHandler.fetchFinalResponse(json, param);
                return json;
            }

        } catch (e) {
            console.log("error: ", e)
            let text = "Sorry, No data found for this Option."
            json = await this.nlpHandler.fetchTextJson(text);
            json = await this.nlpHandler.fetchFinalResponse(json, param);
            return json;
            // throw new Error(e)
        }
    };
    async Tokenname(param) {
        let json = {};
        //console.log("EXECUTING TOKEN SYNC SCHEDULER");
        try {
            console.log("EXECUTING TOKEN SYNC SCHEDULER");
            if (param.USER_EMAIL === undefined) {
                let [userProfile2] = await this.getUser2(param);

                var abcd = userProfile2[0].userEmail;
                console.log(abcd)
                var result = await this.email1.Accountname(param, abcd);
            }
            else {
                var abcd = param.USER_EMAIL;
                var result = await this.email1.Accountname(param, abcd);
            }


            if (result !== null) {

                // console.log(result,'eeeeeeeeeeeeeeeeeeeeeeeeeeeee');
                let dataRecord = []; //User Record
                let data;
                for (let j = 0; j < 1; j++) {
                    data = `<tr><td>${result[j].name}</td><td>${result[j].emailaddress1}</td><td>${result[j].numberofemployees}</td><td>${result[j].address1_city}</td><td>${result[j].address1_composite}</td><td>${result[j].websiteurl}</td><td>${result[j].createdon}</td></tr>`;
                }
                for (let j = 1; j < result.length; j++) {
                    data = data + `<tr><td>${result[j].name}</td><td>${result[j].emailaddress1}</td><td>${result[j].numberofemployees}</td><td>${result[j].address1_city}</td><td>${result[j].address1_composite}</td><td>${result[j].websiteurl}</td><td>${result[j].createdon}</td></tr>`;
                }
                let html = `
        <style>
        table.tickets_status, .tickets_status td, .tickets_status th {  
          border: 1px solid #ddd;
          text-align: left;
        }
        
        table.tickets_status {
          border-collapse: collapse;
          width: 235px;
          margin: 2px;
        }
        
        .tickets_status th, .tickets_status td{
          padding: 8px;
        }
        </style>
        <p>Account Details</p>
 

        <table class="tickets_status">
          <tr>
            <th>Account Name</th>
            <th>Account email</th>
            <th>No. of employees</th>
            <th>City</th>
            <th>address1_composite</th>
            <th>URL</th>
            <th>Created On</th>
 
            
          </tr>
          ${data}
        </table>`;

                //dataRecord.push("ClosedDate:",`"${data.ClosedDate}"`);

                // console.log("Hi i am in sync loop",dataRecord);

                //   if(dataRecord.length > 0){
                //console.log("INSERTING DATA IN CRM_userProfile");
                json = await this.nlpHandler.fetchHtmlJson(html);
                json = await this.nlpHandler.fetchFinalResponse(json, param);
                return json;
            }
            else {
                let text = "Sorry, you have enterred a wrong account"
                json = await this.nlpHandler.fetchTextJson(text);
                json = await this.nlpHandler.fetchFinalResponse(json, param);
                return json;
            }
        } catch (e) {
            // throw new Error(e)
            let text = "Sorry, you have enterred a wrong account"
            json = await this.nlpHandler.fetchTextJson(text);
            json = await this.nlpHandler.fetchFinalResponse(json, param);
            return json;
        }
    };
    async Tokenemail(param) {
        let json = {};
        //console.log("EXECUTING TOKEN SYNC SCHEDULER");
        try {
            console.log("EXECUTING TOKEN SYNC SCHEDULER");

            let result = await this.email1.Accountemail(param);
            // console.log(result,'eeeeeeeeeeeeeeeeeeeeeeeeeeeee');
            let dataRecord = []; //User Record
            let data;
            for (let j = 0; j < 1; j++) {
                data = `<tr><td>${result[j].emailaddress1}</td></tr>`;
            }
            for (let j = 1; j < result.length; j++) {
                data = data + `<tr><td>${result[j].emailaddress1}</td></tr>`;
            }
            let html = `
        <style>
        table.tickets_status, .tickets_status td, .tickets_status th {  
          border: 1px solid #ddd;
          text-align: left;
        }
        
        table.tickets_status {
          border-collapse: collapse;
          width: 235px;
          margin: 2px;
        }
        
        .tickets_status th, .tickets_status td{
          padding: 8px;
        }
        </style>
        <table class="">
          <tr>
            <th>Account Email</th>
 
            
          </tr>
          ${data}
        </table>`;

            //dataRecord.push("ClosedDate:",`"${data.ClosedDate}"`);

            // console.log("Hi i am in sync loop",dataRecord);

            //   if(dataRecord.length > 0){
            //console.log("INSERTING DATA IN CRM_userProfile");
            json = await this.nlpHandler.fetchHtmlJson(html);
            json = await this.nlpHandler.fetchFinalResponse(json, param);
            return json;

        } catch (e) {
            throw new Error(e)
        }
    };
    async Tokentotalw(param) {
        let json = {};
        //console.log("EXECUTING TOKEN SYNC SCHEDULER");
        try {
            if (param.TOTAL === 'totalwon' || param.TOTAL === 'TOTALWON') {
                var formatter = new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'INR',
                });
                console.log("EXECUTING TOKEN SYNC SCHEDULER");
                if (param.USER_EMAIL === undefined) {
                    let [userProfile2] = await this.getUser2(param);

                    var abcd = userProfile2[0].userEmail;
                    console.log(abcd)
                    var result = await this.email1.Totalwon(param, abcd);
                }
                else {
                    var abcd = param.USER_EMAIL;
                    var result = await this.email1.Totalwon(param, abcd);
                }

                // let result = await this.email1.Totalwon(param);

                console.log(result, 'eeeeeeeeeeeeeeeeeeeeeeeeeeeee');
                let dataRecord = []; //User Record
                let data;

                for (let j = 0; j < result.length; j++) {
                    data = `<tr><td>${formatter.format(result[j].Topline)}</td><td>${formatter.format(result[j].Bottomline)}</td></tr>`;
                }
                console.log(data);
                let html = `
        <style>
        table.tickets_status, .tickets_status td, .tickets_status th {  
          border: 1px solid #ddd;
          text-align: left;
        }
        
        table.tickets_status {
          border-collapse: collapse;
          width: 235px;
          margin: 2px;
        }
        
        .tickets_status th, .tickets_status td{
          padding: 8px;
        }
        </style>
        <p>Account Details</p>
 

        <table class="tickets_status">
          <tr>
            <th>Top Line</th>
            <th>Bottom Line</th          
          </tr>
          ${data}
        </table>`;

                //dataRecord.push("ClosedDate:",`"${data.ClosedDate}"`);

                // console.log("Hi i am in sync loop",dataRecord);

                //   if(dataRecord.length > 0){
                //console.log("INSERTING DATA IN CRM_userProfile");
                json = await this.nlpHandler.fetchHtmlJson(html);
                json = await this.nlpHandler.fetchFinalResponse(json, param);
                return json;
            }
            else if (param.TOTAL === 'totalloss' || param.TOTAL === 'TOTALLOSS') {
                var formatter = new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'INR',
                });
                console.log("EXECUTING TOKEN SYNC SCHEDULER");
                if (param.USER_EMAIL === undefined) {
                    let [userProfile2] = await this.getUser2(param);

                    var abcd1 = userProfile2[0].userEmail;
                    console.log(abcd)
                    var result1 = await this.email1.Totalloss(param, abcd1);
                }
                else {
                    var abcd1 = param.USER_EMAIL;
                    var result1 = await this.email1.Totalloss(param, abcd1);
                }
                //  let result = await this.email1.Totalloss(param);
                console.log(result1, 'eeeeeeeeeeeeeeeeeeeeeeeeeeeee');
                let dataRecord = []; //User Record
                let data;
                for (let j = 0; j < result1.length; j++) {
                    data = `<tr><td>${formatter.format(result1[j].Topline)}</td><td>${formatter.format(result1[j].Bottomline)}</td></tr>`;
                }
                console.log(data);
                let html = `
    <style>
    table.tickets_status, .tickets_status td, .tickets_status th {  
      border: 1px solid #ddd;
      text-align: left;
    }
    
    table.tickets_status {
      border-collapse: collapse;
      width: 235px;
      margin: 2px;
    }
    
    .tickets_status th, .tickets_status td{
      padding: 8px;
    }
    </style>
    <p>Account Details</p>


    <table class="tickets_status">
      <tr>
        <th>Top Line</th>
        <th>Bottom Line</th          
      </tr>
          ${data}
        </table>`;

                //dataRecord.push("ClosedDate:",`"${data.ClosedDate}"`);

                // console.log("Hi i am in sync loop",dataRecord);

                //   if(dataRecord.length > 0){
                //console.log("INSERTING DATA IN CRM_userProfile");
                json = await this.nlpHandler.fetchHtmlJson(html);
                json = await this.nlpHandler.fetchFinalResponse(json, param);
                return json;
            }
            else if (param.TOTAL === 'totalopen' || param.TOTAL === 'TOTALOPEN') {
                var formatter = new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'INR',
                });
                console.log("EXECUTING TOKEN SYNC SCHEDULER");
                if (param.USER_EMAIL === undefined) {
                    let [userProfile2] = await this.getUser2(param);

                    var abcd2 = userProfile2[0].userEmail;
                    // console.log(abcd2)
                    var result2 = await this.email1.Totalopen(param, abcd2);
                }
                else {
                    var abcd2 = param.USER_EMAIL;
                    var result2 = await this.email1.Totalopen(param, abcd2);
                }
                //   let result = await this.email1.Totalopen(param);
                console.log(result2, 'eeeeeeeeeeeeeeeeeeeeeeeeeeeee');
                let dataRecord = []; //User Record
                let data;
                for (let j = 0; j < result2.length; j++) {
                    data = `<tr><td>${formatter.format(result2[j].Topline)}</td><td>${formatter.format(result2[j].Bottomline)}</td></tr>`;
                }
                console.log(data);
                let html = `
    <style>
    table.tickets_status, .tickets_status td, .tickets_status th {  
      border: 1px solid #ddd;
      text-align: left;
    }
    
    table.tickets_status {
      border-collapse: collapse;
      width: 235px;
      margin: 2px;
    }
    
    .tickets_status th, .tickets_status td{
      padding: 8px;
    }
    </style>
    <p>Account Details</p>


    <table class="tickets_status">
      <tr>
        <th>Top Line</th>
        <th>Bottom Line</th          
      </tr>
          ${data}
        </table>`;

                //dataRecord.push("ClosedDate:",`"${data.ClosedDate}"`);

                // console.log("Hi i am in sync loop",dataRecord);

                //   if(dataRecord.length > 0){
                //console.log("INSERTING DATA IN CRM_userProfile");
                json = await this.nlpHandler.fetchHtmlJson(html);
                json = await this.nlpHandler.fetchFinalResponse(json, param);
                return json;
            }
        } catch (e) {
            throw new Error(e)
        }
    };
    async Tokentotalo(param) {
        let json = {};
        //console.log("EXECUTING TOKEN SYNC SCHEDULER");
        try {
            var formatter = new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'INR',
            });
            console.log("EXECUTING TOKEN SYNC SCHEDULER");

            let result = await this.email.Totalopen(param);
            console.log(result, 'eeeeeeeeeeeeeeeeeeeeeeeeeeeee');
            let dataRecord = []; //User Record
            let data;
            for (let j = 0; j < result.length; j++) {
                data = `<tr><td>${formatter.format(result[j].Topline)}</td><td>${formatter.format(result[j].Bottomline)}</td></tr>`;
            }
            console.log(data);
            let html = `
    <style>
    table.tickets_status, .tickets_status td, .tickets_status th {  
      border: 1px solid #ddd;
      text-align: left;
    }
    
    table.tickets_status {
      border-collapse: collapse;
      width: 235px;
      margin: 2px;
    }
    
    .tickets_status th, .tickets_status td{
      padding: 8px;
    }
    </style>
    <p>Account Details</p>


    <table class="tickets_status">
      <tr>
        <th>Top Line</th>
        <th>Bottom Line</th          
      </tr>
          ${data}
        </table>`;

            //dataRecord.push("ClosedDate:",`"${data.ClosedDate}"`);

            // console.log("Hi i am in sync loop",dataRecord);

            //   if(dataRecord.length > 0){
            //console.log("INSERTING DATA IN CRM_userProfile");
            json = await this.nlpHandler.fetchHtmlJson(html);
            json = await this.nlpHandler.fetchFinalResponse(json, param);
            return json;

        } catch (e) {
            throw new Error(e)
        }
    };
    async Tokentotall(param) {
        let json = {};
        //console.log("EXECUTING TOKEN SYNC SCHEDULER");
        try {
            var formatter = new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'INR',
            });
            console.log("EXECUTING TOKEN SYNC SCHEDULER");

            let result = await this.email.Totalloss(param);
            console.log(result, 'eeeeeeeeeeeeeeeeeeeeeeeeeeeee');
            let dataRecord = []; //User Record
            let data;
            for (let j = 0; j < result.length; j++) {
                data = `<tr><td>${formatter.format(result[j].Topline)}</td><td>${formatter.format(result[j].Bottomline)}</td></tr>`;
            }
            console.log(data);
            let html = `
    <style>
    table.tickets_status, .tickets_status td, .tickets_status th {  
      border: 1px solid #ddd;
      text-align: left;
    }
    
    table.tickets_status {
      border-collapse: collapse;
      width: 235px;
      margin: 2px;
    }
    
    .tickets_status th, .tickets_status td{
      padding: 8px;
    }
    </style>
    <p>Account Details</p>


    <table class="tickets_status">
      <tr>
        <th>Top Line</th>
        <th>Bottom Line</th          
      </tr>
          ${data}
        </table>`;

            //dataRecord.push("ClosedDate:",`"${data.ClosedDate}"`);

            // console.log("Hi i am in sync loop",dataRecord);

            //   if(dataRecord.length > 0){
            //console.log("INSERTING DATA IN CRM_userProfile");
            json = await this.nlpHandler.fetchHtmlJson(html);
            json = await this.nlpHandler.fetchFinalResponse(json, param);
            return json;

        } catch (e) {
            throw new Error(e)
        }
    };
    async Tokenupdate(param) {
        let json = {};
        //console.log("EXECUTING TOKEN SYNC SCHEDULER");
        try {
            if (param.NAME === 'firstname') {
                console.log("EXECUTING TOKEN SYNC SCHEDULER");

                let result = await this.email1.Updatecontact(param);
                var html = `<p>Your contact has been updated.</p>`


                //dataRecord.push("ClosedDate:",`"${data.ClosedDate}"`);

                // console.log("Hi i am in sync loop",dataRecord);

                //   if(dataRecord.length > 0){
                //console.log("INSERTING DATA IN CRM_userProfile");
                json = await this.nlpHandler.fetchHtmlJson(html);
                json = await this.nlpHandler.fetchFinalResponse(json, param);
                return json;
            }
            else if (param.NAME === 'lastname') {
                let result = await this.email1.Updatecontact1(param);
                var html = `<p>Your contact has been updated.</p>`


                //dataRecord.push("ClosedDate:",`"${data.ClosedDate}"`);

                // console.log("Hi i am in sync loop",dataRecord);

                //   if(dataRecord.length > 0){
                //console.log("INSERTING DATA IN CRM_userProfile");
                json = await this.nlpHandler.fetchHtmlJson(html);
                json = await this.nlpHandler.fetchFinalResponse(json, param);
                return json;

            }


        } catch (e) {
            throw new Error(e)
        }
    };

    async handleEmailverify(param) {
        let json = {};
        try {
            //console.log("what is my email", param.USER_EMAIL)
            console.log("param user email is ", param.USER_EMAIL);

            let [userProfile] = await this.getUser(param);

            console.log("userProfile in handle emailverify ==== ", userProfile);
            if (userProfile && userProfile.length > 0) {


                let Name = userProfile[0].userName
                console.log("user id is", Name);
                let result = await this.handleOTP(param);

                return result;
            }

            else {
                let response = `<b>Your Email is not registered.</b><br>
                               Please contact Admin Team.`;

                json = await this.nlpHandler.fetchHtmlJson(response);
                json = await this.nlpHandler.fetchFinalResponse(json, param);
                return json;
            }

        } catch (err) {
            //Send error Notification to user
            //throw new Error(err);
            console.log("error in handleEmailverify", err)
            let response = `<b>Your Email is not registered.</b><br>
                            Please contact Admin Team.`;
            json = await this.nlpHandler.fetchHtmlJson(response);
            json = await this.nlpHandler.fetchFinalResponse(json, param);
            return json;
        }
    };
    async getUserInfo(param) {
        let json = {};
        try {
            console.log("abcc",param)
            //console.log("what is my email", param.USER_EMAIL)
            // console.log("param user identity is ", param.form_data.Code);
            if (param.new_user) {
                console.log("adding new user")
                await this.addUser(param);
                param.new_user = false
            }
            let [userProfile] = await this.getUserbyGUID(param);

            // console.log("userProfile in get user ==== ", userProfile);
            let buttons = [
                // {
                //     "type": "postback",
                //     "title": 'About PCVisor',
                //     "payload": 'About PCVisor',
                //     "text": ''
                // },
                // {
                //     "type": "postback",
                //     "title": 'Career Opportunities',
                //     "payload": 'Career Opportunities',
                //     "text": ''
                // },
                // {
                //     "type": "postback",
                //     "title": 'IMS Culture ',
                //     "payload": 'IMS Culture',
                //     "text": ''
                // },
                {
                    "type": "postback",
                    "title": 'IT Operations',
                    "payload": 'IT Operations',
                    "text": ''
                },
                {
                    "type": "postback",
                    "title": 'UIPATH',
                   "payload": 'UIPath',
                    "text": ''
                }
            ];


          
         
            

            // json = await this.nlpHandler.fetchFinalResponse(response, param);
            if (userProfile && userProfile.length > 0) {
                let text = `<p>Hi <span style="font-size:15px">&#128075;</span>, ${userProfile[0].userName}  <br>
            
                I can help you with the following mentioned options:</p>`
                let intentDetectionConfidence='99%'
                let response = await this.nlpHandler.fetchSlotJson(text, true, buttons,intentDetectionConfidence);
                console.log("trueee")
                json = await this.nlpHandler.fetchFinalResponse(response, param);
                json.authentic_user = true;
                json.userProfile = userProfile[0]

            }
            else {
                let text_false = "Sorry,User not Authenticated"
                let response = await this.nlpHandler.fetchSlotJson(text_false);
                console.log("falseeee")
                json = await this.nlpHandler.fetchFinalResponse(response, param);
                json.authentic_user = false;

            }
           
            console.log(json,"aaaa")
            return json;
        }
        catch (err) {
            //Send error Notification to user
            //throw new Error(err);
            

            console.log(err)
          
            let text_false = "Sorry , User not Authenticated"
            let response = await this.nlpHandler.fetchSlotJson(text_false, true);
            json = await this.nlpHandler.fetchFinalResponse(response, param);
            json.authentic_user = false;
            return json;
        }
    };

    async handleOTP(param) {
        let json = {};
        try {
            console.log("Inside handleotp")
            var otp = Math.floor(100000 + Math.random() * 900000);
            console.log(otp);

            let [userProfile] = await this.storeotp(param, otp);
            // console.log("handle otp function userprofile is",userProfile)
            //console.log("result",result)
            var msgdata = {
                number: userProfile[0].number,
                Name: userProfile[0].userName,
                to: param.USER_EMAIL,
                otp: otp,
                msg: `Please use the following OTP for verification ${otp}

 Hitachi Systems Micro Clinic Pvt. Ltd.`
            }

            console.log("after handle otp msgdata", msgdata.to)
            let sendmail = await this.sendmail.mailmessage1(msgdata);

            let sendmessage = await this.sendmessage.textmessage(msgdata);

            console.log(sendmail, sendmessage);


            let response = `<p>Your OTP has been sent to your registered email, Please enter to verify.</p>`;
            //console.log(response)
            json = await this.nlpHandler.fetchHtmlJson(response);
            json = await this.nlpHandler.fetchFinalResponse(json, param);
            return json;

        } catch (err) {
            //Send error Notification to user
            //throw new Error(err);
            console.log("error in handleOTP function", err)
            let response = `Sorry For thr inconvenience, we could not generate the OTP at the moment.<br>
            Please contact Admin.`;
            json = await this.nlpHandler.fetchHtmlJson(response);
            json = await this.nlpHandler.fetchFinalResponse(json, param);
            return json;
        }
    };


    ////////////////////////////////////////////////////////////////////////////////////////////////
    
    async handleUIProcess(param) {
        let json = {};
        let userprofile=[]
        try {
            //Fetch List of Components (IT_procedures)
            // console.log("process name ",param.PROCESS_NAME)
            // let req = this.webhookService.fetchUserDetailsByEmail(
            //     param.USER_EMAIL
            // );
            userprofile = await this.getUserByMail(param)
            console.log('userprfffffffffff',userprofile)
            console.log('levellllll',userprofile[0][0]['Level'])
            let [procedures] = await this.getUIProcedure();
            let buttons = [];
            
            for (let procedure of procedures) {
                if(userprofile[0][0]['Level']=='1'){
                console.log("procedure",procedure)
                let button = {
                    "type": "postback",
                    "title": `${procedure.process_name}`,
                    "payload": `${procedure.process_name}`,
                    "text": ''
                };
                buttons.push(button);
            }
            else if(userprofile[0][0]['Level']=='0'&& procedure.process_name === 'MSedge'){
                console.log("procedure",procedure)
                let button = {
                    "type": "postback",
                    "title": `${procedure.process_name}`,
                    "payload": `${procedure.process_name}`,
                    "text": ''
                };
                buttons.push(button);
            }

        }
                
            if (buttons.length === 0) {
                let response = Messages.messages().NLP.NO_COMPONENT_FOUND;
                json = await this.nlpHandler.fetchTextJson(response);
                json = await this.nlpHandler.fetchFinalResponse(json, param);
            } else {
                let text = Messages.messages().NLP.BOT_ACTION_COMPONENT;
                let intentDetectionConfidence=param.intentDetectionConfidence
                let response = await this.nlpHandler.fetchSlotJson(text, true, buttons,intentDetectionConfidence);

                json = await this.nlpHandler.fetchFinalResponse(response, param);
            }
            return json;
        } catch (err) {
            //Send error Notification to user
            //throw new Error(err);
            console.log("error in loop2action component",err)
                let response = `No category/component found for the option you chose. <br>
                <b>Please contact IT team.</b>`;
                        json = await this.nlpHandler.fetchHtmlJson(response);
                        json = await this.nlpHandler.fetchFinalResponse(json, param);
                        return json;
        }
    };



    async getUIProcedure(){
        let req = this.webhookService.fetchUIpathProcedure(
        );
        return  Promise.all([req]);
    }

    
    async handleUIpathProcess(param) {
        let json = {};
        try {
            //Fetch List of Components (IT_procedures)
            console.log("process name", param.any)
            let [procedure] = await this.webhookService.fetchProcedureProcessName(param.USER_QUERY)
            console.log("procedures",procedure)
            console.log("user params" , param)
            let [userProfile] = await this.getUser(param)
            // console.log("user profile, ", userProfile)
            let triggerAction , process_ID  = await this.syncUtil.triggerProcess(procedure);
            
            let process_status = await this.syncUtil.job_status()
            
            
            
            //Here Handle Custom Handling for Components,
            // Like Browser Clean, Temp Clean etc.(Within Loop)
            // for (let procedure of procedures) {
            //     let button = {
            //         "type": "postback",
            //         "title": CommonUtil.convertToTitleCase("Action"),
            //         "payload": CommonUtil.convertToTitleCase(procedure.component),
            //         "text": procedure.text
            //     };
            //     buttons.push(button);
            // }

                let response = "I have triggered the process , process_id : " + process_ID 



                json = await this.nlpHandler.fetchHtmlJson(response);
                json = await this.nlpHandler.fetchFinalResponse(json, param);
                return json;
        } catch (err) {
            //Send error Notification to user
            //throw new Error(err);
            console.log("error in loop2action component",err)
                let response = `No category/component found for the option you chose. <br>
                <b>Please contact IT team.</b>`;
                        json = await this.nlpHandler.fetchHtmlJson(response);
                        json = await this.nlpHandler.fetchFinalResponse(json, param);
                        return json;
        }
    };


    


    
    



    ///////////////////////////////////////////////////////////////////////////////////////////////////


    async checkcount(param, count) {
        let req = this.webhookService.checkcount(
            param.USER_EMAIL, count
        );
        return Promise.all([req]);
    }
    async updatecount(param, count) {
        let req = this.webhookService.updatecount(
            param.USER_EMAIL, count
        );
        return Promise.all([req]);
    }

    // async getUser(param){
    //     let req = this.webhookService.fetchUserDetails(
    //         param.USER_EMAIL
    //     );
    //     return  Promise.all([req]);
    // }

    ///////////////////////////////////////handle host functions////////////////////////////////////////////
    async handlehostfunction(param) {
        let json = {};
        let hostgroup = [];
        try {
            console.log("Inside handlehost function");
            console.log(param.ANY, param.any);
            param.ANY = param.any;
            if (param.ANY) {
                console.log("got an entity", param.ANY);

                let hostgroupzabbix = param.ANY.toUpperCase();
                hostgroupzabbix = hostgroupzabbix.replace(" - ", "-");
                hostgroupzabbix = hostgroupzabbix.replace("- ", "-");
                hostgroupzabbix = hostgroupzabbix.replace(" -", "-");

                [hostgroup] = await this.gethostmongo(hostgroupzabbix);
                var hostgroupid = hostgroup[0].groupid;
                console.log(hostgroup)
            }


            if (hostgroup == null) {
                let text = `"Sorry! Could not find any hostgroup named ${param.USER_QUERY}"`;
                let response = await this.nlpHandler.fetchTextJson(text);

                json = await this.nlpHandler.fetchFinalResponse(response, param);

                return json;

            }
            else {
                let json = {};
                try {
                    console.log("Inside handle host enable function");
                    var exgroupid = hostgroupid;
                    console.log("host enable group id", exgroupid);

                    if (param.hostenable == "Host Enable" || param.hostenable == "HOST ENABLE") {
                        // console.log("Inside HOST ENABLE ");
                        console.log("result for host enable ", param.USER_QUERY);

                        console.log("result for host enable ", exgroupid);

                        let result = await this.syncUtil.gethostenable(exgroupid);
                        console.log("result for host enable ", result);
                        if (result == undefined) {
                            let response = result.error.data;

                            json = await this.nlpHandler.fetchHtmlJson(response);
                            json = await this.nlpHandler.fetchFinalResponse(json, param);
                        }
                        else {
                            let buttons = [];

                            for (let j = 0; j < result.length; j++) {
                                console.log(result[j].host)
                                //console.log(hostgroup[j].groupid)

                                let button = {
                                    "type": "postback",
                                    "title": result[j].host,
                                    "payload": `host name is ${result[j].host}`,
                                    "text": ''
                                };
                                buttons.push(button);
                            }
                            if (buttons.length === 0) {
                                let response = "No host found under selected hostgroup to enable"
                                json = await this.nlpHandler.fetchTextJson(response);
                                json = await this.nlpHandler.fetchFinalResponse(json, param);
                            } else {
                                //let text = Messages.messages().NLP.BOT_ACTION_COMPONENT;
                                let text = "Kindly click on one of the host to enable.";
                                let response = await this.nlpHandler.fetchSlotJson(text, true, buttons);

                                json = await this.nlpHandler.fetchFinalResponse(response, param);
                            }
                        }
                        json.expected_entity = ['any'];
                        return json;
                    } else if (param.hostenable == "Host Disable" || param.hostenable == "HOST DISABLE") {
                        let result = await this.syncUtil.gethostdisable(exgroupid);
                        let buttons = [];

                        for (let j = 0; j < result.length; j++) {
                            console.log(result[j].host)
                            //console.log(hostgroup[j].groupid)

                            let button = {
                                "type": "postback",
                                "title": result[j].host,
                                "payload": `hostname is ${result[j].host}`,
                                "text": ''
                            };
                            buttons.push(button);
                        }
                        if (buttons.length === 0) {
                            let response = "No host found under selected hostgroup to disable"
                            json = await this.nlpHandler.fetchTextJson(response);
                            json = await this.nlpHandler.fetchFinalResponse(json, param);
                        } else {
                            //let text = Messages.messages().NLP.BOT_ACTION_COMPONENT;
                            let text = "Kindly click on one of the host to disable.";
                            let response = await this.nlpHandler.fetchSlotJson(text, true, buttons);

                            json = await this.nlpHandler.fetchFinalResponse(response, param);
                        }
                        json.expected_entity = ['any'];
                        return json;
                    }
                    else {

                        let result = await this.syncUtil.gethost(hostgroupid);
                        let buttons = [];

                        for (let j = 0; j < result.length; j++) {
                            console.log(result[j].host)
                            //console.log(hostgroup[j].groupid)

                            let button = {
                                "type": "postback",
                                "title": result[j].host,
                                "payload": `Host name is ${result[j].host}`,
                                "text": ''
                            };
                            buttons.push(button);
                        }
                        if (buttons.length === 0) {
                            let response = "No host found under selected hostgroup."
                            json = await this.nlpHandler.fetchTextJson(response);
                            json = await this.nlpHandler.fetchFinalResponse(json, param);
                        } else {
                            //let text = Messages.messages().NLP.BOT_ACTION_COMPONENT;
                            let text = "Kindly click on one of the host to get further details.";
                            let response = await this.nlpHandler.fetchSlotJson(text, true, buttons);

                            json = await this.nlpHandler.fetchFinalResponse(response, param);
                        }
                        json.expected_entity = ['any'];
                        return json;
                    }

                } catch (e) {
                    //throw new Error(e)
                    let text = "Sorry! Could not find any disabled/Enabled host.";
                    let response = await this.nlpHandler.fetchtextJson(text);

                    json = await this.nlpHandler.fetchFinalResponse(response, param);

                    return json;

                }

            }
        } catch (e) {
            //throw new Error(e)
            let text = `"Sorry! Could not find any hostgroup named ${param.USER_QUERY}"`;
            let response = await this.nlpHandler.fetchTextJson(text);

            json = await this.nlpHandler.fetchFinalResponse(response, param);

            return json;
        }
    };

    // async handlehostfunction(param) {
    //     let json = {};
    //     try {
    //         console.log("Inside handlehost function");
    //         let hostgroupzabbix = param.ANY.toUpperCase();
    //         hostgroupzabbix = hostgroupzabbix.replace(" - ", "-");
    //         hostgroupzabbix = hostgroupzabbix.replace("- ", "-");
    //         hostgroupzabbix = hostgroupzabbix.replace(" -", "-");

    //         let [hostgroup] = await this.gethostmongo(hostgroupzabbix);

    //         console.log(hostgroup)

    //         let hostgroupid = hostgroup[0].groupid;
    //         if (hostgroup == null) {
    //             let text = `"Sorry! Could not find any hostgroup named ${param.USER_QUERY}"`;
    //             let response = await this.nlpHandler.fetchTextJson(text);

    //             json = await this.nlpHandler.fetchFinalResponse(response, param);

    //             return json;

    //         }
    //         else {
    //             let result = await this.syncUtil.gethost(hostgroupid);
    //             let buttons = [];

    //             for (let j = 0; j < result.length; j++) {
    //                 console.log(result[j].host)
    //                 //console.log(hostgroup[j].groupid)

    //                 let button = {
    //                     "type": "postback",
    //                     "title": result[j].host,
    //                     "payload": `Host name is ${result[j].host}`,
    //                     "text": ''
    //                 };
    //                 buttons.push(button);
    //             }
    //             if (buttons.length === 0) {
    //                 let response = "No host found under selected hostgroup."
    //                 json = await this.nlpHandler.fetchTextJson(response);
    //                 json = await this.nlpHandler.fetchFinalResponse(json, param);
    //             } else {
    //                 //let text = Messages.messages().NLP.BOT_ACTION_COMPONENT;
    //                 let text = "Kindly click on one of the host to get further details.";
    //                 let response = await this.nlpHandler.fetchSlotJson(text, true, buttons);

    //                 json = await this.nlpHandler.fetchFinalResponse(response, param);
    //             }
    //             json.expected_entity = ['any'];
    //             return json;
    //         }
    //     } catch (e) {
    //         //throw new Error(e)
    //         let text = `"Sorry! Could not find any hostgroup named ${param.USER_QUERY}"`;
    //         let response = await this.nlpHandler.fetchTextJson(text);

    //         json = await this.nlpHandler.fetchFinalResponse(response, param);

    //         return json;
    //     }
    // };
    /////////////////////////////////get host mongo function////////////////////////////////
    async gethostmongo(param) {
        let req = this.webhookService.fetchhostDetails(
            param
        );
        return Promise.all([req]);
    }
    async storeotp(param, otp) {
        console.log("inside store otp function")
        let req = this.webhookService.storeotp(
            param.USER_EMAIL, otp
        );
        return Promise.all([req]);
    }

    /////////////////////////////////handle hostgroup functions/////////////////////////////////////////
    async handlehostgroupfunction(param) {
        let json = {};
        try {
            console.log("Inside handlehostgroup function");
            if (param.USER_EMAIL === undefined) {
                let [userProfile2] = await this.getUser2(param);

                var email = userProfile2[0].userEmail;
                console.log(email)
                var procedures = await this.webhookService.fetchhostgroups(email);
            }
            else {
                var procedures = await this.webhookService.fetchhostgroups(param.USER_EMAIL);
            }

            //let userid = procedures[0].Userid;
            //console.log(userid)
            //let procedures1 = await this.webhookService.fetchusergroup(userid);
            var array = [procedures[0].Usergroupid];
            for (let i = 1; i < procedures.length; i++) {
                console.log("usergroupid is", procedures[i].Usergroupid)

                array.push(procedures[i].Usergroupid);
                //array.unshift(procedures[i].Usergroupid);
            }
            console.log(array);
            if (array.includes('7')) {
                var procedures2 = await this.webhookService.fetchhostgroupsall();
            }
            else {
                let procedures1 = await this.webhookService.fetchhostgroups1(array);
                var array1 = [procedures1[0].hostgroupid];
                for (let i = 1; i < procedures1.length; i++) {
                    console.log("hostgroupid is", procedures1[i].hostgroupid)

                    array1.push(procedures1[i].hostgroupid);
                }
                console.log(array1)
                var procedures2 = await this.webhookService.fetchhostgroups2(array1);
            }
            console.log(procedures2)
            let buttons = [];
            for (let procedure of procedures2) {
                let button = {
                    "type": "postback",
                    "title": CommonUtil.convertToTitleCase(procedure.groupname),
                    "payload": CommonUtil.convertToTitleCase(procedure.groupname),
                    "text": procedure.text
                };
                buttons.push(button);
            }

            if (buttons.length === 0) {
                let response = Messages.messages().NLP.NO_COMPONENT_FOUND;
                json = await this.nlpHandler.fetchTextJson(response);
                json = await this.nlpHandler.fetchFinalResponse(json, param);
            } else {
                //let text = Messages.messages().NLP.BOT_ACTION_COMPONENT;
                let text = "Either choose hostgroup from below list or enter the name of the hostgroup for which you want to fetch details.";
                let response = await this.nlpHandler.fetchSlotJson(text, true, buttons);

                json = await this.nlpHandler.fetchFinalResponse(response, param);
            }
            return json;

        } catch (e) {
            //throw new Error(e)
            console.log(e);
            let text = `"Sorry! Could not find any hostgroup named ${param.USER_QUERY}"`;
            let response = await this.nlpHandler.fetchTextJson(text);

            json = await this.nlpHandler.fetchFinalResponse(response, param);

            return json;

        }
    };
    //////////////////////////enable/disable hostgroup function//////////////////
    async handleenablehostgroupfunction(param) {
        let json = {};
        try {
            console.log("Inside  enable handlehostgroup function");
            if (param.USER_EMAIL === undefined) {
                let [userProfile2] = await this.getUser2(param);

                var email = userProfile2[0].userEmail;
                console.log(email)
                var procedures = await this.webhookService.fetchhostgroups(email);
            }
            else {
                var procedures = await this.webhookService.fetchhostgroups(param.USER_EMAIL);
            }
            //let procedures = await this.webhookService.fetchhostgroups(param.USER_EMAIL);

            //let userid = procedures[0].Userid;
            //console.log(userid)
            //let procedures1 = await this.webhookService.fetchusergroup(userid);
            var array = [procedures[0].Usergroupid];
            for (let i = 1; i < procedures.length; i++) {
                console.log("usergroupid is", procedures[i].Usergroupid)

                array.push(procedures[i].Usergroupid);
                //array.unshift(procedures[i].Usergroupid);
            }
            console.log(array);
            if (array.includes('7')) {
                var procedures2 = await this.webhookService.fetchhostgroupsall();
            }
            else {
                let procedures1 = await this.webhookService.fetchhostgroups1(array);
                var array1 = [procedures1[0].hostgroupid];
                for (let i = 1; i < procedures1.length; i++) {
                    console.log("hostgroupid is", procedures1[i].hostgroupid)

                    array1.push(procedures1[i].hostgroupid);
                }
                console.log(array1)
                var procedures2 = await this.webhookService.fetchhostgroups2(array1);
            }
            console.log(procedures2)
            let buttons = [];
            for (let procedure of procedures2) {
                let button = {
                    "type": "postback",
                    "title": CommonUtil.convertToTitleCase(procedure.groupname),
                    "payload": CommonUtil.convertToTitleCase(`Group id is ${procedure.groupid}`),
                    "text": procedure.text
                };
                buttons.push(button);
            }

            if (buttons.length === 0) {
                let response = Messages.messages().NLP.NO_COMPONENT_FOUND;
                json = await this.nlpHandler.fetchTextJson(response);
                json = await this.nlpHandler.fetchFinalResponse(json, param);
            } else {
                //let text = Messages.messages().NLP.BOT_ACTION_COMPONENT;
                let text = "Kindly choose hostgroup from below list.";
                let response = await this.nlpHandler.fetchSlotJson(text, true, buttons);

                json = await this.nlpHandler.fetchFinalResponse(response, param);
            }
            return json;

        } catch (e) {
            //throw new Error(e)
            let text = `"Sorry! Could not find any hostgroup named ${param.USER_QUERY}"`;
            let response = await this.nlpHandler.fetchTextJson(text);

            json = await this.nlpHandler.fetchFinalResponse(response, param);

            return json;

        }
    };
    async handleenablehostfunction(param) {
        let json = {};
        try {
            console.log("Inside  enable handle hostgroup function");
            if (param.USER_EMAIL === undefined) {
                let [userProfile2] = await this.getUser2(param);

                var email = userProfile2[0].userEmail;
                console.log(email)
                var procedures = await this.webhookService.fetchhostgroups(email);
            }
            else {
                var procedures = await this.webhookService.fetchhostgroups(param.USER_EMAIL);
            }
            //let procedures = await this.webhookService.fetchhostgroups(param.USER_EMAIL);

            //let userid = procedures[0].Userid;
            //console.log(userid)
            //let procedures1 = await this.webhookService.fetchusergroup(userid);
            var array = [procedures[0].Usergroupid];
            for (let i = 1; i < procedures.length; i++) {
                console.log("usergroupid is", procedures[i].Usergroupid)

                array.push(procedures[i].Usergroupid);
                //array.unshift(procedures[i].Usergroupid);
            }
            console.log(array);
            if (array.includes('7')) {
                var procedures2 = await this.webhookService.fetchhostgroupsall();
            }
            else {
                let procedures1 = await this.webhookService.fetchhostgroups1(array);
                var array1 = [procedures1[0].hostgroupid];
                for (let i = 1; i < procedures1.length; i++) {
                    console.log("hostgroupid is", procedures1[i].hostgroupid)

                    array1.push(procedures1[i].hostgroupid);
                }
                console.log(array1)
                var procedures2 = await this.webhookService.fetchhostgroups2(array1);
            }
            console.log(procedures2)
            let buttons = [];
            for (let procedure of procedures2) {
                let button = {
                    "type": "postback",
                    "title": CommonUtil.convertToTitleCase(procedure.groupname),
                    "payload": `Host group is ${procedure.groupname}`,
                    "text": procedure.text
                };
                buttons.push(button);
            }

            if (buttons.length === 0) {
                let response = Messages.messages().NLP.NO_COMPONENT_FOUND;
                json = await this.nlpHandler.fetchTextJson(response);
                json = await this.nlpHandler.fetchFinalResponse(json, param);
            } else {
                //let text = Messages.messages().NLP.BOT_ACTION_COMPONENT;
                let text = "Kindly choose hostgroup from below list.";
                let response = await this.nlpHandler.fetchSlotJson(text, true, buttons);

                json = await this.nlpHandler.fetchFinalResponse(response, param);
            }
            return json;

        } catch (e) {
            //throw new Error(e)
            let text = `"Sorry! Could not find any hostgroup named ${param.USER_QUERY}"`;
            let response = await this.nlpHandler.fetchTextJson(text);

            json = await this.nlpHandler.fetchFinalResponse(response, param);

            return json;

        }
    };
    /////////////////////////////////////////////action/////////////////////////////////
    async actionfunction(param) {
        let json = {};
        try {
            console.log('inside function');
            if (param.ACTION === "CLEAN" || param.ACTION === "ISSUE") {
                let buttons = [
                    {
                        "type": "postback",
                        "title": 'Browser',
                        "payload": 'Browser is working slow',
                        "text": ''
                    },
                    {
                        "type": "postback",
                        "title": 'System',
                        "payload": 'System is working slow',
                        "text": ''
                    }


                ];

                let text = "Please select from the following options";
                let intentDetectionConfidence=param.intentDetectionConfidence
                let response = await this.nlpHandler.fetchSlotJson(text, true, buttons,intentDetectionConfidence);
                json = await this.nlpHandler.fetchFinalResponse(response, param);
            }

            else if (param.ACTION === "INSTALL" || param.ACTION === "UNINSTALL" || param.ACTION === "INSTALLATION" || param.ACTION === "UNINSTALLATION") {
                let buttons = [
                    {
                        "type": "postback",
                        "title": 'Software',
                        "payload": 'Software',
                        "text": ''
                    },
                    {
                        "type": "postback",
                        "title": 'Hardware',
                        "payload": 'Hardware',
                        "text": ''
                    }


                ];


                let text = "Please select from the following options";
                let intentDetectionConfidence=param.intentDetectionConfidence
                let response = await this.nlpHandler.fetchSlotJson(text, true, buttons,intentDetectionConfidence);
                json = await this.nlpHandler.fetchFinalResponse(response, param);
            }


            else if (param.ACTION === "TROUBLESHOOT") {
                let buttons = [
                    {
                        "type": "postback",
                        "title": 'Outlook',
                        "payload": 'Outlook Issue',
                        "text": ''
                    },
                    {
                        "type": "postback",
                        "title": 'System',
                        "payload": 'System Issue',
                        "text": ''
                    },
                    {
                        "type": "postback",
                        "title": 'Browser',
                        "payload": 'Browser Issue',
                        "text": ''
                    }


                ];


                let text = "Please select from the following options";
                let intentDetectionConfidence=param.intentDetectionConfidence
                let response = await this.nlpHandler.fetchSlotJson(text, true, buttons,intentDetectionConfidence);
                json = await this.nlpHandler.fetchFinalResponse(response, param);
            }



            else if (param.ACTION === "NETWORK") {
                let buttons = [
                    {
                        "type": "postback",
                        "title": 'Enable',
                        "payload": 'Enable feature',
                        "text": ''
                    },
                    {
                        "type": "postback",
                        "title": 'Disable',
                        "payload": 'Disable feature',
                        "text": ''
                    },
                    {
                        "type": "postback",
                        "title": 'Reset',
                        "payload": 'Reset Network',
                        "text": ''
                    }
                ];

                let text = "Please select from the following options";
                let intentDetectionConfidence=param.intentDetectionConfidence
                let response = await this.nlpHandler.fetchSlotJson(text, true, buttons,intentDetectionConfidence);
                json = await this.nlpHandler.fetchFinalResponse(response, param);
            }


            else if (param.ACTION === "SECURITY") {
                let buttons = [
                    {
                        "type": "postback",
                        "title": 'Enable',
                        "payload": 'i want you to enable security',
                        "text": ''
                    },
                    {
                        "type": "postback",
                        "title": 'Disable',
                        "payload": 'i want you to disable security',
                        "text": ''
                    },
                    {
                        "type": "postback",
                        "title": 'Restore',
                        "payload": 'i want you to Restore',
                        "text": ''
                    }


                ];


                let text = "Please select from the following options";
                let intentDetectionConfidence=param.intentDetectionConfidence
                let response = await this.nlpHandler.fetchSlotJson(text, true, buttons,intentDetectionConfidence);
                json = await this.nlpHandler.fetchFinalResponse(response, param);
            }



            else if (param.ACTION === "SETTINGS") {
                let buttons = [
                    {
                        "type": "postback",
                        "title": 'Browser',
                        "payload": 'Browser Setting',
                        "text": ''
                    },
                    {
                        "type": "postback",
                        "title": 'System',
                        "payload": 'System Setting',
                        "text": ''
                    }


                ];


                let text = "Please select from the following options";
                let intentDetectionConfidence=param.intentDetectionConfidence
                let response = await this.nlpHandler.fetchSlotJson(text, true, buttons,intentDetectionConfidence);
                json = await this.nlpHandler.fetchFinalResponse(response, param);

            }

            return json;
        } catch (e) {
            throw new Error(e)
        }
    };

    async installcomponentfunction(param) {
        let json = {};
        try {
            console.log("INSIDE installcomponentfunction");
            console.log("install/unintsall params", param.ACTION, param.COMPONENT)
            param.ACTION = param.ACTION.toUpperCase();
            param.COMPONENT = param.COMPONENT.toUpperCase();
            let [procedure] = await this.getProcedureforcomponent(param);
            // let [userProfile2] = await this.getUser2(param);
            let [userProfile] = await this.getUser(param);
            console.log("procedure is", procedure[0]);
            console.log("userProfile is", userProfile[0]);
            // console.log("userProfile ==== ", userProfile2);
            //If Yes
            // if (param.CONFIRMATION === 'YES' && param.ACTION !== "LOGIN ISSUE") {
            //Create Ticket
            if (procedure == [] || procedure == undefined) {
                let response = `Sorry, I don't have ${param.COMPONENT} listed with me. Am raising a ticket for this.`;

                json = await this.nlpHandler.fetchTextJson(response);
                json = await this.nlpHandler.fetchFinalResponse(json, param);
                return json;
            }
            let ticketResponse = await this.createTicket(param, procedure[0], userProfile2[0], procedure[0].closingLevel);

            if (ticketResponse.response === "SUCCESS") {
                //Execute Procedure
                let actionResponse = await this.webhookService.executeAction(
                    //param.USER_IDENTITY,
                    userProfile2[0].userIdentity,
                    procedure[0].procedureId
                );
                console.log("actionResponse === ", actionResponse);

                //Create Execution Record
                let executionResponse = await this.webhookService.createExecution(
                    userProfile2[0].userIdentity,
                    procedure[0].procedureId,
                    ticketResponse.ticketId,
                    Constants.constants().EXECUTION_STATUS.RUNNING,
                    ticketResponse.summary
                );

                // let res = await this.webhookService.executeNotification(notifyParam);

                //Return Response
                let response = `I have triggered action requested by you. 
                Also I have created ticket <b>${ticketResponse.ticketId}</b> for same.`;

                json = await this.nlpHandler.fetchTextJson(response);
                json = await this.nlpHandler.fetchFinalResponse(json, param);
                return json;
            } else {
                //Send Notification and Error Response
                let response = `Sorry to inform you that ticket hasn't been created due 
                                to temporary service desk issue. Please try again.`;

                if (userProfile[0].userEmail === '' || userProfile[0].userEmail === 'noDataInPCV@db.com') {
                    response = `Sorry to inform you that ticket hasn't been created due to missing email 
                    configuration in your profile. Please get in touch with IT Support Team for same. `;
                }
                json = await this.nlpHandler.fetchTextJson(response);
                json = await this.nlpHandler.fetchFinalResponse(json, param);


                // let res = await this.webhookService.executeNotification(notifyParam);
                return json;
            }
            // }

            //If No,

            return json;


        } catch (err) {
            //Send error Notification to user
            //throw new Error(err);
            console.log("error in handleItActionComponent component", err)
            let response = `No category/component found for the option you chose. <br>
                <b>Please contact IT team.</b>`;
            json = await this.nlpHandler.fetchHtmlJson(response);
            json = await this.nlpHandler.fetchFinalResponse(json, param);
            return json;
        }
    };

    async confirmItAction(param) {
        // if (param.CONFIRMATION === 'YES' && param.ACTION !== "LOGIN ISSUE") {
        console.log("confirmItAction");
        let json = {};
        try {
            if (param.ACTION) {
                param.ACTION = param.ACTION.toUpperCase();
            }
            if (param.COMPONENT) {
                param.COMPONENT = param.COMPONENT.toUpperCase();
                console.log("component ", param.COMPONENT)
            }
            if (param.COMPONENT == 'USB' || param.COMPONENT == 'UAC' || param.COMPONENT == 'FIREWALL' || param.COMPONENT == 'ADMIN RIGHTS') {
                param.CATEGORY = param.CATEGORY.toUpperCase();
                param.ACTION = 'SECURITY';
                if (param.CATEGORY == 'ENABLE') {
                    param.CATEGORY = 'SECURITY ENABLE';
                }
                else if (param.CATEGORY == 'DISABLE') {
                    param.CATEGORY = 'SECURITY DISABLE';
                }
            }
            let [procedure] = await this.getProcedureforcomponent(param);
            let [userProfile] = await this.getUser2(param);
            console.log("procedure is", procedure[0]);
            console.log("procedure is", procedure);
            console.log("userProfile is", userProfile[0]);
            if (procedure[0] == undefined || procedure[0] == []) {
                console.log("procedure is empty");
                let [procedure] = await this.getProcedureForAction(param);
                console.log("procedure is", procedure[0]);
                let ticketResponse;
                try {
                    ticketResponse = await this.createTicket(param, procedure[0], userProfile[0], procedure[0].closingLevel);
                }
                catch {
                    ticketResponse.response === "Failed";
                }
                let response = '';
                if (ticketResponse.response === "SUCCESS") {
                    response = `Sorry, I don't have ${param.COMPONENT} listed with me.
                Also I have created ticket <b>${ticketResponse.ticketId}</b> for same.`;
                }
                else {
                    response = `Sorry, I don't have ${param.COMPONENT} listed with me.`;
                }
                json = await this.nlpHandler.fetchTextJson(response);
                json = await this.nlpHandler.fetchFinalResponse(json, param);
                return json;
            }
            //Create Ticket
            else if (procedure.length > 1) {
                let buttons = [];
                for (let procedures of procedure) {
                    let button = {
                        "type": "postback",
                        "title": procedures.text,
                        "payload": procedures.text,
                        "text": procedures.text
                    };
                    buttons.push(button);
                }

                if (buttons.length === 0) {
                    let response = Messages.messages().NLP.NO_COMPONENT_FOUND;
                    json = await this.nlpHandler.fetchTextJson(response);
                    json = await this.nlpHandler.fetchFinalResponse(json, param);
                } else {
                    //let text = Messages.messages().NLP.BOT_ACTION_COMPONENT;
                    let text = "Kindly choose hostgroup from below list you want to delete.";
                    let response = await this.nlpHandler.fetchSlotJson(text, true, buttons);

                    json = await this.nlpHandler.fetchFinalResponse(response, param);
                }
                return json;
            }
            else if (procedure[0].approvalRequired) {
                json = await this.handleItActionApproval(param, procedure, userProfile);
                return json;
            }
            else if (param.ACTION == 'LOGIN ISSUE') {//generate random password 
                var password = generator.generate({
                    length: 6,
                    numbers: true
                });

                //Hashing algorithm
                var salt = bcrypt.genSaltSync(10);
                var hash = bcrypt.hashSync(password, salt);

                //base 64 encode
                'use strict';
                let buff = new Buffer(password);
                let base64 = buff.toString('base64');
                console.log('"' + password + '" converted to Base64 is "' + base64 + '"');

                let data = {
                    email: userProfile[0].userEmail,
                    Name: userProfile[0].userName,
                    id: userProfile[0].id,
                    Password: password,
                    Passbase64: base64,
                    Passhash: hash
                }
                if (param.COMPONENT == "WINDOWS" || param.COMPONENT === "MAIL") {

                    console.log("INSIDE AD Password Reset Function");
                    // var sAMAccountName = param.USER_PROFILE.toUpperCase();
                    // console.log("sAMAccountName", sAMAccountName)

                    // var result = this.resetad.resetadpassword(sAMAccountName);

                    // let response = `<p>Your temporary password has been sent to your registered Email ID.<br></p>`;
                    // json = await this.nlpHandler.fetchHtmlJson(response);
                    // json = await this.nlpHandler.fetchFinalResponse(json, param);

                    let ticketResponse = await this.createTicket(param, procedure[0], userProfile[0], procedure[0].closingLevel);

                    if (ticketResponse.response === "SUCCESS") {
                        //Execute Procedure
                        let actionResponse = await this.webhookService.executeAction(
                            //param.USER_IDENTITY,
                            userProfile[0].userIdentity,
                            procedure[0].procedureId
                        );
                        console.log("actionResponse === ", actionResponse);

                        //Create Execution Record
                        let executionResponse = await this.webhookService.createExecution(
                            userProfile[0].userIdentity,
                            procedure[0].procedureId,
                            ticketResponse.ticketId,
                            Constants.constants().EXECUTION_STATUS.RUNNING,
                            ticketResponse.summary
                        );

                        // let res = await this.webhookService.executeNotification(notifyParam);

                        //Return Response
                        let response = `This requires manual intervention. 
            So, I have created ticket <b>${ticketResponse.ticketId}</b> for same.`;

                        json = await this.nlpHandler.fetchTextJson(response);
                        json = await this.nlpHandler.fetchFinalResponse(json, param);
                        return json;
                    } else {
                        //Send Notification and Error Response
                        let response = `Sorry to inform you that ticket hasn't been created due 
                            to temporary service desk issue. Please try again.`;

                        if (userProfile[0].userEmail === '' || userProfile[0].userEmail === 'noDataInPCV@db.com') {
                            response = `Sorry to inform you that ticket hasn't been created due to missing email 
                configuration in your profile. Please get in touch with IT Support Team for same. `;
                        }
                        json = await this.nlpHandler.fetchTextJson(response);
                        json = await this.nlpHandler.fetchFinalResponse(json, param);

                        // let res = await this.webhookService.executeNotification(notifyParam);

                        return json;
                    }
                }
                else if (param.COMPONENT == "EJIJO" || param.COMPONENT == "RESOURCE PORTAL" || param.COMPONENT == "RESOURCE PORTAL") {
                    if (param.COMPONENT == "EJIJO") {
                        await this.syncUtil.executeMobPassword(data)

                    } else {
                        let empid = userProfile[0].EMPID
                        let respassword = await this.aesencryption.encrypt(password)
                        console.log("resource password", respassword)
                        let resource = await this.syncUtil.executeResourcePassword(respassword, empid)
                    }

                    var msgdata = {
                        number: userProfile[0].MobileNumber,
                        msg: `Your temporary password is as follows: ${password}. Please use the same for login.`
                    }
                    console.log("message", msgdata)
                    let sendmessage = await this.sendmessage.textmessage(msgdata)
                    let sendmail = await this.sendmail.mailmessage2(data)

                    let response = `<p>Your temporary password has been sent to your regsitered Email ID/Mobile Number.<br></p>`;
                    json = await this.nlpHandler.fetchHtmlJson(response);
                    json = await this.nlpHandler.fetchFinalResponse(json, param);
                    return json;

                }
            }
            else {
                let ticketResponse = await this.createTicket(param, procedure[0], userProfile[0], procedure[0].closingLevel);

                if (ticketResponse.response === "SUCCESS") {
                    //Execute Procedure
                    // let actionResponse = await this.webhookService.executeAction(
                        //param.USER_IDENTITY,
                    //     userProfile[0].userIdentity,
                    //     procedure[0].procedureId
                    // );
                    // console.log("actionResponse === ", actionResponse);

                    //Create Execution Record
                    // let executionResponse = await this.webhookService.createExecution(
                    //     userProfile[0].userIdentity,
                    //     procedure[0].procedureId,
                    //     ticketResponse.ticketId,
                    //     Constants.constants().EXECUTION_STATUS.RUNNING,
                    //     ticketResponse.summary
                    // );

                    // let res = await this.webhookService.executeNotification(notifyParam);

                    //Return Response
                    let response = `I have triggered action requested by you. 
Also I have created ticket <b>${ticketResponse.ticketId}</b> for same.`;

                    json = await this.nlpHandler.fetchTextJson(response);
                    json = await this.nlpHandler.fetchFinalResponse(json, param);
                    return json;
                } else {
                    //Send Notification and Error Response
                    let response = `Sorry to inform you that ticket hasn't been created due 
                to temporary service desk issue. Please try again.`;

                    if (userProfile[0].userEmail === '' || userProfile[0].userEmail === 'noDataInPCV@db.com') {
                        response = `Sorry to inform you that ticket hasn't been created due to missing email 
    configuration in your profile. Please get in touch with IT Support Team for same. `;
                    }
                    json = await this.nlpHandler.fetchTextJson(response);
                    json = await this.nlpHandler.fetchFinalResponse(json, param);


                    // let res = await this.webhookService.executeNotification(notifyParam);
                    return json;
                }
            }
        }
        catch (err) {
            //Send error Notification to user
            //throw new Error(err);
            console.log("error in handleItActionComponent component", err)
            let response = `Sorry for inconvience. Please try again later.`;
            json = await this.nlpHandler.fetchHtmlJson(response);
            json = await this.nlpHandler.fetchFinalResponse(json, param);
            return json;
        }
    };

    /////////////////////////////////host group creation/////////////////////////////////////////
    async hostgroupcreationfunction(param) {
        let json = {};
        try {
            console.log("Inside hostgroup creation function");
            if (param.hostgroup == "Hostgroup creation" || param.USER_QUERY == "Hostgroup Creation") {
                let response = `<p>Kindly provide the name of the hostgroup you want to create as given example.<br>Hostgroup name is <b>hostgroup name</b>.<p>`;
                json = await this.nlpHandler.fetchHtmlJson(response);
                json = await this.nlpHandler.fetchFinalResponse(json, param);
                return json;
            }
            else if (param.hostgroup == "Hostgroup deletion" || param.USER_QUERY == "Hostgroup Deletion") {
                console.log("Inside handlehostgroupdeletion list function");
                if (param.USER_EMAIL === undefined) {
                    let [userProfile2] = await this.getUser2(param);

                    var email = userProfile2[0].userEmail;
                    console.log(email)
                    var procedures = await this.webhookService.fetchhostgroups(email);
                }
                else {
                    var procedures = await this.webhookService.fetchhostgroups(param.USER_EMAIL);
                }
                //let procedures = await this.webhookService.fetchhostgroups(param.USER_EMAIL);
                var array = [procedures[0].Usergroupid];
                for (let i = 1; i < procedures.length; i++) {
                    console.log("usergroupid is", procedures[i].Usergroupid)

                    array.push(procedures[i].Usergroupid);
                    //array.unshift(procedures[i].Usergroupid);
                }
                console.log(array);
                if (array.includes('7')) {
                    var procedures2 = await this.webhookService.fetchhostgroupsall();
                }
                else {

                    let procedures1 = await this.webhookService.fetchhostgroups1(array);
                    var array1 = [procedures1[0].hostgroupid];
                    for (let i = 1; i < procedures1.length; i++) {
                        console.log("hostgroupid is", procedures1[i].hostgroupid)

                        array1.push(procedures1[i].hostgroupid);
                    }
                    console.log(array1)
                    var procedures2 = await this.webhookService.fetchhostgroups2(array1);
                }
                console.log(procedures2)
                let buttons = [];
                for (let procedure of procedures2) {
                    let button = {
                        "type": "postback",
                        "title": CommonUtil.convertToTitleCase(procedure.groupname),
                        "payload": CommonUtil.convertToTitleCase(`deletion host group id is ${procedure.groupid}`),
                        "text": procedure.text
                    };
                    buttons.push(button);
                }

                if (buttons.length === 0) {
                    let response = Messages.messages().NLP.NO_COMPONENT_FOUND;
                    json = await this.nlpHandler.fetchTextJson(response);
                    json = await this.nlpHandler.fetchFinalResponse(json, param);
                } else {
                    //let text = Messages.messages().NLP.BOT_ACTION_COMPONENT;
                    let text = "Kindly choose hostgroup from below list you want to delete.";
                    let response = await this.nlpHandler.fetchSlotJson(text, true, buttons);

                    json = await this.nlpHandler.fetchFinalResponse(response, param);
                }
                json.expected_entity = ['any'];
                return json;
            }
        } catch (e) {
            throw new Error(e)
        }
    };

    /////////////////////////////host group deletion function////////////////////////////////
    async hostgroupdeletionfunction(param) {
        let json = {};
        try {
            console.log("Inside hostgroup deletion function");
            if (param.hostgroup == "Hostgroup creation" || param.hostgroup == "HOSTGROUP CREATION") {
                let result = await this.syncUtil.hostgroupcreation(param);
                if (JSON.stringify(result).indexOf('groupids') === -1) {
                    let response = result.error.data;

                    json = await this.nlpHandler.fetchHtmlJson(response);
                    json = await this.nlpHandler.fetchFinalResponse(json, param);

                    return json;

                }
                else {
                    let response = `<p>Hostgroup is successfully created</p>`;

                    json = await this.nlpHandler.fetchHtmlJson(response);
                    json = await this.nlpHandler.fetchFinalResponse(json, param);

                    return json;
                }
            }
            else if (param.hostgroup == "Hostgroup deletion" || param.hostgroup == "Hostgroup Deletion" || param.hostgroup == "HOSTGROUP DELETION") {
                if (Number.isFinite(param.USER_QUERY) == "false") {
                    var data = param.USER_QUERY;
                    data = data.replace(" - ", "-");
                    data = data.replace(" -", "-");
                    data = data.replace("- ", "-");
                    var deletionid = (data.split(" ").splice(-1));
                }
                else {
                    let result = await this.syncUtil.hostgroupdeletion(param);
                    if (JSON.stringify(result).indexOf('groupids') === -1) {
                        let response = result.error.data;

                        json = await this.nlpHandler.fetchHtmlJson(response);
                        json = await this.nlpHandler.fetchFinalResponse(json, param);
                        return json;
                    }
                    else {
                        let response = `<p>Hostgroup is successfully deleted</p>`;

                        json = await this.nlpHandler.fetchHtmlJson(response);
                        json = await this.nlpHandler.fetchFinalResponse(json, param);

                        return json;
                    }
                }
            }

        } catch (e) {
            throw new Error(e)
        }
    };

    /////////////////////////////////////////hostgroup deletion list function///////////////////////////
    // async hostgroupdeletionlistfunction(param) {
    //     let json = {};
    //     try {
    // console.log("Inside handlehostgroupdeletion list function");
    // let procedures = await this.webhookService.fetchhostgroups();
    //         //Here Handle Custom Handling for Components,
    //         // Like Browser Clean, Temp Clean etc.(Within Loop)
    //         let buttons = [];
    //         for (let procedure of procedures) {
    //             let button = {
    //                 "type": "postback",
    //                 "title": CommonUtil.convertToTitleCase(procedure.groupname),
    //                 "payload": CommonUtil.convertToTitleCase(`"deletion host group id is "${procedure.groupid}`),
    //                 "text": procedure.text
    //             };
    //             buttons.push(button);
    //         }

    //         if (buttons.length === 0) {
    //             let response = Messages.messages().NLP.NO_COMPONENT_FOUND;
    //             json = await this.nlpHandler.fetchTextJson(response);
    //             json = await this.nlpHandler.fetchFinalResponse(json, param);
    //         } else {
    //             //let text = Messages.messages().NLP.BOT_ACTION_COMPONENT;
    //             let text = "Kindly choose hostgroup from below list you want to delete.";
    //             let response = await this.nlpHandler.fetchSlotJson(text, true, buttons);

    //             json = await this.nlpHandler.fetchFinalResponse(response, param);
    //         }
    //         json.expected_entity = ['any'];
    //         return json;
    //     } catch (e) {
    //         //throw new Error(e)
    //         let text = "Sorry! Could not find any hostgroup.";
    //             let response = await this.nlpHandler.fetchtextJson(text);

    //             json = await this.nlpHandler.fetchFinalResponse(response, param);

    //         return json;

    //     }
    // };

    /////////////////////////////////zabbix action enable/////////////////////////////////////

    async zabbixactionenablefunction(param) {
        let json = {};
        try {
            console.log("Inside zabbix action enable function");
            if (param.actionenable === "Action Enable" || param.actionenable === "ENABLE") {
                let result = await this.syncUtil.zabbixactionenable(param);
                /*if(JSON.stringify(result).indexOf('groupids') === -1)
                {
                   let response = result.error.data;
               
                   json = await this.nlpHandler.fetchHtmlJson(response);
                   json = await this.nlpHandler.fetchFinalResponse(json, param);
                   
                   return json;
       
                }
                else{*/
                let response = `<p>Action is successfully enabled.</p>`;

                json = await this.nlpHandler.fetchHtmlJson(response);
                json = await this.nlpHandler.fetchFinalResponse(json, param);
            }
            else if (param.actionenable === "Action Disable" || param.actionenable === "DISABLE") {
                let result = await this.syncUtil.zabbixactiondisable(param);
                /*if(JSON.stringify(result).indexOf('groupids') === -1)
                {
                   let response = result.error.data;
               
                   json = await this.nlpHandler.fetchHtmlJson(response);
                   json = await this.nlpHandler.fetchFinalResponse(json, param);
                   
                   return json;
       
                }
                else{*/
                let response = `<p>Action is successfully disabled.</p>`;

                json = await this.nlpHandler.fetchHtmlJson(response);
                json = await this.nlpHandler.fetchFinalResponse(json, param);
            }
            return json;
        } catch (e) {
            throw new Error(e)
        }
    };

    async zabbixactionenablenamefunction(param) {
        let json = {};
        try {
            console.log("Inside zabbix action enable function");
            if (param.actionenable === "Action Enable" || param.actionenable === "ENABLE") {
                let mode = "ENABLE";
                var name = param.any;
                if (!name) {
                    let userquery = param.USER_QUERY.toUpperCase();
                    var ret = userquery.replace('ENABLE', '');
                    console.log(ret);
                    name = ret
                }
                let actionobj = await this.webhookService.fetchActionId(mode, name);
                let actionid = actionobj[0].actionid
                param.any = actionid
                let result = await this.syncUtil.zabbixactionenable(param);
                /*if(JSON.stringify(result).indexOf('groupids') === -1)
                {
                   let response = result.error.data;
               
                   json = await this.nlpHandler.fetchHtmlJson(response);
                   json = await this.nlpHandler.fetchFinalResponse(json, param);
                   
                   return json;
       
                }
                else{*/
                let response = `<p>Action is successfully enabled.</p>`;

                json = await this.nlpHandler.fetchHtmlJson(response);
                json = await this.nlpHandler.fetchFinalResponse(json, param);
            }
            else if (param.actionenable === "Action Disable" || param.actionenable === "DISABLE") {
                let mode = "DISABLE";
                let name = param.any;
                if (!name) {
                    let userquery = param.USER_QUERY.toUpperCase();
                    var ret = userquery.replace('DISABLE', '');
                    console.log(ret);
                    name = ret
                }
                let actionobj = await this.webhookService.fetchActionId(mode, name);
                let actionid = actionobj[0].actionid
                param.any = actionid

                let result = await this.syncUtil.zabbixactiondisable(param);
                /*if(JSON.stringify(result).indexOf('groupids') === -1)
                {
                   let response = result.error.data;
               
                   json = await this.nlpHandler.fetchHtmlJson(response);
                   json = await this.nlpHandler.fetchFinalResponse(json, param);
                   
                   return json;
       
                }
                else{*/
                let response = `<p>Action is successfully disabled.</p>`;

                json = await this.nlpHandler.fetchHtmlJson(response);
                json = await this.nlpHandler.fetchFinalResponse(json, param);
            }
            return json;
        } catch (e) {
            throw new Error(e)
        }
    };

    ////////////////////////////actionlistfunction///////////////////////////////////////////
    async actionlistfunction(param) {
        let json = {};
        try {
            console.log("Inside actionlist function");
            if (param.actionenable == "Action Enable" || param.USER_QUERY == "Action Enable") {
                let result = await this.syncUtil.enablezabbixactionlist(param);
                console.log(result)
                let buttons = [];

                for (let j = 0; j < result.length; j++) {
                    console.log(result[j].name)
                    //console.log(hostgroup[j].groupid)

                    let button = {
                        "type": "postback",
                        "title": result[j].name,
                        "payload": `Action id is ${result[j].actionid}`,
                        "text": ''
                    };
                    buttons.push(button);
                }
                if (buttons.length === 0) {
                    let response = Messages.messages().NLP.NO_COMPONENT_FOUND;
                    json = await this.nlpHandler.fetchTextJson(response);
                    json = await this.nlpHandler.fetchFinalResponse(json, param);
                } else {
                    let text = 'Kindly choose one of the action you want to enable';
                    let response = await this.nlpHandler.fetchSlotJson(text, true, buttons);
                    json = await this.nlpHandler.fetchFinalResponse(response, param);
                    //return json;
                }

            } else if (param.actionenable == "Action Disable" || param.USER_QUERY == "Action Disable") {
                let result = await this.syncUtil.disablezabbixactionlist(param);
                console.log(result)
                let buttons = [];

                for (let j = 0; j < result.length; j++) {
                    console.log(result[j].name)
                    //console.log(hostgroup[j].groupid)

                    let button = {
                        "type": "postback",
                        "title": result[j].name,
                        "payload": `Action id is ${result[j].actionid}`,
                        "text": ''
                    };
                    buttons.push(button);
                }
                if (buttons.length === 0) {
                    let response = Messages.messages().NLP.NO_COMPONENT_FOUND;
                    json = await this.nlpHandler.fetchTextJson(response);
                    json = await this.nlpHandler.fetchFinalResponse(json, param);
                } else {
                    let text = 'Kindly choose one of the action you want to disable';
                    let response = await this.nlpHandler.fetchSlotJson(text, true, buttons);
                    json = await this.nlpHandler.fetchFinalResponse(response, param);
                    //return json;
                }

            }
            json.expected_entity = ['any'];
            return json;
        } catch (e) {
            throw new Error(e)
        }
    };
    async zabbixactionlistfunction(param) {
        let json = {};
        try {
            console.log("Inside actionlist function");
            // if (param.actionenable == "Action Enable" || param.USER_QUERY == "Action Enable") {
            let result = await this.syncUtil.enablezabbixactionlist(param);
            console.log(result)
            let buttons = [];

            for (let j = 0; j < result.length; j++) {
                console.log(result[j].name)
                //console.log(hostgroup[j].groupid)

                let button = {
                    "type": "postback",
                    "title": `Enable ${result[j].name}`,
                    "payload": `Enable ${result[j].name}`,
                    "text": ''
                };
                buttons.push(button);
            }
            // if (buttons.length === 0) {
            //     let response = Messages.messages().NLP.NO_COMPONENT_FOUND;
            //     json = await this.nlpHandler.fetchTextJson(response);
            //     json = await this.nlpHandler.fetchFinalResponse(json, param);
            // } else {
            //     let text = 'Kindly choose one of the action you want to enable';
            //     let response = await this.nlpHandler.fetchSlotJson(text, true, buttons);
            //     json = await this.nlpHandler.fetchFinalResponse(response, param);
            //     //return json;
            // }

            // } else if (param.actionenable == "Action Disable" || param.USER_QUERY == "Action Disable") {
            let result_disable = await this.syncUtil.disablezabbixactionlist(param);
            console.log(result_disable)
            // let buttons = [];

            for (let j = 0; j < result_disable.length; j++) {
                console.log(result_disable[j].name)
                //console.log(hostgroup[j].groupid)

                let button = {
                    "type": "postback",
                    "title": `Disable ${result_disable[j].name}`,
                    "payload": `Disable ${result_disable[j].name}`,
                    "text": ''
                };
                buttons.push(button);
            }
            if (buttons.length === 0) {
                let response = Messages.messages().NLP.NO_COMPONENT_FOUND;
                json = await this.nlpHandler.fetchTextJson(response);
                json = await this.nlpHandler.fetchFinalResponse(json, param);
            } else {
                let text = 'Kindly choose one of the action you want to enable / disable';
                let response = await this.nlpHandler.fetchSlotJson(text, true, buttons);
                json = await this.nlpHandler.fetchFinalResponse(response, param);
                //return json;
            }

            // }
            json.expected_entity = ['any'];
            return json;
        } catch (e) {
            throw new Error(e)
        }
    };

    /////////////////////////////zabbix action disable function///////////////////////////////////
    // async zabbixactiondisablefunction(param) {
    //     let json = {};
    //     try {
    // console.log("Inside zabbix action disable function");


    //      let result = await this.syncUtil.zabbixactiondisable(param);
    //      /*if(JSON.stringify(result).indexOf('groupids') === -1)
    //      {
    //         let response = result.error.data;

    //         json = await this.nlpHandler.fetchHtmlJson(response);
    //         json = await this.nlpHandler.fetchFinalResponse(json, param);

    //         return json;

    //      }
    //      else{*/
    //       let response = `<p>Action is successfully disabled.</p>`;

    //       json = await this.nlpHandler.fetchHtmlJson(response);
    //       json = await this.nlpHandler.fetchFinalResponse(json, param);

    //       return json;

    //     } catch (e) {
    //         throw new Error(e)
    //     }
    // };

    /////////////////////////////disable zabbix action list////////////////////////////////////////
    // async disableactionlistfunction(param) {
    //     let json = {};
    //     try {
    // console.log("Inside disable actionlist function");

    //         let result = await this.syncUtil.disablezabbixactionlist(param);
    //        console.log(result)
    //        let buttons = [];

    //        for (let j = 0; j <result.length; j++) {
    //         console.log(result[j].name)
    //         //console.log(hostgroup[j].groupid)

    //        let button = {
    //          "type": "postback",
    //          "title": result[j].name,
    //          "payload": `Action id is ${result[j].actionid}`,
    //          "text": ''
    //      };
    //      buttons.push(button);
    //  }
    //  if (buttons.length === 0) {
    //      let response = Messages.messages().NLP.NO_COMPONENT_FOUND;
    //      json = await this.nlpHandler.fetchTextJson(response);
    //      json = await this.nlpHandler.fetchFinalResponse(json, param);
    //  } else {
    //     let text ='Kindly choose one of the action you want to disable';
    //     let response = await this.nlpHandler.fetchSlotJson(text, true, buttons);
    //     json = await this.nlpHandler.fetchFinalResponse(response, param);
    //     //return json;
    //   }
    //     json.expected_entity = ['any'];
    //     return json;

    //     } catch (e) {
    //         throw new Error(e)
    //     }
    // };

    ///////////////////zabbix host enable function//////////////////
    async zabbixhostenablefunction(param) {
        let json = {};
        try {
            console.log("Inside zabbix host enable function");
            console.log(param.ANY);
            if (param.ANY) {
                console.log("got an entity", param.ANY);
                let hostname = param.any.toUpperCase();
                hostname = hostname.replace(" - ", "-");
                hostname = hostname.replace("- ", "-");
                hostname = hostname.replace(" -", "-");
                console.log(hostname)

                let [host] = await this.gethostidmongo(hostname);

                console.log(host)

                var hostid = host[0].hostid;

            }

            if (hostid == null) {
                let text = `"Sorry! Could not find any hostgroup named ${param.USER_QUERY}"`;
                let response = await this.nlpHandler.fetchTextJson(text);

                json = await this.nlpHandler.fetchFinalResponse(response, param);

                return json;
            }

            else {

                if (param.hostenable == "Host Enable" || param.hostenable == "HOST ENABLE") {
                    let result = await this.syncUtil.zabbixhostenable(hostid);
                    if (JSON.stringify(result).indexOf('hostids') === -1) {
                        let response = result.error.data;

                        json = await this.nlpHandler.fetchHtmlJson(response);
                        json = await this.nlpHandler.fetchFinalResponse(json, param);

                        return json;
                    }

                    else {
                        let response = `<p>Host is successfully enabled.</p>`;

                        json = await this.nlpHandler.fetchHtmlJson(response);
                        json = await this.nlpHandler.fetchFinalResponse(json, param);

                        return json;
                    }
                }
                else if (param.hostenable == "Host Disable" || param.hostenable == "HOST DISABLE") {
                    let result = await this.syncUtil.zabbixhostdisable(param);
                    if (JSON.stringify(result).indexOf('hostids') === -1) {
                        let response = result.error.data;

                        json = await this.nlpHandler.fetchHtmlJson(response);
                        json = await this.nlpHandler.fetchFinalResponse(json, param);

                        return json;

                    }
                    else {
                        let response = `<p>Host is successfully disabled.</p>`;

                        json = await this.nlpHandler.fetchHtmlJson(response);
                        json = await this.nlpHandler.fetchFinalResponse(json, param);

                        return json;
                    }
                }
            }
        } catch (e) {
            throw new Error(e)
        }
    };
    async hmshostnamefunction(param) {
        let json = {};
        try {
            console.log("Inside hmshostnamefunction function");
            param.ANY = param.any
            console.log(param.ANY, param.any);
            if (param.ANY) {
                console.log("got an entity", param.ANY);
                let hostname = param.any.toUpperCase();
                hostname = hostname.replace(" - ", "-");
                hostname = hostname.replace("- ", "-");
                hostname = hostname.replace(" -", "-");
                console.log(hostname)

                let [host] = await this.gethostidmongo(hostname);

                console.log(host)

                var hostid = host[0].hostid;

            }

            if (hostid == null) {
                let text = `"Sorry! Could not find any host named ${param.USER_QUERY}"`;
                let response = await this.nlpHandler.fetchTextJson(text);

                json = await this.nlpHandler.fetchFinalResponse(response, param);

                return json;
            }

            else {

                if (param.hostenable == "Host Enable" || param.hostenable == "HOST ENABLE") {
                    let result = await this.syncUtil.zabbixhostenable(hostid);
                    if (JSON.stringify(result).indexOf('hostids') === -1) {
                        let response = result.error.data;

                        json = await this.nlpHandler.fetchHtmlJson(response);
                        json = await this.nlpHandler.fetchFinalResponse(json, param);

                        return json;
                    }

                    else {
                        let response = `<p>Host is successfully enabled.</p>`;

                        json = await this.nlpHandler.fetchHtmlJson(response);
                        json = await this.nlpHandler.fetchFinalResponse(json, param);

                        return json;
                    }
                }
                else if (param.hostenable == "Host Disable" || param.hostenable == "HOST DISABLE") {
                    let result = await this.syncUtil.zabbixhostdisable(param);
                    if (JSON.stringify(result).indexOf('hostids') === -1) {
                        let response = result.error.data;

                        json = await this.nlpHandler.fetchHtmlJson(response);
                        json = await this.nlpHandler.fetchFinalResponse(json, param);

                        return json;

                    }
                    else {
                        let response = `<p>Host is successfully disabled.</p>`;

                        json = await this.nlpHandler.fetchHtmlJson(response);
                        json = await this.nlpHandler.fetchFinalResponse(json, param);

                        return json;
                    }
                }
                else {
                    // {"text": "I can assist you with the following options.", }
                    let buttons = [{ "type": "postback", "title": "CPU Utilization", "payload": "CPU Utilization" },
                    { "type": "postback", "title": "Top 5 Triggers", "payload": "Top Triggers" },
                    { "type": "postback", "title": "Memory Utilization", "payload": "Memory Utilization" },
                    { "type": "postback", "title": "Report Generation", "payload": "Report Generation" },
                    { "type": "postback", "title": "System Availability", "payload": "System Availability" }]
                    let text = `Please select from the following operations to perform`
                    let response = await this.nlpHandler.fetchSlotJson(text, true, buttons);
                    json = await this.nlpHandler.fetchFinalResponse(response, param);
                    return json;

                }
            }
        } catch (e) {
            throw new Error(e)
        }
    };

    ///////////////////////////host enable function////////////////////////////////
    async hostenablefunction(param) {
        let json = {};
        try {
            console.log("Inside handlehostenable function");
            if (param.hostenable == "Host Enable" || param.hostenable == "HOST ENABLE") {
                console.log("Inside HOST ENABLE ");
                console.log("result for host enable ", param.USER_QUERY);

                var data = param.USER_QUERY;
                console.log("result for host enable ", data);

                var exgroupid = (data.split(" ").splice(-1));
                console.log("result for host enable ", exgroupid);
                if (exgroupid.length <= 1) {
                    // exgroupid = exgroupid.replace(" - ", "-");
                    // exgroupid = exgroupid.replace(" -", "-");
                    // exgroupid = exgroupid.replace("- ", "-");
                }
                console.log("result for host enable ", exgroupid);

                let result = await this.syncUtil.gethostenable(exgroupid);
                console.log("result for host enable ", result);
                if (result == undefined) {
                    let response = result.error.data;

                    json = await this.nlpHandler.fetchHtmlJson(response);
                    json = await this.nlpHandler.fetchFinalResponse(json, param);
                }
                else {
                    let buttons = [];

                    for (let j = 0; j < result.length; j++) {
                        console.log(result[j].host)
                        //console.log(hostgroup[j].groupid)

                        let button = {
                            "type": "postback",
                            "title": result[j].host,
                            "payload": `host id is ${result[j].hostid}`,
                            "text": ''
                        };
                        buttons.push(button);
                    }
                    if (buttons.length === 0) {
                        let response = "No host found under selected hostgroup to enable"
                        json = await this.nlpHandler.fetchTextJson(response);
                        json = await this.nlpHandler.fetchFinalResponse(json, param);
                    } else {
                        //let text = Messages.messages().NLP.BOT_ACTION_COMPONENT;
                        let text = "Kindly click on one of the host to enable.";
                        let response = await this.nlpHandler.fetchSlotJson(text, true, buttons);

                        json = await this.nlpHandler.fetchFinalResponse(response, param);
                    }
                }
                json.expected_entity = ['any'];
                return json;
            } else if (param.hostenable == "Host Disable" || param.hostenable == "HOST DISABLE") {
                var data = param.USER_QUERY;
                var exgroupid = (data.split(" ").splice(-1));
                exgroupid = exgroupid.replace(" - ", "-");
                exgroupid = exgroupid.replace(" -", "-");
                exgroupid = exgroupid.replace("- ", "-");
                let result = await this.syncUtil.gethostdisable(exgroupid);
                let buttons = [];

                for (let j = 0; j < result.length; j++) {
                    console.log(result[j].host)
                    //console.log(hostgroup[j].groupid)

                    let button = {
                        "type": "postback",
                        "title": result[j].host,
                        "payload": `host id is ${result[j].hostid}`,
                        "text": ''
                    };
                    buttons.push(button);
                }
                if (buttons.length === 0) {
                    let response = "No host found under selected hostgroup to disable"
                    json = await this.nlpHandler.fetchTextJson(response);
                    json = await this.nlpHandler.fetchFinalResponse(json, param);
                } else {
                    //let text = Messages.messages().NLP.BOT_ACTION_COMPONENT;
                    let text = "Kindly click on one of the host to disable.";
                    let response = await this.nlpHandler.fetchSlotJson(text, true, buttons);

                    json = await this.nlpHandler.fetchFinalResponse(response, param);
                }
                json.expected_entity = ['any'];
                return json;
            }

            // let procedures = await this.webhookService.fetchhostenable();
            //         let buttons = [];
            //         for (let procedure of procedures) {
            //             let button = {
            //                 "type": "postback",
            //                 "title": CommonUtil.convertToTitleCase(procedure.hostname),
            //                 "payload": CommonUtil.convertToTitleCase(`host id is ${procedure.hostid}`),
            //                 "text": procedure.text
            //             };
            //             buttons.push(button);
            //         }

            //         if (buttons.length === 0) {
            //             let response = Messages.messages().NLP.NO_COMPONENT_FOUND;
            //             json = await this.nlpHandler.fetchTextJson(response);
            //             json = await this.nlpHandler.fetchFinalResponse(json, param);
            //         } else {
            //             //let text = Messages.messages().NLP.BOT_ACTION_COMPONENT;
            //             let text = "Kindly choose host from below list you want to enable.";
            //             let response = await this.nlpHandler.fetchSlotJson(text, true, buttons);

            //             json = await this.nlpHandler.fetchFinalResponse(response, param);
            //         }
            //     }
            //     else if(param.hostenable=="Host Disable" || param.USER_QUERY=="Host Disable"){
            //         let procedures = await this.webhookService.fetchhostdisable();
            //         let buttons = [];
            //         for (let procedure of procedures) {
            //             let button = {
            //                 "type": "postback",
            //                 "title": CommonUtil.convertToTitleCase(procedure.hostname),
            //                 "payload": CommonUtil.convertToTitleCase(`host id is ${procedure.hostid}`),
            //                 "text": procedure.text
            //             };
            //             buttons.push(button);
            //         }

            //         if (buttons.length === 0) {
            //             let response = Messages.messages().NLP.NO_COMPONENT_FOUND;
            //             json = await this.nlpHandler.fetchTextJson(response);
            //             json = await this.nlpHandler.fetchFinalResponse(json, param);
            //         } else {
            //             //let text = Messages.messages().NLP.BOT_ACTION_COMPONENT;
            //             let text = "Kindly choose host from below list you want to disable.";
            //             let response = await this.nlpHandler.fetchSlotJson(text, true, buttons);

            //             json = await this.nlpHandler.fetchFinalResponse(response, param);
            //         }}
            //         json.expected_entity = ['any'];
            //         return json;
        } catch (e) {
            //throw new Error(e)
            let text = "Sorry! Could not find any disabled/Enabled host.";
            let response = await this.nlpHandler.fetchtextJson(text);

            json = await this.nlpHandler.fetchFinalResponse(response, param);

            return json;

        }
    };

    async hostenablenamefunction(param) {
        let json = {};
        try {
            console.log("Inside handlehostenable function");
            let name = param.any;
            let groupobj = await this.webhookService.fetchGroupId(name);
            var exgroupid = groupobj[0].groupid;
            console.log("host enable group id", exgroupid);

            if (param.hostenable == "Host Enable" || param.hostenable == "HOST ENABLE") {
                // console.log("Inside HOST ENABLE ");
                console.log("result for host enable ", param.USER_QUERY);

                // param.any = group_id
                // var exgroupid = (data.split(" ").splice(-1));
                // if (exgroupid.length <= 1) {
                //     // exgroupid = exgroupid.replace(" - ", "-");
                //     // exgroupid = exgroupid.replace(" -", "-");
                //     // exgroupid = exgroupid.replace("- ", "-");
                // }
                console.log("result for host enable ", exgroupid);

                let result = await this.syncUtil.gethostenable(exgroupid);
                console.log("result for host enable ", result);
                if (result == undefined) {
                    let response = result.error.data;

                    json = await this.nlpHandler.fetchHtmlJson(response);
                    json = await this.nlpHandler.fetchFinalResponse(json, param);
                }
                else {
                    let buttons = [];

                    for (let j = 0; j < result.length; j++) {
                        console.log(result[j].host)
                        //console.log(hostgroup[j].groupid)

                        let button = {
                            "type": "postback",
                            "title": result[j].host,
                            "payload": `host id is ${result[j].hostid}`,
                            "text": ''
                        };
                        buttons.push(button);
                    }
                    if (buttons.length === 0) {
                        let response = "No host found under selected hostgroup to enable"
                        json = await this.nlpHandler.fetchTextJson(response);
                        json = await this.nlpHandler.fetchFinalResponse(json, param);
                    } else {
                        //let text = Messages.messages().NLP.BOT_ACTION_COMPONENT;
                        let text = "Kindly click on one of the host to enable.";
                        let response = await this.nlpHandler.fetchSlotJson(text, true, buttons);

                        json = await this.nlpHandler.fetchFinalResponse(response, param);
                    }
                }
                json.expected_entity = ['any'];
                return json;
            } else if (param.hostenable == "Host Disable" || param.hostenable == "HOST DISABLE") {
                // var data = param.USER_QUERY;
                // var exgroupid = (data.split(" ").splice(-1));
                // exgroupid = exgroupid.replace(" - ", "-");
                // exgroupid = exgroupid.replace(" -", "-");
                // exgroupid = exgroupid.replace("- ", "-");
                let result = await this.syncUtil.gethostdisable(exgroupid);
                let buttons = [];

                for (let j = 0; j < result.length; j++) {
                    console.log(result[j].host)
                    //console.log(hostgroup[j].groupid)

                    let button = {
                        "type": "postback",
                        "title": result[j].host,
                        "payload": `host id is ${result[j].hostid}`,
                        "text": ''
                    };
                    buttons.push(button);
                }
                if (buttons.length === 0) {
                    let response = "No host found under selected hostgroup to disable"
                    json = await this.nlpHandler.fetchTextJson(response);
                    json = await this.nlpHandler.fetchFinalResponse(json, param);
                } else {
                    //let text = Messages.messages().NLP.BOT_ACTION_COMPONENT;
                    let text = "Kindly click on one of the host to disable.";
                    let response = await this.nlpHandler.fetchSlotJson(text, true, buttons);

                    json = await this.nlpHandler.fetchFinalResponse(response, param);
                }
                json.expected_entity = ['any'];
                return json;
            }

            // let procedures = await this.webhookService.fetchhostenable();
            //         let buttons = [];
            //         for (let procedure of procedures) {
            //             let button = {
            //                 "type": "postback",
            //                 "title": CommonUtil.convertToTitleCase(procedure.hostname),
            //                 "payload": CommonUtil.convertToTitleCase(`host id is ${procedure.hostid}`),
            //                 "text": procedure.text
            //             };
            //             buttons.push(button);
            //         }

            //         if (buttons.length === 0) {
            //             let response = Messages.messages().NLP.NO_COMPONENT_FOUND;
            //             json = await this.nlpHandler.fetchTextJson(response);
            //             json = await this.nlpHandler.fetchFinalResponse(json, param);
            //         } else {
            //             //let text = Messages.messages().NLP.BOT_ACTION_COMPONENT;
            //             let text = "Kindly choose host from below list you want to enable.";
            //             let response = await this.nlpHandler.fetchSlotJson(text, true, buttons);

            //             json = await this.nlpHandler.fetchFinalResponse(response, param);
            //         }
            //     }
            //     else if(param.hostenable=="Host Disable" || param.USER_QUERY=="Host Disable"){
            //         let procedures = await this.webhookService.fetchhostdisable();
            //         let buttons = [];
            //         for (let procedure of procedures) {
            //             let button = {
            //                 "type": "postback",
            //                 "title": CommonUtil.convertToTitleCase(procedure.hostname),
            //                 "payload": CommonUtil.convertToTitleCase(`host id is ${procedure.hostid}`),
            //                 "text": procedure.text
            //             };
            //             buttons.push(button);
            //         }

            //         if (buttons.length === 0) {
            //             let response = Messages.messages().NLP.NO_COMPONENT_FOUND;
            //             json = await this.nlpHandler.fetchTextJson(response);
            //             json = await this.nlpHandler.fetchFinalResponse(json, param);
            //         } else {
            //             //let text = Messages.messages().NLP.BOT_ACTION_COMPONENT;
            //             let text = "Kindly choose host from below list you want to disable.";
            //             let response = await this.nlpHandler.fetchSlotJson(text, true, buttons);

            //             json = await this.nlpHandler.fetchFinalResponse(response, param);
            //         }}
            //         json.expected_entity = ['any'];
            //         return json;
        } catch (e) {
            //throw new Error(e)
            let text = "Sorry! Could not find any disabled/Enabled host.";
            let response = await this.nlpHandler.fetchtextJson(text);

            json = await this.nlpHandler.fetchFinalResponse(response, param);

            return json;

        }
    };

    ////////////////////zabbix host disable function//////////////////
    // async zabbixhostdisablefunction(param) {
    //     let json = {};
    //     try {
    // console.log("Inside zabbix host disable function");


    //      let result = await this.syncUtil.zabbixhostdisable(param);
    //      if(JSON.stringify(result).indexOf('hostids') === -1)
    //      {
    //         let response = result.error.data;

    //         json = await this.nlpHandler.fetchHtmlJson(response);
    //         json = await this.nlpHandler.fetchFinalResponse(json, param);

    //         return json;

    //      }
    //      else{
    //       let response = `<p>Host is successfully disabled.</p>`;

    //       json = await this.nlpHandler.fetchHtmlJson(response);
    //       json = await this.nlpHandler.fetchFinalResponse(json, param);

    //       return json;
    //      }
    //     } catch (e) {
    //         throw new Error(e)
    //     }
    // };

    /////////////////////host disable list function////////////
    // async hostdisablefunction(param) {
    //     let json = {};
    //     try {
    // console.log("Inside handlehostdisable function");
    // let procedures = await this.webhookService.fetchhostdisable();
    //         //Here Handle Custom Handling for Components,
    //         // Like Browser Clean, Temp Clean etc.(Within Loop)
    //         let buttons = [];
    //         for (let procedure of procedures) {
    //             let button = {
    //                 "type": "postback",
    //                 "title": CommonUtil.convertToTitleCase(procedure.hostname),
    //                 "payload": CommonUtil.convertToTitleCase(`enabled host id is ${procedure.hostid}`),
    //                 "text": procedure.text
    //             };
    //             buttons.push(button);
    //         }

    //         if (buttons.length === 0) {
    //             let response = Messages.messages().NLP.NO_COMPONENT_FOUND;
    //             json = await this.nlpHandler.fetchTextJson(response);
    //             json = await this.nlpHandler.fetchFinalResponse(json, param);
    //         } else {
    //             //let text = Messages.messages().NLP.BOT_ACTION_COMPONENT;
    //             let text = "Kindly choose host from below list you want to disable.";
    //             let response = await this.nlpHandler.fetchSlotJson(text, true, buttons);

    //             json = await this.nlpHandler.fetchFinalResponse(response, param);
    //         }
    //         json.expected_entity = ['any'];
    //         return json;

    // //         let result = await this.syncUtil.gethostgroup(param);
    // //        console.log(result)
    // //        let buttons = [];

    // //        for (let j = 0; j <result.length; j++) {
    // //         console.log(result[j].name)
    // //         //console.log(hostgroup[j].groupid)

    // //        let button = {
    // //          "type": "postback",
    // //          "title": result[j].name,
    // //          "payload": result[j].name,
    // //          "text": ''
    // //      };
    // //      buttons.push(button);
    // //  }
    // //  if (buttons.length === 0) {
    // //      let response = Messages.messages().NLP.NO_COMPONENT_FOUND;
    // //      json = await this.nlpHandler.fetchTextJson(response);
    // //      json = await this.nlpHandler.fetchFinalResponse(json, param);
    // //  } else {
    // //      //let text = Messages.messages().NLP.BOT_ACTION_COMPONENT;
    // //      let text = "Either choose hostgroup from below list or enter the name of the hostgroup for which you want to fetch details.";
    // //      let response = await this.nlpHandler.fetchSlotJson(text, true, buttons);

    // //      json = await this.nlpHandler.fetchFinalResponse(response, param);
    // //  }

    // //      return json;

    //     } catch (e) {
    //         //throw new Error(e)
    //         let text = "Sorry! Could not find any disabled host.";
    //             let response = await this.nlpHandler.fetchtextJson(text);

    //             json = await this.nlpHandler.fetchFinalResponse(response, param);

    //         return json;

    //     }
    // };

    ///////////////////active users function/////////////////////
    async activeusersfunction(param) {
        let json = {};
        try {
            console.log("Inside active users function");
            let [activeuser] = await this.getactiveusermongo();

            // console.log("Users are ",activeuser)
            if (activeuser == null) {
                let text = `"Sorry! Could not find any active users"`;
                let response = await this.nlpHandler.fetchTextJson(text);

                json = await this.nlpHandler.fetchFinalResponse(response, param);

                return json;

            }
            else {
                let dataRecord = []; //User Record
                let data = '';
                // console.log("activeuser.length", activeuser.length)
                for (let k = 0; k < activeuser.length; k++) {
                    let te = new Date();
                    let final1 = Math.abs(te.getTime() / 1000 - (30 * 24 * 60 * 60));
                    let [lastlog] = await this.getlastlog(activeuser[k].Userid);
                    console.log("last login user , final", lastlog[0].logintime, final1);
                    if (lastlog[0].logintime > final1) {
                        // console.log(activeuser[k].Userid, lastlog[0].logintime)
                        var abc = await this.insertuser(activeuser[k].userName, activeuser[k].usertype, lastlog[0].logintime);
                    }
                }

                let [newlastlog] = await this.getnewlastlog();
                console.log("newlastlog is", newlastlog)


                for (let j = 0; j < 1; j++) {


                    //let [lastlog] = await this.getlastlog(activeuser[j].Userid);
                    //if(lastlog && lastlog.length > 0){
                    //let lastlogin = lastlog[0].logintime;
                    let lastlogin = newlastlog[0].logintime;
                    if (lastlogin !== "Never logged in") {
                        var d2 = Math.abs(lastlogin * 1000);
                        var timeValue = d2;
                        var d3 = new Date(+timeValue);
                        var d1 = new Date(d3).toLocaleString(undefined, { timeZone: 'Asia/Kolkata' });
                        // var d1 = new Date(d3).toLocaleString( { timeZone: 'Asia/Kolkata' });

                    } else {
                        var d1 = "Never logged in";
                    }
                    // }
                    // else{
                    //     var d1 = "Never logged in";
                    // }
                    if (newlastlog[j].type == '1') {
                        let type = 'User';
                        data = data + `<tr><td>${newlastlog[j].userName}</td><td>${type}</td><td>${d1}</td></tr>`;
                    } else if (newlastlog[j].usertype == '2') {
                        let type = 'Admin';
                        data = data + `<tr><td>${newlastlog[j].userName}</td><td>${type}</td><td>${d1}</td></tr>`;
                    } else if (activeuser[j].usertype == '3') {
                        let type = ' Super Admin';
                        data = data + `<tr><td>${newlastlog[j].userName}</td><td>${type}</td><td>${d1}</td></tr>`;
                    }
                    //      else {
                    //          //console.log("iam in else loop")
                    //          if(activeuser[j].usertype=='1'){
                    //              let type = 'User';
                    //              data = data+`<tr><td>${activeuser[j].username}</td><td>${type}</td><td>Never Logged In</td></tr>`;
                    //             }else if(activeuser[j].usertype=='2'){
                    //             let type = 'Admin';
                    //             data = data+`<tr><td>${activeuser[j].username}</td><td>${type}</td><td>Never Logged In</td></tr>`;
                    //              }else if(activeuser[j].usertype=='3'){
                    //              let type = ' Super Admin';
                    //              data = data+`<tr><td>${activeuser[j].username}</td><td>${type}</td><td>Never Logged In</td></tr>`;
                    //         }
                    //  }    
                }
                for (let j = 1; j < newlastlog.length; j++) {
                    //     let result = await this.syncUtil.auditlog(activeuser[j].Userid);

                    //  if(result[0] !==undefined){
                    //        //console.log("iam in if loop",activeuser[j].username, result[0])
                    //        let lastlogin = result[0].clock;
                    //let [lastlog] = await this.getlastlog(activeuser[j].Userid);
                    //if(lastlog && lastlog.length > 0){
                    let lastlogin = newlastlog[j].logintime;
                    if (lastlogin !== "Never logged in") {
                        var d2 = Math.abs(lastlogin * 1000);
                        var timeValue = d2;
                        var d3 = new Date(+timeValue);
                        // var d1 = new Date(d3).toLocaleString( { timeZone: 'Asia/Kolkata' });
                        var d1 = new Date(d3).toLocaleString(undefined, { timeZone: 'Asia/Kolkata' });

                    }
                    else {
                        var d1 = "Never logged in";
                    }
                    // } else{
                    //         var d1= "Never logged in";
                    // }
                    if (newlastlog[j].type == '1') {
                        let type = 'User';
                        data = data + `<tr><td>${newlastlog[j].userName}</td><td>${type}</td><td>${d1}</td></tr>`;
                    } else if (newlastlog[j].type == '2') {
                        let type = 'Admin';
                        data = data + `<tr><td>${newlastlog[j].userName}</td><td>${type}</td><td>${d1}</td></tr>`;
                    } else if (newlastlog[j].type == '3') {
                        let type = ' Super Admin';
                        data = data + `<tr><td>${newlastlog[j].userName}</td><td>${type}</td><td>${d1}</td></tr>`;
                    }
                    //     else {
                    //         //console.log("iam in else loop")
                    //         if(activeuser[j].usertype=='1'){
                    //             let type = 'User';
                    //             data = data+`<tr><td>${activeuser[j].username}</td><td>${type}</td><td>Never Logged In</td></tr>`;
                    //            }else if(activeuser[j].usertype=='2'){
                    //            let type = 'Admin';
                    //            data = data+`<tr><td>${activeuser[j].username}</td><td>${type}</td><td>Never Logged In</td></tr>`;
                    //             }else if(activeuser[j].usertype=='3'){
                    //             let type = ' Super Admin';
                    //             data = data+`<tr><td>${activeuser[j].username}</td><td>${type}</td><td>Never Logged In</td></tr>`;
                    //        }
                    // }    
                }

                let html = `
               <style>
               table.tickets_status, .tickets_status td, .tickets_status th { 
               border: 1px solid #ddd;
               text-align: left;
               }
               
               table.tickets_status {
               border-collapse: collapse;
               width: 235px;
               margin: 2px;
               }
               
               .tickets_status th, .tickets_status td{
               padding: 8px;
               }
               </style>
               <p>Please Find list of active users.</p>
               <table class="tickets_status">
               <tr>
               <th>Username</th>
               <th>User Type</th>
               <th>Last Login</th>
               </tr>
               ${data}
               </table>`;


                json = await this.nlpHandler.fetchHtmlJson(html);
                json = await this.nlpHandler.fetchFinalResponse(json, param);
                return json;
            }
        } catch (e) {
            //throw new Error(e)
            console.log(e)
            let text = `"Sorry! Could not find any active users"`;
            let response = await this.nlpHandler.fetchTextJson(text);

            json = await this.nlpHandler.fetchFinalResponse(response, param);

            return json;
        }
    };

    ////////////////get active user mongo function////////////
    async getactiveusermongo() {
        let req = this.webhookService.fetchactiveuserDetails(

        );
        return Promise.all([req]);
    }

    async getlastlog(userid) {
        let req = this.webhookService.fetchlastlog(userid

        );
        return Promise.all([req]);
    }

    async getnewlastlog() {
        let req = this.webhookService.fetchnewlastlog(

        );
        return Promise.all([req]);
    }

    async getitemid(triggerid) {
        let req = this.webhookService.fetchitemdetails(triggerid

        );
        return Promise.all([req]);
    }

    async gethostname(hostid) {
        let req = this.webhookService.fetchhostnamedetails(hostid

        );
        return Promise.all([req]);
    }


    ////////////////////////////////handle media list function/////////////////////////////////////////
    async handlemedialistfunction(param) {
        let json = {};
        try {
            console.log("Inside handlemedialist function");
            if (param.media == "Media Enable" || param.media == "MEDIA ENABLE" || param.USER_QUERY == "Media Enable") {

                let result = await this.syncUtil.getzabbixmedia();
                console.log(result)
                let buttons = [];

                for (let j = 0; j < result.length; j++) {
                    console.log(result[j].name)
                    //console.log(hostgroup[j].groupid)

                    let button = {
                        "type": "postback",
                        "title": result[j].name,
                        "payload": `Mediatype is ${result[j].name}`,
                        "text": ''
                    };
                    buttons.push(button);
                }
                if (buttons.length === 0) {
                    //let response = Messages.messages().NLP.NO_COMPONENT_FOUND;
                    let response = "Sorry! Could not find Media Type to enable.";
                    json = await this.nlpHandler.fetchTextJson(response);
                    json = await this.nlpHandler.fetchFinalResponse(json, param);
                } else {
                    let text = 'Kindly choose one of the media you want to Enable.';
                    let response = await this.nlpHandler.fetchSlotJson(text, true, buttons);

                    json = await this.nlpHandler.fetchFinalResponse(response, param);
                }
            }
            else if (param.media == "Media Disable" || param.USER_QUERY == "Media Disable" || param.media == "MEDIA DISABLE") {
                let result = await this.syncUtil.getzabbixmediadisablelist();
                console.log(result)
                let buttons = [];

                for (let j = 0; j < result.length; j++) {
                    console.log(result[j].name)
                    //console.log(hostgroup[j].groupid)

                    let button = {
                        "type": "postback",
                        "title": result[j].name,
                        "payload": `Mediatype is ${result[j].name}`,
                        "text": ''
                    };
                    buttons.push(button);
                }
                if (buttons.length === 0) {
                    //let response = Messages.messages().NLP.NO_COMPONENT_FOUND;
                    let response = "Sorry! Could not find Media Type to disable.";
                    json = await this.nlpHandler.fetchTextJson(response);
                    json = await this.nlpHandler.fetchFinalResponse(json, param);
                } else {
                    let text = 'Kindly choose one of the media you want to Disable.';
                    let response = await this.nlpHandler.fetchSlotJson(text, true, buttons);

                    json = await this.nlpHandler.fetchFinalResponse(response, param);
                }
            }

            json.expected_entity = ['any'];
            return json;

        } catch (e) {
            throw new Error(e)
        }
    };

    ///////////////////////////////////zabbix media disable function/////////////////////////////////
    async zabbixmediadisablefunction(param) {
        let json = {};
        try {
            console.log("Inside zabbix media disable function");
            if (param.media === "Media Enable" || param.media === "MEDIA ENABLE") {
                let mode = "ENABLE";
                var name = param.any;
                if (!name) {
                    let userquery = param.USER_QUERY.toUpperCase();
                    var ret = userquery.replace('MEDIATYPE IS ', '');
                    console.log(ret);
                    name = ret
                }
                let actionobj = await this.webhookService.fetchMediaId(mode, name);
                let actionid = actionobj[0].mediatypeid
                param.any = actionid

                let result = await this.syncUtil.zabbixmediaenable(param);
                if (JSON.stringify(result).indexOf('mediatypeids') === -1) {
                    let response = result.error.data;

                    json = await this.nlpHandler.fetchHtmlJson(response);
                    json = await this.nlpHandler.fetchFinalResponse(json, param);

                }
                else {
                    let response = `<p>Mediatype is successfully enabled.</p>`;

                    json = await this.nlpHandler.fetchHtmlJson(response);
                    json = await this.nlpHandler.fetchFinalResponse(json, param);

                }

            }
            else if (param.media === "Media Disable" || param.media === "MEDIA DISABLE") {
                let mode = "DISABLE";
                var name = param.any;
                if (!name) {
                    let userquery = param.USER_QUERY.toUpperCase();
                    var ret = userquery.replace('MEDIATYPE IS ', '');
                    console.log(ret);
                    name = ret
                }

                let actionobj = await this.webhookService.fetchMediaId(mode, name);
                let actionid = actionobj[0].mediatypeid
                param.any = actionid


                let result = await this.syncUtil.zabbixmediadisable(param);
                if (JSON.stringify(result).indexOf('mediatypeids') === -1) {
                    let response = result.error.data;

                    json = await this.nlpHandler.fetchHtmlJson(response);
                    json = await this.nlpHandler.fetchFinalResponse(json, param);

                }
                else {
                    let response = `<p>Mediatype is successfully disabled.</p>`;

                    json = await this.nlpHandler.fetchHtmlJson(response);
                    json = await this.nlpHandler.fetchFinalResponse(json, param);
                }
            }
            return json;
        } catch (e) {
            throw new Error(e)
        }
    };

    /////////////////handle media disable list function///////////////////
    async handlemediadisablelistfunction(param) {
        let json = {};
        try {
            console.log("Inside handlemediadisablelist function");

            let result = await this.syncUtil.getzabbixmediadisablelist();
            console.log(result)
            let buttons = [];

            for (let j = 0; j < result.length; j++) {
                console.log(result[j].name)
                //console.log(hostgroup[j].groupid)

                let button = {
                    "type": "postback",
                    "title": result[j].name,
                    "payload": `Mediatype id is ${result[j].mediatypeid}`,
                    "text": ''
                };
                buttons.push(button);
            }
            if (buttons.length === 0) {
                //let response = Messages.messages().NLP.NO_COMPONENT_FOUND;
                let response = "Sorry! Could not find Media Type to disable.";
                json = await this.nlpHandler.fetchTextJson(response);
                json = await this.nlpHandler.fetchFinalResponse(json, param);
            } else {
                let text = 'Kindly choose one of the media you want to Disable.';
                let response = await this.nlpHandler.fetchSlotJson(text, true, buttons);

                json = await this.nlpHandler.fetchFinalResponse(response, param);
            }
            json.expected_entity = ['any'];
            return json;

        } catch (e) {
            throw new Error(e)
        }
    };
    /////////////////handle web monitoring///////////////////
    async handlewebmonitoring(param) {
        let json = {};
        try {
            console.log("Inside handleweb monitoring function");
            let url = param.url;
            console.log("url is", url)
            let [webid] = await this.getwebid();
            console.log("webid is", webid)
            //let id = webid[0].id;
            if (webid && webid.length > 0) {
                var id1 = webid[0].id;
                id1++;
                var id = id1;
                console.log("id is", id)
                let abc = await this.updateweb(url, id);
                let response = "Kindly provide status code for monitoring.";
                json = await this.nlpHandler.fetchTextJson(response);
                json = await this.nlpHandler.fetchFinalResponse(json, param);
                return json;
            }

            else {
                let id = '1';
                let abc = await this.updateweb(url, id);
                let response = "Kindly provide status code for monitoring.";
                json = await this.nlpHandler.fetchTextJson(response);
                json = await this.nlpHandler.fetchFinalResponse(json, param);
                return json;
            }

        } catch (e) {
            throw new Error(e)
        }
    };

    async getwebid(weburl) {
        let req = this.webhookService.fetchwebDetails(
            weburl
        );
        return Promise.all([req]);
    }

    async updateweb(url, id) {
        let req = this.webhookService.updateweb(
            url, id
        );
        return Promise.all([req]);
    }

    async insertuser(user, type, logintime) {
        let req = this.webhookService.insertuser(
            user, type, logintime
        );
        return Promise.all([req]);
    }

    ///////////////handle web monitoring code//////////////
    async handlewebmonitoringcode(param) {
        let json = {};
        try {
            console.log("Inside handleweb monitoring status code function");
            let code = param.statuscode;
            console.log("code is", code)
            let weburl = param.url
            console.log('weburl', weburl);

            let [webid] = await this.getwebid(weburl);
            console.log("webid is", webid)
            console.log("result", webid[0].id)
            let id = webid[0].id;
            let url = webid[0].url;
            let webcode = await this.updatewebcode(code, id, url);
            console.log(webcode)
            let response = `<p>Kindly provide hostname for monitoring as given examples.<br>1. Create web scenario for <b>hostname</b><br>2. Delete web scenario for <b>hostname</b>.</p>`;
            json = await this.nlpHandler.fetchHtmlJson(response);
            json = await this.nlpHandler.fetchFinalResponse(json, param);
            // json.expected_entity = ['any'];
            return json;

        } catch (e) {
            throw new Error(e)
        }
    };

    async updatewebcode(code, id, url) {
        let req = this.webhookService.updatewebcode(
            code, id, url
        );
        return Promise.all([req]);
    }

    ///////////////handle web monitoring hostname////////
    async handlewebmonitoringhostname(param) {
        let json = {};
        try {
            console.log("Inside handleweb monitoring hostname function");

            let hostname = param.any.toUpperCase();
            let weburl = param.url;
            //let hostname = param.any.toUpperCase();
            //   else{let hostname = param.USER_QUERY.toUpperCase();
            //   }
            console.log("hostname is", hostname)
            let [webid] = await this.getwebid(weburl);
            console.log("webid is", webid)
            console.log("result", webid[0].id)
            let id = webid[0].id;
            let url = webid[0].url;
            let code = webid[0].code;
            let webhost = await this.updatewebhost(code, id, url, hostname);
            console.log(webhost)
            let [hostidweb] = await this.gethostidweb(hostname);
            let hostid = hostidweb[0].hostid;
            console.log("hostid is", hostid)
            if (param.web == "Web scenario creation") {
                let result = await this.syncUtil.webscenario(url, code, hostid);
                if (JSON.stringify(result).indexOf('httptestids') === -1) {
                    let response = result.error.data;

                    json = await this.nlpHandler.fetchHtmlJson(response);
                    json = await this.nlpHandler.fetchFinalResponse(json, param);

                    return json;

                }
                else {
                    let response = `<p>Web scenario is successfully created</p>`;

                    json = await this.nlpHandler.fetchHtmlJson(response);
                    json = await this.nlpHandler.fetchFinalResponse(json, param);

                    return json;
                }
            }
            if (param.web == "Web scenario deletion") {
                let result = await this.syncUtil.webscenarioget(url, hostid);
                console.log("web scenario get", result[0].httptestid)
                if (JSON.stringify(result).indexOf('httptestid') === -1) {
                    let response = result.error.data;

                    json = await this.nlpHandler.fetchHtmlJson(response);
                    json = await this.nlpHandler.fetchFinalResponse(json, param);

                    return json;

                }
                else {
                    let result1 = await this.syncUtil.webscenariodeletion(result[0].httptestid);
                    if (JSON.stringify(result1).indexOf('httptestids') === -1) {
                        let response = result1.error.data;

                        json = await this.nlpHandler.fetchHtmlJson(response);
                        json = await this.nlpHandler.fetchFinalResponse(json, param);

                        return json;
                    }
                    else {
                        let response = `<p>Web scenario is successfully deleted</p>`;

                        json = await this.nlpHandler.fetchHtmlJson(response);
                        json = await this.nlpHandler.fetchFinalResponse(json, param);

                        return json;
                    }
                }
            }
        } catch (e) {
            //throw new Error(e)
            let response = `<p>Provided information is not correct.</p>`;

            json = await this.nlpHandler.fetchHtmlJson(response);
            json = await this.nlpHandler.fetchFinalResponse(json, param);

            return json;
        }
    };

    async updatewebhost(code, id, url, hostname) {
        let req = this.webhookService.updatewebhost(
            code, id, url, hostname
        );
        return Promise.all([req]);
    }

    //////////////fetch hostid for web/////////////
    async gethostidweb(hostname) {
        let req = this.webhookService.fetchhostidwebDetails(
            hostname
        );
        return Promise.all([req]);
    }

    ////////////////////handle problem events/////////////////
    async handleproblemevents(param) {
        let json = {};
        try {
            console.log("Inside problem events function");
            console.log(param.USER_QUERY)

            if (param.USER_QUERY == "Recent 5 Alerts") {
                let te = new Date();
                let final = Math.abs(te.getTime() / 1000);
                let final1 = Math.abs(te.getTime() / 1000 - (1 * 24 * 60 * 60));
                let result = await this.syncUtil.geteventlist(final, final1);
                let dataRecord = []; //User Record
                let data;

                for (let j = result.length - 1; j > result.length - 2; j--) {
                    console.log("recent 5 alerts ", j, result.length, result[j])
                    await this.syncUtil.triggersync(result[j].objectid);
                    let [result2] = await this.getitemid(result[j].objectid);
                    if (result2[0].itemid !== "not found") {
                        let result3 = await this.syncUtil.itemsync(result2[0].itemid);
                        let [result4] = await this.gethostname(result3[0].hostid);
                        if (result4.length > 0) {
                            var hostname = result4[0].hostname;
                            console.log("itemid is", result4[0].hostname);
                        }
                        else {
                            var hostname = "Hostname not found";
                            console.log("inside else log", hostname)
                        }
                    }
                    else {
                        var hostname = "Hostname not found";
                    }
                    var d2 = Math.abs(result[j].clock * 1000);
                    var timeValue = d2;
                    var d3 = new Date(+timeValue);
                    var d1 = new Date(d3).toLocaleString(undefined, { timeZone: 'Asia/Kolkata' });
                    data = `<tr><td>${result[j].name}</td><td>${result[j].severity}</td><td>${d1}</td><td>${hostname}</td></tr>`;
                    console.log(data)
                }

                for (let j = result.length - 2; j > result.length - 6; j--) {
                    if (j == -1) {
                        break;
                    }
                    console.log("j data ", j, result.length);
                    console.log("data ", j, result[j]);

                    await this.syncUtil.triggersync(result[j].objectid);

                    let [result2] = await this.getitemid(result[j].objectid);
                    if (result2[0].itemid !== "not found") {
                        let result3 = await this.syncUtil.itemsync(result2[0].itemid);
                        let [result4] = await this.gethostname(result3[0].hostid);
                        console.log(result3, result4);

                        if (result4.length > 0) {
                            var hostname = result4[0].hostname;
                        }
                        else {
                            var hostname = "Hostname not found";
                        }

                    }
                    else {
                        var hostname = "Hostname not found";
                    }
                    var d2 = Math.abs(result[j].clock * 1000);
                    var timeValue = d2;
                    //console.log(timeValue)
                    var d3 = new Date(+timeValue);
                    var d1 = new Date(d3).toLocaleString(undefined, { timeZone: 'Asia/Kolkata' });
                    data = data + `<tr><td>${result[j].name}</td><td>${result[j].severity}</td><td>${d1}</td><td>${hostname}</td></tr>`;
                    console.log("---------------", data)
                }

                let html = `
            <style>
            table.tickets_status, .tickets_status td, .tickets_status th { 
            border: 1px solid #ddd;
            text-align: left;
            }
            
            table.tickets_status {
            border-collapse: collapse;
            width: 235px;
            margin: 2px;
            }
            
            .tickets_status th, .tickets_status td{
            padding: 8px;
            }
            </style>
            <p>Please Find Problem Event Details</p>
            <table class="tickets_status">
            <tr>
            <th>Problem</th>
            <th>Severity</th>
            <th>Occurance Time</th>
            <th>Hostname</th>
            
            
            </tr>
            ${data}
            </table>`;


                json = await this.nlpHandler.fetchHtmlJson(html);
                json = await this.nlpHandler.fetchFinalResponse(json, param);
                return json;
            }
            else if (param.USER_QUERY == "Recent 10 Alerts") {
                console.log("recent 10 alerts")
                let te = new Date();
                console.log(te)
                let final = Math.abs(te.getTime() / 1000);
                console.log(final)
                let final1 = Math.abs(te.getTime() / 1000 - (8 * 24 * 60 * 60));
                console.log(final1)
                let result = await this.syncUtil.geteventlist(final, final1);
                let dataRecord = []; //User Record
                let data;

                for (let j = result.length - 1; j > result.length - 2; j--) {
                    var d2 = Math.abs(result[j].clock * 1000);
                    var timeValue = d2;
                    console.log(timeValue)
                    var d3 = new Date(+timeValue);
                    var d1 = new Date(d3).toLocaleString(undefined, { timeZone: 'Asia/Kolkata' });
                    data = `<tr><td>${result[j].name}</td><td>${result[j].severity}</td><td>${d1}</td></tr>`;
                }
                for (let j = result.length - 2; j > result.length - 11; j--) {
                    var d2 = Math.abs(result[j].clock * 1000);
                    var timeValue = d2;
                    console.log(timeValue)
                    var d3 = new Date(+timeValue);
                    var d1 = new Date(d3).toLocaleString(undefined, { timeZone: 'Asia/Kolkata' });
                    data = data + `<tr><td>${result[j].name}</td><td>${result[j].severity}</td><td>${d1}</td></tr>`;
                }
                let html = `
            <style>
            table.tickets_status, .tickets_status td, .tickets_status th { 
            border: 1px solid #ddd;
            text-align: left;
            }
            
            table.tickets_status {
            border-collapse: collapse;
            width: 235px;
            margin: 2px;
            }
            
            .tickets_status th, .tickets_status td{
            padding: 8px;
            }
            </style>
            <p>Please Find Problem Event Details</p>
            <table class="tickets_status">
            <tr>
            <th>Problem</th>
            <th>Severity</th>
            <th>Occurance Time</th>
            
            
            </tr>
            ${data}
            </table>`;


                json = await this.nlpHandler.fetchHtmlJson(html);
                json = await this.nlpHandler.fetchFinalResponse(json, param);
                return json;

            }
            else if (param.USER_QUERY == "Recent 15 Alerts") {
                let te = new Date();
                console.log(te)
                let final = Math.abs(te.getTime() / 1000);
                console.log(final)
                let final1 = Math.abs(te.getTime() / 1000 - (15 * 24 * 60 * 60));
                console.log(final1)
                let result = await this.syncUtil.getev
                entlist(final, final1);
                // console.log(result)
                let dataRecord = []; //User Record
                let data;

                for (let j = result.length - 1; j > result.length - 2; j--) {
                    var d2 = Math.abs(result[j].clock * 1000);
                    var timeValue = d2;
                    console.log("time values 1", timeValue)
                    var d3 = new Date(+timeValue);
                    var d1 = new Date(d3).toLocaleString(undefined, { timeZone: 'Asia/Kolkata' });
                    data = `<tr><td>${result[j].name}</td><td>${result[j].severity}</td><td>${d1}</td></tr>`;
                }
                for (let j = result.length - 2; j > result.length - 16; j--) {
                    if (j == -1) {
                        break;
                    }
                    console.log(result.length, j, result[j])
                    var d2 = Math.abs(result[j].clock * 1000);
                    var timeValue = d2;
                    console.log(timeValue)
                    var d3 = new Date(+timeValue);
                    var d1 = new Date(d3).toLocaleString(undefined, { timeZone: 'Asia/Kolkata' });
                    data = data + `<tr><td>${result[j].name}</td><td>${result[j].severity}</td><td>${d1}</td></tr>`;
                }
                let html = `
            <style>
            table.tickets_status, .tickets_status td, .tickets_status th { 
            border: 1px solid #ddd;
            text-align: left;
            }
            
            table.tickets_status {
            border-collapse: collapse;
            width: 235px;
            margin: 2px;
            }
            
            .tickets_status th, .tickets_status td{
            padding: 8px;
            }
            </style>
            <p>Please Find Problem Event Details</p>
            <table class="tickets_status">
            <tr>
            <th>Problem</th>
            <th>Severity</th>
            <th>Occurance Time</th>
            
            
            </tr>
            ${data}
            </table>`;


                json = await this.nlpHandler.fetchHtmlJson(html);
                json = await this.nlpHandler.fetchFinalResponse(json, param);
                return json;

            }
        } catch (e) {
            console.log(e)
            throw new Error(e)
        }
    };

    ///////////////////////handle report function/////////////
    async handlereport(param) {
        let json = {};
        try {
            console.log("Inside handle report function")
            let html =
                `<p>Please click on below link to generate pdf report.<br> </p> 
    <a href="http://10.83.150.208/zbxreport/" target="_blank">PDF Report</a> <br>
    <p>Or copy paste url into your browser: http://10.83.152.221/zbxreport/</p>`

            json = await this.nlpHandler.fetchHtmlJson(html);
            json = await this.nlpHandler.fetchFinalResponse(json, param);
            return json;


        } catch (e) {
            throw new Error(e)
        }
    };
    /////////////////////end of hms chatbot functions///////////////////////////////////////////////////

    async getUser(param) {
        if (param.USER_IDENTITY != undefined) {
            console.log("getUser param.USER_IDENTITY", param)
            let req = this.webhookService.fetchUserDetailsByIdentity(
                param.USER_IDENTITY
            );
            return Promise.all([req]);
        }
        else if (param.USER_EMAIL != undefined) {
            let req = this.webhookService.fetchEmailUserDetails(
                param.USER_EMAIL
            );
            return Promise.all([req]);
        }
    }

    async getUserByMail(param) {
        if (param.USER_EMAIL != undefined) {
            console.log("getUser param.USER_MAIL", param.USER_EMAIL)
            let req = this.webhookService.fetchUserDetailsByEmail(
                param.USER_EMAIL
            );
            return Promise.all([req]);
        }
        else if (param.USER_EMAIL != undefined) {
            let req = this.webhookService.fetchEmailUserDetails(
                param.USER_EMAIL
            );
            return Promise.all([req]);
        }
    }
    async getUserbyGUID(param) {
            console.log("getUser param.USER_IDENTITY-new-check", param)
            console.log("web-user-true",param.form_data.Website_user)
            // console.log("getUser param.USER_IDENTITY", param.form_data.Code)  fetchUserDetailsByAgentGUID
            if(param.form_data.Website_user==false){
                console.log('inside---exeee')
                let req = this.webhookService.fetchUserDetailsByAgentGUID(
                    param.form_data.user_identity
                );
                return Promise.all([req]);
            }
            else{
                console.log('inside-web----')
                let req = this.webhookService.fetchUserDetailsByGUID(
                    param.form_data.Code
                );
                return Promise.all([req]);
            }

    }

    async addUser(param) {

        let userinfor = param.form_data
        userinfor.user_identity = param.USER_IDENTITY
        console.log("userinform", userinfor)
        let req = this.webhookService.addNewUserDetailsByIdentity(
            userinfor

        );
        return Promise.all([req]);

    }
    async getPCUser(param) {
        if (param.USER_IDENTITY != undefined) {
            console.log("getUser param.USER_IDENTITY", param.USER_IDENTITY)
            let req = this.webhookService.fetchUserDetailsByIdentity(
                param.USER_IDENTITY
            );
            return Promise.all([req]);
        }
        else if (param.USER_EMAIL != undefined) {
            let req = this.webhookService.fetchPCVEmailUserDetails(
                param.USER_EMAIL
            );
            return Promise.all([req]);
        }
    }
    async getUser2(param) {
        console.log("cbshjcgscvjhv",param.USER_IDENTITY)
        if (param.USER_IDENTITY != undefined) {
           
            let req = this.webhookService.fetchUserDetailsByIdentity2(
                param.USER_IDENTITY, param
            );
            return Promise.all([req]);
        }
        else if (param.USER_EMAIL != undefined) {
            let req = this.webhookService.fetchUserDetails2(
                param.USER_EMAIL, param
            );
            return Promise.all([req]);
        }

    }
    async getUserTicket(user_identity, ticket_id) {

        let req = this.webhookService.fetchUserTicket(
            user_identity, ticket_id
        );
        return Promise.all([req]);

    }
    async   getProcedure(param) {
        console.log('gshdfgsjfgdhj',param.ACTION, param.CATEGORY, param.COMPONENT)
        let req = this.webhookService.fetchProcedureDetailByActionComponent(
            param.ACTION,
            param.COMPONENT,
            param.CATEGORY
        );
        return Promise.all([req]);
    }
    async getProcedureforcomponent(param) {
        let category;
        console.log("category", category)
        if (param.CATEGORY) {
            category = param.CATEGORY
            console.log("category2", category)
        }
        let req = this.webhookService.fetchProcedureDetailforcomponent(
            param.ACTION,
            param.COMPONENT,
            category
        );
        return Promise.all([req]);
    }
    async getProcedureForAction(param) {
        param.ACTION = 'TICKET'
        let req = this.webhookService.fetchProcedureDetailForAction(
            param.ACTION,
        );
        return Promise.all([req]);
    }

    async getProcedureAndUser(param) {
        let req1 = this.webhookService.fetchProcedureDetailByActionComponent(
            param.ACTION,
            param.COMPONENT,
            param.CATEGORY
        );
        let req2 = this.webhookService.fetchUserDetailsByIdentity(
            param.USER_IDENTITY
        );
        return Promise.all([req1, req2]);
    }

    async createTicket(param, procedure, userProfile, closingLevel) {
        console.log('user profile11111111111111',userProfile)
        if (param.CATEGORY === undefined || param.CATEGORY == '') {
            let ticketParam = {
                SUMMARY: param.SUMMARY,
                CATEGORY: procedure.category,
                SUB_CATEGORY: procedure.subcategory,
                USER_IDENTITY: userProfile.userIdentity,
                SUBMITTER_EMAIL: userProfile.userEmail,
                SUBMITTER: userProfile.userName,
                PHONE: userProfile.userContact,
                VOIP: userProfile.voip,
                CLOSING_LEVEL: closingLevel,
                ACTION: param.ACTION,
                COMPONENT: param.COMPONENT,
                MACHINE: userProfile.machineName,
                MACHINEGUID: userProfile.userIdentity,
                MACHINEGROUP: userProfile.groupReverseName,
                MACHINEGROUPGUID: userProfile.machGroupGuid
            };
            console.log('create ticket',ticketParam);
            return this.webhookService.createTicket(ticketParam);

        } else if (param.ACTION === undefined || param.ACTION == '') {
            console.log('inside-else-if')
            let ticketParam = {
                SUMMARY: param.SUMMARY,
                CATEGORY: param.CATEGORY,
                SUB_CATEGORY: procedure.subcategory,
                USER_IDENTITY: userProfile.userIdentity,
                SUBMITTER_EMAIL: userProfile.userEmail,
                SUBMITTER: userProfile.userName,
                PHONE: userProfile.userContact,
                VOIP: userProfile.voip,
                CLOSING_LEVEL: closingLevel,
                ACTION: procedure.action,
                COMPONENT: param.COMPONENT,
                MACHINE: userProfile.machineName,
                MACHINEGUID: userProfile.userIdentity,
                MACHINEGROUP: userProfile.groupReverseName,
                MACHINEGROUPGUID: userProfile.machGroupGuid
            };
            return this.webhookService.createTicket(ticketParam);
        }
        else {
            let ticketParam = {
                SUMMARY: param.SUMMARY,
                CATEGORY: param.CATEGORY,
                SUB_CATEGORY: procedure.subcategory,
                USER_IDENTITY: userProfile.userIdentity,
                SUBMITTER_EMAIL: userProfile.userEmail,
                SUBMITTER: userProfile.userName,
                PHONE: userProfile.userContact,
                VOIP: userProfile.voip,
                CLOSING_LEVEL: closingLevel,
                ACTION: procedure.action,
                COMPONENT: param.COMPONENT,
                MACHINE: userProfile.machineName,
                MACHINEGUID: userProfile.userIdentity,
                MACHINEGROUP: userProfile.groupReverseName,
                MACHINEGROUPGUID: userProfile.machGroupGuid
            };
            console.log('inside else',ticketParam)
            return this.webhookService.createTicket(ticketParam);
        }
    }

}


module.exports = AppController;
