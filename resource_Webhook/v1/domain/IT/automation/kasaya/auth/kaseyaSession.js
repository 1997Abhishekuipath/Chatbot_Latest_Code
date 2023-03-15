const Auth = require('./kaseyaHashCalculater');
const {soapRequest, xmlBodySelector, convertJson} = require('../helpers/soapHelper');

class KaseyaSession extends Auth {

    constructor(kasayaConfig) {
        let userName = kasayaConfig["USERNAME"];
        let password = kasayaConfig["PASSWORD"];
        super(userName, password);
        this.kaseyaConfig = kasayaConfig;
        console.log('@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@');
        console.log('kaseya config for SOAP');
        console.log(this.kaseyaConfig);
        this.refreshTime(this.kaseyaConfig.SOAP.REFRESH_SESSION_TIME, this);
    }

    async getSessionID(reset = false) {
        if (global.session_id && (!reset)) {
            return global.session_id;
        } else  {
            global.session_id  = await this._genrateSessionID();
            return global.session_id;
        }
    }

    async _genrateSessionID() {
        let authXML = `<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
                              <soap:Body>
                                <Authenticate xmlns="KaseyaWS">
                                  <req>
                                    <UserName>${this.kaseyaUser}</UserName>
                                    <CoveredPassword>${this.CoveredSHA256Hash}</CoveredPassword>
                                    <RandomNumber>${this.randomNumber}</RandomNumber>
                                    <BrowserIP>${this.kaseyaConfig.SOAP.IP}</BrowserIP>
                                    <HashingAlgorithm>${this.kaseyaConfig.SOAP.HASH_ALGO}</HashingAlgorithm>
                                  </req>
                                </Authenticate>
                              </soap:Body>
                        </soap:Envelope>`;
                        console.log("+++++  automation ",this.kaseyaConfig.HOST_URL, this.kaseyaConfig.SOAP.AUTH_END_PONT);
        let soapResponse = await soapRequest(this.kaseyaConfig.HOST_URL, this.kaseyaConfig.SOAP.AUTH_END_PONT, authXML);
        if (soapResponse.statusCode == 200) {
            let body = soapResponse.body;
            console.log(body);
            let sessionXML = xmlBodySelector(body, 'AuthenticateResult');
            let authJson = await convertJson(sessionXML);
            let session_id = authJson.AuthenticateResult.SessionID[0];
            if (session_id == '0') {
                console.error('session error');
                console.error(sessionXML)
                throw authJson.AuthenticateResult.ErrorMessage[0]
            } else {
                console.log('session Genrated', session_id);
                return session_id;
            }
        } else {
            console.error(soapResponse.body);
            throw `soap auth error status code ${soapResponse.statusCode} `
        }
    }

    refreshTime(time, self) {
        setInterval(() => {
           console.log('SESSION REFRESH');
           self._genrateSessionID()
       }, time) ;
    }
}

module.exports = KaseyaSession;