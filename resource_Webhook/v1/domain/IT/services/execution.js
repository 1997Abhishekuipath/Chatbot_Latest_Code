const MongoUtil = require('../../../common/libs/mongo-util');
const AutomationUtil = require('../automation/kasaya/automation');

class ExecutionUtil {
    constructor(url, config) {
        this.mongoUtil = new MongoUtil(url);
        this.automationUtil = new AutomationUtil(config);
    }

    async createExecution (execution) {
        console.log("CREATING EXECUTION");
        try {
            const executionId = await this.mongoUtil.fetchSequenceValue("executionId");
            execution.executionId = executionId;
            let result = await this.mongoUtil.createRecord("IT_execution", execution);
            return result;
        } catch (err) {
            throw new Error(err)
        }
    };

    async  updateExecution (procedureId, ticketId, execution) {
        console.log("UPDATING EXECUTION");
        try {
            let query = {$and: [{procedureId: procedureId}, {ticketId: ticketId}]};
            let values = {$set: execution};
            //let values = {notificationStatus: 'Seen'};
            let result = await this.mongoUtil.updateRecord("IT_execution", query, values);
            return result;
        } catch (err) {
            throw new Error(err)
        }
    };

    async updateExecutionStatus (ticketId, procedureId, status, startTime, endTime) {
        console.log("UPDATING EXECUTION STATUS IN DB");
        try {
            let query = {$and: [{procedureId: procedureId}, {ticketId: ticketId}]};
            let values = {$set: {executionStatus: status}};
            if(startTime){
                values = {$set: {executionStatus: status, startTime : startTime}};
            }
            if(endTime){
                values = {$set: {executionStatus: status, endTime : endTime}};
            }
            //let values = {notificationStatus: 'Seen'};
            let result = await this.mongoUtil.updateRecord("IT_execution", query, values);
            return result;
        } catch (err) {
            throw new Error(err)
        }
    };

    async executeAction(userIdentity, procedureId) {
        console.log("EXECUTING ACTION");
        return this.automationUtil.runProcedure(userIdentity,procedureId);
    };

    async fetchProcedureLogs (userIdentity) {
        console.log(userIdentity);
        console.log("FETCHING PROCEDURE LOGS FOR " + userIdentity);
        try {
            let result = await this.automationUtil.fetchProcedureLogs(userIdentity);
            return result;
        } catch (err) {
            throw new Error(err)
        }
    };

    async fetchExecutionDetails(status) {
        try {
            console.log("fetchExecutionDetails");
            let array1 = [];
            let lookup1 = {
                $lookup: {
                    from: "IT_procedures",
                    localField: "procedureId",
                    foreignField: "procedureId",
                    as: "fromProcedures"
                }
            };

            let replaceRoot1 = {
                $replaceRoot: {
                    newRoot: {$mergeObjects: [{$arrayElemAt: ["$fromProcedures", 0]}, "$$ROOT"]}
                }
            };

            let match1 = {
                $match: {executionStatus:status }
            };

            let project1 = {
                $project: {
                    _id : 0,
                    executionId : 1,
                    procedureId : 1,
                    userIdentity : 1,
                    ticketId : 1,
                    startTime : 1,
                    procedureName:1,
                    closingLevel:1,
                    action:1,
                    component:1,
                    summary:1
                }
            };

            array1.push(lookup1);
            array1.push(replaceRoot1);
            array1.push(match1);
            array1.push(project1);
            let result = this.mongoUtil.findAggregatedRecords("IT_execution", array1);
            return result;
        } catch (err) {
            throw new Error(err)
        }
    };

}


module.exports = ExecutionUtil;