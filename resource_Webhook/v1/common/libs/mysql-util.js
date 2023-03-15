const mysql = require('mysql');

class MysqlUtil {
    constructor(config) {
    
        this.config = config;
        this.executeQuery = this.executeQuery.bind(this);
    }

    executeQuery (query, values) {
        return new Promise((resolve, reject) => {
            const pool = mysql.createConnection({
                host:'10.83.145.55',
                user:'dbuser',
                password:'Hitachi@2020',
                database: 'hitachi_live' });
            pool.connect((err) => {
                if (err) {
                    pool.end();
                    console.log("Error in pool connect is " + err);
                    reject(err);
                } else {
                    console.log("Inside MySQL query execution");
                    pool.query(query, function(err, recordset) {
                        pool.end();
                        if(err) {
                            reject(err);
                        }else {
                            
                            resolve(JSON.parse(JSON.stringify(recordset))) 
                          
                           //console.log("records", recordset)
                        }
                        
                    });
                }
            });
        });
    };

    executeMobPassword (data) {
        console.log("data is",data)
        let query1 = `Update user_passwords SET password="${data.Passbase64}" WHERE id="${data.id}"`
        let query2 = `Update users SET app_password="${data.Passhash}" WHERE email="${data.email}"`
        let query3 = `Update users SET password_changed="0" WHERE email="${data.email}"`
        return new Promise((resolve, reject) => {
            const pool = mysql.createConnection({
                host:'10.83.145.55',
                user:'dbuser',
                password:'Hitachi@2020',
                database: 'hitachi_live' });
            pool.connect((err) => {
                if (err) {
                    pool.end();
                    console.log("Error in pool connect is " + err);
                    reject(err);
                } else {
                    console.log("Inside MySQL query execution ejijo password");
                    pool.query(query1, function(err, recordset) {
                        //pool.end();
                        if(err) {
                            reject(err);
                        }else {
                            
                            resolve(JSON.parse(JSON.stringify(recordset))) 
                          
                           //console.log("records", recordset)
                        }
                        
                    });
                    pool.query(query3, function(err, recordset) {
                        //pool.end();
                        if(err) {
                            reject(err);
                        }else {
                            
                            resolve(JSON.parse(JSON.stringify(recordset))) 
                          
                           //console.log("records", recordset)
                        }
                        
                    });
                    pool.query(query2, function(err, recordset) {
                        pool.end();
                        if(err) {
                            reject(err);
                        }else {
                            
                            resolve(JSON.parse(JSON.stringify(recordset))) 
                          
                           //console.log("records", recordset)
                        }
                        
                    });
                }
            });
        });
    };
       
}


module.exports = MysqlUtil;