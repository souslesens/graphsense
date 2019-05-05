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
const path=require("path");


const dbDataPath = path.resolve(__dirname,'../db/souslesensData.db');
const dbMappingsPath =path.resolve(__dirname,'../db/mappings.db');


var jsonDBStorage = {

    getDataSetDb: function () {
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
        jsonDBStorage.getDataSetDb().defaults({files: {}})
            .write()
    },

    createMappingDB: function () {

        jsonDBStorage.getMappingDb().defaults({mappings: {}})
            .write()
    },


    writeDataset: function (key,json) {
       var db= jsonDBStorage.getDataSetDb();
       var xx=  db.get('files');
        db.get('files')
            .set(key, json)
            .write()
    },

    writeMapping: function (json) {
        jsonDBStorage.getDataSetDb().get('mappings')
            .set(key, json)
            .write()
    },

    getDataset: function (json) {
       return  jsonDBStorage.getDataSetDb().get('files')
            .find(json)
            .value()
    },

    getMapping: function (json) {
       return  jsonDBStorage.getDataSetDb().get('mappings')
            .find(json)
            .value()
    },


    getDatasetNames: function (callback) {
           var keys=jsonDBStorage.getDataSetDb().get('files').map('name') .value();
           return callback(null,keys)

    },

    getMappingNames: function (callback) {
        var keys=jsonDBStorage.getMappingDb().get('files').map('name') .value();
        return callback(null,keys)
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

//jsonDBStorage.getDatasetNames()


