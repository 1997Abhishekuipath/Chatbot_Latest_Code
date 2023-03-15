function getServiceDeskType(action,type){
    let val = null;
   switch (action) {
       case "SECURITY":
            val = !type?this.SOAP.SERVICE_DESK_PROBLEM:this.SOAP.SERVICE_DESK_ID_PROBLEM;
            break;     
       default:
            val = !type?this.SOAP.SERVICE_DESK:this.SOAP.SERVICE_DESK_ID  
           break;
   }
   return val;
}

function getServiceDeskTemplate(action){
    let val = null;
   switch (action) {
       case "SECURITY":
            val = 'service_request';
            break;     
       default:
            val = 'incident'; 
           break;
   }
   return val;
}



module.exports = {
    getServiceDeskType:getServiceDeskType,
    getServiceDeskTemplate:getServiceDeskTemplate
}