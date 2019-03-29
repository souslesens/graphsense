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
var DataModel = (function () {
    var self = {};

    self.neo4jProxyUrl = "../../../neo";

    self.labels = {};
    self.labelsRelations = {};
    self.relations = {};
    self.allRelations = {};
    self.allProperties = [""];
    self.allRelationsArray = [""];
    self.allLabels = [""];
    self.DBstats = null;


    self.getDBstats = function (subGraph, callbackOuter) {
        var where = ""
        if (subGraph)
            where = " where n.subGraph='" + subGraph + "' ";


        var dataLabels = [];
        var dataRels = [];
        async.series([
                function (callback) {
                    var countNodesMatch = "  MATCH (n) " + where + "  RETURN Labels(n)[0] as label , count(*) as countNodes";

                    Cypher.executeCypher(countNodesMatch, function (err, result) {
                        if (err)
                            return callback(err);
                        dataLabels = result;
                        callback()
                    });

                },
                function (callback) {
                    var countRelsMatch = " MATCH (n)-[r]->(m) " + where + " RETURN type(r) as relType, labels(n)[0] as startLabel,labels(m)[0] as endLabel, count(r) as countRel";
                    Cypher.executeCypher(countRelsMatch, function (err, result) {
                        if (err)
                            return callback(err);
                        dataRels = result;
                        callback()
                    });
                },
                function (callback) {
                    var nodes = {};
                    for (var i = 0; i < dataLabels.length; i++) {
                        nodes[dataLabels[i].label] = dataLabels[i].countNodes;
                    }
                    var relations = {};
                    for (var i = 0; i < dataRels.length; i++) {
                        relations[dataRels[i].relType] = dataRels[i];
                    }
                    var output = {
                            nodes: nodes,
                            relations: relations,
                        }
                    ;
                    self.DBstats = output;
                    if (callback)
                        return callback(null, output);
                    callback()
                }


            ],

            function (err) {
                if (err)
                    return callbackOuter(err);
                return callbackOuter(null, self.DBstats);


            }
        )


    }


    self.initNeoModel = function (subGraph, callbackOuter) {
        self.labels = {};
        self.labelsRelations = {};
        self.relations = {};
        self.allRelations = {};
        self.allProperties = [""];
        self.allRelationsArray = [""];
        self.allLabels = [""];
        async.series([
            function (callback) {

                var where = "";
                if (subGraph && subGraph != "") ;
                where = " where n.subGraph='" + subGraph + "'";
                var sql = "MATCH(n)-[r]-(m) "
                    + where
                    + " RETURN distinct labels(n) as labels_n, type(r) as type_r,labels(m)[0] as label_m, labels(startNode(r))[0] as label_startNode,count(n) as count_n,count(r) as count_r,count(m) as count_m";
                Cypher.executeCypher(sql, function (err, data) {
                    if (err)
                        return callback(err);
                    if (data.length == 0)
                        return callbackOuter(null, DataModel);

                    for (var i = 0; i < data.length; i++) {
                        var objNeo = data[i];
                        var obj = {
                            labels1: objNeo.labels_n,
                            label2: objNeo.label_m,
                            relStartLabel: objNeo.label_startNode,
                            relType: objNeo.type_r,
                            count1: objNeo.count_n,
                            count2: objNeo.count_m,
                        }

                        if (obj.relType) {
                            if (!DataModel.labelsRelations[obj.label1])
                                DataModel.labelsRelations[obj.label1] = [];
                            DataModel.labelsRelations[obj.label1].push(obj.relType);
                            if (!DataModel.labelsRelations[obj.label2])
                                DataModel.labelsRelations[obj.label2] = [];
                            DataModel.labelsRelations[obj.label2].push(obj.relType);


                            if (obj.labels1) {
                                obj.label1 = obj.labels1[0];
                                if (obj.label1 == obj.relStartLabel)
                                    obj.direction = "normal";
                                else
                                    obj.direction = "inverse";
                            }

                            if (!DataModel.relations[obj.label1])
                                DataModel.relations[obj.label1] = [];
                            DataModel.relations[obj.label1].push(obj);

                            if (!DataModel.allRelations[obj.relType])
                                DataModel.allRelations[obj.relType] = [];


                            DataModel.allRelations[obj.relType].push({
                                startLabel: obj.label1,
                                endLabel: obj.label2,
                                direction: obj.direction
                            });
                            if (DataModel.allRelationsArray.indexOf(obj.relType) < 0)
                                DataModel.allRelationsArray.push(obj.relType);
                        }
                    }
                    callback();


                })
            },
            function (callback) {
                var where = "";
                if (subGraph && subGraph != "") ;
                var sql = "MATCH (n) " + where
                    + " return distinct labels(n) as labels_n,keys(n) as keys_n,count(n) as count_n";

                Cypher.executeCypher(sql, function (err, data) {
                    if (err)
                        return callback(err);
                    if (data.length == 0)
                        return callbackOuter(null, DataModel);


                    for (var i = 0; i < data.length; i++) {

                        var labels = data[i].labels_n;

                        for (var k = 0; k < labels.length; k++) {
                            var label = labels[k];
                            if (DataModel.allLabels.indexOf(label) < 0)
                                DataModel.allLabels.push(label);
                            var fields = data[i].keys_n;
                            if (!DataModel.labels[label])
                                DataModel.labels[label] = [];

                            for (var j = 0; j < fields.length; j++) {
                                if (DataModel.allProperties
                                        .indexOf(fields[j]) < 0)
                                    DataModel.allProperties
                                        .push(fields[j]);
                                if (DataModel.labels[label]
                                        .indexOf(fields[j]) < 0) {
                                    DataModel.labels[label]
                                        .push(fields[j]);
                                }

                            }
                        }
                    }

                    DataModel.allProperties.sort();
                    DataModel.allLabels.sort();
                    callback();
                })
            }
            ,
            function (callback) {
                var where = "";
                if (subGraph && subGraph != "") ;
                var sql = " match(n)-[r]-(m)" + where + " return distinct type(r)as relType,labels(n)[0] as startLabel,labels(m)[0] as endLabel,  keys(r) as relProperties"
                Cypher.executeCypher(sql, function (err, data) {

                    if (err)
                        return callback(err);
                    if (data.length == 0)
                        return callbackOuter(null, DataModel);

                    for (var i = 0; i < data.length; i++) {

                        var relPropsObj = data[i];
                        var relationObjs = DataModel.allRelations[relPropsObj.relType];
                        for (var j = 0; j < relationObjs.length; j++) {
                            var relationObj = relationObjs[j];

                            if (relationObj && relationObj.direction == "normal" && relationObj.startLabel == relPropsObj.startLabel && relationObj.endLabel == relPropsObj.endLabel) {
                                DataModel.allRelations[relPropsObj.relType][j].properties = relPropsObj.relProperties;
                            }
                            if (relationObj && relationObj.direction == "inverse" && relationObj.endLabel == relPropsObj.startLabel && relationObj.startLabel == relPropsObj.endLabel) {
                                DataModel.allRelations[relPropsObj.relType][j].properties = relPropsObj.relProperties;
                            }
                        }


                    }


                    callback();
                })
            }
        ], function (err) {
            if (err)
                return callbackOuter(err);
            return callbackOuter(null, DataModel);

        })
    }
      

    self.generateSubGraphPropertyOnAllNodes = function () {
        var name = $("#subGraphName").val();
        if (!name || name == "") {
            $("#dialog").dialog("close")
            return;
        }
        subGraph = name;
        queryParams.subGraph = subGraph;
        var query = "Match(n) set n.subGraph=\"" + subGraph + "\" return count(n)";
        var payload = {match: query};
        $.ajax({
            type: "POST",
            url: self.neo4jProxyUrl,
            data: payload,
            dataType: "json",
            success: function (data, textStatus, jqXHR) {


                $("#dialog").dialog("close")
            },
            error: function (xhr, err, msg) {
                toutlesensController.onErrorInfo(xhr)
            }
        })

    }
    self.drawDataModel = function () {

        drawNeoModel(subGraph);
    }

    self.callsource = function (urlSuffix, payload, callback) {
        if (!urlSuffix)
            urlSuffix = "";
        $.ajax({
            type: "POST",
            url: self.mongoProxyUrl + urlSuffix,
            data: payload,
            dataType: "json",
            success: function (data, textStatus, jqXHR) {
                callback(data);
            },
            error: function (xhr, err, msg) {
                toutlesensController.onErrorInfo(xhr)
            }
        });
    }

    self.listSubGraph = function () {
        var match = "MATCH (n)  return distinct n.subGraph";
        self.callNeoMatch(match, self.neo4jProxyUrl, function (data) {
            console.log(data);
        });
    }

    self.callNeoMatch = function (match, url, callback) {
        payload = {
            match: match
        };
        if (!url)
            url = self.neo4jProxyUrl;

        $.ajax({
            type: "POST",
            url: url,
            data: payload,
            dataType: "json",
            success: function (data, textStatus, jqXHR) {
                callback(data);
            },
            error: function (xhr, err, msg) {

                toutlesensController.onErrorInfo(xhr)
                if (err.result) {
                    $("#message").html(err.result);
                    $("#message").css("color", "red");
                }
                else
                    $("#message").html(err);
            }

        });

    }
    return self;
})()
