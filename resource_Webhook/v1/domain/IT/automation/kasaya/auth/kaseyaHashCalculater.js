var crypto = require('crypto');

class KaseyaHashCalculater {

    constructor(kaseyaUser, password) {
        console.log('HASH Calculated for ',kaseyaUser, password)
        /*_______________________________________________________________________

            * kaseya encoding formula to genrate tokens for it's services
            * The object of class hold the value so value calculate only at once
            * Rest use BasicAuthString for Authrization Token
            * SOAP Session also created with the help of this HASH
            *
         **********************************************************************/

        this.kaseyaUser = kaseyaUser;
        this.randomNumber = this._randomNo(8); // defalut limit

        /*______________________Hash Calculater Algorithm ___________________________________________________*/
        /*
            # http://help.kaseya.com/webhelp/EN/restapi/9040000/#37320.htm
        */
        this.RawSHA256Hash =        this._CalculateHash(password, "sha256");
        this.CoveredSHA256Hash =    this._CalculateHash(password + kaseyaUser, "sha256");
        this.CoveredSHA256Hash =    this._CalculateHash(this.CoveredSHA256Hash + this.randomNumber, "sha256");
        this.RawSHA1Hash =          this._CalculateHash(password, "sha1");
        this.CoveredSHA1Hash =      this._CalculateHash(password + kaseyaUser, "sha1");
        this.CoveredSHA1Hash =      this._CalculateHash(this.CoveredSHA1Hash + this.randomNumber, "sha1");

        /*
            * GENRATE BASIC AUTH STRING USED IN REST CALL
         */

        this._basicAuthString = this._basicAuthString();
    }

    _CalculateHash(data, algo) {
        switch (algo) {
            case 'sha256' :
                return crypto.createHash('sha256').update(data).digest("hex");
            case 'sha1' :
                console.log(data);
                return crypto.createHash('sha1').update(`${data}`).digest("hex");
            case 'base64' :
                return (new Buffer(data).toString('base64'))
        }
    }

    _randomNo(limit) {
        return Math.floor(Math.random() * (Math.pow(10, limit))).toString().replace('0', '1');
    }

    _basicAuthString() {
        let authString = `user=${this.kaseyaUser},pass2=${this.CoveredSHA256Hash},pass1=${this.CoveredSHA1Hash},rpass2=${this.RawSHA256Hash},rpass1=${this.RawSHA1Hash},rand2=${this.randomNumber}`;
        console.log('auth string genrated for kaseya');
        console.log(authString);
        return this._CalculateHash(authString, 'base64')
    }
}
module.exports = KaseyaHashCalculater