const Constants = require('../../../../../domain/IT/libs/constants');

class ConstantUtil extends Constants{
    constructor(){
        super();
    }

    static newConstants(){
        return {
            USER_QUERY : "SELECT vsummary.agentGuid, vsummary.displayName, vsummary.groupName, \n" +
            "vsummary.contactName,vsummary.contactEmail,vsummary.contactPhone,voip.[VOIP_NO], \n" +
            "CONVERT(varchar(26), vagents.machGroupGuid) as machGroupGuid,vagents.reverseName,c.value07 as mgrName,c.value20 as mgrEmail \n" +
            "FROM vAgentSummaryGridContents as vsummary inner join  \n" +
            "[dbo].[vAgentsAll]  as vagents on vsummary.agentGuid = vagents.agentGuid \n" +
            "left join (select agentGuid,fieldValue as [VOIP_NO] from vSystemInfoManual where fieldName ='VOIP') voip \n" +
            "on voip.agentGuid=vagents.agentGuid \n"+
            "left join  VMachCustFields c on vsummary.agentGuid=c.agentGuid",


            USER_QUERY: "SELECT u.agentGuid, MachineId AS displayName, v.ReverseGroupName as GroupName, \n"+
             "value01 AS contactName, value03 AS contactEmail, u.contactPhone, value35 AS VOIP_NO, \n"+
             "CONVERT(varchar(26),machGroupGuid)machGroupGuid,v.GroupName AS reverseName, value07 AS mgrName, value20 AS mgrEmail \n"+
             "FROM vAuditMachineSummary v join machGroup m on m.groupName=v.groupName join users u on u.agentGuid=v.agentGuid",

             USER_QUERY_res : "select * from PresalesPortal.dbo.ChatBot_vUsers",
             USER_QUERY1: "SELECT users.id, EMPID, EMPName, email, Designation, Department, Sub_Department, users.Mobile_Number, User_data.agentGuid FROM users  left join User_data on users.email=User_data.ContactEmail where users.status ='1' and users.email !=''"
            
        };
    }
}

module.exports = ConstantUtil;