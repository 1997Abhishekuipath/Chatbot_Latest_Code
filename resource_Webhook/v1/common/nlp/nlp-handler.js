const nlpConstants = require('./nlp-constants');
const RASAHandler = require('./humonics/rasa-handler');
let i=1;
class NLPHandler {
    constructor(config) {
        this.platform = config.get('nlp:platform');
        this.version = config.get('nlp:version');
        this.rasaHandler = new RASAHandler(config);
    }
    ////test 
    
    async fetchNlpParams(request) {
        console.log('INSIDE NLP PARAMS');
        i=i+1
        try {
            let params = {};

            //DIALOG-FLOW
            if (this.platform === 'Dialogflow') {
                if (this.version === 'v1') {
                    let result = request.body.result;
                    params.result = result;
                    params.intentName = result.metadata['intentName'];
                    params.userQuery = result.resolvedQuery;
                    params.parameters = result.parameters;
                }
                if (this.version === 'v2') {
                    let result = request.body.queryResult;
                    params.result = result;
                    params.intentName = result.intent.displayName;
                    params.userQuery = result.queryText;
                    params.parameters = result.parameters;
                    params.languageCode = result.languageCode;
                }
            }

            //RASA
            else if (this.platform === 'Humonics') {
                // console.log('Inside Humonics',request)
                params = this.rasaHandler.fetchNlpParams(request);
            }
            return params;
        } catch (err) {
            throw new Error(err);
        }
    };

    async fetchUnableProcessResponse() {
        let json = this.fetchTextJson(nlpConstants.UNABLE_TO_PROCESS_REQUEST);
        json = this.fetchFinalResponse(json,{});
        return json;
    };

    async fetchSlotJson(text, disable, buttons,intentDetectionConfidence) {
        console.log("BUILDING SLOT_TYPE RESPONSE");
        try {
            let response;
            if (this.platform === 'Humonics') {
                response=  this.fetchButtonJson(text, disable, buttons,intentDetectionConfidence);
            }
            return response;
        } catch (err) {
            throw new Error(err)
        }
    };

    // fetchFollowupEventJson(name, parameters) {
    //     let json = {};

    //     return json;
    // };

    fetchTextJson(response) {
        let json = {};
        if (this.platform === 'Humonics') {
            json = this.rasaHandler.fetchTextJson(response);
        }
        return json;
    };

    fetchImageJson(text, images) {
        let json = {};
        if (this.platform === 'Humonics') {
            json = this.rasaHandler.fetchImageJson(text, images);
        }
        return json;
    };

fetchHtmlJson(html) {
        let json = {};
        if (this.platform === 'Humonics') {
            json = this.rasaHandler.fetchHtmlJson(html);
        }
        return json;
    };

    fetchButtonJson(text, disable, buttons,intentDetectionConfidence) {
        let json = {};
        if (this.platform === 'Humonics') {
            json = this.rasaHandler.fetchButtonJson(text, disable, buttons,intentDetectionConfidence);
        }
        return json;
    };

    fetchChartTemporaryJson(data) {
        let json = {};
        if (this.platform === 'Humonics') {
            //TODO: In future
        }
        return json;
    };

    fetchTableJson(data) {
        let json = {};
        if (this.platform === 'Humonics') {
            //TODO: In future
        }
        return json;
    };

    fetchFinalResponse(response, params) {
        if (this.platform === 'Humonics') {
            response = this.rasaHandler.finalResponse(response, params);
        }
        return response;
    }

}

module.exports = NLPHandler;