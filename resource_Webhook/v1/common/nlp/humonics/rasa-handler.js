//const nlpConstants = require('../nlp-constants');

class RASAHandler {
    constructor(config) {
        this.version = config.get('nlp:version');
    }

    fetchNlpParams(request) {
        let params = {};
        if (this.version === 'v1') {
            let result = request.body;
            console.log('hello-nlp',result)
            params.result = result;
            params.flowName = result.flow_name;
            params.intentName = result.intent_name;
            params.userQuery = result.user_query;
            params.parameters = result.parameters;
            params.teamsEmail = result.teams_email
        }
        return params;
    };

    fetchTextJson(response) {
        let json ={};
        if (this.version === 'v1') {
            json = {
                    "template_type": 'text',
                    "text": response
                }
        }
        return json;
    };

    finalResponse(response,params,followup_event){
        if (this.version === 'v1') {
            response = {
                "response":response,
                "parameters": params.PARAMETERS,
                "followup_event":followup_event?followup_event:""
            };
        }
        return response;
    }

    fetchButtonJson(text, disable, buttons,intentDetectionConfidence) {
        let json ={};
        if (this.version === 'v1') {
            json = {
                "template_type": 'button',
                "text": text,
                "buttons":buttons,
                "intentDetectionConfidence":intentDetectionConfidence
            }
        }
        return json;
    };

    fetchImageJson(text, images) {
        let json ={};
        if (this.version === 'v1') {
            json = {
                "template_type": 'image',
                "text": text,
                "images":images
            }
        }
        return json;
    };

    fetchHtmlJson(html) {
        let json ={};
        if (this.version === 'v1') {
            json = {
                "template_type": 'html',
                "data": html
            }
        }
        return json;
    };

}

module.exports = RASAHandler;