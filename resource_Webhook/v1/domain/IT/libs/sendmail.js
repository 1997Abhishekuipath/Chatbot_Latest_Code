const nodemailer = require('nodemailer');

var transporter = nodemailer.createTransport({
  host: 'outlook.office365.com',
  port: 587,
  auth: {
     user: 'itsupportgroup@hisysmc.com',
     pass: 'Micro@123'
  }
});

class SendMail {
    constructor(config) {
    
        this.config = config;
        this.mailmessage1 = this.mailmessage1.bind(this);
        this.mailmessage2 = this.mailmessage2.bind(this);
    }

    jobmessage(data){

      var mailOptions = {
        from: 'itsupportgroup@hisysmc.com',
        to: data.to,
        subject: 'Hiring Details',
        html: `Dear <b>Sir/Mam</b>, <br><br>
        <br> ${data.msg}<br>
        <b>Best Regards</b>,<br> Chatbot <br><br>
        This is an auto generated mail, please don't respond back to this Email.`,
        attachments: [
          {   
            filename: data.file_name,
            path: data.file_dest
          },
         
      ]
    };
      
      transporter.sendMail(mailOptions, function(error, info){
        if (error) {
          console.log("----------------i am inside mail error----------------");
          console.log(error);
          return "error"
            
        } 
        else {
          console.log('Email sent: ' + info.response);   
          return info.response
               
        }
      });
   
   
    }

    mailmessage1(data){

          var mailOptions = {
            from: 'itsupportgroup@hisysmc.com',
            to: data.to,
            subject: 'Chatbot OTP Verification',
            html: `Dear <b>${data.Name}</b>, <br><br>
            Please find the OTP <b>${data.otp}</b> for the verification.<br><br>
            <b>Best Regards</b>,<br> Chatbot <br><br>
            This is auto generated mail, please don't respond back to this Email.`
          };
         
          transporter.sendMail(mailOptions, function(error, info){
            if (error) {
              console.log("----------------i am inside mail error----------------");
              console.log(error);
              return "error"
                
            } 
            else {
              console.log('Email sent: ' + info.response);   
              return info.response
                   
            }
          });
       
       
        }

    mailmessage2(data){

      var mailOptions = {
          from: 'itsupportgroup@hisysmc.com',
          to: data.email,
          subject: 'Request for Password Reset',
          html: `Dear <b>${data.Name}</b>, <br><br>
          Please find the temporary password <b>${data.Password}</b> for login.<br><br>
          <b>Best Regards</b>,<br> Chatbot <br><br>
          This is auto generated mail, please don't respond back to this Email.`
      };
         
      transporter.sendMail(mailOptions, function(error, info){
        if (error) {
          console.log("----------------i am inside mail error----------------");
          console.log(error);
         return "error"
        } 
        else {
          console.log('Email sent: ' + info.response);  
          return info.response 
                   
        }
      });
       
       
        }
}

module.exports = SendMail;