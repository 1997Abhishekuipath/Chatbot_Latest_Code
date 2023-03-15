const AppService = require('../../../../../domain/IT/services/app');
const { getServiceDeskTemplate } = require('../../../../../domain/IT/servicedesk/kasaya/helpers/serviceDeskHelper');

class WebhookService extends AppService {
    constructor(config) {
        super(config);
        this.config = config;
    }

    async createTicket(param) {
        try {
            //Service Desk is "KASAYA"
            console.log("action_new__________", param)
            console.log("CREATING TICKET");

            //Fetch Category Id, SubCategory Id
            let category = '';
            let subcategory = '';
            var is_serviceRequest = false;
            let r1 = this.ticketUtil.fetchTicketCategoryId(param.CATEGORY);
            let r2 = this.ticketUtil.fetchTicketSubCategoryId(param.SUB_CATEGORY);

            if (param.CATEGORY && param.SUB_CATEGORY) {
                [category, subcategory] = await Promise.all([r1, r2]);
            } else if (param.CATEGORY) {
                [category] = await Promise.all([r1]);
            }

            //Summary, Description
            if (!param.SUMMARY && param.ACTION && param.COMPONENT && param.CATEGORY) {
                //         param.SUMMARY = "Request for " + param.ACTION + " of " + param.COMPONENT;
                param.SUMMARY = param.ACTION + "--" + param.CATEGORY + " " + param.COMPONENT;
            }
            else if (!param.SUMMARY) {
                //         param.SUMMARY = "Request for " + param.ACTION + " of " + param.COMPONENT;
                param.SUMMARY = param.ACTION + "--" + param.CATEGORY + " " + param.COMPONENT;
            }


            // if (param.SUBMITTER_EMAIL.indexOf('hitachi')=== -1){
            //     param.SUBMITTER_EMAIL='itsupport.ef@hitachi-systems.com'
            // }

            //Create Service Desk Json
            //1. Default Json
            // if (param.MACHINEGROUP.indexOf('hsnetworktechnologies')=== -1) {

            console.log("------------------hitachi loop-----------")

            let ticketJson = this.config.get(`ticket:templates:${getServiceDeskTemplate(param.ACTION)}:create:default`);
            ticketJson.Category = category[0].categoryId;
            ticketJson.Summary = param.SUMMARY;
            ticketJson.SubmitterEmail = param.SUBMITTER_EMAIL;
            // ticketJson.Machine=param.MACHINE
            // ticketJson.MachineGuid=param.MACHINEGUID
            // ticketJson.MachineGroup=param.MACHINEGROUP
            // ticketJson.MachineGroupGuid=param.MACHINEGROUPGUID
            console.log('param.SUBMITTER_EMAIL',param.SUBMITTER_EMAIL,ticketJson.SubmitterEmail)
            ticketJson.Submitter = param.SUBMITTER;
            ticketJson.Description = param.SUMMARY;
            if (subcategory && subcategory[0] && subcategory[0].subcategory) {
                ticketJson.SubCategory = subcategory[0].subcategory[0].subcategoryId;
            }
            //ticketJson.Category = ticketJson.Category+"||"+ticketJson.SubCategory;

            //2. Custom Json
            console.log("customTicketJson +++++++++++++++++############", getServiceDeskTemplate(param.ACTION), customTicketJson)
            
            let customTicketJson = this.config.get(`ticket:templates:${getServiceDeskTemplate(param.ACTION)}:create:custom`);
            console.log("customTicketJson +++++++++++++++++", getServiceDeskTemplate(param.ACTION), customTicketJson)

            if (param.ACTION == "SECURITY") {
                customTicketJson.Contact_Number = param.PHONE;
                customTicketJson.VOIP_Number = param.VOIP;
                customTicketJson.ReasonforChange = param.SUMMARY;
                is_serviceRequest = true;
            }
            else {
                customTicketJson.ContactNumberNew = param.PHONE;
                customTicketJson.VOIPNew = param.VOIP;
                customTicketJson.Submitter = param.SUBMITTER;
            }
            let ticketResponse = await this.ticketUtil.createTicketInServiceDesk(ticketJson, customTicketJson, param);
            let ticketNo = ticketResponse.IncidentNumber;
            console.log("ticketResponse  ==" + JSON.stringify(ticketResponse))
            let dbTicket = {
                ticketSystem: this.config.get('serviceDesk:platform'),
                ticketId: ticketNo,
                summary: param.SUMMARY,
                description: param.SUMMARY,
                category: param.CATEGORY,
                subcategory: param.SUB_CATEGORY,
                ticketStatus: this.constants.constants().TICKET_STATUS.OPEN,
                assignedTo: 'BOT',
                createdOn: this.commonUtil.getCurrentTimestamp(),
                createdBy: 'BOT',
                submittedBy: param.SUBMITTER_EMAIL,
                userIdentity: param.USER_IDENTITY,
                closingLevel: param.CLOSING_LEVEL,
                response: "SUCCESS",
                is_serviceRequest: is_serviceRequest,
            };


            let t = await this.ticketUtil.createTicketInDB(dbTicket);
            return dbTicket;
            // } 
            // else {
            //     console.log("------------------hsnt loop-----------")
            //     let ticketJson = this.config.get(`ticket:templates:hsnt:create:default`);
            //     ticketJson.Summary = param.SUMMARY;
            //     ticketJson.SubmitterEmail = param.SUBMITTER_EMAIL;
            //     ticketJson.Machine=param.MACHINE
            //     ticketJson.MachineGuid=param.MACHINEGUID
            //     ticketJson.MachineGroup=param.MACHINEGROUP
            //     ticketJson.MachineGroupGuid=param.MACHINEGROUPGUID
            //     ticketJson.Submitter = param.SUBMITTER;
            //     ticketJson.Description = param.SUMMARY;
            //     ticketJson.Severity = "HSNT||Low"
            //     if(param.ACTION==="INSTALL" || "UNINSTALL")
            //     ticketJson.Category="567772240456087"
            //     else if(param.ACTION==="CLEAN" || "TROUBLESHOOT" ||"SETTINGS")
            //     ticketJson.Category="967734906434888"
            //     else if(param.ACTION==="NETWORK" || "SECURITY")
            //     ticketJson.Category="889842094383128"
            //     else if(param.ACTION==="LOGIN ISSUE")
            //     ticketJson.Category="150959972641878"           

            //     console.log("what is my organization name",ticketJson.OrganizationName,ticketJson.Organization)
            //     //2. Custom Json
            //     let customTicketJson = this.config.get(`ticket:templates:hsnt:create:custom`);

            //     // let ticketResponse = await this.ticketUtil.createTicketInServiceDesk(ticketJson,customTicketJson,param);
            //     // let ticketNo = ticketResponse.IncidentNumber;
            //     // console.log("ticketResponse  =="+ JSON.stringify(ticketResponse))
            //     let dbTicket = {
            //         ticketSystem:  this.config.get('serviceDesk:platform'),
            //         ticketId: ticketNo,
            //         summary: param.SUMMARY,
            //         description: param.SUMMARY,
            //         category: param.CATEGORY,
            //         subcategory: param.SUB_CATEGORY,
            //         ticketStatus: this.constants.constants().TICKET_STATUS.OPEN,
            //         assignedTo: 'BOT',
            //         createdOn: this.commonUtil.getCurrentTimestamp(),
            //         createdBy: 'BOT',
            //         submittedBy: param.SUBMITTER_EMAIL,
            //         userIdentity: param.USER_IDENTITY,
            //         closingLevel: param.CLOSING_LEVEL,
            //         response : "SUCCESS"
            //     };


            //     let t = await this.ticketUtil.createTicketInDB(dbTicket);
            //     return dbTicket;

            //                 }
        } catch (e) {
            try {
                //Service Desk is "KASAYA"
                console.log("action_new__________", param)
                console.log("CREATING TICKET");

                //Fetch Category Id, SubCategory Id
                let category = '';
                let subcategory = '';

                let r1 = this.ticketUtil.fetchTicketCategoryId(param.CATEGORY);
                let r2 = this.ticketUtil.fetchTicketSubCategoryId(param.SUB_CATEGORY);

                if (param.CATEGORY && param.SUB_CATEGORY) {
                    [category, subcategory] = await Promise.all([r1, r2]);
                } else if (param.CATEGORY) {
                    [category] = await Promise.all([r1]);
                }

                //Summary, Description
                if (!param.SUMMARY && param.ACTION && param.COMPONENT && param.CATEGORY) {
                    //         param.SUMMARY = "Request for " + param.ACTION + " of " + param.COMPONENT;
                    param.SUMMARY = param.ACTION + "--" + param.CATEGORY + " " + param.COMPONENT;
                }
                else if (!param.SUMMARY) {
                    //         param.SUMMARY = "Request for " + param.ACTION + " of " + param.COMPONENT;
                    param.SUMMARY = param.ACTION + "--" + param.CATEGORY + " " + param.COMPONENT;
                }
                // if (param.SUBMITTER_EMAIL.indexOf('hitachi')=== -1){
                //     param.SUBMITTER_EMAIL='itsupport.ef@hitachi-systems.com'
                // }

                //Create Service Desk Json
                //1. Default Json
                // if (param.MACHINEGROUP.indexOf('hsnetworktechnologies')=== -1) {

                console.log("------------------hitachi loop-----------")
                console.log('category[0].categoryId;', category[0].categoryId)
                let ticketJson = this.config.get(`ticket:templates:${getServiceDeskTemplate(param.ACTION)}:create:default`);
                ticketJson.Category = category[0].categoryId;
                ticketJson.Summary = param.SUMMARY;
                ticketJson.SubmitterEmail = param.SUBMITTER_EMAIL;
                // ticketJson.Machine=param.MACHINE
                // ticketJson.MachineGuid=param.MACHINEGUID
                // ticketJson.MachineGroup=param.MACHINEGROUP
                // ticketJson.MachineGroupGuid=param.MACHINEGROUPGUID
                ticketJson.Submitter = param.SUBMITTER;
                ticketJson.Description = param.SUMMARY;

                if (subcategory && subcategory[0] && subcategory[0].subcategory) {
                    ticketJson.SubCategory = subcategory[0].subcategory[0].subcategoryId;
                }

                //2. Custom Json
                let customTicketJson = this.config.get(`ticket:templates:${getServiceDeskTemplate(param.ACTION)}:create:custom`);
                console.log("customTicketJson +++++++++++++++++", getServiceDeskTemplate(param.ACTION), customTicketJson)

                if (param.ACTION == "SECURITY") {
                    customTicketJson.Contact_Number = param.PHONE;
                    customTicketJson.VOIP_Number = param.VOIP;
                    customTicketJson.ReasonforChange = param.SUMMARY;
                    is_serviceRequest = true;
                }
                else {
                    customTicketJson.ContactNumberNew = param.PHONE;
                    customTicketJson.VOIPNew = param.VOIP;
                    customTicketJson.Submitter = param.SUBMITTER;
                }
                let ticketResponse = await this.ticketUtil.createTicketInServiceDesk(ticketJson, customTicketJson, param);
                console.log("createTicketInServiceDesk", ticketResponse);
                let ticketNo = ticketResponse.IncidentNumber;
                console.log("ticketResponse  ==" + JSON.stringify(ticketResponse))
                let dbTicket = {
                    ticketSystem: this.config.get('serviceDesk:platform'),
                    ticketId: ticketNo,
                    summary: param.SUMMARY,
                    description: param.SUMMARY,
                    category: param.CATEGORY,
                    subcategory: param.SUB_CATEGORY,
                    ticketStatus: this.constants.constants().TICKET_STATUS.OPEN,
                    assignedTo: 'BOT',
                    createdOn: this.commonUtil.getCurrentTimestamp(),
                    createdBy: 'BOT',
                    submittedBy: param.SUBMITTER_EMAIL,
                    userIdentity: param.USER_IDENTITY,
                    closingLevel: param.CLOSING_LEVEL,
                    response: "SUCCESS",
                    is_serviceRequest: is_serviceRequest,
                };


                let t = await this.ticketUtil.createTicketInDB(dbTicket);
                return dbTicket;
                // } 
                // else {
                //     console.log("------------------hsnt loop-----------")
                //     let ticketJson = this.config.get(`ticket:templates:hsnt:create:default`);
                //     ticketJson.Summary = param.SUMMARY;
                //     ticketJson.SubmitterEmail = param.SUBMITTER_EMAIL;
                //     ticketJson.Machine=param.MACHINE
                //     ticketJson.MachineGuid=param.MACHINEGUID
                //     ticketJson.MachineGroup=param.MACHINEGROUP
                //     ticketJson.MachineGroupGuid=param.MACHINEGROUPGUID
                //     ticketJson.Submitter = param.SUBMITTER;
                //     ticketJson.Description = param.SUMMARY;
                //     ticketJson.Severity = "HSNT||Low"
                //     if(param.ACTION==="INSTALL" || "UNINSTALL")
                //     ticketJson.Category="567772240456087"
                //     else if(param.ACTION==="CLEAN" || "TROUBLESHOOT" ||"SETTINGS")
                //     ticketJson.Category="967734906434888"
                //     else if(param.ACTION==="NETWORK" || "SECURITY")
                //     ticketJson.Category="889842094383128"
                //     else if(param.ACTION==="LOGIN ISSUE")
                //     ticketJson.Category="150959972641878"           

                //     console.log("what is my organization name",ticketJson.OrganizationName,ticketJson.Organization)
                //     //2. Custom Json
                //     let customTicketJson = this.config.get(`ticket:templates:hsnt:create:custom`);

                //     // let ticketResponse = await this.ticketUtil.createTicketInServiceDesk(ticketJson,customTicketJson,param);
                //     // let ticketNo = ticketResponse.IncidentNumber;
                //     // console.log("ticketResponse  =="+ JSON.stringify(ticketResponse))
                //     let dbTicket = {
                //         ticketSystem:  this.config.get('serviceDesk:platform'),
                //         ticketId: ticketNo,
                //         summary: param.SUMMARY,
                //         description: param.SUMMARY,
                //         category: param.CATEGORY,
                //         subcategory: param.SUB_CATEGORY,
                //         ticketStatus: this.constants.constants().TICKET_STATUS.OPEN,
                //         assignedTo: 'BOT',
                //         createdOn: this.commonUtil.getCurrentTimestamp(),
                //         createdBy: 'BOT',
                //         submittedBy: param.SUBMITTER_EMAIL,
                //         userIdentity: param.USER_IDENTITY,
                //         closingLevel: param.CLOSING_LEVEL,
                //         response : "SUCCESS"
                //     };


                //     let t = await this.ticketUtil.createTicketInDB(dbTicket);
                //     return dbTicket;

                //                 }
            } catch (e) {
                console.log("error =========", e)
                //throw new Error(e)
                let dbTicket = {
                    response: "ERROR"
                };
                return dbTicket;
            }
        }
    };

    async updateTicket(param) {
        try {
            //Service Desk is "KASAYA"
            console.log("UPDATING TICKET");
            console.log(param, "paraaaaaammmmmmmmmmmmmmmmmmmm");
            console.log(param.INCIDENT_NUMBER.indexOf('HSN'),"[[[[[[[]]]]]]]" ,param.INCIDENT_NUMBER)
            param.DESCRIPTION = 'Resolved by Bot'
            param.TICKET_ID = param.INCIDENT_NUMBER
            //if(param.INCIDENT_NUMBER.indexOf('HSN')=== -1){
            //Update Service Desk Json
            //1. Default Json
            let ticketJson = this.config.get(`ticket:templates:${getServiceDeskTemplate(param.ACTION)}:update:default`);
            ticketJson.IncidentNumber = param.TICKET_ID;
            ticketJson.Summary = param.SUMMARY;
            ticketJson.Status = "Incident||Resolved";
            ticketJson.Resolution = "Incident||NotResolved";
            ticketJson.Stage = "Incident||Open";
            ticketJson.Description = param.DESCRIPTION;
            ticketJson.ResolutionNote = "resolved"
             console.log(ticketJson,"rittttttttttu")
            //2. Custom Json
            let customTicketJson = this.config.get(`ticket:templates:${getServiceDeskTemplate(param.ACTION)}:update:custom`);

            let r1 = this.ticketUtil.updateTicketInDB(param.INCIDENT_NUMBER, param.STATUS);
            let r2 = this.ticketUtil.updateTicketInServiceDesk(ticketJson, customTicketJson, param);
            let r = await Promise.all([r1, r2]);
            return "SUCCESS";
            // }
            // else{
            //     let ticketJson = this.config.get(`ticket:templates:hsnt:update:default`);
            // ticketJson.IncidentNumber = param.INCIDENT_NUMBER;
            // ticketJson.Summary = param.SUMMARY;
            // ticketJson.Status = "HSNT||4.InProgress";
            // ticketJson.Description= "resolved by bot",
            // ticketJson.Stage = "HSNT||WIP"
            // ticketJson.Severity = "HSNT||Low"

            // //2. Custom Json
            // let customTicketJson = this.config.get(`ticket:templates:hsnt:update:custom`);
            // customTicketJson.PreviousValue="Open"

            // let r1 = this.ticketUtil.updateTicketInDB(param.INCIDENT_NUMBER, param.STATUS);
            // let r2 = this.ticketUtil.updateTicketInServiceDesk(ticketJson, customTicketJson,param);
            // let r = await Promise.all([r1, r2]);


            // let ticketJson2 = this.config.get(`ticket:templates:hsnt:update:default`);
            // ticketJson2.IncidentNumber = param.INCIDENT_NUMBER;
            // ticketJson2.Summary = param.SUMMARY;
            // ticketJson2.Status = "HSNT||C.Closed";
            // ticketJson2.Resolution= "HSNT||Resolved";
            // ticketJson2.Description= "resolved by bot",
            // ticketJson2.ResolutionNote ="resolved by bot"
            // ticketJson2.Stage = "HSNT||Closed"
            // ticketJson2.Severity = "HSNT||Low"

            // let customTicketJson2 = this.config.get(`ticket:templates:hsnt:update:custom`);
            // customTicketJson2.PreviousValue="WIP"
            // // customTicketJson2.TotalResolvedMin="10"
            // // customTicketJson2.HSNTResolutionSLA="Achieved"

            // let r3 = this.ticketUtil.updateTicketInServiceDesk(ticketJson2, customTicketJson2,param);
            // let r4 = await Promise.all([ r3]);
            // return "SUCCESS";
            // }
        } catch (e) {
            try {
                //Service Desk is "KASAYA"
                console.log("UPDATING TICKET inside catch(--try)");
                console.log(param);

                // if(param.INCIDENT_NUMBER.indexOf('HSN')=== -1){
                //Update Service Desk Json
                //1. Default Json
                let ticketJson = this.config.get(`ticket:templates:${getServiceDeskTemplate(param.ACTION)}:update:default`);
                ticketJson.IncidentNumber = param.TICKET_ID;
                ticketJson.Summary = param.SUMMARY;
                ticketJson.Status = "Incident||Resolved";
                ticketJson.Resolution = "Incident||NotResolved";
                ticketJson.Stage = "Incident||Open";
                ticketJson.Description = param.DESCRIPTION;
                ticketJson.ResolutionNote = "resolved"

                //2. Custom Json
                let customTicketJson = this.config.get(`ticket:templates:${getServiceDeskTemplate(param.ACTION)}:update:custom`);

                let r1 = this.ticketUtil.updateTicketInDB(param.INCIDENT_NUMBER, param.STATUS);
                let r2 = this.ticketUtil.updateTicketInServiceDesk(ticketJson, customTicketJson, param);
                let r = await Promise.all([r1, r2]);
                return "SUCCESS";
                // }
                // else{
                //     let ticketJson = this.config.get(`ticket:templates:hsnt:update:default`);
                // ticketJson.IncidentNumber = param.INCIDENT_NUMBER;
                // ticketJson.Summary = param.SUMMARY;
                // ticketJson.Status = "HSNT||4.InProgress";
                // ticketJson.Description= "resolved by bot",
                // ticketJson.Stage = "HSNT||WIP"
                // ticketJson.Severity = "HSNT||Low"

                // //2. Custom Json
                // let customTicketJson = this.config.get(`ticket:templates:hsnt:update:custom`);
                // customTicketJson.PreviousValue="Open"

                // let r1 = this.ticketUtil.updateTicketInDB(param.INCIDENT_NUMBER, param.STATUS);
                // let r2 = this.ticketUtil.updateTicketInServiceDesk(ticketJson, customTicketJson,param);
                // let r = await Promise.all([r1, r2]);


                // let ticketJson2 = this.config.get(`ticket:templates:hsnt:update:default`);
                // ticketJson2.IncidentNumber = param.INCIDENT_NUMBER;
                // ticketJson2.Summary = param.SUMMARY;
                // ticketJson2.Status = "HSNT||C.Closed";
                // ticketJson2.Resolution= "HSNT||Resolved";
                // ticketJson2.Description= "resolved by bot",
                // ticketJson2.ResolutionNote ="resolved by bot"
                // ticketJson2.Stage = "HSNT||Closed"
                // ticketJson2.Severity = "HSNT||Low"

                // let customTicketJson2 = this.config.get(`ticket:templates:hsnt:update:custom`);
                // customTicketJson2.PreviousValue="WIP"
                // // customTicketJson2.TotalResolvedMin="10"
                // // customTicketJson2.HSNTResolutionSLA="Achieved"

                // let r3 = this.ticketUtil.updateTicketInServiceDesk(ticketJson2, customTicketJson2,param);
                // let r4 = await Promise.all([ r3]);
                // return "SUCCESS";
                // }
            } catch (e) {
                throw new Error(e)
            }
        }
    };
    async getTicket(ticket_id) {
        try {
            //Service Desk is "KASAYA"
            console.log("webhook services get TICKET");
            let r2 = this.ticketUtil.getTicketInServiceDesk(ticket_id);
            let result = await Promise.all([r2]);
            return result;

        } catch (e) {
            try {
                //Service Desk is "KASAYA"
                console.log("Get ticket");
                let r2 = this.ticketUtil.getTicketInServiceDesk(ticket_id);
                let result = await Promise.all([r2]);
                return result;
            } catch (e) {
                throw new Error(e)
            }
        }
    };

    async fetchSupportExtension(param) {
        try {
            let result = [];
            let location = param.IT_LOCATION;

            if (!location) {
                //Fetch User Location
                let userProfile = await this.fetchUserDetailsByIdentity(
                    param.USER_IDENTITY
                );
                location = userProfile[0].customerGroup;
            }

            if (location && location != '') {
                let query = { location: location };
                let fields = {};
                result = await this.extensionUtil.fetchSupportExtension(query, fields);
            }

            return result;
        } catch (e) {
            throw new Error(e)
        }
    };
}

module.exports = WebhookService;