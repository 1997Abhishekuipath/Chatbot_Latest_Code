class Constants {
    constructor(){
    }

    static constants(){
        return {
            NLP_PLATFORM : {
                DIALOGFLOW : 'DIALOGFLOW',
                RASA : 'RASA'
            },
            SERVICE_DESKS : {
                KASAYA : 'KASAYA',
                SUMMIT : 'SUMMIT'
            },

            TICKET_STATUS : {
                CLOSED : 'Closed',
                OPEN: 'Open',
                WORKING : 'Working'
            },

            NOTIFICATION_STATUS : {
                SEEN : 'Seen',
                NOT_SEEN: 'NotSeen'
            },

            NOTIFICATION_CATEGORY : {
                APPROVAL_REQUEST : 'ApprovalRequest',
                APPROVAL_RESPONSE : 'ApprovalResponse',
                EXECUTION_REQUEST : 'ExecutionRequest',
                EXECUTION_RESPONSE : 'ExecutionResponse',
                TICKET_CONFIRMATION : 'TicketConfirmation',
                TICKET_CLOSE : 'TicketClose',
                TICKET_CREATE: 'TicketCreate',
                TICKET_CREATE_MANUAL : 'TicketCreatedManualProcedure',
                TICKET_ERROR : 'TicketError'
            },

            NOTIFICATION_TYPE : {
                VIEW : 'View',
                CONFIRMATION: 'Confirmation',
                APPROVAL : 'Approval'
            },

            EXECUTION_STATUS : {
                PENDING : 'Pending',
                HALTED : 'Halted',
                RUNNING : 'Running',
                COMPLETED : 'Completed',
                FAILED : 'Failed'
            },

            APPROVAL_STATUS : {
                PENDING : 'Pending',
                APPROVED : 'Approved',
                REJECTED :'Rejected'
            },

            CLOSING_LEVEL : {
                AUTOMATIC : 'Automatic',
                MANUAL : 'Manual',
                CONFIRMATION: 'Confirmation'
            },

            BROWSER : ['Internet Explorer', 'FIREFOX', 'CHROME', 'EDGE', 'SAFARI']
        };
    }
}

module.exports = Constants;