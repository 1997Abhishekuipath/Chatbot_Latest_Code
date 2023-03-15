const config = require('../libs/config-util');
const AppController = require('../../../../../domain/IT/controllers/app');
const IntentUtil = require('./../libs/intent-util');
const NlpHandler = require('../../../../../common/nlp/nlp-handler');
const WebhookService = require('./../services/webhook');
const CommonUtil = require('../../../../../common/libs/common-util');
const MessageUtil = require('./../libs/message-util');


let webhookService = new WebhookService(config);

class WebhookController extends AppController {
    constructor() {
        super(config, webhookService);
        this.nlpHandler = new NlpHandler(config);
        this.execute = this.execute.bind(this);
        this.file_execute = this.file_execute.bind(this);
    }

    async execute(request, res) {
        
        res.set("Access-Control-Allow-Origin", "*");
        res.set("Access-Control-Allow-Headers", "X-Requested-With");
        try {
            
            let response = {};
            // console.log("reqqqqqqqquesst" , request)
            let params = await this.nlpHandler.fetchNlpParams(request);
           
            console.log("******** NLP RESULT **************");
            console.log(params);
            console.log("******** END OF NLP RESULT **************");
            const intentName = params.intentName;
            const flowName = params.flowName;
            const userQuery = params.userQuery;
            const teamsEmail = params.teamsEmail
            const userIdentity = params.result.user_identity
            console.log('fdfd')
            const param = {

                USER_QUERY: userQuery,
                PARAMETERS: params.parameters,
                INTENTNAME: params.intentName, //network_issue
                NAME: params.parameters['name'],
                USER_IDENTITY: userIdentity || params.parameters['user_identity'] ,
                USER_EMAIL: teamsEmail || params.parameters['email'],
                //USER_EMAIL: params.parameters['email'],
                USER_PROFILE: params.parameters['any'],
                JOB: params.parameters['Jobs'],
                ACTION: params.parameters['action'], // Network
                COMPONENT: params.parameters['component'],
                CATEGORY: params.parameters['category'],
                // CATEGORY:'SOFTWARE',
                SUB_CATEGORY: params.parameters['subcategory'],
                SUMMARY: params.parameters['summary'],
                DESCRIPTION: params.parameters['description'],
                REASON: params.parameters['reason'],
                CONFIRMATION: params.parameters['confirmation'],
                IT_LOCATION: params.parameters['extension_location'],
                TICKET_STATUS: params.parameters['ticketStatus'],
                TIME: params.parameters['time_period'],
                OPERATIONS: params.parameters['operations'],
                any: params.parameters['any'],
                OPTIONS: params.parameters['option'],
                media: params.parameters['media'],
                hostenable: params.parameters['hostenable'],
                actionenable: params.parameters['actionenable'],
                web: params.parameters['web'],
                hostgroup: params.parameters['hostgroup'],
                OPPORTUNITY: params.parameters['opportunity'],
                TOTAL: params.parameters['total'],
                OTP: params.parameters['number'] || params.parameters['otp'],
                statuscode: params.parameters['statuscode'],
                TICKET_ID: params.parameters['ticket_id'],
                url: params.parameters['url'],
                new_user :params.parameters['new_user'],
                form_data : params.parameters['form_data'],

                intentDetectionConfidence:Math.round(params.parameters['intentDetectionConfidence']*100)+'%'
            };
            console.log('fdfd',param)


            if (intentName === IntentUtil.intents().IT_ACTION_COMPONENT ||
                intentName === IntentUtil.intents().IT_ISSUE_COMPONENT ||
                intentName === IntentUtil.intents().IT_SR_COMPONENT ||
                //  intentName === IntentUtil.intents().IT_LOGIN_COMPONENT ||
                intentName === IntentUtil.intents().IT_NETWORK_COMPONENT ||
                intentName === IntentUtil.intents().IT_SECURITY_COMPONENT ||
                intentName === IntentUtil.intents().IT_ANTIVIRUS_COMPONENT ||
                intentName === IntentUtil.intents().IT_SETTING_COMPONENT ||
                intentName === IntentUtil.intents().IT_TROUBLESHOOT_COMPONENT ||
                intentName === IntentUtil.intents().PROFILE ||
                intentName === IntentUtil.intents().Application_login) {
                response = await this.handleItActionComponent(param);
                response.reset_entities = ['action', 'category', 'confirmation', 'component', 'hostenable', 'actionenable', 'media', 'option', 'hostgroup', 'web', 'opportunity', 'total']
                response.parameters.action = "";
                response.parameters.category = "";
                response.parameters.confirmation = "";
                response.parameters.component = "";
                response.parameters.hostenable = "";
                response.parameters.actionenable = "";
            }

            else if (intentName === IntentUtil.intents().IT_CONVO) {
                response = await this.handleItActionComponentConv(param);
                response.reset_entities = ['action', 'category', 'confirmation', 'component', 'hostenable', 'actionenable', 'media', 'option', 'hostgroup', 'web', 'opportunity', 'total']
                response.parameters.action = "";
                response.parameters.category = "";
                response.parameters.confirmation = "";
                response.parameters.component = "";
                response.parameters.hostenable = "";
                response.parameters.actionenable = "";
            }

            else if (intentName === IntentUtil.intents().video) {
                response = await this.handleimsvideo(param);
            }

            else if (intentName === IntentUtil.intents().job_org) {
                response = await this.handleJobCategories(param);
            }

            else if (intentName === IntentUtil.intents().job_subcategories) {
                response = await this.handleJobSubcategories(param);
            }

            else if (intentName === IntentUtil.intents().experience) {
                response = await this.handleExperience(param);
            }

            else if (intentName === IntentUtil.intents().file_upload) {
                response = await this.handleJobmails(param);
            }

            // else if (intentName === IntentUtil.intents().PROFILE) {
            //     response = await this.handleItProfile(param);
            // }
            else if (intentName === IntentUtil.intents().EMAIL || flowName === 'Email_Verify') {
                response = await this.handleEmailverify(param);
                console.log("inside response block");
                console.log(response);
                //response.reset_entities=['action','category','confirmation','component']
            }
            else if (intentName === IntentUtil.intents().get_user_info || flowName === 'get_user_info') {
                response = await this.getUserInfo(param);
                console.log('get-user-info-param',param)
                response.reset_entities = ['action', 'category', 'confirmation', 'component', 'hostenable', 'actionenable', 'media', 'option', 'hostgroup', 'web', 'opportunity', 'total']
                response.parameters.action = "";
                response.parameters.category = "";
                response.parameters.confirmation = "";
                response.parameters.component = "";
                response.parameters.hostenable = "";
                response.parameters.actionenable = "";
                // console.log(response);
                //response.reset_entities=['action','category','confirmation','component']
            }

            else if (intentName === IntentUtil.intents().IT_CONVO_CONFIRMATION) {
                response = await this.handleItActionConfirmationConv(param);
                response.reset_entities = ['action', 'category', 'confirmation', 'component', 'hostenable', 'actionenable', 'media', 'option', 'hostgroup', 'web', 'opportunity', 'total']
                response.parameters.action = "";
                response.parameters.category = "";
                response.parameters.confirmation = "";
                response.parameters.component = "";
                response.parameters.hostenable = "";
                response.parameters.actionenable = "";
            }


            else if (intentName === IntentUtil.intents().IT_ACTION_APPROVAL) {
                response = await this.handleItActionApproval(param);
                response.reset_entities = ['action', 'category', 'confirmation', 'component', 'hostenable', 'actionenable', 'media', 'option', 'hostgroup', 'web', 'opportunity', 'total']
                response.parameters.action = "";
                response.parameters.category = "";
                response.parameters.confirmation = "";
                response.parameters.component = "";
                response.parameters.hostenable = "";
                response.parameters.actionenable = "";
            }
            // else if (intentName === IntentUtil.intents().IT_ACTION_EXECUTE) {
            //     response = await this.handleItActionExecute(param);
            // }

            else if (intentName === IntentUtil.intents().IT_ACTION_CONFIRMATION ||
                intentName === IntentUtil.intents().IT_CLEAN_CONFIRMATION ||
                intentName === IntentUtil.intents().IT_SR_CONFIRMATION ||
                intentName === IntentUtil.intents().IT_LOGIN_CONFIRMATION ||
                intentName === IntentUtil.intents().IT_NETWORK_CONFIRMATION ||
                intentName === IntentUtil.intents().IT_ANTIVIRUS_CONFIRMATION ||
                intentName === IntentUtil.intents().IT_SECURITY_CONFIRMATION ||
                intentName === IntentUtil.intents().IT_SETTING_CONFIRMATION ||
                intentName === IntentUtil.intents().IT_TROUBLESHOOT_CONFIRMATION) {
                response = await this.handleItActionConfirmation(param);
                // response.reset_entities = ['action', 'category', 'confirmation', 'component', 'hostenable', 'actionenable', 'media', 'option', 'hostgroup', 'web', 'opportunity', 'total']
                // response.parameters.action = "";
                // response.parameters.category = "";
                // response.parameters.confirmation = "";
                // response.parameters.component = "";
                // response.parameters.hostenable = "";
                // response.parameters.actionenable = "";
            }
            else if (((!intentName && flowName === 'welcome') ||
                intentName === IntentUtil.intents().Intent_welcome) && (param.USER_IDENTITY == undefined && param.USER_EMAIL == undefined)) {
                console.log("user_Identity", param.USER_IDENTITY)
                response = await this.handleUserIdentity(param);
                response.reset_entities = ['action', 'category', 'confirmation', 'component', 'hostenable', 'actionenable', 'media', 'option', 'hostgroup', 'web', 'opportunity', 'total']
                response.parameters.action = "";
                response.parameters.category = "";
                response.parameters.confirmation = "";
                response.parameters.component = "";
                response.parameters.hostenable = "";
                response.parameters.actionenable = "";
            }

            else if (((!intentName && flowName === 'welcome') ||
                intentName === IntentUtil.intents().Intent_welcome ||intentName === IntentUtil.intents().welcome ||
                intentName === IntentUtil.intents().EMAIL) && (param.USER_IDENTITY != undefined || param.USER_EMAIL != undefined)) {
                response = await this.handleWelcomeList(param);
                response.reset_entities = ['action', 'category', 'confirmation', 'component', 'hostenable', 'actionenable', 'media', 'option', 'hostgroup', 'web', 'opportunity', 'total']
                response.parameters.action = "";
                response.parameters.category = "";
                response.parameters.confirmation = "";
                response.parameters.component = "";
                response.parameters.hostenable = "";
                response.parameters.actionenable = "";
            }

            // else if ((flowName==='IT_Options') ||
            // intentName === IntentUtil.intents().IT_Options){
            //     response = await this.handleCompleteList(param);  
            // }

            else if (intentName === IntentUtil.intents().IT_Options) {
                console.log('IT_Options-param-11',param)
                response = await this.handleCompleteList(param);
                console.log('IT_Options-response',response)
                
                response.reset_entities = ['action', 'category', 'confirmation', 'component', 'hostenable', 'actionenable', 'media', 'option', 'hostgroup', 'web', 'opportunity', 'total']
                response.parameters.action = "";
                response.parameters.category = "";
                response.parameters.confirmation = "";
                response.parameters.component = "";
                response.parameters.hostenable = "";
                response.parameters.actionenable = "";
                
            }

            else if (intentName === IntentUtil.intents().ACTION_LIST ||
                intentName === IntentUtil.intents().IT_CLEAN_LIST ||
                intentName === IntentUtil.intents().SR_LIST ||
                intentName === IntentUtil.intents().IT_LOGIN_LIST ||
                intentName === IntentUtil.intents().IT_SECURITY_LIST ||
                intentName === IntentUtil.intents().IT_NETWORK_LIST ||
                intentName === IntentUtil.intents().IT_ANTIVIRUS_LIST ||
                intentName === IntentUtil.intents().IT_SETTING_LIST ||
                intentName === IntentUtil.intents().IT_TROUBLESHOOT) {
                response = await this.handleItActionList(param);
                response.reset_entities = ['action', 'category', 'confirmation', 'component', 'hostenable', 'actionenable', 'media', 'option', 'hostgroup', 'web', 'opportunity', 'total']
                response.parameters.action = "";
                response.parameters.category = "";
                response.parameters.confirmation = "";
                response.parameters.component = "";
                response.parameters.hostenable = "";
                response.parameters.actionenable = "";
            }
            else if (intentName === IntentUtil.intents().OTHERS) {
                response = await this.handleOtherComponent(param);
                response.reset_entities = ['action', 'category', 'confirmation', 'component', 'hostenable', 'actionenable', 'media', 'option', 'hostgroup', 'web', 'opportunity', 'total']
                response.parameters.action = "";
                response.parameters.category = "";
                response.parameters.confirmation = "";
                response.parameters.component = "";
                response.parameters.hostenable = "";
                response.parameters.actionenable = "";
            } else if (intentName === IntentUtil.intents().TICKET_LIST) {
                response = await this.handleTicketStatus(param);
            }

            else if (intentName === IntentUtil.intents().Host_operation) {
                response = await this.handlehostoperations(param);
                response.reset_entities = ['operations']
                response.parameters.any = "";
            }
            else if (intentName === IntentUtil.intents().email_otp2 || intentName === IntentUtil.intents().email_otp) {
                response = await this.verifyOTP(param);
            }

            else if (intentName === IntentUtil.intents().hostgroupdetail_id) {
                response = await this.handlehostfunction(param);
                response.reset_entities = ['any']
                //response.parameters.any="";
            }

            else if (intentName === IntentUtil.intents().hostgroupdetails) {

                response = await this.handlehostgroupfunction(param);
            }

            ////////////////////////////////////////////////////////////////////////////////
            else if (intentName === IntentUtil.intents().Performance_issue || intentName === IntentUtil.intents().Performance_issue) {
                response = await this.actionfunction(param);
                response.reset_entities = ['action', 'category', 'confirmation', 'component', 'hostenable', 'actionenable', 'media', 'option', 'hostgroup', 'web', 'opportunity', 'total']
                response.parameters.action = "";
                response.parameters.category = "";
                response.parameters.confirmation = "";
                response.parameters.component = "";
                response.parameters.hostenable = "";
                response.parameters.actionenable = "";
            }
            else if (intentName === IntentUtil.intents().get_ticket_id || intentName === IntentUtil.intents().get_ticket_id) {
                response = await this.getTicketDetails(param);
                response.reset_entities = ['action', 'category', 'confirmation', 'component', 'hostenable', 'actionenable', 'media', 'option', 'hostgroup', 'web', 'opportunity', 'total']
                response.parameters.action = "";
                response.parameters.category = "";
                response.parameters.confirmation = "";
                response.parameters.component = "";
                response.parameters.hostenable = "";
                response.parameters.actionenable = "";
            }
            else if (intentName === IntentUtil.intents().update_ticket || intentName === IntentUtil.intents().update_ticket) {
                response = await this.updateTicketDetails(param);
                response.reset_entities = ['action', 'category', 'confirmation', 'component', 'hostenable', 'actionenable', 'media', 'option', 'hostgroup', 'web', 'opportunity', 'total']
                response.parameters.action = "";
                response.parameters.category = "";
                response.parameters.confirmation = "";
                response.parameters.component = "";
                response.parameters.hostenable = "";
                response.parameters.actionenable = "";
            }
            else if (intentName === IntentUtil.intents().installations_yes || intentName === IntentUtil.intents().installations_yes) {
                param.ACTION = 'install'
                response = await this.installcomponentfunction(param);
                            response.reset_entities = ['action', 'category', 'confirmation', 'component', 'hostenable', 'actionenable', 'media', 'option', 'hostgroup', 'web', 'opportunity', 'total']
                response.parameters.action = "";
                response.parameters.category = "";
                response.parameters.confirmation = "";
                response.parameters.component = "";
                response.parameters.hostenable = "";
                response.parameters.actionenable = "";
            }
            else if (intentName === IntentUtil.intents().uninstallations_yes || intentName === IntentUtil.intents().uninstallations_yes) {
                param.ACTION = 'uninstall'
                response = await this.installcomponentfunction(param);
                response.reset_entities = ['action', 'category', 'confirmation', 'component', 'hostenable', 'actionenable', 'media', 'option', 'hostgroup', 'web', 'opportunity', 'total']
                response.parameters.action = "";
                response.parameters.category = "";
                response.parameters.confirmation = "";
                response.parameters.component = "";
                response.parameters.hostenable = "";
                response.parameters.actionenable = "";
            }
            else if (intentName === IntentUtil.intents().login_component_yes || intentName === IntentUtil.intents().login_component_yes) {
                param.ACTION = 'login issue'
                response = await this.loginActionComponent(param);
                response.reset_entities = ['action', 'category', 'confirmation', 'component', 'hostenable', 'actionenable', 'media', 'option', 'hostgroup', 'web', 'opportunity', 'total']
                response.parameters.action = "";
                response.parameters.category = "";
                response.parameters.confirmation = "";
                response.parameters.component = "";
                response.parameters.hostenable = "";
                response.parameters.actionenable = "";
            }
            else if (intentName === IntentUtil.intents().system_issue_yes || intentName === IntentUtil.intents().system_issue_yes) {
                param.ACTION = 'clean';
                param.CATEGORY = 'SYSTEM';
                response = await this.performItAction(param);
                response.reset_entities = ['action', 'category', 'confirmation', 'component', 'hostenable', 'actionenable', 'media', 'option', 'hostgroup', 'web', 'opportunity', 'total']
                response.parameters.action = "";
                response.parameters.category = "";
                response.parameters.confirmation = "";
                response.parameters.component = "";
                response.parameters.hostenable = "";
                response.parameters.actionenable = "";
            }
            else if (intentName === IntentUtil.intents().browser_issue_yes || intentName === IntentUtil.intents().browser_issue_yes) {
                param.ACTION = 'clean';
                param.CATEGORY = 'BROWSER';
                response = await this.performItAction(param);
                response.reset_entities = ['action', 'category', 'confirmation', 'component', 'hostenable', 'actionenable', 'media', 'option', 'hostgroup', 'web', 'opportunity', 'total']
                response.parameters.action = "";
                response.parameters.category = "";
                response.parameters.confirmation = "";
                response.parameters.component = "";
                response.parameters.hostenable = "";
                response.parameters.actionenable = "";
            }
            else if (intentName === IntentUtil.intents().network_issue_yes || intentName === IntentUtil.intents().network_issue_yes) {
                param.ACTION = 'NETWORK';
                response = await this.performItAction(param);
                response.reset_entities = ['action', 'category', 'confirmation', 'component', 'hostenable', 'actionenable', 'media', 'option', 'hostgroup', 'web', 'opportunity', 'total']
                response.parameters.action = "";
                response.parameters.category = "";
                response.parameters.confirmation = "";
                response.parameters.component = "";
                response.parameters.hostenable = "";
                response.parameters.actionenable = "";
            }
            else if (intentName === IntentUtil.intents().component_action) {
                response = await this.provideActionList(param);
                response.reset_entities = ['action', 'category', 'confirmation', 'component', 'hostenable', 'actionenable', 'media', 'option', 'hostgroup', 'web', 'opportunity', 'total']
                response.parameters.action = "";
                response.parameters.category = "";
                response.parameters.confirmation = "";
                response.parameters.component = "";
                response.parameters.hostenable = "";
                response.parameters.actionenable = "";
            }
            else if (intentName === IntentUtil.intents().raise_ticket) {
                response = await this.raiseTicket(param);
                response.reset_entities = ['action', 'category', 'confirmation', 'component', 'hostenable', 'actionenable', 'media', 'option', 'hostgroup', 'web', 'opportunity', 'total']
                response.parameters.action = "";
                response.parameters.category = "";
                response.parameters.confirmation = "";
                response.parameters.component = "";
                response.parameters.hostenable = "";
                response.parameters.actionenable = "";
            }
            else if (intentName === IntentUtil.intents().outlook_issue_yes || intentName === IntentUtil.intents().outlook_issue_yes) {
                param.ACTION = 'TROUBLESHOOT';
                param.CATEGORY = 'OUTLOOK';
                param.COMPONENT = 'OUTLOOK';
                response = await this.performItAction(param);
                response.reset_entities = ['action', 'category', 'confirmation', 'component', 'hostenable', 'actionenable', 'media', 'option', 'hostgroup', 'web', 'opportunity', 'total']
                response.parameters.action = "";
                response.parameters.category = "";
                response.parameters.confirmation = "";
                response.parameters.component = "";
                response.parameters.hostenable = "";
                response.parameters.actionenable = "";
            }
            else if (intentName === IntentUtil.intents().browser_settings_yes || intentName === IntentUtil.intents().browser_settings_yes) {
                param.ACTION = 'SETTINGS';
                param.CATEGORY = 'BROWSER SETTING';
                param.COMPONENT = 'CHROME DEFAULT';
                response = await this.performItAction(param);
                response.reset_entities = ['action', 'category', 'confirmation', 'component', 'hostenable', 'actionenable', 'media', 'option', 'hostgroup', 'web', 'opportunity', 'total']
                response.parameters.action = "";
                response.parameters.category = "";
                response.parameters.confirmation = "";
                response.parameters.component = "";
                response.parameters.hostenable = "";
                response.parameters.actionenable = "";
            }

            else if (intentName === IntentUtil.intents().component_confirmation || intentName === IntentUtil.intents().component_confirmation || intentName === IntentUtil.intents().component_affirmative) {
                response = await this.confirmItAction(param);
                response.reset_entities = ['action', 'category', 'confirmation', 'component', 'hostenable', 'actionenable', 'media', 'option', 'hostgroup', 'web', 'opportunity', 'total']
                response.parameters.action = "";
                response.parameters.category = "";
                response.parameters.confirmation = "";
                response.parameters.component = "";
                response.parameters.hostenable = "";
                response.parameters.actionenable = "";
            }
            else if (intentName === IntentUtil.intents().system_performance_issue || intentName === IntentUtil.intents().system_performance_issue) {
                console.log('inside system_performance_issue ---------------->')
                param.ACTION = 'clean';
                param.CATEGORY = 'system';
                response = await this.handleItActionList(param);
                response.reset_entities = ['action', 'category', 'confirmation', 'component', 'hostenable', 'actionenable', 'media', 'option', 'hostgroup', 'web', 'opportunity', 'total']
                response.parameters.action = "";
                response.parameters.category = "";
                response.parameters.confirmation = "";
                response.parameters.component = "";
                response.parameters.hostenable = "";
                response.parameters.actionenable = "";
            }
            else if (intentName === IntentUtil.intents().browser_performance_issue || intentName === IntentUtil.intents().browser_performance_issue) {
                param.ACTION = 'clean';
                param.CATEGORY = 'browser';
                response = await this.handleItActionList(param);
                response.reset_entities = ['action', 'category', 'confirmation', 'component', 'hostenable', 'actionenable', 'media', 'option', 'hostgroup', 'web', 'opportunity', 'total']
                response.parameters.action = "";
                response.parameters.category = "";
                response.parameters.confirmation = "";
                response.parameters.component = "";
                response.parameters.hostenable = "";
                response.parameters.actionenable = "";
            }
            else if (intentName === IntentUtil.intents().network_issue || intentName === IntentUtil.intents().network_issue) {
                param.ACTION = 'NETWORK';
                param.CATEGORY = ''
                response = await this.handleItActionList(param);
                response.reset_entities = ['action', 'category', 'confirmation', 'component', 'hostenable', 'actionenable', 'media', 'option', 'hostgroup', 'web', 'opportunity', 'total']
                response.parameters.action = "";
                response.parameters.category = "";
                response.parameters.confirmation = "";
                response.parameters.component = "";
                response.parameters.hostenable = "";
                response.parameters.actionenable = "";
            }
            else if (intentName === IntentUtil.intents().installation_issue || intentName === IntentUtil.intents().installation_issue) {

                param.ACTION = 'INSTALL';
                console.log('inside installation-issue',param)
                response = await this.handleItActionList(param);
                response.reset_entities = ['action', 'category', 'confirmation', 'component', 'hostenable', 'actionenable', 'media', 'option', 'hostgroup', 'web', 'opportunity', 'total']
                response.parameters.action = "";
                response.parameters.category = "";
                response.parameters.confirmation = "";
                response.parameters.component = "";
                response.parameters.hostenable = "";
                response.parameters.actionenable = "";
                // response.reset_entities = ['action', 'category', 'confirmation', 'component']
            }
            else if (intentName === IntentUtil.intents().uninstallation_issue || intentName === IntentUtil.intents().uninstallation_issue) {
                param.ACTION = 'UNINSTALL';
                response = await this.handleItActionList(param);
                // response.reset_entities = ['action', 'category', 'confirmation', 'component', 'hostenable', 'actionenable', 'media', 'option', 'hostgroup', 'web', 'opportunity', 'total']
                // response.parameters.action = "";
                // response.parameters.category = "";
                // response.parameters.confirmation = "";
                // response.parameters.component = "";
                // response.parameters.hostenable = "";
                // response.parameters.actionenable = "";
            }
            else if (intentName === IntentUtil.intents().hostgroupseltask || intentName === "hostgroup_creation") {
                response = await this.hostgroupcreationfunction(param);
                response.reset_entities = ['action', 'category', 'confirmation', 'component', 'hostenable', 'actionenable', 'media', 'option', 'hostgroup', 'web', 'opportunity', 'total']
                response.parameters.action = "";
                response.parameters.category = "";
                response.parameters.confirmation = "";
                response.parameters.component = "";
                response.parameters.hostenable = "";
                response.parameters.actionenable = "";
            }

            else if (intentName === IntentUtil.intents().Hostgroup_name || intentName === IntentUtil.intents().hostgroup_name) {
                response = await this.hostgroupdeletionfunction(param);
                response.reset_entities = ['action', 'category', 'confirmation', 'component', 'hostenable', 'actionenable', 'media', 'option', 'hostgroup', 'web', 'opportunity', 'total']
                response.parameters.action = "";
                response.parameters.category = "";
                response.parameters.confirmation = "";
                response.parameters.component = "";
                response.parameters.hostenable = "";
                response.parameters.actionenable = "";
                // response.reset_entities = ['any']
                // response.parameters.any = "";
            }

            // else if (intentName === IntentUtil.intents().hostgroup_deletion){
            //     response = await this.hostgroupdeletionlistfunction(param);
            // }

            else if (intentName === IntentUtil.intents().useraction) {
                response = await this.zabbixactionenablefunction(param);
                response.reset_entities = ['any']
                response.parameters.any = "";
                response.reset_entities = ['action', 'category', 'confirmation', 'component', 'hostenable', 'actionenable', 'media', 'option', 'hostgroup', 'web', 'opportunity', 'total']
                response.parameters.action = "";
                response.parameters.category = "";
                response.parameters.confirmation = "";
                response.parameters.component = "";
                response.parameters.hostenable = "";
                response.parameters.actionenable = "";
            }
            else if (intentName === IntentUtil.intents().zabbixactioname) {
                response = await this.zabbixactionenablenamefunction(param);
                response.reset_entities = ['action', 'category', 'confirmation', 'component', 'hostenable', 'actionenable', 'media', 'option', 'hostgroup', 'web', 'opportunity', 'total']
                response.parameters.action = "";
                response.parameters.category = "";
                response.parameters.confirmation = "";
                response.parameters.component = "";
                response.parameters.hostenable = "";
                response.parameters.actionenable = "";
            }

            else if (intentName === IntentUtil.intents().actiontask) {
                response = await this.actionlistfunction(param);
                response.reset_entities = ['action', 'category', 'confirmation', 'component', 'hostenable', 'actionenable', 'media', 'option', 'hostgroup', 'web', 'opportunity', 'total']
                response.parameters.action = "";
                response.parameters.category = "";
                response.parameters.confirmation = "";
                response.parameters.component = "";
                response.parameters.hostenable = "";
                response.parameters.actionenable = "";
            }
            else if (intentName === IntentUtil.intents().zabbixactionlist) {
                response = await this.zabbixactionlistfunction(param);
            }
            // else if (intentName === IntentUtil.intents().useractiondisable){
            //     response = await this.zabbixactiondisablefunction(param);
            //     response.reset_entities=['any']
            //     response.parameters.any="";
            // }

            // else if (intentName === IntentUtil.intents().disableactionintent){
            //     response = await this.disableactionlistfunction(param);
            // }

            else if (intentName === IntentUtil.intents().enablehostname) {
                response = await this.zabbixhostenablefunction(param);
                response.reset_entities = ['hostenable']
                response.parameters.any = "";
            }

            else if (intentName === IntentUtil.intents().enabledisablegroup) {
                response = await this.hostenablefunction(param);
                // response.reset_entities=['any']
                // response.parameters.any="";
            }
            else if (intentName === IntentUtil.intents().enabledisablenamegroup) {
                response = await this.hostenablenamefunction(param);
                // response.reset_entities=['any']
                // response.parameters.any="";
            }
            else if (intentName === IntentUtil.intents().enabledisabletask || intentName === IntentUtil.intents().zabbixhostdisable) {
                response = await this.handleenablehostgroupfunction(param);
            }

            else if (intentName === IntentUtil.intents().enabledisablehostask || intentName === IntentUtil.intents().zabbixhostdisable) {
                response = await this.handleenablehostfunction(param);
            }
            // else if (intentName === IntentUtil.intents().disablehostname){
            //     response = await this.zabbixhostdisablefunction(param);
            //     response.reset_entities=['any']
            //     response.parameters.any="";
            // }

            else if (intentName === IntentUtil.intents().hmshostname) {
                response = await this.hmshostnamefunction(param);
            }

            else if (intentName === IntentUtil.intents().activeusersname) {
                response = await this.activeusersfunction(param);
            }

            else if (intentName === IntentUtil.intents().mediatype) {
                response = await this.zabbixmediadisablefunction(param);
                response.reset_entities = ['any', 'media']
                response.parameters.any = "";
            }

            else if (intentName === IntentUtil.intents().Mediatask) {
                response = await this.handlemedialistfunction(param);
            }
            // else if (intentName === IntentUtil.intents().disablemedianame || flowName==='mediadisable'){
            //     response = await this.handlemediadisablelistfunction(param);
            // }
            //////////////////////////////////////////////crm////////////////////////////////////////////////////

            else if (intentName === IntentUtil.intents().opportunity || intentName === 'opportunity' || flowName === 'opportunities') {
                response = await this.Tokenwon(param);
                //response.reset_entities=['']
            }

            else if (intentName === IntentUtil.intents().account_name || flowName === 'customer name') {
                response = await this.Tokenname(param);
                response.reset_entities = ['any']

            }
            /*else if (intentName === IntentUtil.intents().firstname_update || flowName === 'fullname flow'){
                response = await this.Tokenupdate(param);
            
            }*/

            else if (intentName === IntentUtil.intents().click_totalamount) {
                response = await this.Tokentotalw(param);

            }
            /*else if (intentName === IntentUtil.intents().loss||flowName === 'opportunity loss'){
                response = await this.handle12(param);
               response.reset_entities=['']
            }*/
            else if (intentName === IntentUtil.intents().urlname) {
                response = await this.handlewebmonitoring(param);
            }

            else if (intentName === IntentUtil.intents().statuscodename) {
                response = await this.handlewebmonitoringcode(param);
            }

            else if (intentName === IntentUtil.intents().webusername) {
                response = await this.handlewebmonitoringhostname(param);
                response.reset_entities = ['any']
                response.parameters.any = "";
            }



            ///////////////////////////////////////////////////////////////////
            else if (intentName === IntentUtil.intents().UIPath) {
                response = await this.handleUIProcess(param);

            }

            
            else if (intentName === IntentUtil.intents().ui_process) {
                response = await this.handleUIpathProcess(param)
            }











            /////////////////////////////////////////////////////////////////////

            else if (intentName === IntentUtil.intents().eventduration) {
                response = await this.handleproblemevents(param);
            }

            else if (intentName === IntentUtil.intents().reportgentask) {
                response = await this.handlereport(param);
            }

            console.log("++++++++++++++++++++++++++9897654321  ", JSON.stringify(response));
            res.setHeader('Content-Type', 'application/json');
            res.send(response);
            res.end();
        } catch (e) {
            console.log('Error!', e);
            res.setHeader('Content-Type', 'application/json');
            res.send(this.nlpHandler.fetchUnableProcessResponse());
            res.end();
        }
    };

    async file_execute(request, res) {
        res.set("Access-Control-Allow-Origin", "*");
        res.set("Access-Control-Allow-Headers", "X-Requested-With");
        console.log(request,"----------------------------------")
        try {
            let response = {};
            // console.log("reqqqqqqqquesst" , request)
            // let params = await this.nlpHandler.fetchNlpParams(request);
            const userIdentity = request.body.web_session
            const file_dest = request.files[0].path
            const file_name = request.files[0].originalname
            const param = {
                USER_IDENTITY: userIdentity ,
                file_dest : file_dest,
                file_name : file_name
            }
            console.log("******** NLP RESULT **************");
            console.log(param );
            console.log("******** END OF NLP RESULT **************");
            //  if (intentName === IntentUtil.intents().reportgentask) {
                // response = await this.handleJobmails(param);
                response = await this.handleJobmails(param)
            // }

            console.log("++++++++++++++++++++++++++????????  ", JSON.stringify(response));
            res.setHeader('Content-Type', 'application/json');
            res.send(response);
            res.end();
        } catch (e) {
            console.log('Error!', e);
            res.setHeader('Content-Type', 'application/json');
            res.send(this.nlpHandler.fetchUnableProcessResponse());
            res.end();
        }
    };
    


}


module.exports = WebhookController;

