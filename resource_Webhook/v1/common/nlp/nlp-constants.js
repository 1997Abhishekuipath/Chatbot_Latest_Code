const constants = {
    UNABLE_TO_PROCESS_REQUEST : 'We are unable to process your request at this time.',
    DIALOGFLOW: {
        RESPONSE_TYPES: {
            SLOT: '#OPEN#\n' +
            '  "type_slot" : "TRUE",\n' +
            '  "type": 4,\n' +
            '  "payload": #OPEN#\n' +
            '\t"template_type": "BUTTON",\n' +
            '\t"text": "$TEXT",\n' +
            '\t"disable": "$DISABLE",\n' +
            '\t"buttons": [$BUTTONS]\n' +
            '  #CLOSE#\n' +
            '#CLOSE#',

            BUTTON: '#OPEN#\n' +
            '  "template_type": "BUTTON",\n' +
            '  "payload": #OPEN#\n' +
            '\t"template_type": "BUTTON",\n' +
            '\t"text": "$TEXT",\n' +
            '\t"disable": "$DISABLE",\n' +
            '\t"buttons": $BUTTONS\n' +
            '  #CLOSE#\n' +
            '#CLOSE#',
        },

        BUTTON_TYPE: {
            PAYLOAD: '#OPEN#\n' +
            '\t\t"type": "postback",\n' +
            '\t\t"title": "$TITLE",\n' +
            '\t\t"payload": "$PAYLOAD",\n' +
            '\t\t"text" : "$TEXT"\n' +
            '\t  #CLOSE#'
        }
    }
};

module.exports = constants;