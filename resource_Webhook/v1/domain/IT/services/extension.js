const MongoUtil = require('../../../common/libs/mongo-util');

class ExtensionUtil {
    constructor(url) {
        this.mongoUtil = new MongoUtil(url);
    }

    async fetchSupportExtension (query,fields)  {
        console.log("FETCHING EXTENSION");
        try {
            let result = await this.mongoUtil.findRecord("IT_extensions", query, fields);
            return result;
        } catch (err) {
            throw new Error(err)
        }
    };
}

module.exports = ExtensionUtil;