const MongoUtil = require('../../../common/libs/mongo-util');

class ProcedureUtil {
    constructor(url) {
        this.mongoUtil = new MongoUtil(url);
    }

    async fetchProcedureDetail(procedureId) {
        console.log("FETCHING PROCEDURE DETAIL BY PROCEDURE ID");
        try {
            let query = { procedureId: procedureId };
            let fields = {};
            let result = await this.mongoUtil.findRecord("IT_procedures", query, fields);
            return result;
        } catch (err) {
            throw new Error(err)
        }
    };

    async fetchProcedureDetailByActionComponent(action, component, category) {
        console.log("FETCHING PROCEDURE DETAIL BY ACTION & COMPONENT", action, component, category);
        try {
            component = component.toUpperCase();
            let query = {
                component: component,
                procStatus: 'Active'
            };
            if (action)
                query.action = action.toUpperCase();

            if (category)
                query.category = category.toUpperCase();

            let fields = {};
            console.log("query----",query)
            let result = await this.mongoUtil.findRecord("IT_procedures", query, fields);
            return result;
        } catch (err) {
            throw new Error(err)
        }
    };
    async fetchProcedureDetailforcomponent(action, component, category) {
        console.log("FETCHING PROCEDURE DETAIL BY ACTION & COMPONENT", action, component , category);
        try {
            component = component.toUpperCase();
            let query = {
                component: component,
                procStatus: 'Active'
            };
            if (action)
                query.action = action.toUpperCase();
            if (category)
                query.category = category.toUpperCase();
            
            console.log('query',query);
            console.log('categories',category);

            let fields = {};
            let result = await this.mongoUtil.findRecord("IT_procedures", query, fields);
            return result;
        } catch (err) {
            throw new Error(err)
        }
    };
    async fetchProcedureDetailForAction(action) {
        console.log("FETCHING PROCEDURE DETAIL Action issue", action);
        try {
            let query = {
                action:  action.toUpperCase(),
            };
            console.log('query',query);

            let fields = {};
            let result = await this.mongoUtil.findRecord("IT_procedures", query, fields);
            return result;
        } catch (err) {
            throw new Error(err)
        }
    };

    async fetchProcedureListByAction(action, category) {
        action = action.toUpperCase();
        if (category)
            category = category.toUpperCase();
        console.log("FETCHING PROCEDURE LIST BY ACTION OR CATEGORY");
        try {
            let query = { action: action, procStatus: 'Active' };

            if (category || category != '')
                // query.category = 'SOFTWARE';
                query.category = category
            console.log('query' , query)

            let fields = {};
            let result = await this.mongoUtil.findRecord("IT_procedures", query, fields);
            // console.log('result' , result)
            return result;
        } catch (err) {
            throw new Error(err)
        }
    };
    async fetchActionId(mode , name) {
        console.log("FETCHING ACTION ID");
        try {
            name = name.toUpperCase();
            let query = {name:{'$regex' : '^((?!name).)*$', '$options' : 'i'} , mode:mode};
            // let query = {name:name , mode:mode};
            let fields = {};
            let result = await this.mongoUtil.findRecord("zabbix_action", query, fields);
            // console.log( "result ACTION ID",result)
            return result;
        } catch (err) {
            throw new Error(err)
        }
    };
    
    async fetchMediaId(mode , name) {
        console.log("FETCHING MEDIA ID");
        try {
            name = name.toUpperCase();
            let query = {name:name , mode:mode};
            let fields = {};
            let result = await this.mongoUtil.findRecord("media_action", query, fields);
            // console.log( "result ACTION ID",result)
            return result;
        } catch (err) {
            throw new Error(err)
        }
    };

    async fetchGroupId(name) {
        console.log("FETCHING GROUP ID");
        try {
            name = name.toUpperCase();
            let query = {groupname:name};
            let fields = {};
            let result = await this.mongoUtil.findRecord("Hawkeye_hostgroup", query, fields);
            // console.log( "result ACTION ID",result)
            return result;
        } catch (err) {
            throw new Error(err)
        }
    };
    async fetchActionList() {
        console.log("FETCHING ACTION LIST");
        try {
            let query = {};
            let fields = {};
            let sort = { title: 1 };
            let result = await this.mongoUtil.findSortedRecord("IT_actions", query, fields, sort);
            return result;
        } catch (err) {
            throw new Error(err)
        }
    };

    async fetchFaqList() {
        console.log("FETCHING FAQ LIST");
        try {
            let query = {};
            let fields = {};
            let sort = { title: 1 };
            let result = await this.mongoUtil.findSortedRecord("IT_faqs", query, fields, sort);
            return result;
        } catch (err) {
            throw new Error(err)
        }
    };

    async fetchTroubleshootList() {
        console.log("FETCHING TROUBLESHOOT LIST");
        try {
            let query = {
                $and: [
                    { action: 'TROUBLESHOOT' },
                    { procStatus: 'Active' }
                ]
            };
            let fields = {};
            let result = await this.mongoUtil.findRecord("IT_procedures", query, fields);
            return result;
        } catch (err) {
            throw new Error(err)
        }
    };
    /////////////////////////hms chatbot procedure services/////////////////////////////////////////
    ////////////////fetch hostgroups user.js////////////////////////////
    async fetchhostgroups(userEmail) {
        //action = action.toUpperCase();
        //if (category)
        //  category = category.toUpperCase();
        console.log("FETCHING hostgroups mongoquery");
        try {
            //let query = {groupname:{'$regex' : '^((?!TEMPLATE).)*$', '$options' : 'i'}};
            let query = { Useremailid: "Zabbix" };
            console.log(query);
            //if (category)
            //  query.category = category;

            let fields = {};
            let result = await this.mongoUtil.findRecord("Hawkeye_Useraccess", query, fields);
            console.log('db result', result);
            return result;
        } catch (err) {
            console.log(err);
            throw new Error(err)
        }
    };
    /////////////////fetch hostgroups1 user.js//////////////
    async fetchhostgroups1(array) {
        //action = action.toUpperCase();
        //if (category)
        //  category = category.toUpperCase();
        console.log("FETCHING hostgroups1 mongoquery");
        try {
            //let query = {groupname:{'$regex' : '^((?!TEMPLATE).)*$', '$options' : 'i'}};
            let query = { "Usergroupid": { $in: array }, "permission": { $in: ['2', '3'] } };
            console.log(query)
            //if (category)
            //  query.category = category;

            let fields = {};
            let result = await this.mongoUtil.findRecord("Hawkeye_usergroup", query, fields);
            return result;
        } catch (err) {
            throw new Error(err)
        }
    };
    /////////////////fetch hostgroup2 name list from hostgroup table based on permission//////
    async fetchhostgroups2(array1) {
        console.log("FETCHING hostgroups2 mongoquery");
        try {
            let query = { "groupid": { $in: array1 }, "groupname": { '$regex': '^((?!TEMPLATE).)*$', '$options': 'i' } };
            console.log(query)
            //if (category)
            //  query.category = category;

            let fields = {};
            let result = await this.mongoUtil.findRecord("Hawkeye_hostgroup", query, fields);
            return result;
        } catch (err) {
            throw new Error(err)
        }
    };
    ///////////////////////////////////////////////////////
    async fetchhostgroupsall() {
        console.log("FETCHING hostgroups2 all mongoquery");
        try {
            let query = { "groupname": { '$regex': '^((?!TEMPLATE).)*$', '$options': 'i' } };
            console.log(query)
            //if (category)
            //  query.category = category;

            let fields = {};
            let result = await this.mongoUtil.findRecord("Hawkeye_hostgroup", query, fields);
            return result;
        } catch (err) {
            throw new Error(err)
        }
    };

    /////////////////////////fetch host enable procedure.js///////////////////////
    async fetchhostenable() {
        //action = action.toUpperCase();
        //if (category)
        //  category = category.toUpperCase();
        console.log("FETCHING host enbale mongoquery");
        try {
            let query = { "hoststatus": "1" };

            //if (category)
            //  query.category = category;

            let fields = {};
            let result = await this.mongoUtil.findRecord("Hawkeye_host", query, fields);
            return result;
        } catch (err) {
            throw new Error(err)
        }
    };

    ////////////////////////fetch host disable procedure.js/////////////
    async fetchhostdisable() {
        //action = action.toUpperCase();
        //if (category)
        //  category = category.toUpperCase();
        console.log("FETCHING host disable mongoquery");
        try {
            let query = { "hoststatus": "0" };

            //if (category)
            //  query.category = category;

            let fields = {};
            let result = await this.mongoUtil.findRecord("Hawkeye_host", query, fields);
            return result;
        } catch (err) {
            throw new Error(err)
        }
    };

    async fetchlastlog(userid) {
        // console.log("FETCHING lastlogin mongoquery");
        try {
            let te = new Date();
            let final1 = Math.abs(te.getTime() / 1000 - (30 * 24 * 60 * 60));
            // console.log(final1)
            let query = { userid: userid };
            console.log("fetchlastlog db query" , query)
            // console.log(userid);
            let fields = {};
            let result = await this.mongoUtil.findRecord("Hawkeye_userlogin", query, fields);
            console.log(result);
            return result;
        } catch (err) {
            throw new Error(err)
        }
    };

    async fetchnewlastlog() {
        //console.log("FETCHING lastlogin mongoquery");
        try {

            //console.log(final1)
            //final1 = "'"+final1+"'"
            let query = {};
            //console.log("new query is",query)
            let fields = {};
            let result = await this.mongoUtil.findRecord("Hawkeye_currentUser", query, fields);
            let result1 = await this.mongoUtil.emptyCollection("Hawkeye_currentUser");

            return result;
        } catch (err) {
            throw new Error(err)
        }
    };

    async fetchitemdetails(triggerid) {
        //console.log("FETCHING lastlogin mongoquery");
        try {
            let query = { triggerid: triggerid };
            let fields = {};
            let result = await this.mongoUtil.findRecord("Hawkeye_trigger", query, fields);
            return result;
        } catch (err) {
            throw new Error(err)
        }
    };

    //////////////////////////////////////////////////////////////////////////////////////////
    async fetchUIprocessname() {
        console.log("FETCHING PROCESS NAME");
        try {
            let query = {};


            let fields = {};
            let result = await this.mongoUtil.findRecord("UIPATH_FolderData", query, fields);
            console.log("result", result)
            return result;
        } catch (err) {
            throw new Error(err)
        }
    };



    async fetchUIprocessname() {
        console.log("FETCHING PROCESS NAME");
        try {
            let query = {};


            let fields = {};
            let result = await this.mongoUtil.findRecord("UIPATH_FolderData", query, fields);
            console.log("result", result)
            return result;
        } catch (err) {
            throw new Error(err)
        }
    };
    async fetchUIpathprocessname(process_name) {
        console.log("FETCHING PROCESS NAME",process_name);
        try {
            let query = {process_name:process_name};


            let fields = {};
            let result = await this.mongoUtil.findRecord("UIPATH_FolderData", query, fields);
            console.log("result", result)
            return result;
        } catch (err) {
            throw new Error(err)
        }
    };

    async fetchProcessId() {
        console.log("FETCHING PROCESS ID");
        
        try {
            let query  = {};

            let fields = {};
            let result = await this.mongoUtil.findRecord("process_status_record", query, fields);
            let P_ID = []
            
            console.log("ffdf",result[0].process_ID)
            return result;
            
        } catch (err) {
            throw new Error(err)
        }
    };


    ///////////////////////////////////////////////////////////////////////////////////////////////////////////

    async fetchhostnamedetails(hostid) {
        //console.log("FETCHING lastlogin mongoquery");
        try {
            let query = { hostid: hostid };
            let fields = {};
            let result = await this.mongoUtil.findRecord("Hawkeye_host", query, fields);
            return result;
        } catch (err) {
            throw new Error(err)
        }
    };

    ///////////////////////////////////////////////////////////////////////////////////////////////
}

module.exports = ProcedureUtil;