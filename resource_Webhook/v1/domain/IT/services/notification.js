const MongoUtil = require('../../../common/libs/mongo-util');

class NotificationUtil {
    constructor(url) {
        this.mongoUtil = new MongoUtil(url);
    }

    async fetchNotifications (userIdentity) {
        console.log("FETCH NOTIFICATION");
        try {
            let notifications = [];
            let filter = {
                _id : 0,
                notificationId: 1,
                userIdentity: 1,
                procedureId: 1,
                ticketId: 1,
                details : 1,
                type : 1,
                notificationStatus : 1
            };

            //View
            let query = {
                $and: [
                    {userIdentity: userIdentity},
                    {notificationStatus: 'NotSeen'},
                    {type: 'View'}
                ]
            };




            //Approval
            let array1 = [];
            let lookup1 = {
                $lookup: {
                    from: "IT_approvals",
                    localField: "ticketId",
                    foreignField: "ticketId",
                    as: "fromApprovals"
                }
            };

            let replaceRoot1 = {
                $replaceRoot: {
                    newRoot: {$mergeObjects: [{$arrayElemAt: ["$fromApprovals", 0]}, "$$ROOT"]}
                }
            };

            let match1 = {
                $match: {
                    $and: [
                        {mgrIdentity: userIdentity},
                        {type: 'Approval'},
                        {$or: [{notificationStatus: 'NotSeen'}, {approvalStatus: 'Pending'}]}
                    ]
                }
            };

            let project1 = {
                $project: {
                    _id : 0,
                    notificationId: 1,
                    userIdentity: 1,
                    procedureId: 1,
                    ticketId: 1,
                    details : 1,
                    type : 1,
                    notificationStatus : 1
                }
            };

            array1.push(lookup1);
            array1.push(replaceRoot1);
            array1.push(match1);
            array1.push(project1);


            //Confirmation
            let array2 = [];
            let lookup2 = {
                $lookup: {
                    from: "IT_tickets",
                    localField: "ticketId",
                    foreignField: "ticketId",
                    as: "fromTickets"
                }
            };

            let replaceRoot2 = {
                $replaceRoot: {
                    newRoot: {$mergeObjects: [{$arrayElemAt: ["$fromTickets", 0]}, "$$ROOT"]}
                }
            };

            let match2 = {
                $match: {
                    $and: [
                        {userIdentity: userIdentity},
                        {type: 'Confirmation'},
                        {$or: [{notificationStatus: 'NotSeen'}, {ticketStatus: 'Open'}]}
                    ]
                }
            };

            let project2 = {
                $project: {
                    _id : 0,
                    notificationId: 1,
                    userIdentity: 1,
                    procedureId: 1,
                    ticketId: 1,
                    details : 1,
                    type : 1,
                    notificationStatus : 1
                }
            };

            array2.push(lookup2);
            array2.push(replaceRoot2);
            array2.push(match2);
            array2.push(project2);


            let r1 = this.mongoUtil.findRecord("IT_notifications", query, filter);
            let r2 = this.mongoUtil.findAggregatedRecords("IT_notifications", array1);
            let r3 = this.mongoUtil.findAggregatedRecords("IT_notifications", array2);
            const [result1, result2, result3] = await Promise.all([r1, r2, r3]);
            if(result1 && result1.length>0){
                notifications =  notifications.concat(result1);
            }
            if(result2 && result2.length>0){
                notifications = notifications.concat(result2);
            }
            if(result3 && result3.length>0){
                notifications = notifications.concat(result3);
            }
            console.log(notifications.length);
            return notifications;
        } catch (err) {
            throw new Error(err)
        }
    };

    async createNotification (notification) {
        console.log("CREATING NOTIFICATION");
        try {
            const notificationId = await this.mongoUtil.fetchSequenceValue("notificationId");
            notification.notificationId = notificationId;
            let result = await this.mongoUtil.createRecord("IT_notifications", notification);
            return notification;
        } catch (err) {
            throw new Error(err)
        }
    };

    async updateNotification (notificationId) {
        console.log("UPDATING NOTIFICATION");
        try {
            let query = {notificationId: notificationId};
            //let values = {$set: notification};
            let values = {$set: {notificationStatus: 'Seen'}}
            let result = await this.mongoUtil.updateRecord("IT_notifications", query, values);
            return "SUCCESS";
        } catch (err) {
            throw new Error(err)
        }
    };

    async updateNotifications (userIdentity) {
        console.log("UPDATING NOTIFICATIONS");
        try {
            // let promise = [];
            // for(let notification in notifications){
            //     let query = {notificationId: notification.notificationId};
            //     let values = {notificationStatus: 'Seen'};
            //     let r = this.mongoUtil.updateRecord("IT_notifications", query, values);
            //     promise.push(r);
            // }
            //
            // let output = await Promise.all(promise);

            let query = {userIdentity: userIdentity};
            let values = {$set: {notificationStatus: 'Seen'}}
            let r = await this.mongoUtil.updateRecords("IT_notifications", query, values);
            return "SUCCESS";
        } catch (err) {
            throw new Error(err)
        }
    };
}


module.exports = NotificationUtil;