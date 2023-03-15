var execFile = require('child_process').execFile;

class ResetAD {
    constructor(config) {
    
        this.config = config;
        this.resetadpassword = this.resetadpassword.bind(this);
    }
    resetadpassword(accountname){
        console.log("------------Microclinic-------------")
        var user = accountname;
        var domainName = 'microclinic.in'
        var ADadminuser = 'adm.pcvisor'
        var ADdminpassword  = 'j49P7QrxmKrpseD+iYmcBF0gab7rDNjqzrWhITN+Dq0='
        var emailID = 'itsupport@hisysmc.com'
        var emailpassword = 'tn24d6DGAkRPyQUts7vzW3xUSETmNwGRY33DrbVlcKK89E/ZFdMHwimXG+vLgWd4' 
        var executablePath = "C:\\Users\\neha\\Downloads\\hitachitest\\Webhook\\v1\\customers\\hitachi\\IT\\passwordreset\\ADPassChangeEmail.exe";
        execFile(executablePath, [`${user}`,`${domainName}`,`${ADadminuser}`,`${ADdminpassword}`,`${emailID}`,`${emailpassword}`], function(err, data) {
        if(err) {
            console.log(err)
        } 
        else 
        console.log(data.toString());                       
    }); 
return;
}
}
module.exports = ResetAD;