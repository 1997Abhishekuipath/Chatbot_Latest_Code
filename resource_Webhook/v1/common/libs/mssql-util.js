const sql = require("mssql");

class MssqlUtil {
    constructor(config) {
        this.config = config;
        this.executeQuery = this.executeQuery.bind(this);
    }

    executeQuery (query, params) {
        return new Promise((resolve, reject) => {
            let pool = new sql.ConnectionPool(this.config.get('mssql'));
            pool.connect(err => {
                if (err) {
                    console.log("Error in pool connect is " + err);
                    reject(err);
                } else {
                    console.log("Inside MSSQL query execution");
                    const request = new sql.Request(pool);
                    request.query(query, function (error, recordset) {
                        if (error) {
                            console.log("err is " + error);
                            reject(error);
                        } else {
                            for (let i = 0; i < recordset.recordsets.length; i++) {
                                //console.log(recordset.recordsets[i])
                                resolve(recordset.recordsets[i]);
                            }
                        }
                        pool.close();
                    })
                }
            })
        });
    };

    
    UpdateRespassword (query1) {
        console.log(query1,"ttttttttttttttttttttt")
        let pool = new sql.ConnectionPool({
            server:'10.83.145.25',
            user:'ChatBot',
            password:'Ch0tbot@2o2o#',
        });
        pool.connect(err => {
                if (err) {
                    pool.close();
                    console.log("Error in pool connect is " + err);
                    throw err
                } else {
                    console.log("Inside MSSQL query execution", query1);
                    const request = new sql.Request(pool);
                    request.query(query1, function (error) {
                        pool.close();
                        if (error) {
                            console.log("err is " + error);
                            throw err
                        } else {
                            console.log("success")
                        }
                        
                    })
                }
        })
        
        return "success"
    };
}

module.exports = MssqlUtil;