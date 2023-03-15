const AutomationUtil = require('./automation');

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
        REFRESH_SESSION_TIME: 30 * 1000* 10000,
    }
};

let automationUtil = new AutomationUtil(kaseyaConfig);


async function test () {
    let run = await automationUtil.runProcedure(102402508882267, 392435893);
        console.log(run);

    // console.log('########################################');
    // let log = await automationUtil.fetchProcedureLogs(392435893);
    // console.log(log);
}

test().then(res => {console.log('____________ Test_Complete _____________')});





