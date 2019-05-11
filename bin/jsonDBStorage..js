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


var jsonDBStorage = {


    invoke: function (req, callback) {
        if (req.body.getDatasetNames) {
            jsonDBStorage.getDatasetNames(req.body.getDatasetNames,function (error, result) {
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
        if (req.body.writeDataset) {
            jsonDBStorage.writeDataset(JSON.parse(req.body.writeDataset), function (error, result) {
                callback(error, result);
            });
        }


        if (req.body.addMappingset) {
            jsonDBStorage.addMappingset(req.body.addMappingset, function (error, result) {
                callback(error, result);
            });
        }
        if (req.body.writeMapping) {
            var mapping=JSON.parse( req.body.writeMapping);
            jsonDBStorage.writeMapping(mapping.mappingset,mapping, function (error, result) {
                callback(error, result);
            });
        }
        if (req.body.getMappings) {
            jsonDBStorage.getMappings(req.body.getMappings, function (error, result) {
                callback(error, result);
            });
        }

        if (req.body.removeDataset) {
            jsonDBStorage.removeDataset(req.body.removeDataset, function (error, result) {
                callback(error, result);
            });
        }
        if (req.body.removeMapping) {
            jsonDBStorage.removeMapping(req.body.mappingsetName, req.body.removeMapping, function (error, result) {
                callback(error, result);
            });
        }
        if (req.body.getDataset) {
            jsonDBStorage.getDataset(JSON.parse(req.body.getDataset), function (error, result) {
                callback(error, result);
            });
        }
        if (req.body.getDatasetCollectionNames) {
            jsonDBStorage.getDatasetCollectionNames( function (error, result) {
                callback(error, result);
            });
        }

        if (req.body.getMapping) {
            jsonDBStorage.getMapping(JSON.parse(req.body.getMapping), function (error, result) {
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


    createDataDB: function () {
        jsonDBStorage.getDatasetDb().defaults({files: []})
            .write()
    },

    createMappingDB: function () {

        jsonDBStorage.getMappingDb().defaults({mappings: []})
            .write()
    },


    writeDataset: function (json, callback) {

        var datasetCollectionName=json.datasetCollectionName;
        var obj= jsonDBStorage.getDatasetDb().get('datasets').get(datasetCollectionName).value()
        if(obj==null)
            var obj= jsonDBStorage.getDatasetDb().get('datasets').set(datasetCollectionName,{}).write()

       jsonDBStorage.getDatasetDb().get('datasets').get(datasetCollectionName).set(json.name,json) .write();
        if (callback)
            return callback(null, "done")
    },


    addMappingset: function (mappingsetName, json, callback) {
        var db = jsonDBStorage.getMappingDb().get('mappings')
        db.set(mappingsetName, {nodes:{},relations:{}}).write();
        return callback(null, "done")
    },


    writeMapping: function (mappingsetName, json, callback) {
        var db = jsonDBStorage.getMappingDb().get('mappings');


       /* var value = db.get(mappingsetName).get(mappingsetName).get(json.name).value();
        if (value)
            db.get(mappingsetName).remove(json.name).write()*/

       var xx= db.get(mappingsetName).get(json.type+"s").value();
        db.get(mappingsetName).get(json.type+"s").set(json.name,json) .write();

        if (callback)
            return callback(null, "done")
    },

    getDataset: function (json, callback) {
        var query = json.query;
        if (!json.query)
            query = json;
        var value = jsonDBStorage.getDatasetDb().get('files')
            .find(query)
            .value()

        if (json.fields) {
            value = jsonDBStorage.filterFields(value, json.fields)

        }
        return callback(null, value);
    },


    getMappings: function (mappingsetName, callback) {

        var value = jsonDBStorage.getMappingDb().get('mappings').get(mappingsetName).value();

        return callback(null, value);

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


    getDatasetNames: function (datasetCollectionName,callback) {
        var obj = jsonDBStorage.getDatasetDb().get('datasets').get(datasetCollectionName).value();
        return callback(null, Object.keys(obj))

    },

    getDatasetCollectionNames: function (callback) {
        var obj = jsonDBStorage.getDatasetDb().get('datasets').value();
        return callback(null, Object.keys(obj))

    },

    getDatasetNames: function ( datasetCollectionName,callback) {
        var obj = jsonDBStorage.getDatasetDb().get('datasets').get(datasetCollectionName).value();
        return callback(null, Object.keys(obj))

    },

    getMappingsetNames: function (callback) {
        var obj = jsonDBStorage.getMappingDb().get('mappings').value();
        return callback(null, Object.keys(obj));
    },

    getMappingNames: function (mappingsetName, callback) {
        var keys = jsonDBStorage.getMappingDb().get('mappings').map(mappingsetName).value();

        return callback(null, keys)
    },

    removeDataSet: function (datasetName, callback) {
        jsonDBStorage.getDatasetDb().get('datasets').get(datasetName).remove().write()
        return callback(null, "done")
    },
    removeMapping: function (mappingsetName, mappingName, callback) {
        jsonDBStorage.getMappingDb().get('mappings').get(mappingsetName).get(mappingName).remove().write()
        return callback(null, "done")
    },


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


