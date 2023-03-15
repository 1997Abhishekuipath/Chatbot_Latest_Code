var RestApi = require('./restApi');
const KaseAuthHeader = require('../auth/kaseyaAuthHeader');

var datetime = require('node-datetime');

class ProceduresLogs extends RestApi{

    constructor(config){
        super(config, new KaseAuthHeader(config));
    }
    agentProcedureLogs(agentguid) {
        console.log("this is agent guid", agentguid)
        return this.restGet(`/automation/agentprocs/${agentguid}/history?$top=10&$orderby=LastExecutionTime desc`);
    }
    agentProcedureHis(agentguid) {
           return this.restGet(`/assetmgmt/logs/${agentguid}/agentprocedure?$top=10&$orderby=LastExecution desc`);
    }
}
module.exports = ProceduresLogs;
