const schedule = require('node-schedule');

const config = require('../../IT/bot/libs/config-util');
const ConstantUtil = require('../../IT/bot/libs/constant-util');
const WebhookController = require('../bot/controllers/webhook');
const webhookController = new WebhookController();
const SyncUtil = require('../../../../domain/IT/sync/kasaya/sync');
const ProcedureUtil = require('../../../../domain/IT/services/procedure');
const syncUtil = new SyncUtil(config);



const cron1 = '*/840000 * * * * *';
const job1 = schedule.scheduleJob(cron1, function (fireDate) {
    console.log('Executing Ticketing Sync Job at '+ fireDate);
    webhookController.executeTicketSyncJob()
        .then(result => {
            console.log("result" ,result);
        })
        .catch(error => {
            console.log("ERROR:: " +error);
        });
        
         //synclastlogin();
 });

// const cron2 = {hour: 8, minute: 00, dayOfWeek: [0,1,2,3,4,5,6]};
// const job2 = schedule.scheduleJob(cron2, function(firedate){
//     console.log('Executing User Sync Job at ' + firedate);
//     syncPCUsers();
    // syncUsers();
   //syncuser();
   //synccrmuser();
    
// });

// const cron3 = "*/300 * * * * *";
// const job3 = schedule.scheduleJob(cron3, function(firedate){
//     console.log("updating ticket status"+firedate);
//      id_update();
//      pid();

    
    
//  });





// const cron3 = {hour: 1, minute: 00, dayOfWeek: [0,1,2,3,4,5,6]};
// const job3 = schedule.scheduleJob(cron3, function(firedate){
//     console.log('Executing User Sync Job at ' + firedate);
//     synctrigger();
    
    

// });
////////////////////////////////////////crm///////////////////////////////////////
// function synccustomer (){

//     syncUtil.TokenFetchJob12()
//         .then(result => {
//          console.log("Done")
//         })
//         .catch(error => {
//             console.log("ERROR:: " +error);
//         });
// }
// //synccustomer();


// function synccrmuser (){

//     syncUtil.TokenFetchJob2()
//         .then(result => {
//          console.log("Done")
//         })
//         .catch(error => {
//             console.log("ERROR:: " +error);
//         });
// }
// //synccrmuser();


// function syncUsers(){
//     syncUtil.executeUserSync({QUERY : ConstantUtil.newConstants().USER_QUERY1})
//     .then(result => {
//         console.log("done flexi");
//     })
//     .catch(error => {
//         console.log("ERROR:: " +error);
//     });
// }


function syncUsersResource(){
    syncUtil.executeUserResource({QUERY : ConstantUtil.newConstants().USER_QUERY_res})
    .then(result => {
        console.log("done flexi");
    })
    .catch(error => {
        console.log("ERROR:: " +error);
    });
}
// syncUsersResource();


// function syncPCUsers(){
//     console.log("i m inside pc users")

//     syncUtil.executePCUserSync({QUERY : ConstantUtil.newConstants().USER_QUERY})
//     .then(result => {
//         console.log("done PC users");
//     })
//     .catch(error => {
//         console.log("ERROR:: " +error);
//     });
// }

// syncPCUsers();
// syncUsers();

// // function syncemail (){

// //     syncUtil.TokenFetchJob()
// //         .then(result => {
// //          console.log("Done")
// //         })
// //         .catch(error => {
// //             console.log("ERROR:: " +error);
// //         });
// // }
// // syncemail();

// function synchostgroup (){
//     syncUtil.gethostgroup()
//     .then(result => {
//         console.log("Done hostgroup")
//        })
//        .catch(error => {
//            console.log("ERROR:: " +error);
//        });
// }
// //synchostgroup();

// function synchost (){
//     syncUtil.gethostsyncing()
//     .then(result => {
//         console.log("Done sync host")
//        })
//        .catch(error => {
//            console.log("ERROR:: " +error);
//        });
// }
// //synchost();

// function syncuser (){
//     console.log("i am in user")
//     syncUtil.getuser()
//     .then(result => {
//         console.log("Done hms user")
//        })
//        .catch(error => {
//            console.log("ERROR:: " +error);
//        });
// }
// //syncuser();

// function syncuseraccess (){
//     syncUtil.getuserforaccess()
//     .then(result => {
//         console.log("Done")
//        })
//        .catch(error => {
//            console.log("ERROR:: " +error);
//        });
// }
// //syncuseraccess();

// function syncusergroup (){
//     syncUtil.getusergroup()
//     .then(result => {
//         console.log("Done user group")
//        })
//        .catch(error => {
//            console.log("ERROR:: " +error);
//        });
// }
// //syncusergroup();

// function synclastlogin (){
//     syncUtil.getuserlastlogin()
//     .then(result => {
//         console.log("Done last login")
//        })
//        .catch(error => {
//            console.log("ERROR:: " +error);
//        });
// }
//synclastlogin();

// function synctrigger (){
//     syncUtil.triggersync()
//     .then(result => {
//         console.log("Done trigger")
//        })
//        .catch(error => {
//            console.log("ERROR:: " +error);
//        });
// }
// //synctrigger();

function getaccesstoken(){
    syncUtil.accesstoken()
    .then(result=>{
        console.log("token fetched")
    })
    .catch(error => {
        console.log("ERROR:: " +error);
    });
}
// getaccesstoken();

function getfolders(){
    syncUtil.folders()
    .then(result=>{
        console.log("folder")
    })
    .catch(error => {
        console.log("ERROR:: " +error);
    });
}
// getfolders();

function run_process(){
    syncUtil.run_process()
    .then(result=>{
        console.log("process ran")
    })
    .catch(error => {
        console.log("ERROR:: " +error);
    });}
//   run_process();

function triggerProcess(){
    syncUtil.triggerProcess()
    .then(result=>{
        console.log("execution done")
    })
    .catch(error => {
        console.log("ERROR:: " +error);
    });
}
    // triggerProcess();

     function id_update(){
        syncUtil.job_status()
        .then(result=>{
            console.log("execution done")
        })
        .catch(error => {
            console.log("ERROR:: " +error);
        });
    }
    // id_update();

    function pid(){
        syncUtil.fetchPId()
        .then(result=>{
            console.log("execution done")
        })
        .catch(error => {
            console.log("ERROR:: " +error);
        });
    }
    // pid();



    


