var buildPaths = (function () {
    var self = {};
    self.currentDataset;
    var alphabet = "abcdefghijklmno";
    var currentSetType;

    self.queryObjs = [];
    self.isEditing = false;
    self.currentCypher = "";
    self.currentNodesDistance = 1;


    var cardCliked = false;
    var stopExpand = false;

    var globalHtml = "";


    self.onRelDivClick = function (index) {
        $("#dialog").load("htmlSnippets/searchRelationsDialog.html", function () {
            dialog.dialog("open");

            dialog.dialog({title: "Relation conditions"});
            self.queryObjs.selectedIndex = index;
            searchRelations.initDialog(self.queryObjs[index].incomingRelation.candidates)


        })
    }

    self.updateRelation = function (relation) {
        self.queryObjs[self.queryObjs.selectedIndex].incomingRelation.selected = relation;
        dialog.dialog("close");
        var html = relation.name + "<br>" + relation.queryObject.text;
        $("#buildPath_relConditionsDiv_" + self.queryObjs.selectedIndex).html(html);

    }

    self.moveDivLeft = function (index) {
    }
    self.moveDivRight = function (index) {

    }
    self.editCypher = function () {
        var visibility = $('#buildPaths_cypherTA').css('visibility');

        if (visibility == "hidden")
            visibility = "visible"
        else
            visibility = "hidden"
        $('#buildPaths_cypherTA').css('visibility', visibility);
        $('#buildPaths_cypherTA').val(self.currentCypher)
    }

    self.onSelectNodeDiv = function (index) {
        if (self.queryObjs[index].type && self.queryObjs[index].type.indexOf("nodeSet") == 0)
            return;

        $(".buildPaths-nodeDiv ").removeClass("buildPaths-nodeDivSelected")
        $("#buildPath_nodeDiv_" + index).addClass("buildPaths-nodeDivSelected")
        $(".selectLabelDiv").css("visibility", "visible");
        context.queryObject = self.queryObjs[index];


        $("#mainAccordion").accordion("option", "active", 0);
        $("#searchDialog_booleanOperatorsDiv").css('visibility', 'visible');
        searchNodes.setUIPermittedLabels(context.queryObject.label);
        searchNodes.setUpdateContextQueryObject();
        cardCliked = true;
        /* if  (event && typeof event !== 'undefined')
           event.stopPropagation()*/
        //   (typeof event !== 'undefined')
        //  event.stopPropagation()
        /*     if(window.event)
                 window.event.stopPropagation();*/


    }
    self.removeQueryObj = function (index) {
        if (index == 0) {
            searchNodes.setUIPermittedLabels();
            searchNodes.resetQueryClauses();
            $("#buildPaths_matchNodesWrapper").html("");
        }
        else
            searchNodes.setUIPermittedLabels(self.queryObjs[index - 1].label);
        self.queryObjs.splice(index, 1)
        self.drawNodeQueryDivs();


    }


    self.clusterNodesInGraph = function (index) {
        if (!self.queryObjs[index].clusterInResult) {
            self.queryObjs[index].clusterInResult = true;
        } else {
            delete self.queryObjs[index].clusterInResult;
        }
    }


    self.showMoreParams = function (type) {
        currentSetType = type;
        var labels = [];
        self.queryObjs.forEach(function (queryObject, index) {
            labels.push({label: (queryObject.label + "-" + index), index: index})
        })
        if (labels.length > 1)
            common.fillSelectOptions(buildPaths_labelSelect, labels, "label", "index", true)
        else {
            common.fillSelectOptions(buildPaths_labelSelect, labels, "label", "index", false);
            $("#buildPaths_labelSelect").val(labels[0].index)

        }


        if (type == "others" || type == "set") {
            $("#buildPath_moreParamsDiv").css("visibility", "visible")
            if (type == "set")
                $("#buildPath_moreParamsSetDiv").css("visibility", "visible")
            else
                $("#buildPath_moreParamsSetDiv").css("visibility", "hidden")


        }
    }


    self.checkQueryExceedsLimits = function () {
        var ok = true;
        var cartesianProduct = 1
        self.queryObjs.forEach(function (line) {
            if (line.nodeIds)
                cartesianProduct *= line.nodeIds.length
            else if (line.nodeSetIds)
                cartesianProduct *= line.nodeIds.length

        })
        var amount
        if (self.queryObjs.length > 1)
            var amount = Math.pow(cartesianProduct, 1 / (self.queryObjs.length - 1))
        if (amount > 1000000)
            return true;
        return false;

    }
    self.executeQuery = function (type, options, callback) {
        if (!options.addToGraph)
            visjsGraph.clearGraph();

        self.queryObjs = [];
        var nodesOnly = false
        for (var key in context.cardsMap) {
            if (!context.cardsMap[key].skip)
                self.queryObjs.push(context.cardsMap[key]);//clone
          //  if (context.cardsMap[key].origin == "tree")
             //   nodesOnly = nodesOnly || true;
        }


        if (nodesOnly) {
            var nodesOnlyQueryObj = {};
            nodesOnlyQueryObj.label = null;
            nodesOnlyQueryObj.type = "nodeSet" + key;
            nodesOnlyQueryObj.inResult = true;
            var ids = []
            for (var key in context.cardsMap) {
                ids = ids.concat(context.cardsMap[key].nodeSetIds)
            }
            nodesOnlyQueryObj.nodeSetIds = ids;
            self.queryObjs = [nodesOnlyQueryObj]

        }
        else {
            self.queryObjs.sort(function (a, b) {
                if (a.index > b.index)
                    return -1;
                if (a.index < b.index)
                    return 1;
                return 0;
            })
        }


        if (!options)
            options = {};
        options.nodesDistance = 1;
        self.currentNodesDistance = 1;

        var uiCypher = $('#buildPaths_cypherTA').val();
        if (true || uiCypher == "") {
            self.currentCypher = self.buildQuery(type, options);
            $('#buildPaths_cypherTA').val(self.currentCypher);
        }
        else {
            self.currentCypher = $('#buildPaths_cypherTA').val();

        }
        MainController.showSpinner(true);
        Cypher.executeCypher(self.currentCypher, function (err, result) {
            MainController.showSpinner(false);
            if (err) {
                console.log("ERROR " + self.currentCypher)
                return $("#buildPaths_resultDiv").html(err)
            }
            if (result.length == 0) {
                if (false && self.queryObjs.length > 1)
                    return self.drawShortestPathesDialog();
                else
                     MainController.alert("No relations found");
                if(callback){

                    return callback(null,{data:{nodes:[],relations:[]}})
                }


            }
            //   return $("#buildPaths_resultDiv").html("no result");
            if (type == "count") {
                $("#buildPaths_resultDiv").html(+result[0].cnt + " pathes found");
                return;
                if (result.length > Config.graphMaxDataLengthToDisplayGraphDirectly)
                    return $("#buildPaths_resultDiv").html("too many results" + result.length + " (limit=" + Config.graphMaxDataLengthToDisplayGraphDirectly + ")apply more restrictive filters");


            }
            else if (type == "dataTable") {
                $("#buildPaths_resultDiv").html(+result.length + " pathes found");
                self.currentDataset = self.prepareDataset(result);
                return buildPaths.displayTable(callback);
            }
            else if (type == "graph") {
                $("#buildPaths_resultDiv").html(+result.length + " pathes found");
                self.currentDataset = self.prepareDataset(result);
                return buildPaths.displayGraph(options, callback);
            }
            else if (currentSetType) {
                var index = $("#buildPaths_labelSelect").val();
                if (index == "" || index < 0)
                    return;
                index = parseInt(index);
                var queryObj = self.queryObjs[index];
                if (currentSetType == "set") {
                    currentSetType = null;
                    var name = $("#buildPaths_setName").val();
                    if (!name || name == "")
                        return alert('enter set name')
                    var comment = $("#buildPaths_setCommentTA").val();
                    if (!comment)
                        comment = ""
                    nodeSets.create(name, queryObj.label, comment, self.currentCypher, result[0].setIds, function (err, resultSet) {
                        var message = "";
                        if (err)
                            message = "ERROR " + err;
                        else
                            message = "Set " + name + "created :" + result[0].setIds.length + " nodes"
                        $("#buildPaths_resultDiv").html(message)

                    })

                }
                else if (currentSetType == "others") {
                    context.queryObject = queryObj;
                    context.queryObject.nodeSetIds = result[0].setIds;

                    self.expandCollapse()


                    searchNodes.activatePanel("searchActionDiv");
                }

            }


        })


    }
    self.getWhereClauseFromQueryObject = function (queryObject, nodeAlias) {

        var property = queryObject.property;
        var operator = queryObject.operator;
        var value = queryObject.value;

        if (operator == "exists" || operator == "notExists") {
            ;
        }
        else if (!value || value == "")
            return null;

        var not = (operator == "notContains") ? "NOT " : "";
        if (operator == "!=") {
            operator = "<>"
            if (!(/^-?\d+\.?\d*$/).test(value))//not number
                value = "\"" + value + "\"";
        }


        else if (operator == "~" || operator == "contains" || operator == "notContains") {
            operator = "=~"
            // value = "'.*" + value.trim() + ".*'";
            value = "'(?i).*" + value.trim() + ".*'";
        }
        else {
            //if ((/[\s\S]+/).test(value))
            if (!(/^-?\d+\.?\d*$/).test(value))//not number
                value = "\"" + value + "\"";
        }
        var propStr = "";

        if (operator == "exists" || operator == "notExists") {
            if (operator == "notExists")
                not = " NOT "
            else
                not = " "
            propStr = not + " EXISTS(" + nodeAlias + "." + property + ")";
        }
        else if (property == "any")
            propStr = "(any(prop in keys(n) where n[prop]" + operator + value + "))";

        else {
            propStr = not + nodeAlias + "." + property + operator + value.trim();
        }
        return propStr;

    }

    self.countResults = function () {
        var count = 0;

        self.queryObjs.forEach(function (queryObject, index) {
            if (queryObject.inResult)
                count += 1;
        })
        return count;
    }

    self.getWhereClauseFromQueryObject = function (queryObject, nodeAlias) {

        var property = queryObject.property;
        var operator = queryObject.operator;
        var value = queryObject.value;

        if (operator == "exists" || operator == "notExists") {
            ;
        }
        else if (!value || value == "")
            return null;

        var not = (operator == "notContains") ? "NOT " : "";
        if (operator == "!=") {
            operator = "<>"
            if (!(/^-?\d+\.?\d*$/).test(value))//not number
                value = "\"" + value + "\"";
        }


        else if (operator == "~" || operator == "contains" || operator == "notContains") {
            operator = "=~"
            // value = "'.*" + value.trim() + ".*'";
            value = "'(?i).*" + value.trim() + ".*'";
        }
        else {
            //if ((/[\s\S]+/).test(value))
            if (!(/^-?\d+\.?\d*$/).test(value))//not number
                value = "\"" + value + "\"";
        }
        var propStr = "";

        if (operator == "exists" || operator == "notExists") {
            if (operator == "notExists")
                not = " NOT "
            else
                not = " "
            propStr = not + " EXISTS(" + nodeAlias + "." + property + ")";
        }
        else if (property == "any")
            propStr = "(any(prop in keys(n) where n[prop]" + operator + value + "))";

        else {
            propStr = not + nodeAlias + "." + property + operator + value.trim();
        }
        return propStr;

    }

    self.getWhereClauseFromArray = function (property, _array, nodeSymbol) {
        var array;
        if (!nodeSymbol)
            nodeSymbol = "n";
        if (typeof _array == "string")
            array = _array.split(",");
        else
            array = _array;

        var query = nodeSymbol + "." + property + " in ["
        if (property == "_id")
            query = "ID(n) in ["
        var quote = "";
        for (var i = 0; i < array.length; i++) {
            if (i > 0 && i < array.length)
                query += ","
            else if ((typeof array[i] === 'string'))
                var quote = "\"";
            query += quote + array[i] + quote;
        }
        query += "] ";
        return query;
    }


    self.buildQuery = function (type, options) {

        if (!options)
            options = {};


        if (self.queryObjs.length == 0)
            return console.log("self.queryObjs is empty")

        var cypherObj = {
            match: [],
            whereNode: [],
            whereRelation: [],
            with: [],
            return: [],
            distinct: []


        }



        self.queryObjs.forEach(function (queryObject, index) {

            var matchCypher = "";
            var whereCypher = "";
            var whereRelationCypher = "";


            var symbol = alphabet.charAt(index);


            // set relation where
            var relType = "";
            if (queryObject.incomingRelation) {
                var relation = queryObject.incomingRelation.selected
                if (index > 0 && relation) {
                    relType = ":" + relation.type;

                    var queryRelObject = relation.queryObject;
                    if (queryRelObject.property == "numberOfRelations") {
                        cypherObj.with.push(queryRelObject);
//with n,count(r) as cnt  MATCH (n:personne)-[r]-(m:communaute) where cnt>3  return n,m
                    }
                    else if (queryRelObject.value != "") {
                        var withStr = self.getWhereClauseFromQueryObject(queryRelObject, symbol)
                        cypherObj.whereRelation.push(withStr)


                    }
                }
            }

            var labelStr = "";
            if (queryObject.label)
                labelStr = ":" + queryObject.label;

            if (index == 0) {

                matchCypher = "(" + symbol + labelStr + ")";
            } else {
                var distanceStr = "";
                 if (options.withOrphans)
                      distanceStr = "*0..1";

                else if (options.nodesDistance > 1 && index < 2)
                    distanceStr = "*.." + options.nodesDistance;


                matchCypher += "-[r" + index + distanceStr + relType + "]-"
                matchCypher += "(" + symbol + labelStr + ")";
                cypherObj.return.push("r" + index);


            }


            if (queryObject.nodeSetIds) {//nodeSet
                whereCypher += "id(" + symbol + ") in [" + queryObject.nodeSetIds.toString() + "]";
            }
            else if (queryObject.value && queryObject.value != "") {

                whereCypher += self.getWhereClauseFromQueryObject(queryObject, symbol);
            }
            if (queryObject.subQueries) {
                queryObject.subQueries.forEach(function (suqQuery) {
                    if (suqQuery.value && suqQuery.value != "") {
                        whereCypher += " " + suqQuery.booleanOperator + " " + self.getWhereClauseFromQueryObject(suqQuery, symbol);
                    }
                })
            }


            if (queryObject.inResult) {
                cypherObj.return.push(symbol)
                cypherObj.distinct.push("ID(" + symbol + ")")
            }

            if (context.subGraph)
                cypherObj.whereNode.push(symbol + ".subGraph='" + context.subGraph + "'")


            cypherObj.match.push(matchCypher)
            cypherObj.whereNode.push(whereCypher)


            cypherObj.whereRelation.push(whereRelationCypher)


        })


        function concatClauses(clausesArray, sep) {
            var str = "";
            clausesArray.forEach(function (clause, index) {
                if (clause != "") {
                    if (index > 0 && sep != "") {
                        str += " " + sep + " "
                    }
                    str += clause
                }
            })
            return str;
        }

        cypherObj.match.cypher = concatClauses(cypherObj.match, "")


        cypherObj.whereNode.cypher = concatClauses(cypherObj.whereNode, "AND");
        if (cypherObj.whereNode.cypher.length != "")
            cypherObj.whereNode.cypher = " WHERE " + cypherObj.whereNode.cypher;

        cypherObj.whereRelation.cypher = concatClauses(cypherObj.whereRelation, "AND")
        if (cypherObj.whereRelation.cypher != "") {
            if (cypherObj.whereNode.cypher == "")
                cypherObj.whereRelation.cypher = " WHERE " + cypherObj.whereRelation.cypher;
            else
                cypherObj.whereRelation.cypher = " AND " + cypherObj.whereRelation.cypher;

        }


        cypherObj.return.cypher = concatClauses(cypherObj.return, ",")
        cypherObj.distinct.cypher = concatClauses(cypherObj.distinct, "+\"-\"+")


// return clause
        if (type == "count") {
            cypherObj.return.cypher = "count(a) as cnt";
            cypherObj.distinct.cypher = "";
        }
        else if (type == "set") {
            var index = $("#buildPaths_labelSelect").val();
            var symbol = alphabet.charAt(index);
            cypherObj.return.cypher = "collect(ID(" + symbol + ")) as setIds";
            cypherObj.distinct.cypher = "";
        }
        else {
            cypherObj.distinct.cypher = "DISTINCT(" + cypherObj.distinct.cypher + ") as distinctIds,";// pour supprimer les doublons

        }


        var cypher = "";
        if (cypherObj.with.length == 0) {// without with clause

            cypher = " MATCH p=(" + cypherObj.match.cypher + ") " + cypherObj.whereRelation.cypher + cypherObj.whereNode.cypher + " RETURN " + cypherObj.distinct.cypher + cypherObj.return.cypher + " LIMIT " + Config.maxResultSupported;
        }
        else {//use of WITH : count relations for example...
            for (var key in withClauses) {

            }
        }
        if (options.returnQueryObj)
            return {
                match: cypherObj.match.cypher,
                where: cypherObj.whereNode.cypher,
                return: cypherObj.return.cypher,
                distinctWhere: cypherObj.distinct.cypher
            };
        return cypher;
    }


    //var union=   "match (a:personne)-[r1]-(b:tag)  with  a,count(b) as cntR  where  a.name=~'(?i).*art.*' and  cntR> 5 match(a)-[r]-(b2) return a , collect(id(b2)) as bx limit 100 union match (a:personne)-[r1]-(b:tag)  with  a,count(b) as cntR  where cntR<5 match(a)-[r]-(b2) return a,b2 as bx limit 100"

    self.prepareDataset = function (neoResult) {


        var dataset = {nodes: [], relations: []}
        var uniqueNodeRels = [];
        var columns = [];
        var labelSymbols = [];
        var labels = [];
        var relTypes = [];
        neoResult.forEach(function (line, index) {// define columns and structure objects by line
            var lineObj = {};
            var currentNode;
            var currentRel = null;
            for (var key in line) {// each node type
                var subLine = line[key];
                if (key == "distinctIds")
                    continue;
                if (key.indexOf("r") == 0) {// relation
                    if (relTypes.indexOf(subLine.type) < 0)
                        relTypes.push(subLine.type);

                    currentRel = {id: subLine._id, neoAttrs: subLine.properties, type: subLine.type};

                    if (subLine._fromId == currentNode.id)
                        currentRel.direction = "normal"
                    else
                        currentRel.direction = "inverse"

                }
                else {

                    if (labelSymbols.indexOf(key) < 0)
                        labelSymbols.push(key);

                    var props = subLine.properties;
                    for (var keyProp in props) {
                        if (columns.indexOf(keyProp) < 0) {
                            columns.push(keyProp);
                        }
                    }
                    props.neoId = subLine._id;
                    props.labelNeo = subLine.labels[0];
                    if (labels.indexOf(props.labelNeo) < 0)
                        labels.push(props.labelNeo);

                    var obj = visJsDataProcessor.getVisjsNodeFromNeoNode(subLine, false)
                    obj.incomingRelation = currentRel;
                    currentNode = obj;
                    lineObj[key] = obj;


                }

                dataset.nodes.push(lineObj)


            }

        })
        // console.log(JSON.stringify(dataset,null,2))
        return {columns: columns, data: dataset, labelSymbols: labelSymbols, labels: labels, relTypes: relTypes};


    }
    self.expandCollapse = function (expand) {
        if (expand) {
            stopExpand = false;
            return;
        }
        else
            stopExpand = true;

        if ($("#buildGraphDiv").html() == "" || expand) {
            $("#buildGraphDiv").html(globalHtml);
            $("#GraphHighlight_legendDiv").css("visibility", "hidden")
        } else {
            $("#buildGraphDiv").html("");
        }


    }


    self.displayTable = function (callback) {

        function getConnections(line) {
            var connections = {}
            var nodeKeys = Object.keys(line);
            nodeKeys.forEach(function (key) {
                connections[key] = "";
                nodeKeys.forEach(function (key2, indexKey2) {
                    if (key2 != key) {
                        if (connections[key] != "")
                            connections[key] += ","
                        connections[key] += line[key2].neoAttrs[Schema.getNameProperty(line[key2].label)] + "[" + line[key2].labelNeo + "]"
                    }

                })
            })
            return connections;
        }

        //  self.expandCollapse();
        var tableDataset = [];
        var columns = self.currentDataset.columns;
        columns.push("neoId")
        self.currentDataset.data.nodes.forEach(function (line) {

            var connections = getConnections(line);
            for (var nodeKey in line) {


                var datasetLine = {};
                datasetLine["label"] = line[nodeKey].neoAttrs["labelNeo"];
                datasetLine["label"].neoId = line[nodeKey].id;
                columns.forEach(function (col) {
                    if (col != "labelNeo") {
                        var value = line[nodeKey].neoAttrs[col];
                        if (!value)
                            value = "";
                        datasetLine[col] = value;
                    }
                })
                if (connections[nodeKey].length > 0)
                    datasetLine.connectedTo = connections[nodeKey]


                tableDataset.push(datasetLine);
            }


        })


        //group all connections
        var datasetGroupedMap = {}
        tableDataset.forEach(function (line) {
            if (!datasetGroupedMap[line.neoId]) {
                datasetGroupedMap[line.neoId] = line
                datasetGroupedMap[line.neoId].connectedToArray = [];
            } else if (line.connectedTo) {
                if (datasetGroupedMap[line.neoId].connectedToArray.indexOf(line.connectedTo) < 0)
                    datasetGroupedMap[line.neoId].connectedToArray.push(line.connectedTo);
                //  datasetGroupedMap[line.id].connectedTo += "," + line.connectedTo
            }

        })
        var datasetGroupedArray = [];
        for (var key in datasetGroupedMap) {
            datasetGroupedArray.push(datasetGroupedMap[key]);
        }


        datasetGroupedArray.sort(function (a, b) {
            if (a.label > b.label) {
                return 1;
            }
            if (a.label < b.label) {
                return -1;
            }
            return 0;

        })

        datasetGroupedArray.forEach(function (line) {
            line.connectedToArray.forEach(function (connection, index) {
                if (index == 0)
                    line.connectedTo = "";
                else
                    line.connectedTo += ",";
                line.connectedTo += connection;

            })
        })


        $("#ExportDataModalMenu").modal("show");
        ExportData.initDialog(datasetGroupedArray);


        /*    dialog.dialog("open");


            dialog.dialog({title: "Select table columns"});
            exportDialog.init(datasetGroupedArray, true)*/


    }

    self.defineAsSet = function () {
        var setName = prompt("set name ?")
        if (!setName || setName == "")
            return;

    }


    self.drawGraph = function (dataset, options, callback) {


        var visjsData = {nodes: [], edges: [], labels: []};
        visjsData.labels = dataset.labels;
        var uniqueNodes = [];
        var uniqueRels = [];
        dataset.data.nodes.forEach(function (line, indexLine) {
            for (var nodeKey in line) {
                var nodeNeo = line[nodeKey];
                if (uniqueNodes.indexOf(nodeNeo.id) < 0) {
                    uniqueNodes.push(nodeNeo.id);

                    var visjsNode = nodeNeo;
                    visjsData.nodes.push(visjsNode);
                }
            }
            var previousSymbol;
            dataset.labelSymbols.forEach(function (symbol, indexSymbol) {
                if (indexSymbol > 0) {
                    var fromNode = line[previousSymbol];
                    var toNode = line[symbol];
                    var relNeo = line[symbol].incomingRelation;


                    if (uniqueRels.indexOf(relNeo.id) < 0) {
                        uniqueRels.push(relNeo.id);


                        var relObj = visJsDataProcessor.getVisjsRelFromNeoRel(fromNode.id, toNode.id, relNeo.id, relNeo.type, relNeo.neoAttrs, false, false);


                        visjsData.edges.push(relObj);
                    }
                    /*  if (!relsCount[indexSymbol])
                          relsCount[indexSymbol] = 0
                      relsCount[indexSymbol] += 1*/
                }
                previousSymbol = symbol;

            })
        })
        if (options.addToGraph) {// addTo Graph


            var existingNodeIds = Object.keys(visjsGraph.nodes._data);
            var existingEdgesHashes = [];
            for (var key in visjsGraph.edges._data) {
                var edge = visjsGraph.edges._data[key]
                existingEdgesHashes.push(edge.from * edge.to)
            }

            var newNodes = [];
            var newEdges = [];

            visjsData.nodes.forEach(function (node) {
                if (existingNodeIds.indexOf("" + node.id) < 0)
                    newNodes.push(node)
            })

            visjsData.edges.forEach(function (edge) {
                if (existingEdgesHashes.indexOf(edge.from * edge.to) < 0) {
                    newEdges.push(edge);
                    existingEdgesHashes.push(edge.from * edge.to);

                }

            })

            visjsGraph.nodes.update(newNodes)
            visjsGraph.edges.update(newEdges)
            visjsGraph.drawLegend2(visjsData.labels, null);
            if (callback)
            callback(null,{data:{nodes:newNodes,relations:newEdges}});


        }
        else {

            visjsGraph.drawLegend(visjsData.labels, null);
            visjsGraph.draw("graphDiv", visjsData, {}, function () {
                if (callback)
                    callback(null,visjsData);
            });
        }

    }


    self.displayGraph = function (options, callback) {
        if (!options)
            options = {};

        $(".graphDisplayed").css("visibility", "visible");
        // self.expandCollapse()
        var relsCount = {};
        GraphController.setGraphMessage("Working...")
        self.drawGraph(self.currentDataset, options, function () {
            Cache.addCurrentGraphToCache()
            // self.updateResultCountDiv(relsCount);
            if (callback)
                callback(null, self.currentDataset);
        });

    }


    self.displayStats = function () {
        var limit = $("#searchDialog_AlgorithmsResultSize").val();
        var sourceIndex = $("#buildPath_StatSourceLabelSelect").val();
        var targetIndex = $("#buildPath_StatTargetLabelSelect").val();
        var queryObj = self.buildQuery("count", {returnQueryObj: true});


        var sourceSymbol = alphabet.charAt(sourceIndex);
        var targetSymbol = alphabet.charAt(targetIndex);
        var sourceLabel = self.queryObjs[sourceIndex].label;
        var targetLabel = self.queryObjs[targetIndex].label;
        var cypher = "Match " + queryObj.match + " " + queryObj.where + " return " + sourceSymbol + "." + Schema.getNameProperty() + " as name, count (" + targetSymbol + ") as cnt order by cnt desc limit " + limit;

        Cypher.executeCypher(cypher, function (err, result) {
                if (err) {
                    $("#buildPaths_resultDiv").val(err);
                    return console.log(err);
                }
                self.currentCypher = cypher;
                $("#buildPaths_cypherTA").val(cypher);

                if (result.length == 0) {
                    $("#waitImg").css("visibility", "hidden");
                    $("#buildPaths_resultDiv").val("No result");
                    return;
                }
                var statsData = [];
                result.forEach(function (line) {
                    statsData.push({name: line.name, count: line.cnt})
                });
                if (!GraphController.graphDataTable) {
                    GraphController.graphDataTable = new myDataTable();
                    GraphController.graphDataTable.pageLength = 30;
                }

                dialogLarge.load("htmlSnippets/dataTable.html", function () {
                    dialogLarge.dialog("open");
                    GraphController.graphDataTable.loadJsonInTable(null, "dataTableDiv", statsData, function (err, result) {
                    }, 2000)


                })

            }
        )
    }

    self.showStatsDialog = function () {
        $("#dialog").load("htmlSnippets/stats.html", function () {
            var labels = [];
            self.queryObjs.forEach(function (line, index) {
                labels.push({name: line.label, index: index})
            })
            common.fillSelectOptions(buildPath_StatSourceLabelSelect, labels, "name", "index", true)
            common.fillSelectOptions(buildPath_StatTargetLabelSelect, labels, "name", "index", true)

            $("#dialog").dialog("option", "title", "statistics");
            $("#dialog").dialog({modal: false});
            $("#dialog").dialog("open");
        });
    }

    self.updateResultCountDiv = function (relsCount) {
        /*  for(var key in relsCount){

              var html=$("#buildPath_resultCountDiv_1"+key).html();
              html="<span class=buildPath-relCount>"+relsCount[key]+"</span>/"+html
              $("#buildPath_resultCountDiv_1"+key).html(html)

          }*/

    }

    self.graphFromUniqueNode = function (nodeId, callback) {

        var cypher = "match (a)-[r1]-(b) where id(a) =" + nodeId + " RETURN DISTINCT(ID(a) +'-'+ ID(b)) as distinctIds,a , r1 , b LIMIT " + Config.maxResultSupported;
        Cypher.executeCypher(cypher, function (err, result) {
            if (err)
                return console.log(err);
            self.currentDataset = self.prepareDataset(result);
            if (callback)
                return callback(err, result)


            return buildPaths.displayGraph();
        })

    }

    self.drawShortestPathesDialog = function () {
        self.currentNodesDistance += 1;
        MainController.openDialog("no relations found. Try shortestPaths algorithm with distance " + self.currentNodesDistance + " ? ", buildPaths.drawShortestPathes);
    }
    self.drawShortestPathes = function () {


        var cypherObj = self.buildQuery("graph", {nodesDistance: self.currentNodesDistance, returnQueryObj: self.currentNodesDistance});

        var cypher = " MATCH p=(" + cypherObj.match + ") " + cypherObj.where
        cypher += " WITH * MATCH path = allShortestPaths( (a)-[*.." + self.currentNodesDistance + "]-(b) )RETURN nodes(path) as nodes, relationships(path) as relations" +
            " limit " + Config.maxResultSupported;

        console.log(cypher)


        var newNodes = [];
        var newEdges = [];
        var newNodeIds = [];
        var mArrayIds = [];
        var nodes = visjsGraph.nodes._data;
        var edges = visjsGraph.edges._data;

        Cypher.executeCypher(cypher, function (err, result) {


            if (err)
                return console.log(err);
            if (result.length == 0) {
                if (self.currentNodesDistance < 3)
                    return self.drawShortestPathesDialog();
                else
                    return MainController.openDialog("no relations found  with  distance " + self.currentNodesDistance);

            }

            result = result[0];
            var labels = [];
            result.nodes.forEach(function (node) {


                if (newNodeIds.indexOf(node._id) < 0) {
                    newNodeIds.push(node._id);

                    var visjsNode = visJsDataProcessor.getVisjsNodeFromNeoNode(node, true);
                    newNodes.push(visjsNode);
                }

                var label = node.labels[0]
                if (labels.indexOf(label) < 0)
                    labels.push(label);

            })
            result.relations.forEach(function (rel) {
                var from = rel._fromId;
                var to = rel._toId;
                var relId = rel._id
                var relType = rel._type;
                var relProps = rel.properties;

                var visjsEdge = visJsDataProcessor.getVisjsRelFromNeoRel(from, to, relId, relType, relProps);
                newEdges.push(visjsEdge);


            })

            visjsGraph.draw("graphDiv", {nodes: newNodes, edges: newEdges})
            visjsGraph.drawLegend(labels, null);
            MainController.closeDialog();
            $('#query_filterLabelDialogModal').modal('hide');

            $("#dbFilterCollapseMenu").removeClass("show");


        })

    }

    return self;
})
()