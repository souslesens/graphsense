var async = require("async")
var neoProxy=require("../neoProxy.js")

var ParagraphEntitiesGraph = {

    cardsMap: {}


    /***
     * creation des chainages de paragrahes
     *
     *
     * match(n:Paragraph)-->(:Document)<--(m:Paragraph) where n.subGraph="entitiesGraph2"  and m.subGraph="entitiesGraph2"  and m.TextOffset-n.TextOffset=1 create (n)-[:precede]->(m)
     *
     *
     *
     *
     */


    , clear: function () {

        ParagraphEntitiesGraph.cardsMap = {};
    }
    ,

    addQueryObject: function (queryObject) {
        var index = Object.keys(ParagraphEntitiesGraph.cardsMap).length;
        ParagraphEntitiesGraph.cardsMap[queryObject.label + index] = queryObject;


    },

    removeEntityFromCards: function (key) {
        delete ParagraphEntitiesGraph.cardsMap[key];


    },

    executeQuery: function (output) {

        var cardKeys = Object.keys(ParagraphEntitiesGraph.cardsMap);
        var countCards = cardKeys.length;


        if (countCards <= 1) {
            return;
        }
        else if (false && countCards == 2) {
            ParagraphEntitiesGraph.getPathBetweenTwoEntities(cardKeys, function (err, result) {
                if (err)
                    return console.log(err);

                ParagraphEntitiesGraph.processResult(result, output);
            });
        }
        else {
            var combinationResults = {}
            var combinations = ParagraphEntitiesGraph.combination(cardKeys, 2)// combinaisons deux à deux des keys de cards

            async.eachSeries(combinations, function (combination, callbackEach) {
                    ParagraphEntitiesGraph.getPathBetweenTwoEntities(combination, function (err, result) {
                        if (result.length > 0) {
                            var key = JSON.stringify(combination)
                            combinationResults[key] = result;
                        }
                        return callbackEach(err);
                    });

                },

                function (err) {
                    if (err)
                        return console.log(err);
                    if (Object.keys(combinationResults) == 0)
                        return alert("no result");

                    var intersectionResults = [];
                    var allParagraphs = {};

                    var index = 0;
                    for (var key in combinationResults) {
                        index += 1;
                        var result = combinationResults[key];
                        result.forEach(function (line) {
                            line.nodes.forEach(function (node) {
                                if (node.labels[0] == "Paragraph") {
                                    if (!allParagraphs[node._id]) {
                                        allParagraphs[node._id] = {node: node, combinationKeys: [], freq: 1};
                                    }

                                    if (allParagraphs[node._id].combinationKeys.length > 0)
                                        var x = 0
                                    if (allParagraphs[node._id].combinationKeys.length > 1)
                                        var x = 0
                                    if (allParagraphs[node._id].combinationKeys.indexOf(key) < 0) {

                                        allParagraphs[node._id].freq += 1;
                                        allParagraphs[node._id].combinationKeys.push(key);
                                    }


                                }
                            })
                        })
                    }
// identification des noeuds ayant toutes les combinaisons

                    var matchingParagraphs = [];
                    for (var key in allParagraphs) {
                        var pathsArray = allParagraphs[key].combinationKeys;
                        if (allParagraphs[key].combinationKeys.length >= combinations.length) {

                            var parag = allParagraphs[key];
                            var node = parag["node"];
                            matchingParagraphs.push(node._id);
                            //   console.log(JSON.stringify(node, null, 2))
                        }


                    }


                    // selection des chemins qui passent par les matching nodes;
                    var matchingPaths = []
                    for (var key in combinationResults) {

                        combinationResults[key].forEach(function (path) {

                            path.nodes.forEach(function (node) {


                                if (matchingParagraphs.indexOf(node._id) > -1) {
                                    matchingPaths.push(path)
                                }


                            })


                        })
                    }
                    matchingPaths = ParagraphEntitiesGraph.filterText(matchingPaths);
                    ParagraphEntitiesGraph.processResult(matchingPaths, output);


                })


        }
    },


    getPathBetweenTwoEntities: function (keys, callback) {
        var distance = 1;
        distance = $("#plugin-paragraphEntitiesGraph-distance").val();
        distance = parseInt(distance);
        var where = "";
        var cypher = "";
        var index = 0;
        var withStr = ""
        keys.forEach(function (key) {

            index++;
            var where2 = buildPaths.getWhereClauseFromArray("_id", ParagraphEntitiesGraph.cardsMap[key].nodeSetIds, "x" + index);
            if (where2 == null || where2 == "")
                where2 = "";
            if (where.indexOf(ParagraphEntitiesGraph.cardsMap[key].nodeSetIds) < 0) {//doublons
                if (index == 1)
                    where += " WHERE " + where2
                else
                    where += " AND " + where2
            }


            withStr += "x" + index + ",";

            if (index == 1) {
                //  cypher += "MATCH   path=(x" + index + ")-[:hasEntity|:precede*1.." + distance + "]-(x" + (index + 1) + ")";

                cypher += "MATCH   path=(x" + index + ")<-[:hasEntity]-(p1)-[:precede*0.." + distance + "]-(p2)-[:hasEntity]->(x" + (index + 1) + ")";
            }
        })
        cypher += where + " return nodes(path) as nodes, relationships(path) as relations";


        ParagraphEntitiesGraph.executeCypher(cypher, function (err, result) {
            if (err)
                return callback(err);
            return callback(null, result)

        })


    },

    filterText: function (result, textFilter) {


        if (!textFilter || textFilter == "")
            return result;

        var regex = new RegExp(".*" + textFilter + ".*", "gi");
        var filteredPaths = [];
        result.forEach(function (path) {
            var ok = false;
            path.nodes.forEach(function (node, index) {

                if (node.labels[0] != "Paragraph") {
                    return;
                }
                ok = regex.test(node.properties.ParagraphText)
            })
            if (ok) {
                filteredPaths.push(path);
            }
        })
        return filteredPaths;
    },


    processResult: function (result, output) {
        if (output == 'graph')
            ParagraphEntitiesGraph.drawGraph(result);
        else if (output == 'text')
            ParagraphEntitiesGraph.displayParagraphText(result)
    },
    drawGraph: function (result0) {
        var newNodes = [];
        var newEdges = [];
        var newNodeIds = [];
        var mArrayIds = [];
        var edgeHashes = [];
        var visjsNodes = {};
        var visjsEdges = {};
        var visjsLegendLabels = [];
        if (visjsGraph.type == "graph") {
            visjsNodes = visjsGraph.nodes._data;
            visjsEdges = visjsGraph.edges._data;
            visjsLegendLabels = visjsGraph.legendLabels;
        }


        result0.forEach(function (result) {
            result.nodes.forEach(function (node) {
                if (mArrayIds.indexOf(node._id) < 0) {
                    mArrayIds.push(node._id)
                    // if (!visjsNodes[node._id]) {

                    if (newNodeIds.indexOf(node._id) < 0) {
                        newNodeIds.push(node._id);

                        var visjsNode = visJsDataProcessor.getVisjsNodeFromNeoNode(node, false);
                        newNodes.push(visjsNode);
                    }
                    // }
                    var label = node.labels[0]
                    if (visjsLegendLabels.indexOf(label) < 0)
                        visjsLegendLabels.push(label);
                }
            })


            result.relations.forEach(function (rel) {
                var from = rel._fromId;
                var to = rel._toId;

                //  if (edgeHashes.indexOf(from * to) < 0) {
                edgeHashes.push(from * to)
                var relId = rel._id
                var relType = rel._type;
                var relProps = rel.properties;


                var visjsEdge = visJsDataProcessor.getVisjsRelFromNeoRel(from, to, relId, relType, relProps);
                newEdges.push(visjsEdge);
                // }


            })

        })

        /* visjsGraph.draw("graphDiv", {nodes: newNodes, edges: newEdges, type: "graph"});*/

    },


    displayParagraphText: function (result) {
        $("<style>")
            .prop("type", "text/css")
            .html("\
    .paragraphGroup{\
           border:solid #ccc 1px;\
             border-radius: 10px;\
          }")
            .appendTo("head");
        ;

        var html = "";
        var title = "";


        result.forEach(function (path) {
            html += "<div class='paragraphGroup'>";

            path.nodes.sort(function (a, b) {
                if (a.properties.TextOffset > b.properties.TextOffset)
                    return 1;
                if (a.properties.TextOffset < b.properties.TextOffset)
                    return -1;
                return 0;
            })
            var pathStr = "";
            path.nodes.forEach(function (node, index) {

                if (node.labels[0] != "Paragraph") {
                    return;
                }
                var node = node.properties;

                if (pathStr == "")
                    pathStr += "<b>" + node.Document + "  " + node.ChapterTitle1 + "</b><br>"

                pathStr += "<b>" + node.TextOffset + "</b>&nbsp;" + node.ParagraphText + "<br>";
            })
            html += pathStr + "</div>"
        })

        html = title + "<br>" + html;
        $('#genericModal').modal('show')
        $("#genericModalDiv").html(html);

    },


    combination: function (arr, length) {

        var i, j, temp
        var result = []
        var arrLen = arr.length
        var power = Math.pow
        var combinations = power(2, arrLen)

        // Time & Space Complexity O (n * 2^n)

        for (i = 0; i < combinations; i++) {
            temp = ''

            for (j = 0; j < arrLen; j++) {
                // & is bitwise AND
                if ((i & power(2, j))) {
                    temp += arr[j] + ","
                }
            }
            result.push(temp)
        }
        var result2 = [];

        result.forEach(function (str) {
            var result3 = str.split(",");
            if (result3[result3.length - 1] == "")
                result3.splice(result3.length - 1, 1);
            result2.push(result3);
        })
        if (length) {
            var result3 = [];
            result2.forEach(function (line) {
                if (line.length == length)
                    result3.push(line);
            })
            return result3;

        }


        return result2;
    }
    ,
    executeCypher(cypher,callback){
        neoProxy.match(cypher,callback)


    }


}



module.exports=ParagraphEntitiesGraph;