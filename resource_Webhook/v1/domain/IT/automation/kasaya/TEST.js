const AutomationUtil = require('./automation');

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
        SERVICE_DESK_PROBLEM: "Problem",
        SERVICE_DESK_ID_PROBLEM: "39611074020090634046495477",
        REFRESH_SESSION_TIME: 30 * 1000* 10000,
    }
};



let automationUtil = new AutomationUtil(kaseyaConfig);


async function test () {
    let run = await automationUtil.runProcedure(277310793459789, 392435893);
        console.log(run);

    console.log('########################################');
    // let log = await automationUtil.fetchProcedureLogs(548506680226231);
    // console.log(log);
}

test().then(res => {console.log('____________ Test_Complete _____________')});





