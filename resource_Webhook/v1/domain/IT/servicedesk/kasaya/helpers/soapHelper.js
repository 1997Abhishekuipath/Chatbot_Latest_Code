const axios = require('axios');
var parseString = require('xml2js').parseString;

function soapRequest(host, path, body) {
  console.log("---------------", host, path)
  let url = `https://${host}${path}`,
    headers = {
      "Content-Type": "text/xml",
    };
  return new Promise((resolve, reject) => {
    axios({
      method: 'POST',
      url: url,
      headers: headers,
      data: body
    }).then((response) => {
      resolve({
        statusCode: response.status,
        statusMessage: response.statusText,
        body: response.data
      });
    }).catch((error) => {
      if (error.response) {
        console.log(`SOAP FAIL: ${error}`);
        reject(error.response.data);
      } else {
        console.log(`SOAP FAIL: ${error}`);
        reject(error);
      }
    });
  });

}

function xmlBodySelector(xmlResponseString, element) {
  console.log('element', element,xmlResponseString);
  if (xmlResponseString.indexOf('#50000') > 0) {
    console.log('Session Expire');
    throw "Session Expire";
  }
  var r = new RegExp(`<${element}>(.+?)<\/${element}>`);
  console.log('regex string', r);
  var s = xmlResponseString.match(r);
  console.log('xmlBodySelector ', s);
  return s[0]
}

function convertJson(xml) {
  return new Promise((res, rej) => {
    parseString(xml, function (err, result) {
      if (err) {
        return rej(err)
      }
      res(result);
    })
  })
}

function ticketXmlTOJSON(xml) {
  let ticketObj = {};
  const arr = ['IncidentNumber'];
  arr.forEach((val) => {
    ticketObj[val] = matchElement(val, xml);
  });
  return ticketObj;
}

function matchElement(element, xmlResponseString) {
  var r = new RegExp(`<${element} xmlns="http://www.kaseya.com/vsa/2007/12/ServiceDeskDefinition.xsd">(.+?)<\/${element}>`);
  var s = xmlResponseString.match(r);
  if (s) {
    return s[1]
  }
}

module.exports = {
  soapRequest: soapRequest,
  xmlBodySelector: xmlBodySelector,
  convertJson: convertJson,
  ticketXmlTOJSON: ticketXmlTOJSON
}