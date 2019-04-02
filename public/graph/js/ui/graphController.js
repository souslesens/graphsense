var
    GraphController = (function () {

        var self = {};


        self.onNodeClicked = function (node, point) {

            var offset = $("#graphDiv").position()
            var sidebarWidth = $("#sidebar").width()
            $("#GraphNodePopoverDiv").css("top", offset.top + point.y).css("left", offset.left + sidebarWidth + point.x);
            $("#GraphNodePopoverDiv").removeClass("d-none")
        }

        self.onEdgeClicked = function (node, point) {

        }


        self.showNodeInfos = function () {
            self.hideNodePopover();
            var html = Layouts.formatNodeInfo(visjsGraph.context.currentNode.neoAttrs)
            $("#graph_nodeInfosDiv").removeClass("d-none")
            $("#graph_nodeInfosDiv").html(html)

        }
        self.startFromNode = function () {
            self.hideNodePopover();
            buildPaths.graphFromUniqueNode( visjsGraph.context.currentNode.id)


        }


        self.expandNode = function () {
            self.hideNodePopover();
            GraphExpand.expandFromNode(visjsGraph.context.currentNode)


        }
        self.hideNode = function () {
            self.hideNodePopover();
        }

        self.hideNodePopover = function () {
            $("#GraphNodePopoverDiv").addClass("d-none")
            $("#graph_nodeInfosDiv").addClass("d-none")
        }

        self.setGraphMessage = function () {


        }

        self.onError = function () {


        }
        self.setEdgeColors=function(relTypes){
            context.edgeColors={}
            relTypes.forEach(function(type,index){
                context.edgeColors[type]= Config.relationPalette[(index% (Config.relationPalette.length-1))]

            })
        }


        return self;


    })()