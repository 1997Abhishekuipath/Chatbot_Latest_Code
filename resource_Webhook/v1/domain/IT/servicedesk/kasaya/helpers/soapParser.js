class KaseySOPString {

    static toJSON(soapString) {
        let jsonKey = {};
        let categoryArray = soapString.match(new RegExp("<Item(.*?)</Item>", "gm"));
        console.log(categoryArray);
        for (let i = 1; i < categoryArray.length; i++) {
            let stringArray = categoryArray[i].split('>');
            let key = stringArray[1].replace('</Item', "");
            stringArray = stringArray[0].split('"')
            let value = stringArray[1].replace("Incident||", "")
            // console.log('value', value)
            jsonKey[key] = value;
        }
        return jsonKey;
    }
}
module.exports = KaseySOPString;