var ParagraphEntitiesGraph = (function () {


        var self = {};
        self.cardsMap = {};


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


        self.clear = function () {
            $("#plugin-paragraphEntitiesGraph-nodes").html("");
            $("#plugin-paragraphEntitiesGraphExec").addClass("d-none");
            self.cardsMap = {};
        }

        self.addQueryObject = function (queryObject) {
            var index = Object.keys(self.cardsMap).length;
            self.cardsMap[queryObject.label + index] = queryObject;

            var nodesStr = "";
            for (var key in self.cardsMap) {
                nodesStr += self.cardsMap[key].nodeSetTexts.toString() + "<br>"
            }
            $("#plugin-paragraphEntitiesGraph-nodes").html(nodesStr)
            $("#plugin-paragraphEntitiesGraphExec").removeClass("d-none");
        }


        self.executeQuery = function () {


            var cardKeys = Object.keys(self.cardsMap);
            var countCards = cardKeys.length;


            if (countCards <= 1) {
                return;
            }
            else if (countCards == 2) {
                self.getPathBetweenTwoEntities(cardKeys, self.processResult);
            }
            else {
                var combinationResults = {}
                var combinations = self.combination(cardKeys, 2)// combinaisons deux à deux des keys de cards

                async.eachSeries(combinations, function (combination, callbackEach) {
                        self.getPathBetweenTwoEntities(combination, function (err, result) {
                            if (result.length > 0)
                                combinationResults[combination.toString()] = result;
                            return callbackEach(err);
                        });

                    },

                    function (err) {
                        if (err)
                            return console.log(err);
                        if (Object.keys(combinationResults) == 0)
                            return alert("no result");

                        var intersectionResults = [];
                        var allParagraphs=[];
                        var index=0;
                        for (var key in combinationResults) {
                            index+=1;
                            var result = combinationResults[key];
                            if(index==1){
                                intersectionResults=intersectionResults.concat(result);
                            else{}
                            result.forEach(function (line) {
                                line.nodes.forEach(function (node) {
                                    if(node.labels[0]=="Paragraph"){
                                        x=1;
                                    }

                                })
                            })

                        }


                    })

            }
        }


        self.getPathBetweenTwoEntities = function (keys, callback) {
            var distance = 3;
            distance = $("#plugin-paragraphEntitiesGraph-distance").val();
            distance = parseInt(distance);
            var where = "";
            var cypher = "";
            var index = 0;
            var withStr = ""
            keys.forEach(function (key) {

                index++;
                var where2 = buildPaths.getWhereClauseFromArray("_id", self.cardsMap[key].nodeSetIds, "x" + index);
                if (where2 == null || where2 == "")
                    where2 = "";
                if (where.indexOf(self.cardsMap[key].nodeSetIds) < 0) {//doublons
                    if (index == 1)
                        where += " WHERE " + where2
                    else
                        where += " AND " + where2
                }


                withStr += "x" + index + ",";

                if (index == 1)
                    cypher += "MATCH   path=(x" + index + ")-[:hasEntity|:precede*1.." + distance + "]-(x" + (index + 1) + ")";
            })
            cypher += where + " return nodes(path) as nodes, relationships(path) as relations";


            Cypher.executeCypher(cypher, function (err, result) {
                if (err)
                    return callback(err);
                return callback(null, result)

            })


        }


        self.processResult = function (result) {

            self.drawGraph(result);
        }

        self.drawGraph = function (result0) {
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
                        if (!visjsNodes[node._id]) {

                            if (newNodeIds.indexOf(node._id) < 0) {
                                newNodeIds.push(node._id);

                                var visjsNode = visJsDataProcessor.getVisjsNodeFromNeoNode(node, false);
                                newNodes.push(visjsNode);
                            }
                        }
                        var label = node.labels[0]
                        if (visjsLegendLabels.indexOf(label) < 0)
                            visjsLegendLabels.push(label);
                    }
                })

                for (var key in visjsEdges) {

                    var edge = visjsEdges[key];
                    edgeHashes.push(edge.from * edge.to)
                }


                result.relations.forEach(function (rel) {
                    var from = rel._fromId;
                    var to = rel._toId;

                    if (edgeHashes.indexOf(from * to) < 0) {
                        edgeHashes.push(from * to)
                        var relId = rel._id
                        var relType = rel._type;
                        var relProps = rel.properties;


                        var visjsEdge = visJsDataProcessor.getVisjsRelFromNeoRel(from, to, relId, relType, relProps);
                        newEdges.push(visjsEdge);
                    }


                })

            })

            visjsGraph.draw("graphDiv", {nodes: newNodes, edges: newEdges, type: "graph"});
            $("#navbar_graph_Graph_ul").removeClass("d-none");
        }

        self.getParagraphsContainingAllEntities = function () {
            var cypher = "";
            var index = 0;
            var withStr = ""
            for (var key in self.cardsMap) {
                index++;
                var where = buildPaths.getWhereClauseFromArray("_id", self.cardsMap[key].nodeSetIds, "x" + index);
                if (where == null || where == "")
                    where = "";
                else
                    where = " WHERE " + where
                withStr += "x" + index + ",";

                cypher += " MATCH  (x" + index + ":" + self.cardsMap[key].label + ")<--(p1:Paragraph) " + where;

                cypher += " WITH " + withStr + "p1";


            }

            cypher += " MATCH (p1)-->(p2:Paragraph) return " + withStr + "p1,p2";
            Cypher.executeCypher(cypher, function (err, result) {
                if (err)
                    return console.log(err);

                if (true) {
                    self.displayParagraphText(result);
                }

            })
        }

        self.displayParagraphText = function (result) {
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
            var contents = [];
            result.forEach(function (line, index) {
                var content = [];

                for (var key in line) {
                    if (key.indexOf("x") > -1 && index == 0) {
                        title += line[key].labels[0] + " : " + line[key].properties.name + "<br>";
                    }
                    else if (key.indexOf("p") > -1) {

                        content.push(line[key].properties)

                    }

                }

                content.sort(function (a, b) {
                    if (a.index > b.TextOffset)
                        return 1;
                    if (a.index < b.TextOffset)
                        return -1;
                    return 0;
                })
                contents.push(content);


            })


            contents.forEach(function (content) {
                html += "<div class='paragraphGroup'>";

                content.forEach(function (line, index) {
                    if (index == 0)
                        html += "<b>" + line.Document + "  " + line.ChapterTitle1 + "</b><br>"

                    html += "<b>" + line.TextOffset + "</b>&nbsp;" + line.ParagraphText + "<br>";
                })
                html += "</div>"
            })

            html = title + "<br>" + html;
            $('#genericModal').modal('show')
            $("#genericModalDiv").html(html);

        }


        self.combination = function (arr, length) {

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
        return self;

    }
)();