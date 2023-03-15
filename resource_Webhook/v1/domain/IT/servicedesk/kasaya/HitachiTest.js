const ServiceDeskUtil = require('./servicedesk');

let kaseyaConfig = {
    USERNAME : 'automation',
    PASSWORD : 'qwert@#1234',
    HOST_URL: "pcv-demo.hitachi-systems-mc.com",
    REFRESH_TOKEN_TIME : 30 * 1000* 10000,
    SOAP : {
        IP : '119.82.92.55',
        HASH_ALGO : 'SHA-256',
        SERVICE_DESK : 'Incident',
        SERVICE_DESK_ID : '41334541980004371136012999',
        SERVICE_DESK_PROBLEM: "Problem",
        SERVICE_DESK_ID_PROBLEM: "39611074020090634046495477",
        REFRESH_SESSION_TIME: 30 * 1000* 10000,
    }
};


let serviceDeskUtil = new ServiceDeskUtil(kaseyaConfig);
// 548506680226231/582579179/


async function test () {
    let ticketjson = {
        Status: '1.New',
        Priority: 'Medium',
        Category: '235062439709465',
        SubCategory : '367375443767465',
        Summary: 'Testing',
        SubmitterEmail: 'sidharth.sasikumar.fw@hitachi-systems.com',
        Submitter:'Sidharth Sasikumar',
    };

    let CustomJSON={
        ChangeRequest:'No',
        ProblemRecord:'No',
        Source:'Call',
        KB_Article:'No',
        ContactNumberNew:'8920220883',
        VOIPNew:'242',
        CRNumber1:'',
        CRRequired:'',
        ExpectedClosureDate:'',
        Submitter:'Sidharth Sasikumar',
        CreatedBy:'BOT'
    };


    let ticketUpdatejson={
        IncidentNumber:'',
        Summary:'Testing',
        Description:'resolved',
        Status: 'Incident||Resolved',
        Resolution: 'Incident||Resolved',
        Stage: 'Incident||Resolved',
        ResolutionNote: 'resolved',

    };

    let customUpdateJSON={
        Urgency: 'Medium',
        ChangeRequest: 'No',
        ProblemRecord: 'No',
        Source: 'Call',
        KB_Article: 'No',
        EngineerName: 'BOT',
        EngineerEmail: 'itsupport.ef@hitachi-systems.com',
        CRRequired: 'No',
        CreatedBy: 'bot'
    };

    console.log('########################################');
    let ticket = await serviceDeskUtil.createTicket(ticketjson,CustomJSON);
    console.log(ticket);
    ticketUpdatejson.IncidentNumber= ticket.IncidentNumber;
    console.log('########################################');
    let ticketClose = await serviceDeskUtil.updateTicket(ticketUpdatejson, customUpdateJSON);
    console.log(ticketClose);

}

test().then(res => {console.log('____________ Test_Complete _____________')});






