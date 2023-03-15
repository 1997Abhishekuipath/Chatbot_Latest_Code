const ticketRest = require('./restApis/ticketRest');
const KaseyaTicket = require('./soapApis/kaseyaTicket');
const { REST, SOAP } = require('./config/config');

//ServerUrl is used for REST CALL;
/*
* for http pass SERVER_URL ,
* host create https// request URL
* */
class ServiceDeskUtil {

    constructor(kaseyaConfig) {
        kaseyaConfig.SERVER_URL = kaseyaConfig.SERVER_URL || `https://${kaseyaConfig.HOST_URL}/`;

        /* _____## REST SERICE END POINT CHECK  ##_______*/
        kaseyaConfig.AUTH_URL = kaseyaConfig.AUTH_URL || (kaseyaConfig.SERVER_URL + REST.AUTH_END_PONT);
        kaseyaConfig.API_URL = kaseyaConfig.API_URL || kaseyaConfig.SERVER_URL + REST.API_END_POINT;

        /* _____ ## SOAP SERICE END POINT CHECK  ## _______*/
        kaseyaConfig.SOAP.AUTH_END_PONT = kaseyaConfig.SOAP.AUTH_END_PONT || SOAP.AUTH_END_PONT;
        kaseyaConfig.SOAP.TICKET_PATH = kaseyaConfig.SOAP.TICKET_PATH || SOAP.TICKET_PATH;
        //  kaseyaConfig.API_URL = kaseyaConfig.API_URL || kaseyaConfig.SERVER_URL + REST.API_END_POINT;

        this.initInstance(kaseyaConfig)
    }

    initInstance(config) {
        this.kaseyaTicket = new KaseyaTicket(config);
        this.ticketRest = new ticketRest(config);
    }

    createTicket(ticketJSON,customTicketJSON,param) {
        return this.kaseyaTicket.createTicket(ticketJSON,customTicketJSON,param)
    }
    updateTicket(ticketJSON,customTicketJSON,param) {
        return this.kaseyaTicket.updateTicket(ticketJSON,customTicketJSON,param);
    }
    getTicket(ticket_id) {
        return this.kaseyaTicket.getTicket(ticket_id);
    }

}

module.exports = ServiceDeskUtil;

