const Intents = require('../../../../../domain/IT/libs/intents');

class IntentUtil extends Intents{
    constructor(){
        super();
    }

    static newIntents(){
        return {};
    }

    static newEvents(){
        return {};
    }
}

module.exports = IntentUtil;