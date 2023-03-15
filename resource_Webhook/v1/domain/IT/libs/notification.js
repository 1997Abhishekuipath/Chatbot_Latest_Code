const Constants = require('./constants');
const Messages = require('./messages');

module.exports = {
    approvalResponse : async (param) =>{
        //To User
        let detail = {};
        let msg = Messages.messages().NLP.APPROVAL_REQUEST_APPROVED;
        if(param.STATUS===Constants.constants().APPROVAL_STATUS.REJECTED){
            msg = Messages.messages().NLP.APPROVAL_REQUEST_DECLINED;
            detail.comment = param.COMMENT;
        }
        msg = msg.replace('#', param.TICKET_ID);
        msg = msg.replace('@action', param.ACTION);
        detail.message = msg;
        return detail;
    },

    approvalRequest : async (param) =>{
        //To Manager
        let detail = {};
        let buttons = [
            {  "type": "postback",
                "title": "Approve",
                "payload": "Approved"
            },
            {
                "type": "postback",
                "title": "Reject",
                "payload": "Rejected"
            }
        ];

        let msg = Messages.messages().NLP.APPROVAL_REQUEST;
        msg = msg.replace('#', param.TICKET_ID);
        msg = msg.replace('@email', param.USER_EMAIL);
        msg = msg.replace('@action', param.ACTION);

        detail.buttons = buttons;
        detail.message = msg;
        detail.reason = param.REASON;
        return detail;
    },

    executionRequest : async (param) =>{
        //To User
        let detail = {};
        let msg = Messages.messages().NLP.EXECUTION_REQUEST;
        msg = msg.replace('#', param.TICKET_ID);
        msg = msg.replace('@action', param.ACTION);
        detail.message = msg;
        return detail;
    },

    executionResponse : async (param) =>{
        //To User
        let detail = {};
        let msg = Messages.messages().NLP.EXECUTION_COMPLETED_RESPONSE;
        if(param.status === Constants.constants().EXECUTION_STATUS.FAILED){
            msg = Messages.messages().NLP.EXECUTION_FAILED_RESPONSE;
        }
        msg = msg.replace('@action', param.ACTION);
        detail.message = msg;
        return detail;
    },

    ticketConfirmation : async (param) =>{
        //To User
        let detail = {};

        let buttons = [
            {  "type": "postback",
                "payload": "Close",
                "title": "Yes"
            },
            {
                "type": "postback",
                "payload": "Open",
                "title": "No"
            }
        ];

        let msg = Messages.messages().NLP.TICKET_CONFIRMATION;
        msg = msg.replace('#', param.TICKET_ID);
        msg = msg.replace('@action', param.ACTION);
        detail.message = msg;
        detail.buttons = buttons;
        return detail;
    },

    ticketClose: async (param) =>{
        //To User
        let detail = {};
        let msg = Messages.messages().NLP.TICKET_CLOSED;
        msg = msg.replace('#', param.TICKET_ID);
        msg = msg.replace('@action', param.ACTION);
        detail.message = msg;
        return detail;
    },

    ticketCreatedForManualProcedure: async (param) =>{
        //To User
        let detail = {};
        let msg = Messages.messages().NLP.TICKET_OPENED_MANUAL_PROCEDURE;
        msg = msg.replace('#', param.TICKET_ID);
        msg = msg.replace('@action', param.ACTION);
        detail.message = msg;
        return detail;
    },

    ticketCreate: async (param) =>{
        //To User
        let detail = {};
        let msg = Messages.messages().NLP.TICKET_CREATED;
        msg = msg.replace('#', param.TICKET_ID);
        detail.message = msg;
        return detail;
    },

    ticketError: async (param) =>{
        //To User
        let detail = {};
        let msg = Messages.messages().NLP.TICKET_ERROR;
        detail.message = msg;
        return detail;
    }
};