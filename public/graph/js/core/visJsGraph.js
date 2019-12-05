/**
 * Created by claud on 03/08/2017.
 */

//https://ww3.arb.ca.gov/ei/tools/lib/vis/docs/
var visjsGraph = (function () {
    var self = {};


    self.physicsOn = true;
    self.configure = false;

    self.nodes = [];
    self.edges = [];
    self.type = null;
    self.network = null;
    self.currentScale;
    self.smooth = true;
    self.edgeWidth = 1;
    self.maxEdgesForSmoothEdges = 200;


    self.currentLayoutType = Config.visjs.defaultLayout;
    self.currentLayoutDirection = "";
    self.currentShape = Config.visjs.defaultNodeShape;


    self.scaleToShowLabels = 0.6;
    self.context = {currentNode: null, currentEdge: null};
    self.dragRect = {x: 0, y: 0, w: 0, h: 0};
    self.graphHistory = [];
    self.graphHistory.currentIndex = 0;
    self.legendLabels = [];
    self.physics = {};
    self.labelsVisible = false;
    self.lastClikedNodeIds = [];


    var showNodesLabelMinScale = .3;
    var stopPhysicsTimeout = 5000;
    var lastClick = new Date();
    var dblClickDuration = 500;


    var dragPosition = {};
    var options = {};
    var physicsTimeStep = 0.5;


    self.getDefaultPhysics = function () {
        return {
            "barnesHut": {
                // "gravitationalConstant": -39950,
                "gravitationalConstant": -10000,
                "centralGravity": 0.35
            },
            "minVelocity": 0.75,
            "stabilization": {enabled: false},

        }

    }


    self.getVisJsOptions = function (_options) {
        if (!_options)
            _options = {};

        var options = {
            manipulation: {
                enabled: false
            },
            interaction: {
                dragView: false,
                multiselect: true,
                hover: true,

                navigationButtons: true,
                keyboard: true

            },

            nodes: {
                borderWidthSelected: 6,
                shape: Config.visjs.defaultNodeShape,
                size: Config.visjs.defaultNodeSize,
                font: {size: Config.visjs.defaultTextSize},

            },
            edges: {
                selectionWidth: 4,
                width: self.edgeWidth,

                smooth: {enabled: self.smooth, type: "continuous"},
                font: {
                    size: 8
                }
            }


        };
        if (_options.scale)
            options.scale = _options.scale;

        if (Object.keys(self.edges).length > 1000)
            options.layout = {improvedLayout: false}
        if (Object.keys(self.nodes).length > 1000)
            options.layout = {improvedLayout: false}

        if (_options.fixed) {
            options.physics = {}
            options.physics = false;
        } else {
            self.physicsOn = true;
            options.physics = self.physics

        }

        if (_options.stopPhysicsTimeout)
            stopPhysicsTimeout = _options.stopPhysicsTimeout;

        if (self.configure) {
            var wrapper = $(".vis-configuration-wrapper")
            if (!wrapper.length) {
                options.configure = {

                    filter: function (option, path) {
                        if (path.indexOf('physics') !== -1) {
                            return true;
                        }
                        if (path.indexOf('smooth') !== -1 || option === 'smooth') {
                            return true;
                        }
                        return false;
                    },
                    container: document.getElementById('configVisjs')
                }
            }
        }
        //    console.log(JSON.stringify(options, null, 2));

        return options;
    }

    self.setStabilisationTimeOut = function (nodesLength) {
        var x = (Math.log(self.nodes.length * 2) * Math.LOG10E) + 1;

        // stopPhysicsTimeout = Math.pow(10, x);
        stopPhysicsTimeout = x * 1000

        console.log("stopPhysicsTimeout " + stopPhysicsTimeout)

    }


    self.draw = function (divId, visjsData, _options, callback) {
        if (!_options) {
            _options = {}
        }


        $("#" + divId).css("background-color", Config.visjs.graphBackgroundColor)
        self.lastClikedNodeIds = [];
        {// initialisation
            var t0 = new Date();
            var container = document.getElementById(divId);
            self.nodesDS = new vis.DataSet(visjsData.nodes);
            self.edgesDS = new vis.DataSet(visjsData.edges);
            self.type = visjsData.type;
        }
        self.drawLegend2()

        var data = {
            nodes: self.nodesDS.get(),
            edges: self.edgesDS.get()
        };

        if (visjsData.edges.length > self.maxEdgesForSmoothEdges) {
            self.smooth = false;
            self.edgeWidth = 1;
        }


        self.setStabilisationTimeOut(self.nodesDS.get().length);
        var options = self.getVisJsOptions(_options)
        self.physics = self.getDefaultPhysics();

        options.physics.enabled = true;

        if (context.user.graphDisplaySettings.labels) {
            if (!options.groups) {
                options.groups = {}
            }
            for (var key in context.user.graphDisplaySettings.labels) {
                options.groups[key] = {
                    shape: 'icon',
                    icon: {
                        face: 'FontAwesome',
                        code: String.fromCharCode("0x" + context.user.graphDisplaySettings.labels[key]),
                        size: Config.visjs.defaultIconSize,
                        color: context.nodeColors[key]
                    }
                }
            }

        }


        self.network = new vis.Network(container, data, options);
        self.network.startSimulation();

        window.setTimeout(function () {

            self.physics.enabled = false;


            if (!_options.scale) {
                self.network.fit();
                if (!_options.fixed)
                    ;// self.onScaleChange()
            }

            if (_options.fixed) {
                _options.physics = false;
            } else {
                self.network.stopSimulation();
                /* self.network.setOptions(
                     {physics: self.physics}
                 );*/
                self.physicsOn = false;
            }


            if (_options.onFinishDraw) {

                var fn = _options["onFinishDraw"];
                fn();
            }

        }, stopPhysicsTimeout);


        self.network.on("click", function (params) {

            GraphController.hideNodePopover()
            if (params.event.type == "doubletap")
                return;

            if (_options.onClick) {
                var fn = _options["onClick"];
                return fn(params);
            }

            if (params.edges.length == 0 && params.nodes.length == 0) {//simple click stop animation

                if (options.fixed)
                    return;

                self.physicsOn = false;
                self.physics.enabled = self.physicsOn;
                self.network.setOptions(
                    {physics: self.physics, edges: {smooth: {enabled: self.smooth}}}
                );

                $("#GraphNodePopoverDiv").addClass("d-none")
                $("#GraphRelationPopoverDiv").addClass("d-none")

            }


            // select node
            else if (params.nodes.length == 1) {

                var nodeId = params.nodes[0];
                self.lastClikedNodeIds.push(nodeId)
                var node = self.nodesDS.get(nodeId);
                node._graphPosition = params.pointer.DOM;
                var point = params.pointer.DOM;
                self.context.currentNode = node;
                if (params.event.srcEvent.ctrlKey) {
                    return GraphController.onNodeClicked(node, point, {ctrlKey: 1})
                }


                GraphController.onNodeClicked(node, point)


            }

            // select edge
            else if (params.edges.length == 1) {
                var edgeId = params.edges[0];
                var edge = self.edges._data[edgeId];
                edge.fromNode = self.nodesDS.get(edge.from);
                edge.toNode = self.nodesDS.get(edge.to);
                var point = params.pointer.DOM;
                GraphController.onEdgeClicked(edge, point)


            }
        });

        self.network.on("zoom", function (params) {
            self.onScaleChange()

        });
        self.network.on("configChange", function (params) {

            self.physics.enabled = true;
            Object.assign(self.physics, params.physics);
            self.network.setOptions({physics: self.physics})

        });

        self.network.on("doubleClick", function (params) {
            //stop or animation when click on canvas
            if (params.edges.length == 0 && params.nodes.length == 0) {

                if (options.fixed)
                    return;

                self.physicsOn = true;
                self.physics.enabled = self.physicsOn;
                self.network.setOptions(
                    {physics: self.physics, edges: {smooth: {enabled: self.smooth}}}
                );

                if (_options.onFinishDraw) {
                    var fn = _options["onFinishDraw"];
                    fn();
                } else {
                    //  self.network.fit();
                    //  self.onScaleChange()
                }


            }
        })

        self.network.on("stabilizationIterationsDone", function (ctx) {
            // self.onScaleChange()
        });

        self.network.on("stabilized", function (ctx) {
            //  self.onScaleChange()
        });

        self.network.on(" afterDrawing", function (params) {
            //   self.onScaleChange()
        });
        self.network.on("dragEnd", function (params) {
            if (params.nodes.length > 0)
                Cache.cacheGraphSchema();
            return;
        });

        /*       self.network.on("beforeDrawing", function (ctx) {
                   self.context = ctx;
               });
               self.network.on("afterDrawing", function (ctx) {
                   self.context = ctx;
                   if (callback)
                       callback();
               });

               self.network.on("dragStart", function (params) {
                   dragPosition = params.pointer.DOM;

                   //   self.dragRect("dragStart",dragPosition.x,dragPosition.y);
               });

               self.network.on("drag", function (params) {
                   dragPosition = params.pointer.DOM;
                   //  self.dragRect("drag",dragPosition.x,dragPosition.y);
               });

               self.network.on("dragEnd", function (params) {
                   return;
                   var dragEndPos = params.pointer.DOM;
                   self.dragRect("dragEnd", dragPosition.x, dragPosition.y);
                   if ((true || _options.dragConnectedNodes) && params.event.srcEvent.ctrlKey) {
                       self.dragConnectedNodes(params.nodes[0], {
                           x: dragEndPos.x - dragPosition.x,
                           y: dragEndPos.y - dragPosition.y
                       });
                   }
                   if (_options.onEndDrag) {


                       var fn = _options["onEndDrag"];
                       fn();
                   }
                   else {
                       ;// network.fit()
                   }


               });

               self.network.on("hoverNode", function (params) {

               });
               self.network.on("selectNode", function (params) {


               });


               self.network.on("selectEdge", function (params) {
                   //  console.log('selectEdge Event:', params);
               });
               self.network.on("deselectNode", function (params) {
                   // console.log('deselectNode Event:', params);
               });
               self.network.on("deselectEdge", function (params) {
                   //  console.log('deselectEdge Event:', params);
               });
               self.network.on(" afterDrawing", function (params) {
                   onVisjsGraphReady();
                   //  console.log('graph loaded Event');
               });*/
        document.addEventListener('mousewheel', this, {passive: true});//https://github.com/almende/vis/issues/4016
        if (callback)
            return callback(null, "ok")
    }
    self.outlineNodeEdges = function (nodeId) {
        self.edges.setOption({width: 1})


        var connectedEdges = self.network.getConnectedEdges(nodeId);
        var nodeEdges = [];
        for (var i = 0; i < connectedEdges.length; i++) {
            var connectedEdgeId = connectedEdges[i];
            nodeEdges.push[{id: "" + connectedEdgeId, width: 5}]

        }
        selfedgesDS.update(nodeEdges)
    }

    self.getNodeIds = function () {
        var nodes = [];
        self.nodesDS.get().forEach(function (node) {
            nodes.push(node.id)
        })
        return nodes
    }

    self.setShapeOption = function (shape) {
        self.currentShape = shape;
        var nodes = [];
        self.nodesDS.get().forEach(function (node) {
            nodes.push(node.id)
        })
        /*  for (var key in self.nodes._data) {
                nodes.push(key)
            }*/
        self.paintNodes(nodes, null, null, null, shape)

    }

    self.setLayoutType = function (layoutStr, apply) {
        var layoutArray = layoutStr.split(" ");
        var layoutType = layoutArray[0];
        var sortMethod = "";
        if (layoutArray.length > 1)
            sortMethod = layoutArray[1];
        self.currentLayoutType = layoutType;
        if (layoutType == "hierarchical") {
            ($("#graphLayoutDirectionDir").css("visibility", "visible"))
            options.layout = {hierarchical: {sortMethod: sortMethod, direction: self.currentLayoutDirection}}
        }
        if (layoutType == "random") {
            ($("#graphLayoutDirectionDir").css("visibility", "hidden"))
            options.layout = {hierarchical: false, randomSeed: 2}
        }
        if (apply) {
            self.network.setOptions(options)
        }
        return (options)
    }
    self.setLayoutDirection = function (direction, apply) {
        self.currentLayoutDirection = direction;

        if (self.currentLayoutType == "hierarchical") {
            options.layout = {hierarchical: {direction: direction}}
        }

        if (apply) {

            self.network.setOptions(options)
        }
        return (options)
    }
    self.drawLegend = function (labels, relTypes) {

    }

    self.drawLegend2 = function () {
        var countLabels = {};

        //  var nodes = self.nodes._data;
        var nodes = self.nodesDS.get();
        nodes.forEach(function (node) {
            //  for (var key in nodes) {
            var nodeLabel = node.labelNeo;
            if (!countLabels[nodeLabel])
                countLabels[nodeLabel] = 0
            countLabels[nodeLabel] += 1;
        })


        self.legendLabels = [];
        var labels = []
        for (var label in countLabels) {
            // labels.forEach(function (label) {
            if (label != "" && self.legendLabels.indexOf(label) < 0) {
                self.legendLabels.push(label);
                labels.push(label)
            }
        }

        // })


        var html = "<table>";
        var onClick = "";

        var usedLabels = [];
        for (var i = 0; i < labels.length; i++) {

            var label = labels[i];
            var labelText = label;
            if (countLabels[label])
                labelText += " (" + countLabels[label] + ")"

            if (usedLabels.indexOf(label) < 0) {
                usedLabels.push(label)
                if (label && label != "" && context.nodeColors[label]) {
                    onClick = "onclick=filter.filterNodeLegend('" + label + "')";
                    html += "<tr" + onClick + "><td><span  class='legendSpan' id='legendSpan_" + label + "' style='background-color: " + context.nodeColors[label] + ";width:20px;height: 20px'>&nbsp;&nbsp;&nbsp;</span></td><td><span style='font-size: 10px'>" + labelText + "</span></td></tr>"
                }
            }
            /*   }

               if (relTypes) {
                   relTypes.forEach(function (type) {
                       onClick = "onclick=filter.filterNodeLegend('" + label + "')";
                       html += "<tr" + onClick + "><td><span  class='legendSpan' id='legendSpan_" + type + "' style='background-color: " + context.edgeColors[type] + ";width:40px;height:3px'>&nbsp;&nbsp;&nbsp;</span></td><td><span style='font-size: 10px'>[" + type + "]</span></td></tr>"

                   })*/


        }


        html += "</table>"
        $("#graph_legendDiv").html(html);
        $("#textMenuButton").css("visibility", "visible")


    }

    self.onScaleChange = function (options) {
        if (!options)
            options = {};
        var scale = self.network.getScale();
        if (false && scale == 1)
            return;
        if (options.force || !self.currentScale || Math.abs(scale - self.currentScale) > .01) {

            $("#graphInfosSpan").html(" scale " + Math.round(scale * 100) + "%");
            //  if (_options.showNodesLabel == false && scale > self.scaleToShowLabels) {


            var nodes = [];
            var scaleCoef = scale >= 1 ? (scale * .9) : (scale * 2)
            var size = Config.visjs.defaultNodeSize / scaleCoef;
            var fontSize = (Config.visjs.defaultTextSize / (scaleCoef));
            if (scale < 1)
                fontSize = (Config.visjs.defaultTextSize / (scaleCoef * 0.8));
            else
                fontSize = (Config.visjs.defaultTextSize / (scaleCoef * 1.3));

            var oldNodes = self.nodesDS.get();
            oldNodes.forEach(function (node) {

                var shape = node.shape;
                if (!shape)
                    shape = Config.visjs.defaultNodeShape;
                if (shape != "box") {

                    if (scale > showNodesLabelMinScale) {
                        node.label=node.ishidden ? null : node.hiddenLabel;
                        node.size= size;
                        node.font={size: fontSize}
                        self.labelsVisible = true;
                      /*  node = {
                            id: node.id,
                            label: node.ishidden ? null : node.hiddenLabel,
                            size: size,
                            font: {size: fontSize}
                        }*/



                    } else {
                        self.labelsVisible = false;
                        node.label=null;
                        node.size= size;
                        node.font={size: fontSize}

                    }

                    nodes.push(node);
                }
            })
           // console.log(JSON.stringify(nodes,null,2))
            self.network.body.emitter.emit('_dataChanged')
            self.nodesDS.update(nodes);
            self.network.redraw()

        }
        self.currentScale = scale;
    }


    self.setNodesColor = function (nodeIds, color) {
        var newNodes = [];
        var nodeColor;
        var nodes = self.nodesDS.get();
        nodes.forEach(function (node) {
            if (nodeIds.indexOf(node.id) > -1)
                nodeColor = color;
            else
                nodeColor = node.initialColor;
            newNodes.push({id: node.id, background: nodeColor});

        })
        self.nodesDS.update(newNodes);


    }


    self.paintNodes = function (nodeIds, color, otherNodesColor, radius, shape) {
        var nodes = [];
        if (!shape)
            shape = "star";

        for (var i = 0; i < nodeIds.length; i++) {// transform ids in string
            nodeIds[i] = "" + nodeIds[i];
        }
        var nodes = self.nodesDS.get();
        nodes.forEach(function (node) {

            if (nodeIds.indexOf(key) > -1) {
                if (shape)
                    node.shape = shape;
                if (color)
                    node.color = color
                if (radius)
                    node.size = radius * 2;

            } else {
                if (node.initialColor)
                    node.color = {background: node.initialColor};


                if (node.image && node.image.length > 0) {
                    node.shape = 'circularImage';
                    node.image = node.image.replace(/File:/, "File&#58;");
                    node.brokenImage = "images/questionmark.png";
                    node.borderWidth = 4
                    node.size = 30;

                } else if (node.icon && node.icon.length > 0) {
                    node.shape = 'circularImage';
                    node.image = node.icon;
                    node.brokenImage = 'http://www.bnf.fr/bnf_dev/icono/bnf.png'
                    node.borderWidth = 4
                    node.size = 30;

                } else {
                    // node.shape = null;
                    node.size = 15;
                    node.shape = self.currentShape;
                }
            }
            nodes.push(node);
        })


        self.nodesDS.update(nodes);

    }
    self.selectNode = function (ids) {
        self.network.selectNodes(ids, true);

    }

    self.updateNodes = function (nodes) {
        self.nodesDS.update(nodes);

    }

    self.updateRelations = function (relations) {
        selfedgesDS.update(relations);

    }


    self.scaleNodes = function (nodes, valueProp) {
        var newNodes = []
        var nodes = self.nodesDS.get();
        nodes.forEach(function (node) {
            newNodes.push({id: node.id, value: node[valueProp]})
            //  nodes[i]._data.value= nodes[i]._data[valueProp];

        })
        self.nodesDS.update(newNodes);

    }


    self.paintEdges = function (relIds, color, otherRelColor, radius) {
        var edges = []

        //   for (var i=0;i<relations.length;i++) {
        var edges = self.edgesDS.get();
        edges.forEach(function (edge) {
            if (relIds.indexOf(edge.neoId) > -1) {
                edge.color = {color: color};
                edge.width = 1;
                // self.edges[key].width = 3;
            } else {
                if (otherRelColor)
                    edge.color = {color: otherRelColor};

                edges.push(edge);
            }

        })
        self.network.setData({nodes: self.nodes, edges: self.edges});

        //  physics: {enabled: true}
        self.network.setOptions({
            physics: {enabled: true}
        });


    }

    self.displayRelationNames = function (option) {
        var show
        if (option)
            show = option.show
        show = $("#showRelationTypesCbx").prop("checked");
        Config.showRelationNames = show;
        var edges = self.edgesDS.get();
        edges.forEach(function (edge) {
            if (show) {
                edge.label = edge.type;
                if (edge.label)
                    edge.label.arrows = 'to';
                edge.font = {size: 8, color: 'grey', face: 'arial'}
            } else
                delete edge.label;

        })
        self.network.setData({nodes: self.nodesDS.get(), edges: self.edgesDS.get()});

        //  physics: {enabled: true}
        self.network.setOptions({
            physics: {enabled: true}
        });

    }


    self.changeLayout = function (select) {
        self.currentLayoutType = $(select).val();
        var options = {}

        if (self.currentLayoutType == "physics") {

            options.physics = {
                enabled: true,
                stabilization: {enabled: false},

            };

        }

        if (self.currentLayoutType == "hierarchical") {
            options.layout = {
                hierarchical: {
                    direction: "UD"
                }
                ,
                stabilization: {enabled: false},

            };
        }
        self.network.setOptions(options);
        self.network.fit()
    }

    self.fitToPage = function () {
        self.network.fit({
            animation: {
                scale: 1.0,
                animation: {
                    duration: 1000,
                }
            }
        })
    }
    self.zoomOnNode = function (expression) {
        var regex = new RegExp(".*" + expression + ".*", 'i');
        var nodes = [];
        var nodes = self.nodesDS.get();
        nodes.forEach(function (node) {

            var str = node.label;
            if (!str)
                str = node.neoAttrs[Schema.getNameProperty()]
            if (str.match(regex)) {
                self.nodesDS.update({id: node.id, shape: "star"});
                self.network.focus(node.id,
                    {
                        scale: 1.0,
                        animation: {
                            duration: 1000,
                        }
                    });
            }

        })
    }

    self.findNode = function (expression, color, radius) {
        var regex = new RegExp(".*" + expression + ".*", 'i');
        var nodes = [];
        var nodes = self.nodesDS.get();
        nodes.forEach(function (node) {
            if (node.label.match(regex)) {
                node.color = {background: color};
                node.size = 2 * radius;
            } else {

                node.color = node.initialColor;
            }
            nodes.push(node);
        })


        self.nodesDS.update(nodes);
        self.network.fit()

    }
    self.outlinePathNodes = function () {
        var pathNodes = []
        var nodes = self.nodesDS.get();
        nodes.forEach(function (node) {
            if (node.isSource) {
                //  node.x = 0;
                //   node.y = 0;
                pathNodes.push("" + node.id);
            }
            if (node.target) {
                // node.x = $("#graphDiv").width();
                //   node.y = $("#graphDiv").height();
                pathNodes.push("" + node.id);
            }
        })
        self.paintNodes(pathNodes, "red", null, 20);
    }


    self.exportGraph = function () {
        function objectToArray(obj, positions) {
            return Object.keys(obj).map(function (key) {
                obj[key].id = key;
                if (positions[key]) {
                    obj[key].x = positions[key].x;
                    obj[key].y = positions[key].y;
                }
                return obj[key];
            });
        }


        function addConnections(elem, index) {
            // need to replace this with a tree of the network, then get child direct children of the element

            elem.connections = self.network.getConnectedNodes(elem.id);
        }

        function destroyNetwork() {
            self.network.destroy();
        }

        var positions = self.network.getPositions();

        var nodes = objectToArray(self.nodesDS.get(), positions);


        nodes.forEach(addConnections);
        var data = {
            nodes: nodes,
            edges: self.edgesDS.get()
        }
        return data;


    }

    self.getNodesNeoIdsByLabelNeo = function (labelNeo) {
        var ids = [];
        var nodes = self.nodesDS.get();
        nodes.forEach(function (node) {
            if (!labelNeo) {
                ids.push(parseInt("" + node.id))
            } else if (node.labelNeo == labelNeo)
                ids.push(parseInt("" + node.id))


        })
        return ids;


    }

    self.graph2Text = function () {
        var str0 = "";
        var graphNodesArray = self.exportGraph();
        var graphData = {}
        for (var i = 0; i < graphNodesArray.length; i++) {
            var node = graphNodesArray[i];
            graphData[node.id] = node;
        }


        function node2Text(node) {

            var str = "";
            var properties = node.neoAttrs;
            var color = context.nodeColors[node.labelNeo];
            var connections = node.connections
            str += "<br>" + "[" + node.labelNeo + "]" + JSON.stringify(properties)
            str += "<ul>"
            for (var i = 0; i < connections.length; i++) {
                str += "<li>"
                var linkedNode = graphData["" + connections[i]];
                str += "[" + linkedNode.labelNeo + "]" + linkedNode.neoAttrs[Schema.getNameProperty()]
                str += "</li>"


            }
            str += "</ul>"
            return str;

        }

        for (var key in graphData) {
            var node = graphData[key];
            str0 += node2Text(node);
        }

        return str0;
    }

    self.importGraph = function (inputData, options) {
        if (!options) {
            options = {};
        }


        function getNodeData(nodeData) {
            var networkNodes = [];
            nodeData.forEach(function (elem, index, array) {
                networkNodes.push(elem);
                //   networkNodes.push({id: elem.id, label: elem.id, x: elem.x, y: elem.y});
            });
            return networkNodes;
            // return new vis.DataSet(networkNodes);
        }

        function getNodeById(data, id) {
            for (var n = 0; n < data.length; n++) {
                if (data[n].id == id) {  // double equals since id can be numeric or string
                    return data[n];
                }
            }
            ;

            throw 'Can not find id \'' + id + '\' in data';
        }


        function getEdgeData(data) {
            var edges = [];
            for (var key in allEdges) {
                edges.push(allEdges[key]);
            }
            return edges;
        }


        var allEdges = inputData.edges;
        var allNodes = inputData.nodes;
        if (allNodes.nodes)// correction bug graphSchema
            allNodes = allNodes.nodes;
        var data = {
            nodes: getNodeData(allNodes),
            edges: getEdgeData(allEdges)
        }

        /* if (!options)
             options = {smooth: true};*/
        if (!options.history)
            options.noHistory = true;
        options.fixed = true;

        self.draw("graphDiv", data, options);


    }

    self.getConnectedNodes = function (nodeId) {

        return self.network.getConnectedNodes(nodeId);

    }

    self.dragConnectedNodes = function (nodeId, offset) {

        var connectedNodes = self.network.getConnectedNodes(nodeId);
        var connectedEdges = self.network.getConnectedEdges(nodeId);


        var positions = self.network.getPositions()
        var nodes = [];
        var edges = []
        for (var i = 0; i < connectedNodes.length; i++) {
            var connectedId = connectedNodes[i];

            if (true || toutlesensData && toutlesensData.queriesIds.indexOf(connectedId) < 0) {
                var node = self.nodesDS.get("" + connectedId);
                node.x = positions[connectedId].x + offset.x;
                node.y = positions[connectedId].y + offset.y;
                nodes.push(node);


            }
        }

        for (var i = 0; i < connectedEdges.length; i++) {
            var connectedEdgeId = connectedEdges[i];

            if (connectedEdgeId.indexOf("cluster") > -1)
                connectedEdgeId = connectedEdgeId.substring(8);
            var edge = self.edgesDS.get("" + connectedEdgeId);
            //  if(toutlesensData.queriesIds.indexOf(edge.from)<0) {
            edge.smooth = {
                type: 'continuous'
            };
            edges.push(edge)


            //}
        }

        selfedgesDS.update(edges);
        self.nodesDS.update(nodes);


    }

    self.showPreviousGraph = function () {
        if (self.graphHistory.currentIndex > 0)
            self.graphHistory.currentIndex -= 1;
        self.importGraph(self.graphHistory[self.graphHistory.currentIndex].graph);
        self.setPreviousNextButtons();
    }
    self.showNextGraph = function () {
        if (self.graphHistory.currentIndex < (self.graphHistory.length - 1))
            self.graphHistory.currentIndex += 1;
        self.importGraph(self.graphHistory[self.graphHistory.currentIndex].graph);
        self.setPreviousNextButtons();
    }

    self.setPreviousNextButtons = function () {
        if (self.graphHistory.currentIndex > 0)
            $("#previousGraphMenuButton").css("visibility", "visible")
        else
            $("#previousGraphMenuButton").css("visibility", "hidden")

        if (self.graphHistory.currentIndex < (self.graphHistory.length - 1))
            $("#nextGraphMenuButton").css("visibility", "visible")
        else
            $("#nextGraphMenuButton").css("visibility", "hidden")
    }

    self.toList = function () {
        var array = self.exportGraph().nodes;
        // console.log()
        var dataset = []


        var map = {};
        array.forEach(function (node) {
            map[node.id] = node;
        })
        array.forEach(function (node) {
            var obj = {

                label: node.labelNeo,
                name: node.label,

            }

            var str = "";
            var connectionsCountMap = {}
            node.connections.forEach(function (id, index) {

                if (index > 0)
                    str += ","
                str += (map[id].label || map[id].hiddenLabel) + "[" + map[id].labelNeo + "]"
                if (!connectionsCountMap[map[id].labelNeo])
                    connectionsCountMap[map[id].labelNeo] = 0;
                connectionsCountMap[map[id].labelNeo] += 1;
            })
            obj.connectedTo = str;
            for (var key in node.neoAttrs) {
                if (node.neoAttrs[key] != null)
                    obj[key] = node.neoAttrs[key]
            }
            obj.id = node.id,
                obj.connectionsCountMap = connectionsCountMap,

                dataset.push(obj);
        })
        return dataset;

    }

    self.filterGraph = function (booleanOption, label, property, operator, value) {
        //  self.saveGraph();
        var objectType = "node";

        if (objectType == "node") {


            var selectedNodes = [];
            var selectedEdges = [];
            var nodes = self.nodesDS.get();
            nodes.forEach(function (node) {
                var hidden = false;

                if (context.currentNode && context.currentNode.id && context.currentNode.id == node.id)
                    ;

                else if (booleanOption == "none") {
                    ;
                } else {

                    var nodeOk = visJsDataProcessor.isLabelNodeOk(node, label, property, operator, value);
                    if (booleanOption == "not")
                        hidden = nodeOk;
                    else
                        hidden = !nodeOk;
                }

                var color = node.initialColor;
                var vijsLabel = node.hiddenLabel;

                if (hidden) {
                    color = hexToRgba(node.initialColor, 0.1);
                    vijsLabel = null;
                }

                selectedNodes.push({id: "" + node.id, color: color, label: vijsLabel, ishidden: hidden});
                //  selectedNodes.push({id: "" + node.id, hidden: hidden});
                var connectedEdgesIds = self.network.getConnectedEdges(key);
                connectedEdgesIds.forEach(function (edgeId) {
                    var edgeColor = "#333"
                    if (hidden)
                        edgeColor = "#ddd"
                    else
                        edgeColor = "#ddd"

                    selectedEdges.push({id: "" + edgeId, color: edgeColor})
                    //   selectedEdges.push({id: "" + edgeId, hidden: hidden})
                })


            })
            self.nodesDS.update(selectedNodes);
            selfedgesDS.update(selectedEdges);
            // self.onScaleChange({force:true});
        } else if (objectType == "relation") {

            //    TO DO   !!!!
        }
    }


    self.setGraphOpacity = function (opacity, exceptNodes) {
        if (!exceptNodes)
            exceptNodes = [];

        var nodes2 = [];
        var edges2 = [];
        var nodes = self.nodesDS.get();
        nodes.forEach(function (node) {

            if (exceptNodes.indexOf("" + node.id) < 0) {

                var vijsLabel = node.hiddenLabel;
                var color = node.initialColor
                if (opacity < 1 && color) {
                    color = hexToRgba(color, opacity);

                }
                if (opacity < 0.5)
                    vijsLabel = null;
                nodes2.push({id: "" + node.id, color: color, label: vijsLabel});
            }
        })
        var edges = self.edgesDS.get();
        edges.forEach(function (edge) {
            var edgeColor = "#333"
            if (opacity < 1) {
                edgeColor = "#ddd"
            }
            edges2.push({id: "" + edge.id, color: edgeColor});
        })
        self.nodesDS.update(nodes2);
        selfedgesDS.update(edges2);

    }


    self.removeNode = function (id) {
        var connectedEdges = self.network.getConnectedEdges(id);
        for (var i = 0; i < connectedEdges.length; i++) {
            var connectedEdgeId = connectedEdges[i];
            self.edges.remove({id: connectedEdgeId})
        }

        self.nodes.remove({id: id})
    }

    self.updateNode = function (obj) {
        var node = self.nodesDS.get(obj.id);
        node.label = (obj[Schema.getNameProperty()])
        self.nodesDS.update(node);
    }

    self.addNode = function (node) {
        self.addNodes([node])
    }

    self.addNodes = function (nodes) {
        function exeAdd() {
            var visjsNodes = []
            nodes.forEach(function (node) {
                visjsNodes.push({
                        x: (node.x || -100),
                        y: (node.y || -100),
                        label: (node.label || ""),
                        color: context.nodeColors[node.labelNeo]
                    }
                )
                self.nodes.add(visjsNodes);
            })


        }

        if (self.nodes.length == 0) {
            //init empty Graph

            self.draw("graphDiv", {nodes: [], edges: []});
            $("#graphLayoutSelect").val("random");
            $("#graphPopup").html(toutlesensDialogsController.getNodeInfoButtons());
            setTimeout(exeAdd, 1000);
        } else
            exeAdd();


    }

    self.addRelation = function (edge) {
        if (self.nodes.length == 0) {
            //init empty Graph
            self.draw("graphDiv", {nodes: [], edges: []});
            $("#graphPopup").html(toutlesensDialogsController.getNodeInfoButtons());

        }
        self.edges.add(edge);
    }

    self.deleteRelation = function (edgeId) {
        self.edges.remove(edgeId);
    }

    self.clearGraph = function () {// comment ca marche  bad doc???
        if (self.network)
            self.network.destroy();
        $("#graph_legendDiv").html("");
        // DataSet.clear();
        // self.edges.clear();
    }


    self.dragRect = function (action, x, y) {// pas au point
        return;
        var ctx = self.context;
        if (action == "dragStart") {
            self.dragRect.x = x;
            self.dragRect.y = y;

        } else if (action.indexOf("drag") == 0) {
            self.dragRect.w = x - self.dragRect.x;
            self.dragRect.h = y - self.dragRect.y;
            self.dragRect.w = 200;
            self.dragRect.h = 300;


            if (action == "dragEnd") {
                var ctx = self.context;
                ctx.strokeStyle = '#A6D5F7';
                ctx.fillStyle = '#294475';
                ctx.rect(self.dragRect.x, self.dragRect.y, self.dragRect.w, self.dragRect.h);
                ctx.fill();
                ctx.stroke();

            }


        }
    }

    self.exportPng = function () {
        var canvasElement = self.network.canvas
        var canvasElement = document.getElementsByTagName("canvas")[0]
        //   var canvasElement = document.getElementById(id);

        var MIME_TYPE = "image/png";

        var imgURL = canvasElement.toDataURL(MIME_TYPE);

        var dlLink = document.createElement('a');
        dlLink.download = "graph";
        dlLink.href = imgURL;
        dlLink.dataset.downloadurl = [MIME_TYPE, dlLink.download, dlLink.href].join(':');

        document.body.appendChild(dlLink);
        dlLink.click();
        document.body.removeChild(dlLink);
    }

    self.showHideLabels = function () {

        var visible = self.labelsVisible;

        var nodes = [];
        var nodes = self.nodesDS.get();
        nodes.forEach(function (node) {


            if (visible == false) {
                nodes.push({id: node.id, label: node.hiddenLabel});
            } else {
                nodes.push({id: node.id, label: null});
            }
        })

        self.nodesDS.update(nodes);
        setTimeout(function () {
            self.labelsVisible = visible ? false : true;
        }, 100)


    }

    self.getNodeRelations = function (nodeId) {
        var relations = [];
        var connectedEdgesIds = self.network.getConnectedEdges(nodeId);
        connectedEdgesIds.forEach(function (edgeId) {
            var edges = self.edgesDS.get();
            edges.forEach(function (edge) {
                var obj = {
                    id: edge.id,
                    type: edge.type,
                    properties: edge.neoAttrs,
                }
                obj.from = self.nodesDS.get(edge.from);
                obj.to = self.nodesDS.get(edge.to);
                relations.push(obj)
            })
            return relations;
        })

    }
    return self;
})
()
