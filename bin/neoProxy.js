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
var neo4j = require('neo4j');
//var neo4jD = require('neo4j-driver').v1;
var async=require('async');
var request = require("request");
var serverParams = require("./serverParams.js");
var logger=require("./logger..js");


neo4jProxy = {
    driver: null,
    getDriver: function () {
        if (!neo4jProxy.driver)
            neo4jProxy.driver = neo4jD.driver("bolt://localhost", neo4j.auth.basic("neo4j", "souslesens"));
        return neo4jProxy.driver;
    }

    ,

    matchCypher: function (matchStr, callback) {
        var path = "/db/data/cypher";
        var payload = {
            "query": matchStr
        }
        neo4jProxy.cypher(null, path, payload, callback);


    },
    matchDriver: function (matchStr, callback) {
        var session = neo4jProxy.getDriver().session();

// Run a Cypher statement, reading the result in a streaming manner as records arrive:
        session
            .run(matchStr)
            .subscribe({
                onNext: function (record) {
                    console.log(JSON.stringify(record,null,2));
                    var x=1;

                },
                onCompleted: function () {
                    session.close();
                },
                onError: function (error) {
                    console.log(error);
                    session.close();
                }
            });
    },

    match: function (matchStr, callback) {
        logger.info(matchStr)
        var neo4jUrl = serverParams.neo4jUrl;
        var db = new neo4j.GraphDatabase(neo4jUrl);
        var obj = {
            query: matchStr
        };
        try {
            db.cypher(obj, function (err, results) {
                if (err)
                    callback(err);
                else
                    callback(null, results)
            });
        } catch (e) {
            console.log(e);
        }
    },

    matchRest:function(matchStr,callback){
        var payload = {
            "query": matchStr
        }
        var path = "/db/data/cypher";
        var neo4jUrl = serverParams.neo4jUrl;
        request({
                url: neo4jUrl + path,
                json: payload,
                method: 'POST',
                headers: {'Content-Type': 'application/json',}
            },
            function (err, res) {
                if (err)
                    callback(err)
                else if (res.body && res.body.errors && res.body.errors.length > 0) {
                    console.log(JSON.stringify(res.body.errors))
                    callback(res.body.errors)
                }
                else {
                    callback(null, res.body)
                }
            })



    }

    , cypher: function (url, path, payload, callback) {

        var neo4jUrl = serverParams.neo4jUrl;
        var uri = neo4jUrl + path;

        if (typeof payload === 'string')
            payload = JSON.parse(payload);
        request({
                url: uri,
                json: payload,
                method: 'POST',
            },
            function (err, res) {

                if (err)
                    callback(err)
                else if (res.body && res.body.errors && res.body.errors.length > 0) {
                    console.log(JSON.stringify(res.body.errors))
                    callback(res.body.errors)
                }
                else
                    callback(null, res.body)
            });


    },
    executeStatements: function (statements, callback) {
            //   console.log(statements.length)
            function execute(group) {
                var payload = {
                    "statements": group
                }
                var path = "/db/data/transaction/commit";
                var neo4jUrl = serverParams.neo4jUrl;
                request({
                        url: neo4jUrl + path,
                        json: payload,
                        method: 'POST',
                        headers: {'Content-Type': 'application/json',}
                    },
                    function (err, res) {

                        if (err)
                            callback(err)
                        else if (res.body && res.body.errors && res.body.errors.length > 0) {
                            console.log(JSON.stringify(res.body.errors))
                            callback(res.body.errors)
                        }
                        else {


                            callback(null, res.body)
                        }
                    })


            }

            var groups = [];
            var currentGroup = [];

            statements.forEach(function (statement, index) {

                currentGroup.push(statement)
                if (currentGroup.length > 100 || index >= statements.length - 1) {
                    groups.push(currentGroup);
                    currentGroup = [];
                }

            })
        var allResults=[];
            async.eachSeries(groups, function (group, callbackEach) {

                execute(group, function (err, result) {

                    if (err)
                        return callbackEach(err);
                    allResults.push.apply(allResults,result);
                    return callbackEach();
                })

            }, function (err) {
                if (err) {
                    console.log(err);
                    return callback(err);
                }
                return callback(allResults);
            })
        }


}

module.exports = neo4jProxy;

