const MongoUtil = require('../../../common/libs/mongo-util');
const Constants = require('../libs/constants');
const KasayaServiceDeskUtil = require('../servicedesk/kasaya/servicedesk');

class TicketUtil {
    constructor(url, serviceDesk, serviceDeskConfig) {
        this.mongoUtil = new MongoUtil(url);
        this.serviceDesk = serviceDesk;

        if (serviceDesk === Constants.constants().SERVICE_DESKS.KASAYA) {
            this.kasayaServiceDesk = new KasayaServiceDeskUtil(serviceDeskConfig);
        }
        else if (serviceDesk === Constants.constants().SERVICE_DESKS.SUMMIT) {
            //TODO
        }
    }

    async createTicketInDB(ticket) {
        console.log("CREATING TICKET IN DB");
        try {
            //delete ticket.response;
            let result = await this.mongoUtil.createRecord("IT_tickets", ticket);
            return result;
        } catch (err) {
            throw new Error(err)
        }
    };

    async updateTicketInDB(ticketId, status) {
        console.log("UPDATING TICKET IN DB");
        try {
            let query = { ticketId: ticketId };
            let values = { $set: { ticketStatus: status } };
            let result = await this.mongoUtil.updateRecord("IT_tickets", query, values);
            return result;
        } catch (err) {
            throw new Error(err)
        }
    };

    async createTicketInServiceDesk(ticketJSON, customTicketJSON, param) {
        console.log("CREATING TICKET IN SERVICE DESK");
        try {
            if (this.serviceDesk === Constants.constants().SERVICE_DESKS.KASAYA) {
                let result = await this.kasayaServiceDesk.createTicket(ticketJSON, customTicketJSON, param);
                console.log("createTicketInServiceDesk result is", result);
                return result;
            } else if (this.serviceDesk === Constants.constants().SERVICE_DESKS.SUMMIT) {
                //TODO
            }
        } catch (err) {
            throw new Error(err)
        }
    };

    async updateTicketInServiceDesk(ticketJSON, customTicketJSON, param) {
        console.log("UPDATING TICKET IN SERVICE DESK");
        try {
            if (this.serviceDesk === Constants.constants().SERVICE_DESKS.KASAYA) {
                let result = await this.kasayaServiceDesk.updateTicket(ticketJSON, customTicketJSON, param);
                return result;
            } else if (this.serviceDesk === Constants.constants().SERVICE_DESKS.SUMMIT) {
                //TODO
            }
        } catch (err) {
            throw new Error(err)
        }
    };
    async getTicketInServiceDesk(ticket_id) {
        console.log("get ticket details in service desk");
        try {
            if (this.serviceDesk === Constants.constants().SERVICE_DESKS.KASAYA) {
                let result = await this.kasayaServiceDesk.getTicket(ticket_id);
                return result;
            } else if (this.serviceDesk === Constants.constants().SERVICE_DESKS.SUMMIT) {
                //TODO
            }
        } catch (err) {
            throw new Error(err)
        }
    };
    async fetchTicketCategories() {
        console.log("FETCHING TICKET CATEGORY");
        try {
            let query = {};
            let fields = { categoryName: 1 };
            let sort = { categoryName: 1 };
            let result = await this.mongoUtil.findSortedRecord("IT_ticketCategories", query, fields, sort);
            return result;
        } catch (err) {
            throw new Error(err)
        }
    };

    async fetchTicketSubCategories(category) {
        console.log("FETCHING TICKET SUB CATEGORY");
        try {
            let query = { categoryName: category };
            let fields = {};
            let sort = { "subcategory.subcategoryName": 1 };
            let result = await this.mongoUtil.findSortedRecord("IT_ticketCategories", query, fields, sort);
            return result;
        } catch (err) {
            throw new Error(err)
        }
    };

    async fetchTicketCategoryId(category) {
        console.log("FETCHING TICKET CATEGORY ID", category);
        try {
            category = category.toUpperCase();
            let query = { categoryName: category };
            let fields = { categoryId: 1 };
            console.log("CATEGORY QUERY", query);
            let result = await this.mongoUtil.findRecord("IT_ticketCategories", query, fields);
            console.log("ticket category id", result)
            return result;
        } catch (err) {
            throw new Error(err)
        }
    };

    async fetchTicketSubCategoryId(subcategory) {
        console.log("FETCHING TICKET SUB CATEGORY ID");
        try {
            let query = { "subcategory.subcategoryName": subcategory };
            let fields = { _id: 0, subcategory: { $elemMatch: { subcategoryName: subcategory } } };
            console.log("SUBCATEGORY QUERY", query);
            let result = await this.mongoUtil.findRecord("IT_ticketCategories", query, fields);
            return result;
        } catch (err) {
            throw new Error(err)
        }
    };

    async fetchTicketStatus(userIdentity, status) {
        console.log("FETCHING TICKETS STATUS");
        try {
            let query = { userIdentity: userIdentity };
            if (status) {
                query = {
                    userIdentity: userIdentity,
                    ticketStatus: status
                };
            }
            let fields = {};
            let sort = { "createdOn": -1 };
            console.log("query", query)
            let result = await this.mongoUtil.findSortedRecord("IT_tickets", query, fields, sort);
            console.log("result", result.length)
            return result;
        } catch (err) {
            throw new Error(err)
        }
    };
    async fetchTicketDetails(userIdentity, ticket_id) {
        console.log("FETCHING TICKETS DETAILS");
        try {
            let query = {
                    userIdentity: userIdentity,
                    ticketId: ticket_id
                };
            
            let fields = {};
            console.log("query", query)
            let result = await this.mongoUtil.findRecord("IT_tickets", query, fields);
            console.log("result", result)
            return result;
        } catch (err) {
            throw new Error(err)
        }
    };
}


module.exports = TicketUtil;