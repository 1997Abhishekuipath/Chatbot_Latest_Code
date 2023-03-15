const KaseyaSession = require('../auth/kaseyaSession');
const { soapRequest, xmlBodySelector, convertJson, ticketXmlTOJSON } = require('../helpers/soapHelper');
const { getServiceDeskType } = require('../helpers/serviceDeskHelper');
const { json } = require('express');
// var s = new XMLSerializer();

class KaseyaTicket extends KaseyaSession {
    constructor(config) {
        super(config);
    }

    async createTicket(ticketJSON, customTicketJSON, param) {
        //it only hold if session is not available
        console.log("test1")
        if (!global.session_id) {
            await this.getSessionID();
        }
        let ticketXml = await this._createTicketCreationXML(ticketJSON, customTicketJSON, param);
        let response = await soapRequest(this.kaseyaConfig.HOST_URL, this.kaseyaConfig.SOAP.TICKET_PATH, ticketXml);

        console.log('fullTicketXML', response);
        let slicedTicketData = null;
        try {
            slicedTicketData = xmlBodySelector(response.body, 'AddIncidentResult');
            console.log('slicedTicketData', slicedTicketData);
        } catch (e) {
            console.error(e);
            if (e == 'Session Expire') {
                /*
                * handle the case of  session expire;
                * */
                await this.getSessionID(true);
                ticketXml = this._createTicketCreationXML(ticketJSON, customTicketJSON, action);
                response = await soapRequest(this.kaseyaConfig.HOST_URL, this.kaseyaConfig.SOAP.TICKET_PATH, ticketXml);
                slicedTicketData = xmlBodySelector(response.body, 'AddIncidentResult');
            } else {
                throw e
            }
        }

        let ticketJson = await ticketXmlTOJSON(slicedTicketData);
        console.log(ticketJson);
        return ticketJson;
    }

    async updateTicket(ticketJSON, customTicketJSON, param) {
        if (!global.session_id) {
            await this.getSessionID();
        }
        let ticketXml = await this._updateTicketCreationXML(ticketJSON, customTicketJSON, param);
        let response = await soapRequest(this.kaseyaConfig.HOST_URL, this.kaseyaConfig.SOAP.TICKET_PATH, ticketXml);

        console.log('fullTicketXML', response);
        let slicedTicketData = null;
        try {
            slicedTicketData = xmlBodySelector(response.body, 'UpdateIncidentResult');
            console.log('slicedTicketData', slicedTicketData);
        } catch (e) {
            console.error(e);
            if (e == 'Session Expire') {
                /*
                * handle the case of  session expire;
                * */
                await this.getSessionID(true);
                ticketXml = this._updateTicketCreationXML(ticketJSON, customTicketJSON, action);
                response = await soapRequest(this.kaseyaConfig.HOST_URL, this.kaseyaConfig.SOAP.TICKET_PATH, ticketXml);
                slicedTicketData = xmlBodySelector(response.body, 'UpdateIncidentResult');
            } else {
                throw e
            }
        }
        let ticketJson = await ticketXmlTOJSON(slicedTicketData);
        console.log(ticketJson);
        return ticketJson;

    }

    async getTicket(ticket_id) {
        if (!global.session_id) {
            await this.getSessionID();
        }
        let ticketXml = await this._getTicketCreationXML(ticket_id);
        let response = await soapRequest(this.kaseyaConfig.HOST_URL, this.kaseyaConfig.SOAP.TICKET_PATH, ticketXml);
        let slicedTicketData = null;
        try {
            slicedTicketData = response.body
            console.log('slicedTicketData', slicedTicketData);
            if (slicedTicketData.indexOf('#50000') > 0) {
                console.log('Session Expire');
                throw "Session Expire";
              }
            var ticketJson = await convertJson(slicedTicketData);
            console.log("ticket result in json", ticketJson);
        } catch (e) {
            console.error(e);
            if (e == 'Session Expire') {
                /*
                * handle the case of  session expire;
                * */
                await this.getSessionID(true);
                ticketXml = this._getTicketCreationXML(param);
                response = await soapRequest(this.kaseyaConfig.HOST_URL, this.kaseyaConfig.SOAP.TICKET_PATH, ticketXml);
                slicedTicketData = response.body
                console.log('slicedTicketData', slicedTicketData);
                ticketJson = await convertJson(slicedTicketData);
               } else {
                throw e
            }
        }
        // let ticketJson = await convertJson(slicedTicketData);
        // // console.log(ticketJson);
        let soapJson = ticketJson['soap:Envelope']['soap:Body'][0]['GetIncidentResponse'][0]['GetIncidentResult'][0]['IncidentResponse']
        console.log(soapJson)
        return soapJson;

    }

    async _createTicketCreationXML(ticketJson, customJson, param) {
        console.log('ticket json is');
        console.log(customJson);
        let action = param.ACTION

        let xmlstring = '';
        let xml2string = '';
        for (let key in ticketJson) {
            xmlstring = xmlstring.concat(await this._ticketXmlByJson(key, ticketJson[key]));
        }
        for (let key in customJson) {
            xml2string = xml2string.concat(await this._customXmlByJson(key, customJson[key]));
        }

        // if (param.MACHINEGROUP.indexOf('hsnetworktechnologies')=== -1) {

        let serviceDeskName = getServiceDeskType.call(this.kaseyaConfig, action);

        let ticketXml = `<?xml version="1.0" encoding="utf-8"?>
            <soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
                <soap:Body>
                    <AddIncident xmlns="vsaServiceDeskWS">
                        <req>
                            <AddSDIncident>
                            <ServiceDeskName xmlns="http://www.kaseya.com/vsa/2007/12/ServiceDeskDefinition.xsd">${serviceDeskName}</ServiceDeskName>
                                ${xmlstring}
                                <CustomFields xmlns="http://www.kaseya.com/vsa/2007/12/ServiceDeskDefinition.xsd">
                                    ${xml2string}
                                </CustomFields>
                            </AddSDIncident>
                        
                            <SessionID>${global.session_id}</SessionID>
                        </req>
                    </AddIncident>
                </soap:Body>
            </soap:Envelope>`;
        console.log(ticketXml);
        return ticketXml;
        // } else {

        //     let serviceDeskName = "HSNT"

        //     let ticketXml = `<?xml version="1.0" encoding="utf-8"?>
        //     <soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
        //         <soap:Body>
        //             <AddIncident xmlns="vsaServiceDeskWS">
        //                 <req>
        //                     <AddSDIncident>
        //                     <ServiceDeskName xmlns="http://www.kaseya.com/vsa/2007/12/ServiceDeskDefinition.xsd">${serviceDeskName}</ServiceDeskName>
        //                         ${xmlstring}
        //                         <CustomFields xmlns="http://www.kaseya.com/vsa/2007/12/ServiceDeskDefinition.xsd">
        //                             ${xml2string}
        //                         </CustomFields>
        //                     </AddSDIncident>

        //                     <SessionID>${global.session_id}</SessionID>
        //                 </req>
        //             </AddIncident>
        //         </soap:Body>
        //     </soap:Envelope>`;
        //     console.log(ticketXml);
        //     return ticketXml;
        // }
    }

    async _updateTicketCreationXML(ticketJson, customJson, param) {
        console.log('ticket json is');
        console.log(customJson);
        let action = param.ACTION

        let xmlstring = '';
        let xml2string = '';
        for (let key in ticketJson) {
            xmlstring = xmlstring.concat(await this._ticketXmlByJson(key, ticketJson[key]));
            console.log('xmlstring ' , xmlstring)
        }
        for (let key in customJson) {
            xml2string = xml2string.concat(await this._customXmlByJson(key, customJson[key]));
        }

        // if (param.INCIDENT_NUMBER.indexOf('HSN')=== -1) {
        let serviceDeskName = getServiceDeskType.call(this.kaseyaConfig, action);
        let ticketXml = `<?xml version="1.0" encoding="utf-8"?>
                    <soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
                    <soap:Body>
                        <UpdateIncident xmlns="vsaServiceDeskWS">
                        <req>
                        <UpdateSDIncident>
                            <ServiceDeskName xmlns="http://www.kaseya.com/vsa/2007/12/ServiceDeskDefinition.xsd">${serviceDeskName}</ServiceDeskName>
                                ${xmlstring}
                                <CustomFields xmlns="http://www.kaseya.com/vsa/2007/12/ServiceDeskDefinition.xsd">
                                    ${xml2string}
                                </CustomFields>
                            </UpdateSDIncident>
                        
                            <SessionID>${global.session_id}</SessionID>
                        </req>
                    </UpdateIncident>
                </soap:Body>
            </soap:Envelope>`;
        console.log(ticketXml);
        return ticketXml;
        // } else {
        //     let serviceDeskName = "HSNT"
        // let ticketXml = `<?xml version="1.0" encoding="utf-8"?>
        //         <soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
        //         <soap:Body>
        //             <UpdateIncident xmlns="vsaServiceDeskWS">
        //             <req>
        //             <UpdateSDIncident>
        //                 <ServiceDeskName xmlns="http://www.kaseya.com/vsa/2007/12/ServiceDeskDefinition.xsd">${serviceDeskName}</ServiceDeskName>
        //                     ${xmlstring}
        //                     <CustomFields xmlns="http://www.kaseya.com/vsa/2007/12/ServiceDeskDefinition.xsd">
        //                         ${xml2string}
        //                     </CustomFields>
        //                 </UpdateSDIncident>

        //                 <SessionID>${global.session_id}</SessionID>
        //             </req>
        //         </UpdateIncident>
        //     </soap:Body>
        // </soap:Envelope>`;
        // console.log(ticketXml);
        // return ticketXml;
        // }

    }
    async _getTicketCreationXML(ticket_id) {
        console.log('ticket json is');
        let ticketXml = `<?xml version="1.0" encoding="utf-8"?>
                <soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
                <soap:Body>
                <GetIncident xmlns="vsaServiceDeskWS">
                <req>
                  <IncidentRequest>
                            <IncidentNumber xmlns="http://www.kaseya.com/vsa/2007/12/ServiceDeskDefinition.xsd">${ticket_id}</IncidentNumber>
                            </IncidentRequest>
                        <SessionID>${global.session_id}</SessionID>
                        </req>
                        </GetIncident>
            </soap:Body>
        </soap:Envelope>`;
        console.log(ticketXml);
        return ticketXml;
    }

    _ticketXmlByJson(key, value) {
        let xmlString = `<${key} xmlns="http://www.kaseya.com/vsa/2007/12/ServiceDeskDefinition.xsd">${value}</${key}>`;
        return xmlString;
    }

    _customXmlByJson(key, value) {
        let xml2String = `<Field fieldName="${key}">${value}</Field>`;
        return xml2String;
    }
}

module.exports = KaseyaTicket;