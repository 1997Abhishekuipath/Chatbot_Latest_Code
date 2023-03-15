const MessageUtil = require("../../domain/IT/libs/messages");

class VerifyToken{
    constructor(config){
        this.config = config;

        /*---------------------Function Binding------------------*/
        this.verify=this.verify.bind(this);
    }

    verify(req, res, next) {
        console.log("Inside Verify Token");
        const authToken = this.config.get('server:authToken');
        const token = req.headers['authorization'];
        if (!token){
            console.log("No token Provided")
            return res.status(403).send({
                success: false,
                message: MessageUtil.messages().ERROR.TOKEN_NOT_PROVIDED
            });
        }
        else if(token != authToken){
            console.log('Failed to authenticate token');
            
            return res.status(401).send({
                success: false,
                message: MessageUtil.messages().ERROR.TOKEN_AUTHENTICATION_FAILURE
            });
        }
        else{
            next();
        }
    }
}

module.exports = VerifyToken;
