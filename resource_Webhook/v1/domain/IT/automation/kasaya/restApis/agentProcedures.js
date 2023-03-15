/// var Auth = require('./auth/auth');
var RestApi = require('./restApi');

const KaseAuthHeader = require('../auth/kaseyaAuthHeader');

class AgentProcedures extends RestApi{
    constructor(config){
        super(config, new KaseAuthHeader(config));
    }
    ///////////////////////////////////////////////////////////////////////////////////////////clientid
    runProcedure(clientId, procId) {

        // var clientId1 = 422663950078964;
        console.log("------------------procedure----------------",clientId,procId)
        return this.restPut(`/automation/agentprocs/${clientId}/${procId}/runnow`);
    }
    test(url, method) {
        let teststring = `this.rest${method}`;
        let f = eval(teststring);
        return f.call(this, url)
    }
}
module.exports = AgentProcedures;

