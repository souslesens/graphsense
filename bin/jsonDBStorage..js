/*******************************************************************************
 * SOUSLESENS LICENSE************************
 *
 * The MIT License (MIT)
 *
 * Copyright (c) 2016-2017 Claude Fauconnet claude.fauconnet@neuf.fr
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 *
 ******************************************************************************/
const low = require('lowdb')
const FileSync = require('lowdb/adapters/FileSync');
const path = require("path");


const dbDataPath = path.resolve(__dirname, '../db/datasets.db');
const dbMappingsPath = path.resolve(__dirname, '../db/mappings.db');
const dbUsersPath = path.resolve(__dirname, '../db/users.db');

var jsonDBStorage = {


    invoke: function (req, callback) {

        /*************************Datasets*******************************************************/
        if (req.body.getDatasetNames) {
            jsonDBStorage.getDatasetNames(req.body.getDatasetNames, function (error, result) {
                callback(error, result);
            });
        }
        if (req.body.getDatasets) {
            jsonDBStorage.getDatasets(req.body.getDatasets, function (error, result) {
                callback(error, result);
            });
        }


        if (req.body.writeDataset) {
            jsonDBStorage.writeDataset(JSON.parse(req.body.writeDataset), function (error, result) {
                callback(error, result);
            });
        }




        if (req.body.removeDataset) {
            jsonDBStorage.removeDataset(req.body.datasetCollectionName,req.body.datasetName, function (error, result) {
                callback(error, result);
            });
        }

        if (req.body.getDataset) {
            jsonDBStorage.getDataset(req.body.getDataset, function (error, result) {
                callback(error, result);
            });
        }
        if (req.body.getDatasetCollectionNames) {
            jsonDBStorage.getDatasetCollectionNames(function (error, result) {
                callback(error, result);
            });
        }
/************************************Mappings******************************/
        if (req.body.getMapping) {
            jsonDBStorage.getMapping(JSON.parse(req.body.getMapping), function (error, result) {
                callback(error, result);
            });
        }
        if (req.body.removeMapping) {
            jsonDBStorage.removeMapping(req.body.mappingsetName,req.body.type, req.body.mappingName, function (error, result) {
                callback(error, result);
            });
        }
        if (req.body.addMappingset) {
            jsonDBStorage.addMappingset(req.body.addMappingset, function (error, result) {
                callback(error, result);
            });
        }
        if (req.body.writeMapping) {
            var mapping = JSON.parse(req.body.writeMapping);
            jsonDBStorage.writeMapping(mapping.mappingset, mapping, function (error, result) {
                callback(error, result);
            });
        }
        if (req.body.getMappings) {
            jsonDBStorage.getMappings(req.body.getMappings, function (error, result) {
                callback(error, result);
            });
        }

        if (req.body.getMappingsetNames) {
            jsonDBStorage.getMappingsetNames(function (error, result) {
                callback(error, result);
            });
        }
        if (req.body.getMappingNames) {
            jsonDBStorage.getMappingNames(req.body.getMappingNames, function (error, result) {
                callback(error, result);
            });
        }

        /************************************Users******************************/


        if (req.body.getUserData) {
            jsonDBStorage.getUserData(req.body.login, function (error, result) {
                callback(error, result);
            });
        }
        if (req.body.setUserData) {
            jsonDBStorage.setUserData(req.body.login,JSON.parse(req.body.data), function (error, result) {
                callback(error, result);
            });
        }
        if (req.body.addUser) {
            jsonDBStorage.addUser(req.body.user, function (error, result) {
                callback(error, result);
            });
        }
        if (req.body.removeUser) {
            jsonDBStorage.removeUser(req.body.login, function (error, result) {
                callback(error, result);
            });
        }
        if (req.body.listUsers) {
            jsonDBStorage.listUsers( function (error, result) {
                callback(error, result);
            });
        }
        if (req.body.checkLogin) {
            jsonDBStorage.checkLogin(req.body.login,req.body.password, function (error, result) {
                callback(error, result);
            });
        }




    },


    getDatasetDb: function () {
        const adapter = new FileSync(dbDataPath)
        const db = low(adapter)
        return db;
    },

    getMappingDb: function () {
        const adapter = new FileSync(dbMappingsPath)
        const db = low(adapter);
        return db;
    }
    ,
    getUserDb: function () {
        const adapter = new FileSync(dbUsersPath)
        const db = low(adapter);
        return db;
    }
    ,


    createDataDB: function () {
        jsonDBStorage.getDatasetDb().defaults({files: []})
            .write()
    },

    createMappingDB: function () {

        jsonDBStorage.getMappingDb().defaults({mappings: []})
            .write()
    },




    /*****************************************Datasets**************************************/

    writeDataset: function (json, callback) {

        var datasetCollectionName = json.datasetCollectionName;
        var obj = jsonDBStorage.getDatasetDb().get('datasets').get(datasetCollectionName).value()
        if (obj == null)
            var obj = jsonDBStorage.getDatasetDb().get('datasets').set(datasetCollectionName, {}).write()

        jsonDBStorage.getDatasetDb().get('datasets').get(datasetCollectionName).set(json.name, json).write();
        if (callback)
            return callback(null, "done")
    },


    addMappingset: function (mappingsetName, json, callback) {
        var db = jsonDBStorage.getMappingDb().get('mappings')
        db.set(mappingsetName, {nodes: {}, relations: {}}).write();
        return callback(null, "done")
    },


    getDatasetNames: function (datasetCollectionName, callback) {
        var obj = jsonDBStorage.getDatasetDb().get('datasets').get(datasetCollectionName).value();
        return callback(null, Object.keys(obj))

    },
    getDatasets: function (datasetCollectionName, callback) {
        var obj = jsonDBStorage.getDatasetDb().get('datasets').get(datasetCollectionName).value();
        return callback(null, obj)

    },

    getDatasetCollectionNames: function (callback) {
        var obj = jsonDBStorage.getDatasetDb().get('datasets').value();
        return callback(null, Object.keys(obj))

    },

    getDataset: function (datasetName, callback) {

        var value = jsonDBStorage.getDatasetDb().get('datasets').get(datasetName).value();
        if (callback)
            return callback(null, value);
        return value;

    },

/*****************************************Mappings**************************************/
    writeMapping: function (mappingsetName, json, callback) {
        var db = jsonDBStorage.getMappingDb().get('mappings');


         var value = db.get(mappingsetName).value();
         if (!value)
             db.set(mappingsetName,{nodes:{},relations:{}}).write();

        var xx = db.get(mappingsetName).get(json.type + "s").value();
        db.get(mappingsetName).get(json.type + "s").set(json.name, json).write();

        if (callback)
            return callback(null, "done")
    },



    getMappings: function (mappingsetName, callback) {

        var value = jsonDBStorage.getMappingDb().get('mappings').get(mappingsetName).value();
        if (callback)
            return callback(null, value);
        return value;

    },


    getMapping: function (json, callback) {
        var query = null;
        if (json) {
            var query = json.query;
            if (!json.query)
                query = json;
        }

        var value;
        if (!query || query == "*")
            value = jsonDBStorage.getMappingDb().get('mappings')
                .value()
        else
            value = jsonDBStorage.getMappingDb().get('mappings')
                .find(json)
                .value()

        if (json.fields) {
            value = jsonDBStorage.filterFields(value, json.fields)
        }
        return callback(null, value);
    },

    filterFields: function (obj, fields) {
        var obj2 = {}
        for (var key in obj) {
            if (fields.indexOf(key) > -1)
                obj2[key] = obj[key];
        }
        return obj2;

    },





    getMappingsetNames: function (callback) {
        var obj = jsonDBStorage.getMappingDb().get('mappings').value();
        return callback(null, Object.keys(obj));
    },

    getMappingNames: function (mappingsetName, callback) {
        var keys = jsonDBStorage.getMappingDb().get('mappings').map(mappingsetName).value();

        return callback(null, keys)
    },

    removeDataSet: function (datasetCollectionName,datasetName, callback) {
        jsonDBStorage.getDatasetDb().get('datasets').get(datasetCollectionName).get(datasetName).remove().write()
        return callback(null, "done")
    },
    removeMapping: function (mappingsetName,type, mappingName, callback) {
        var xx=jsonDBStorage.getMappingDb().get('mappings').get(mappingsetName).get(type).get(mappingName).value()
        jsonDBStorage.getMappingDb().get('mappings').get(mappingsetName).get(type).get(mappingName).remove().write()
        return callback(null, "done")
    },







    /***************************users**********************************/


    addUser:function(user, callback) {

        var db = jsonDBStorage.getUserDb().get('users')
        db.set(user, {infos:{},settings: {}, graphs: {},sets:{}}).write();
        return callback(null, "done")

},
    removeUser:function(login, callback) {
        var db = jsonDBStorage.getUserDb().get('users')
        db.get(login).remove().write();
        return callback(null, "done")

    },
    listUsers:function( callback) {
        var obj = jsonDBStorage.getUserDb().get('users').value();
        return callback(null, Object.keys(obj));

    },
    getUserData:function(login, callback) {
        var obj = jsonDBStorage.getUserDb().get('users').get(login).value();
        return callback(null, obj)

    },
    setUserData:function(login, data,callback) {
        jsonDBStorage.getUserDb().get('users').set(login, data).write();
        return callback(null, "done")

    },
    checkLogin(login,password,callback){

            var obj = jsonDBStorage.getUserDb().get('users').get(login).value();
            if(!obj)
                return callback("Wrong user");
            if(obj.infos.password!=password)
                return callback("Wrong password");
            return callback(null, obj);


    }


}


/*var x=db.get('posts')
    .find({ id: 1 })
    .value()*/

/*

// Set some defaults
db.defaults({ posts: [], user: {} })
    .write()

// Add a post
db.get('posts')
    .push({ id: 1, title: 'lowdb is awesome'})
    .write()

// Set a user using Lodash shorthand syntax
db.set('user.name', 'typicode')
    .write()*/


module.exports = jsonDBStorage;
/*var xx = Object.keys(jsonDBStorage.getMappingDb().get('mappings').value());

var xx = jsonDBStorage.getMappingDb().get('mappings').get('aa').value();


jsonDBStorage.writeMapping("aa", {name: "aa1", ww: 33}, function (err, result) {
    x = 2
})*/


