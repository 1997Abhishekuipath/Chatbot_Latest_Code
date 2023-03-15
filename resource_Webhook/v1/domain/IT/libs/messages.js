class Messages {
    constructor(){
    }

    static messages(){
        return {
            ERROR : {
                RECORD_NOT_FOUND : 'Record not found',
                ERROR_OCCURRED: 'An Internal error occurred, please after sometime',
                TOKEN_AUTHENTICATION_FAILURE : 'Failed to authenticate token.',
                TOKEN_NOT_PROVIDED : 'No token provided.',
                UNABLE_TO_PROCESS_REQUEST : 'We are unable to process your request at this time.'
            },
            WARNING:{

            },
            INFO:{

            },
            NLP : {  
                NO_COMPONENT_FOUND : 'I am sorry, I could not found any component associated with the action listed.',
                BOT_ACTION_SLOT_TEXT : 'Please choose an action from below list',
                BOT_FAQ_TEXT : 'I can help you with below queries.',
                BOT_TROUBLESHOOT_TEXT : 'Please choose a component from below list for troubleshooting',
                BOT_ACTION_COMPONENT : 'Please choose a component from below list.',
                BOT_ACTION_SLOT_CONFIRMATION_TEXT : 'Please confirm if you would like to proceed with the selected action?',
                BOT_TICKET_CATEGORY_TEXT : 'Please select a ticket category from below list',
                BOT_TICKET_SUBCATEGORY_TEXT : 'Now please select a subcategory',
                APPROVAL_REQUEST_APPROVED : 'Your request for @action (Ticket #) has been approved.',
                APPROVAL_REQUEST_DECLINED : 'Your request for @action (Ticket #) has been declined.',
                APPROVAL_REQUEST : 'Ticket # requested by @email for @action is pending for your approval',
                EXECUTION_REQUEST : 'Ticket # has been created for @action request.',
                EXECUTION_COMPLETED_RESPONSE : '@action has been executed successfully. Please check once.',
                EXECUTION_FAILED_RESPONSE : '@action has been executed but failed . Please contact servicedesk for further assistance.',
                TICKET_CREATED : 'Ticket # has been created for your request.',
                TICKET_CLOSED : 'I have closed the Ticket #.',
                TICKET_CONFIRMATION : 'Ticket # opened against @action is still opened. If you are satisfied with the services, can I close the Ticket?',
                TICKET_OPENED_MANUAL_PROCEDURE : 'Since your request demands manual intervention, I have raised ticker #. Support Staff will assist you soon.',
                TICKET_ERROR : "Ticket hasn't been created for your request. Please try again.",

                TICKET_LOG_RESPONSE : [
                    'I have logged ticket @ticketId for your request. Our service desk support team will assist you soon.',
                    'I have logged ticket @ticketId in service desk. Our support team will get in touch with you shortly'
                ],

                THANKS_TEXT : [
                    'Ok Thanks, Happy to help you. To restart the conversation type hello/help',
                    'Ok Thanks, Happy to help you. To restart the conversation type hello/help'
                ],

                TROUBLESHOOTING_TEXT : [
                    'I am troubleshooting @component for you. And I have created ticket @ticketId for same.',
                    'Please wait, I am troubleshooting @component and will notify once completed. Also I have raised service desk ticket for same.'
                ],
            
                COMPONENT_NOT_FOUND : "I am sorry, I don't have this component listed with me.",
            },

            RESPONSE :{
                ERROR : "ERROR",
                SUCCESS : "SUCCESS"
            }
        };
    }
}

module.exports = Messages;