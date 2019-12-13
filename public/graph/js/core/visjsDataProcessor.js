var visJsDataProcessor = (function () {
        var self = {};


self.transformNeo2Visj=function(neoData){
    var visjsData = {nodes: [], edges: [], labels: []};
    visjsData.labels = neoData.labels;
    var uniqueNodes = [];
    var uniqueRels = [];
    neoData.data.nodes.forEach(function (line, indexLine) {
        for (var nodeKey in line) {
            var nodeNeo = line[nodeKey];
            if (uniqueNodes.indexOf(nodeNeo.id) < 0) {
                uniqueNodes.push(nodeNeo.id);

                var visjsNode = nodeNeo;
                visjsData.nodes.push(visjsNode);
            }
        }
        var previousSymbol;
        neoData.labelSymbols.forEach(function (symbol, indexSymbol) {
            if (indexSymbol > 0) {
                var fromNode = line[previousSymbol];
                var toNode = line[symbol];
                var relNeo = line[symbol].incomingRelation;
                if (uniqueRels.indexOf(relNeo.id) < 0) {
                    uniqueRels.push(relNeo.id);
                    var relObj = visJsDataProcessor.getVisjsRelFromNeoRel(fromNode.id, toNode.id, relNeo.id, relNeo.type, relNeo.neoAttrs, false, false);


                    visjsData.edges.push(relObj);
                }

            }
            previousSymbol = symbol;

        })
    })

    return visjsData;
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

                visjsGraph.nodesDS.update(newNodes)
                visjsGraph.edgesDS.update(newEdges)
                visjsGraph.drawLegend2(visjsData.labels, null);
                if (callback)
                    callback(null, {data: {nodes: newNodes, relations: newEdges}});


            }
            else {

                visjsGraph.drawLegend(visjsData.labels, null);
                visjsGraph.draw("graphDiv", visjsData, {}, function () {
                    if (callback)
                        callback(null, visjsData);
                });
            }

        }


        self.getVisjsNodeFromNeoNode = function (nodeNeo, hideLabel, rel) {
            var neoId = nodeNeo._id;
            var nodeNeoProps = nodeNeo.properties;

            var labels = nodeNeo.labels;

            var labelVisjs = ""+nodeNeoProps[Config.defaultNodeNameProperty];
            if (labelVisjs && labelVisjs.length > Config.nodeMaxTextLength)
                labelVisjs = labelVisjs.substring(0, Config.nodeMaxTextLength) + "...";

            var color = context.nodeColors[nodeNeo.labels[0]];

            var nodeObj = {

                labelNeo: labels[0],// because visjs where label is the node name
                color: color,
                myId: nodeNeoProps.id,
                id: neoId,
                children: [],
                neoAttrs: nodeNeoProps,
                // value: 2,
                size: Config.visjs.defaultNodeSize,
                font: {size: Config.visjs.defaultTextSize},


            }
            if (rel)
                nodeObj.endRel = rel;


            if (!hideLabel) {
                nodeObj.label = labelVisjs;
                // nodeObj.title = labelVisjs;
            }

            nodeObj.hiddenLabel = labelVisjs;








            nodeObj.initialColor = nodeObj.color;
            var labelIcon = null;
            if (context.user.graphDisplaySettings.labels)
                labelIcon = context.user.graphDisplaySettings.labels[nodeObj.labelNeo];
            if (labelIcon) {
              nodeObj.group=nodeObj.labelNeo;
              nodeObj.icon="icon";
                nodeObj.color;
                nodeObj.initialColor;
            }

            else if (nodeNeoProps.image && nodeNeoProps.image.length > 0) {
                nodeObj.shape = 'circularImage';
                nodeObj.image = nodeNeoProps.image.replace(/File:/, "File&#58;");
                nodeObj.brokenImage = "images/questionmark.png";
                //   nodeObj.image=encodeURIComponent(nodeNeoProps.icon)
                nodeObj.borderWidth = 4
                nodeObj.size = 30;
                delete nodeObj.color;
                delete nodeObj.initialColor;

            }
            else if (nodeNeoProps.icon && nodeNeoProps.icon.length > 0) {
                nodeObj.shape = 'circularImage';
                nodeObj.image = nodeNeoProps.icon;
                nodeObj.brokenImage = 'http://www.bnf.fr/bnf_dev/icono/bnf.png'
                //   nodeObj.image=encodeURIComponent(nodeNeoProps.icon)
                nodeObj.borderWidth = 4
                nodeObj.size = 30;
                delete nodeObj.color;
                delete nodeObj.initialColor;


            }
            return nodeObj

        }

        self.getVisjsRelFromNeoRel = function (from, to, id, type, props, showType, outline) {


            var color = "#eee";//linkColors[rel];
            if (false && context.edgeColors[type])
                color = context.edgeColors[type];

            var relObj = {
                from: from,
                to: to,
                type: type,
                neoId: id,
                neoAttrs: props,
                color: color,
                width: 1
                // font:{background:color},
            }


            if (outline) {
                relObj.width = 3;
                relObj.font = {size: 18, color: 'red', strokeWidth: 3, strokeColor: '#ffffff'}
            }


            if (showType) {
                relObj.label = relObj.type;
                relObj.arrows = {from: {scaleFactor: 0.5}}
            }
            return relObj;
        }


        self.elasticSkosToVisjs = function (resultArray) {

            visjsData = {nodes: [], edges: [], labels: []};
            var nodesMap = {};
            /*  var dataLabels = [];
              var colors = [];*/
            if (!resultArray)
                return;
            var id = 10000;
            for (var i = 0; i < resultArray.length; i++) {
                var elasticObj = resultArray[i].content;

                for (var key in elasticObj) {
                    var visObj = {
                        label: elasticObj[key].label,
                        labelNeo: key,// because visjs where label is the node name
                        color: "blue",
                        myId: id,
                        id: id++,
                        children: [],
                        neoAttrs: {},
                        endRel: 0


                    }
                    nodesMap[elasticObj[key].label] = visObj;
                    visjsData.nodes.push(visObj);
                }

            }

//relations
            for (var i = 0; i < resultArray.length; i++) {
                var elasticObj = resultArray[i].content;
                var conceptObj = elasticObj.concept;
                var idConcept = nodesMap[conceptObj.label].id;
                for (var key in elasticObj) {
                    if (key != "concept") {
                        var idTarget = nodesMap[elasticObj[key].label].id;

                        var relObj = {
                            from: idConcept,
                            to: idTarget,
                            type: key,
                            neoId: idTarget,
                            neoAttrs: {},
                            color: "green",
                            // font:{background:color},
                        }
                        visjsData.edges.push(relObj);

                    } else {

                    }

                }
            }
            return visjsData;//testData;
        }

        self.isLabelNodeOk = function (data, label, property, operator, value) {

            if (label && (!value || value == "")) {
                if (data.labelNeo == label)
                    return true;
                return false;
            }

            if (property && property.length > 0) {


                if (!data.neoAttrs[property])
                    return false;


                var comparison;
                if (operator == "contains")
                    comparison = "\"" + data.neoAttrs[property] + "\".match(/.*" + value + ".*/i)";
                else {
                    if (operator == "=")
                        operator = "==";
                    if (common.isNumber(value))
                        value = value;
                    else
                        value = "'" + value + "'"
                    var predicate = data.neoAttrs[property];
                    if (typeof predicate == "string")
                        predicate = "'" + predicate + "'"

                    comparison = predicate + operator + value;
                }
                var result = eval(comparison)
                return result;


            } else {
                if (value && value.length > 0) {// we look for value in all properties

                    for (var key in data) {
                        if (self.isLabelNodeOk(data, key, operator, value, type)) {
                            return true;
                        }
                    }
                }
                else {// we look that type corresponds

                    if (data.labelNeo == label)
                        return true;
                }

            }
            return false;

        }


        self.toutlesensSchemaToVisjs = function (schema, id) {

            function makeNode(label) {

                var visNode = {
                    label: label,
                    type: "schema",
                    neoAttrs: schema.labels[label],
                    labelNeo: "label",// because visjs where label is the node name
                    // color: "lightBlue",
                    color: context.nodeColors[label],
                    myId: id,
                    shape: "box",
                    id: "schemaLabel_" + label,
                    children: [],
                    neoAttrs: {},
                    font: {stroke: "black", "font-size": "14px"},
                    endRel: 0
                }
                nodesMap[label] = visNode;
                visjsData.nodes.push(visNode);

            }

            visjsData = {nodes: [], edges: [], labels: []};
            var nodesMap = {};
            var uniqueRelIds = []
            var id = 0;
            for (var key in schema.relations) {
                var relation = schema.relations[key];
                if (!nodesMap[relation.startLabel])
                    makeNode(relation.startLabel)
                if (!nodesMap[relation.endLabel])
                    makeNode(relation.endLabel)

                var relObj = {
                    from: nodesMap[relation.startLabel].id,
                    to: nodesMap[relation.endLabel].id,
                    type: "relation",
                    neoId: "schemaRelation_" + relation.startLabel + "_" + relation.endLabel,
                    id: "schemaRelation_" + relation.startLabel + "_" + relation.endLabel,
                    neoAttrs: {},
                    color: "green",
                    label: relation.type,
                    font: {stroke: "black", "font-size": "14px"},
                    arrows: {to: {scaleFactor: 0.5}}
                    // font:{background:color},
                }
                if (uniqueRelIds.indexOf(relObj.id) < 0) {
                    uniqueRelIds.push(relObj.id)
                    visjsData.edges.push(relObj);
                }

            }
//nodes without relations
            for (var key in schema.labels) {
                if (!nodesMap[key]) {
                    makeNode(key);
                }
            }
            if (DataModel.DBstats) {
                for (var i = 0; i < visjsData.nodes.length; i++) {
                    var countNodes = "?";
                    if (DataModel.DBstats.nodes[visjsData.nodes[i].label])
                        countNodes = DataModel.DBstats.nodes[visjsData.nodes[i].label];
                    visjsData.nodes[i].count = countNodes;
                    visjsData.nodes[i].name = visjsData.nodes[i].label;
                    visjsData.nodes[i].label += " (" + countNodes + ")";

                }
                for (var i = 0; i < visjsData.edges.length; i++) {
                    var countRels = 0;
                    if (DataModel.DBstats.relations[visjsData.edges[i].label] && DataModel.DBstats.relations[visjsData.edges[i].label].countRel) {
                        countRels = DataModel.DBstats.relations[visjsData.edges[i].label].countRel;
                    }
                    //  visjsData.edges[i].value=countRels;
                    visjsData.edges[i].count = countRels;
                    visjsData.edges[i].name = visjsData.edges[i].label;
                    visjsData.edges[i].label += " (" + countRels + ")";

                }


            }
            visjsData.type="schema"
            return visjsData;

        }
        self.graphToDatable = function () {

            function processGroupedNodes(fromNode, toNode) {
                if (!labelsMap[fromNode.labelNeo]) {
                    labelsMap[fromNode.labelNeo] = {};
                }
                if (!labelsMap[fromNode.labelNeo][fromNode.id]) {
                    var node = fromNode.neoAttrs
                    if (toNode)
                        node.connectedTo = ["[" + toNode.labelNeo + "]" + toNode.label];
                    labelsMap[fromNode.labelNeo][fromNode.id] = node;
                } else {
                    if (toNode)
                        labelsMap[fromNode.labelNeo][fromNode.id].connectedTo.push("[" + toNode.labelNeo + "]" + toNode.label);
                }
            }

            function processNodes(fromNode, toNode) {
                if (toNode)
                    toNode.name = toNode.neoAttrs[Schema.getNameProperty()]
                if(!fromNode || !fromNode.id)
                    return;

                if (!labelsMap[fromNode.id]) {
                    var node = fromNode.neoAttrs
                    if (toNode)
                        node.connectedTo = ["[" + toNode.labelNeo + "]" + toNode.name];
                    labelsMap[fromNode.id] = node;
                } else {
                    if (toNode)
                        labelsMap[fromNode.id].connectedTo.push("[" + toNode.labelNeo + "]" + toNode.name);
                }
            }

            var labelsMap = {};

            visjsGraph.data.edges.get().forEach(function(edge) {


                var fromNode = visjsGraph.data.nodes.get(edge.from);
                var toNode = visjsGraph.data.nodes.get(edge.to);

                processNodes(fromNode, toNode);
                processNodes(toNode, fromNode);
            })

            visjsGraph.data.nodes.get().forEach(function(node) {
                processNodes(node);
            })

            var data = [];
            var columns = [];
            for (var key in labelsMap) {
                for (var col in labelsMap[key]) {
                    if (columns.indexOf(col) < 0)
                        columns.push(col);
                }
                data.push(labelsMap[key])
            }

            data.forEach(function (line, index) {
                columns.forEach(function (col) {
                    if (!line[col])
                        data[index][col] = ""
                })

            })

            $("#ExportDataModalMenu").modal("show");
            ExportData.initDialog(data);

        }

        return self;
    }


)()
