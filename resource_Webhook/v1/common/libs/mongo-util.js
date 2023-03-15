const mongoClient = require('mongodb').MongoClient;

class MongoUtil {
    constructor(url) {
        this.url = url;
    }

    createCollection (collection) {
        return new Promise((resolve, reject) => {
            mongoClient.connect(this.url, function (error, db) {
                if (error) {
                    reject(error);
                } else {
                    db.createCollection(collection, function (err, res) {
                        if (err) {
                            reject(err);
                        } else {
                            db.close();
                            resolve(res);
                        }
                    });
                }
            });
        });
    };

    createRecord (collection, document) {
        return new Promise((resolve, reject) => {
            mongoClient.connect(this.url, function (error, db) {
                if (error) {
                    reject(error);
                } else {
                    db.collection(collection).insertOne(document, function (err, res) {
                        if (err) {
                            reject(err);
                        } else {
                            db.close();
                            resolve(res);
                        }
                    });
                }
            });
        });
    };

    findRecord (collection, query, fields) {
        console.log(this.url);
        return new Promise((resolve, reject) => {
            mongoClient.connect(this.url, function (error, db) {
                if (error) {
                    reject(error);
                } else {
                    if (!fields) {
                        fields = {};
                    }
                    db.collection(collection).find(query, fields).toArray(function (err, res) {
                        if (err) {
                            reject(err);
                        } else {
                            db.close();
                            resolve(res);
                        }
                    });
                }
            });
        });
    };

    findwebRecord (collection, query, fields) {
        console.log(this.url);
        return new Promise((resolve, reject) => {
            mongoClient.connect(this.url, function (error, db) {
                if (error) {
                    reject(error);
                } else {
                    if (!fields) {
                        fields = {};
                    }
                    db.collection(collection).find(query, fields).sort({'_id':-1}).limit(1).toArray(function (err, res) {
                        if (err) {
                            reject(err);
                        } else {
                            db.close();
                            resolve(res);
                        }
                    });
                }
            });
        });
    };

    findSortedRecord (collection, query, fields,sort) {
        console.log(this.url);
        return new Promise((resolve, reject) => {
            mongoClient.connect(this.url, function (error, db) {
                if (error) {
                    reject(error);
                } else {
                    if (!fields) {
                        fields = {};
                    }
                    db.collection(collection).find(query, fields).sort(sort).toArray(function (err, res) {
                        if (err) {
                            reject(err);
                        } else {
                            db.close();
                            resolve(res);
                        }
                    });
                }
            });
        });
    };

    updateRecord(collection, query, values){
        return new Promise((resolve, reject) => {
            mongoClient.connect(this.url, function (error, db) {
                if (error) {
                    reject(error);
                } else {
                    db.collection(collection).updateOne(query, values, function (err, res) {
                        if (err) {
                            reject(err);
                        } else {
                            db.close();
                            resolve(res);
                        }
                    });
                }
            });
        });
    };

    updateRecords(collection, query, values) {
        return new Promise((resolve, reject) => {
            mongoClient.connect(this.url, function (error, db) {
                if (error) {
                    reject(error);
                } else {
                    db.collection(collection).updateMany(query, values, function (err, res) {
                        if (err) {
                            reject(err);
                        } else {
                            db.close();
                            resolve(res);
                        }
                    });
                }
            });
        });
    };

    updateRecordWithUpsert (collection, query, values)  {
        return new Promise((resolve, reject) => {
            mongoClient.connect(this.url, function (error, db) {
                if (error) {
                    reject(error);
                } else {
                    
                    db.collection(collection).updateOne(query, values, {upsert: true}, function (err, res) {
                        if (err) {
                            reject(err);
                        } else {
                            db.close();
                            resolve(res);
                        }
                    });
                }
            });
        });
    };

    findAggregatedRecords (collection, array) {
        return new Promise((resolve, reject) => {
            mongoClient.connect(this.url, function (error, db) {
                if (error) {
                    reject(error);
                } else {
                    db.collection(collection).aggregate(array).toArray(function (err, res) {
                        if (err) {
                            reject(err);
                        } else {
                            db.close();
                            resolve(res);
                        }
                    });
                }
            });
        });
    };

    fetchSequenceValue (sequenceName) {
        return new Promise((resolve, reject) => {
            mongoClient.connect(this.url, function (error, db) {
                if (error) {
                    reject(error);
                } else {
                    db.collection("counters").findOneAndUpdate({_id: sequenceName}, {$inc: {sequence: 1}}, {returnOriginal: false}, function (err, res) {
                        if (err) {
                            reject(err);
                        } else {
                            console.log(res.value.sequence);
                            db.close();
                            resolve(res.value.sequence);
                        }
                    });
                }
            });
        });
    };


    emptyCollection (collection) {
        return new Promise((resolve, reject) => {
            mongoClient.connect(this.url, function (error, db) {
                if (error) {
                    reject(error);
                } else {
                    db.collection(collection).deleteMany({},{}, function (err, res) {
                        if (err) {
                            reject(err);
                        } else {
                            db.close();
                            resolve(res);
                        }
                    });
                }
            });
        });
    };
    
    RemoveRecords (collection,documents) {
        return new Promise((resolve, reject) => {
            mongoClient.connect(this.url, function (error, db) {
                if (error) {
                    reject(error);
                } else {
                    db.collection(collection).remove(documents,{justOne: false}, function (err, res) {
                        if (err) {
                            reject(err);
                        } else {
                            db.close();
                            resolve(res);
                        }
                    });
                }
            });
        });
    };
    insertRecords (collection, documents) {
        return new Promise((resolve, reject) => {
            mongoClient.connect(this.url, function (error, db) {
                if (error) {
                    reject(error);
                } else {
                    db.collection(collection).insertMany(documents, function (err, res) {
                        if (err) {
                            reject(err);
                        } else {
                            db.close();
                            resolve(res);
                        }
                    });
                }
            });
        });
    };
}

module.exports = MongoUtil;