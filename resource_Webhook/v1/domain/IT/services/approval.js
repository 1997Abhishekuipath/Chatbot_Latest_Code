const MongoUtil = require('../../../common/libs/mongo-util');

class ApprovalUtil {
    constructor(url) {
        this.mongoUtil = new MongoUtil(url);
    }

    async createApproval(approval) {
        console.log("CREATING APPROVAL");
        try {
            const approvalId = await this.mongoUtil.fetchSequenceValue("approvalId");
            approval.approvalId = approvalId;
            let result = await this.mongoUtil.createRecord("IT_approvals", approval);
            return result;
        } catch (err) {
            throw new Error(err)
        }
    };

    async updateApproval(ticketId,procedureId,approvalStatus,comment) {
        console.log("UPDATING APPROVAL");
        try {
            let query = {$and: [{ticketId: ticketId}, {procedureId: procedureId}]};
            let values = {$set: {approvalStatus: approvalStatus, comment : comment}};
            // let values = {approvalStatus: approvalStatus, comment : comment};
            let result = await this.mongoUtil.updateRecord("IT_approvals", query, values);
            return result;
        } catch (err) {
            throw new Error(err)
        }
    };
}

module.exports = ApprovalUtil;