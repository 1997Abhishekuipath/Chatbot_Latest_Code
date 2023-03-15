var RestApi = require('./restApi');
const KaseAuthHeader = require('../auth/kaseyaAuthHeader');
const { getServiceDeskType } = require('../helpers/serviceDeskHelper');

class TicketRest extends RestApi {

    constructor(config) {
        super(config, new KaseAuthHeader(config));
        this.config = config;
    };

    updateStatus(ticketId, statusId) {
        return this.restPut(`/automation/servicedesktickets/${ticketId}/status/${statusId}`);
    };

    serviceDeskStatus(serviceDeskId) {
        return this.restGet(`/automation/servicedesks/${serviceDeskId}/status`);
    };

    serviceDeskTicketByRef(serviceDeskId, ticketRef) {
        return this.restGet(`/automation/servicedesks/${serviceDeskId}/tickets?$filter=TicketRef eq '${ticketRef}'`);
    };

    async updateTicketStatus(ticketRef, status,action) {
        let service_ID = getServiceDeskType.call(this.config,action,'id');
        let result = await this.serviceDeskStatus(service_ID);
        let allStatus = JSON.parse(result.body)["Result"];
        for (let i = 0; i < allStatus.length; i++) {
            let singleData = allStatus[i];
            console.log(singleData);
            if (singleData.StatusName == status) {
                let ticket = await this.serviceDeskTicketByRef(service_ID, ticketRef);
                let ticketId = JSON.parse(ticket.body)["Result"][0]['ServiceDeskTicketId']
                let data = await this.updateStatus(ticketId, singleData.StatusId)
                return data;
                break;
            }
        }
        throw "status not found";
    }

    test(url, method) {
        let teststring = `this.rest${method}`;
        let f = eval(teststring);
        return f.call(this, url);
    }
}

module.exports = TicketRest;