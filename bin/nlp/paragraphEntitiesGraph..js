var async = require("async")
var neoProxy = require("../neoProxy.js");
var httpProxy = require("../httpProxy.js");
var ParagraphEntitiesGraph = {

    cardsMap: {}


    /***
     * creation des chainages de paragrahes
     *
     *
     * match(n:Paragraph)-->(:Document)<--(m:Paragraph) where n.subGraph="entitiesGraph2"  and m.subGraph="entitiesGraph2"  and m.TextOffset-n.TextOffset=1 create (n)-[:precede]->(m)
     *
     *
     *match(n:ThesaurusConcept)-[:instanceOf]-(m)--(p:Paragraph)  create (p)-[:hasConcept]->(n)
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

    executeQuery: function (options, callbackOuter) {
        var cardsMap = options.cards;
        var distance = options.distance;
        var paragraphIds = options.paragraphIds

        if (cardsMap)
            ParagraphEntitiesGraph.cardsMap = cardsMap;

        var cardKeys = Object.keys(ParagraphEntitiesGraph.cardsMap);
        var countCards = cardKeys.length;

        var combinations2,combinations1;
        var combinationResults = {};
        var matchCount = 0;

        if (countCards ==0) {
            return callbackOuter(null,{});
        }
        else if(countCards ==1) {
            combinations2 =[]
            combinations1 =[cardKeys]
        }

        else {

            combinations2 = ParagraphEntitiesGraph.combination(cardKeys, 2)// combinaisons deux à deux des keys de cards
            combinations1 = ParagraphEntitiesGraph.combination(cardKeys, 1);// liste des keys de cards prises individuelement
        }

            async.series([
                function (callback) {//combinasons 2à 2
                    if(combinations2.length==0)
                       return callback();
                    async.eachSeries(combinations2, function (combination, callbackEach) {
                            ParagraphEntitiesGraph.getPathBetweenEntities(combination, distance, paragraphIds, function (err, result) {
                                if (result.length > 0) {
                                    var key = JSON.stringify(combination)
                                    combinationResults[key] = result;
                                    matchCount += result.length;

                                }
                                return callbackEach(err);
                            });

                        },

                        function (err) {

                            callback(err);

                            // ParagraphEntitiesGraph.processResult(matchingPaths, output);


                        })

                },
                function (callback) {//chaque entité séparéee si combinaison 2 à 2 echoue
                    if (matchCount > 0)
                        return callback()
                    async.eachSeries(combinations1, function (combination, callbackEach) {
                            ParagraphEntitiesGraph.getPathBetweenEntities(combination, 1, paragraphIds, function (err, result) {
                                if (result.length > 0) {
                                    var key = JSON.stringify(combination)
                                    combinationResults[key] = result;

                                }
                                return callbackEach(err);
                            });

                        },

                        function (err) {

                            callback(err);

                            // ParagraphEntitiesGraph.processResult(matchingPaths, output);


                        })

                }
            ], function (err) {
                return   callbackOuter(err, combinationResults)

            })



    },




    getPathBetweenEntities: function (keys, distance, paragraphIds, callback) {

        /*    distance = $("#plugin-paragraphEntitiesGraph-distance").val();
            distance = parseInt(distance);*/
        var where = "";
        var cypher = "";
        var index = 0;
        var withStr = ""
        keys.forEach(function (key) {

            index++;
            var where2 = ParagraphEntitiesGraph.getWhereClauseFromArray("_id", ParagraphEntitiesGraph.cardsMap[key].nodeSetIds, "x" + index);
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
                if (distance > 1)
                    cypher += "MATCH   path=(x" + index + ")<-[:hasEntity*0..1]-(p1)-[:precede*0.." + distance + "]-(p2)-[:hasEntity*0..1]->(x" + (index + 1) + ")";
                else
                    cypher += "MATCH   path=(x" + index + ")<-[:hasEntity*0..1]-(p1)-[:precede*0.." + distance + "]-(p2)"


            /*    if (distance > 1)
                    cypher += "MATCH   path=(x" + index + ")-[:instanceOf*0..1]->(c"+ index +":ThesaurusConcept  )<-[:hasConcept*0..1]-(p1)-[:precede*0.." + distance + "]-(p2)-[:hasConcept*0..1]->(c"+ (index+1) +":ThesaurusConcept)<-[:instanceOf*0..1]-(x" + (index + 1) + ")";
                else
                    cypher += "MATCH   path=(x" + index + ")-[:instanceOf*0..1]->(c"+ index +":ThesaurusConcept  )<-[:hasConcept*0..1]-(p1)-[:precede*0.." + distance + "]-(p2)"
          */
          
            }
        })

        if (paragraphIds && paragraphIds.length > 0) {
            var whereP1 = ParagraphEntitiesGraph.getWhereClauseFromArray("ID", paragraphIds, "p1");
            var whereP2 = ParagraphEntitiesGraph.getWhereClauseFromArray("ID", paragraphIds, "p2");
            where += " AND (" + whereP1 + " OR " + whereP2 + ")"
        }
        cypher += where + " return nodes(path) as nodes, relationships(path) as relations";

        console.log(cypher);
        ParagraphEntitiesGraph.executeCypher(cypher, function (err, result) {
            if (err)
                return callback(err);
            return callback(null, result)

        })


    },
    getWhereClauseFromArray: function (property, _array, nodeSymbol) {
        var array;
        if (!nodeSymbol)
            nodeSymbol = "n";
        if (typeof _array == "string")
            array = _array.split(",");
        else
            array = _array;

        var query = nodeSymbol + "." + property + " in ["
        if (property == "_id")
            query = "ID(" + nodeSymbol + ") in ["
        var quote = "";
        for (var i = 0; i < array.length; i++) {
            if (i > 0 && i < array.length)
                query += ","
            else if ((property != "_id" && typeof array[i] === 'string'))
                var quote = "\"";
            query += quote + array[i] + quote;

        }
        query += "] ";
        return query;
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
    executeCypher(cypher, callback) {
        neoProxy.match(cypher, callback)


    }


}


module.exports = ParagraphEntitiesGraph;