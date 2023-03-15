const AgentProcedures = require('./restApis/agentProcedures');
const ProceduresLogs = require('./restApis/proceduresLogs');
const { REST, SOAP } = require('./config/config');

//ServerUrl is used for REST CALL;
/*
* for http pass SERVER_URL ,
* host create https// request URL
* */
class AutomationUtil {

    constructor(kaseyaConfig) {
        kaseyaConfig.SERVER_URL = kaseyaConfig.SERVER_URL || `https://${kaseyaConfig.HOST_URL}/`;

        /* _____## REST SERICE END POINT CHECK  ##_______*/
        kaseyaConfig.AUTH_URL = kaseyaConfig.AUTH_URL || (kaseyaConfig.SERVER_URL + REST.AUTH_END_PONT);
        kaseyaConfig.API_URL = kaseyaConfig.API_URL || kaseyaConfig.SERVER_URL + REST.API_END_POINT;

        /* _____ ## SOAP SERICE END POINT CHECK  ## _______*/
        kaseyaConfig.SOAP.AUTH_END_PONT = kaseyaConfig.SOAP.AUTH_END_PONT || SOAP.AUTH_END_PONT;
        //  kaseyaConfig.API_URL = kaseyaConfig.API_URL || kaseyaConfig.SERVER_URL + REST.API_END_POINT;

        this.initInstance(kaseyaConfig)
    }

    initInstance(config) {
        this.agentProcedure = new AgentProcedures(config);
        this.procedureLog = new ProceduresLogs(config);
    }

    runProcedure (agent_id, proc_id) {
        return this.agentProcedure.runProcedure(agent_id, proc_id);
    };

     async fetchProcedureLogs (agent_id) {
        return this.procedureLog.agentProcedureLogs(agent_id);
    }
}

module.exports = AutomationUtil;

