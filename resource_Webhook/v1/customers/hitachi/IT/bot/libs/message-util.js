const Messages = require('../../../../../domain/IT/libs/messages');

class MessageUtil extends Messages{
    constructor(){
        super();
    }

    static newMessages(){
        return {
            NLP : {
                EXTENSION_RESPONSE : 'The contact details are provided below:<br><br><b>Engineer</b> : @engineer <br><b>Email</b>: @email <br><b>Location</b>: @location <br><b>Phone</b>: @phone <br><b>VOIP</b>: @voip'
            }
        };
    }
}

module.exports = MessageUtil;