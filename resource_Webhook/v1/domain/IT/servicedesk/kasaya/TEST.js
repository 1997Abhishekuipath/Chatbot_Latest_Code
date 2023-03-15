const ServiceDeskUtil = require('./servicedesk');

let kaseyaConfig = {
    USERNAME : 'bot',
    PASSWORD : 'bot@#1234',
    SERVER_URL: "http://10.250.8.81/",
    HOST_URL: "10.250.8.81",
    REFRESH_TOKEN_TIME : 30 * 1000* 10000,
    SOAP : {
        IP : '10.250.8.81',
        HASH_ALGO : 'SHA-256',
        SERVICE_DESK : 'Incident',
        SERVICE_DESK_ID : '17041199210084144354247584',
        REFRESH_SESSION_TIME: 30 * 1000* 10000,
    }
};


let serviceDeskUtil = new ServiceDeskUtil(kaseyaConfig);
// 548506680226231/582579179/


async function test () {
    let ticketjson = {
        Status: '1.New',
        Priority: 'Medium',
        Category: '179928969955039',
        SubCategory : '934755287056208',
        Summary: 'this is sumaryy',

        submiterEmail: 'bsingh@gmail.com',
    };
    console.log('########################################');
    let ticket = await serviceDeskUtil.createTicket(ticketjson);
    console.log(ticket);
    // let ticketId = ticket.IncidentNumber;
    // console.log(ticketId);
    // console.log('########################################');
    // let ticketClose = await serviceDeskUtil.updateTicket(ticketId, 'Closed');
    // console.log(ticketClose);

}

test().then(res => {console.log('____________ Test_Complete _____________')});






