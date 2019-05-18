var GraphController = (function () {

        var self = {};
        self.containerDims = {w: 0, h: 0, x: 0, y: 0};
        self.schemaCurrentNode;
        self.schemaPreviousNode;


        self.initComponentsPositionAndSize = function (containerId) {
            $("#content").height($(window).height())
            self.containerDims.w = $("#" + containerId).width();
            self.containerDims.h = $("#" + containerId).height() - $(".navbar").height() - 150;
            self.containerDims.x = $("#" + containerId).position().left;
            self.containerDims.y = $("#" + containerId).position().top;
            $("#graphDiv").width(self.containerDims.w - 2);
            $("#graphDiv").height(self.containerDims.h + 30);


            $("#graph_legendDiv").width(120).css("position", "absolute").css("top", $(".navbar").height() + (self.containerDims.h)).css("left", +(self.containerDims.w - 150));//"background", "none");
            $("#graph_infosDiv").width(400).height(40).css("position", "absolute").css("left", self.containerDims.x + 10).css("top", $(".navbar").height() + 100).css("background-color", "#eee");
            $("#GraphHighlight_legendDiv").css("position", "absolute").css("top", 0).css("left", self.containerDims.x + 10).css("top", 80).css("background-color", "#eee");
            $("#graph_infosDiv").css("visibility", "hidden")
        }


        self.showPopoverAtPosition = function (popoverDiv, point) {
            var offset = $("#graphDiv").position()
            var sidebarWidth = $("#sidebar").width()
            $("#" + popoverDiv).css("top", offset.top + point.y).css("left", offset.left + sidebarWidth + point.x);
            $("#" + popoverDiv).removeClass("d-none")
        }

        self.onNodeClicked = function (node, point, options) {
            if (options && options.ctrlKey) {
                $("#popover-shortestPathLi").removeClass("d-none")
            }

            if (node.type == "schema") {

                self.schemaCurrentNode = node;
                self.showPopoverAtPosition("GraphSchemaPopoverDiv", point);

            }
            else {

                self.showPopoverAtPosition("GraphNodePopoverDiv", point);
                var permittedLabels = Schema.getPermittedLabels(node.labelNeo, true, true);
                common.fillSelectOptionsWithStringArray("graph_expandNodeLabelSelect", permittedLabels, true);

                $("#popover-node-name").html(node.neoAttrs.name)
                $("#GraphNodePopoverDiv").removeClass("d-none");
            }

        }

        self.onEdgeClicked = function (edge, point) {
            $("#relation_popover-relType").html("Type : " + edge.type);
            $("#relation_popover-from").html("From :" + edge.fromNode.neoAttrs.name);
            $("#relation_popover-to").html("To :" + edge.toNode.neoAttrs.name);

            self.showPopoverAtPosition("GraphRelationPopoverDiv", point);

        }


        self.showShortestPaths = function () {
            $("#popover-shortestPathLi").addClass("d-none")
            var length = visjsGraph.lastClikedNodeIds.length;
            if (length > 1) {
                var id1 = visjsGraph.lastClikedNodeIds[length - 2];
                var id2 = visjsGraph.lastClikedNodeIds[length - 1];
                GraphExpand.expandFromTwoNodesShortestPath(id1, id2);
                $("#GraphNodePopoverDiv").addClass("d-none");
                self.hideNodePopover();
            }
        }

        self.showNodeInfos = function () {
            self.hideNodePopover();

            $("#GraphNodeInfoWrapperDiv").modal('show');
            $('[href="#graphNodeInfos_tabs_Details"]').tab('show');
            nodeInfosController.setNodeInfoModalDiv(visjsGraph.context.currentNode.id);
        }
        self.startFromNode = function () {
            self.hideNodePopover();
            buildPaths.graphFromUniqueNode(visjsGraph.context.currentNode.id)


        }

        self.showExpandNodeOptionsPopover = function () {

            $("#graph_expandNodeOptionsDiv").popover('show')
        }

        self.expandNode = function (label) {
            self.hideNodePopover();
            GraphExpand.expandFromNode(visjsGraph.context.currentNode, label)


        }

        self.expandGraph = function () {


        }


        self.hideNode = function () {
            self.hideNodePopover();
            var id = visjsGraph.context.currentNode.id;
            if (id) {
                visjsGraph.removeNode(id);
            }
        }

        self.hideNodePopover = function () {
            $("#GraphNodePopoverDiv").addClass("d-none")
            $("#GraphRelationPopoverDiv").addClass("d-none")
            $("#GraphSchemaPopoverDiv").addClass("d-none")
        }

        self.setGraphMessage = function () {


        }

        self.onError = function () {


        }
        self.setEdgeColors = function (relTypes) {
            context.edgeColors = {}
            relTypes.forEach(function (type, index) {
                context.edgeColors[type] = Config.relationPalette[(index % (Config.relationPalette.length - 1))]

            })
        }



        self.resetGraphSchema=function(){
            self.schemaPreviousNode={};
            self.schemaCurrentNode={};
        }

        self.schemaSelectAllNodes = function () {
            self.hideNodePopover();
            if (!self.schemaPreviousNode.label) {
                context.queryObject = {
                    label: self.schemaCurrentNode.label,
                    text: "all",
                    inResult: true,
                }
                self.schemaPreviousNode= context.queryObject
                var text = context.queryObject.label + ":" + context.queryObject.text

                var obj = {id: self.schemaCurrentNode.id, label: text, borderWidth: 3, color: "white", font: {color: context.nodeColors[context.queryObject.label]}}
                visjsGraph.nodes.update(obj);
            }
            else {//calcul des chemins

                        Schema.getPathsBetweenLabels(self.schemaPreviousNode.label,self.schemaCurrentNode.label ,function (err, result){

                    if (err)
                        return console.log(err)
                    var labelsRels={}
                    result.forEach(function (line) {
                        line.nodes.forEach(function (node, index) {
                            labelsRels[node._id]=node.properties.name;
                            if (index > 0) {
                                var cardId = Math.round(Math.random() * 10000);
                                var queryObject = {
                                    label: node.properties.name,
                                    text: "all",
                                    inResult: false,
                                    cardId: cardId
                                }
                                context.cardsMap[cardId] = queryObject;


                                var nodeId = "schemaLabel_" + queryObject.label;
                                var obj = {id: nodeId , borderWidth: 3, color: "white", font: {color: context.nodeColors[queryObject.label]}}
                                visjsGraph.nodes.update(obj);


                            }

                        })
                        line.relations.forEach(function (relation, index) {


                            var relId = "schemaRelation_" + labelsRels[relation._fromId] + "_" + labelsRels[relation._toId];
                            var obj = {id: relId, color: "white", width: 4}
                            visjsGraph.edges.update(obj);

                            var relId = "schemaRelation_" + labelsRels[relation._toId] + "_" + labelsRels[relation._fromId];
                            var obj = {id: relId, color: "white", width: 4}
                            visjsGraph.edges.update(obj);
                        })

                    })
                })
            }


        }


        self.schemaSelectSomeNodes = function () {

            UI_query.showQueryCardParamsDialog(self.schemaCurrentNode.label);
            $("#dbQueryFilterLabelModal").modal("show");

        }




        return self;


    }
)
()