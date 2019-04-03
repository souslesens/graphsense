var
    GraphController = (function () {

        var self = {};
       self.containerDims={w:0,h:0,x:0,y:0}



self.initComponentsPositionAndSize=function(containerId){
    self.containerDims.w=$("#"+containerId).width();
    self.containerDims.h=$("#"+containerId).height()-$(".navbar").height() ;
    self.containerDims.x=$("#"+containerId).position("left") ;
    self.containerDims.y=$("#"+containerId).position("top") ;
    $("#graphDiv").width(self.containerDims.w-20);
    $("#graphDiv").height(self.containerDims.h);



        $("#graph_legendDiv").width(120).height(200).css("position", "absolute").css("top", self.containerDims.h-200).css("left", 5).css("background", "none");
        $("#graph_infosDiv").width(400).height(40).css("position", "absolute").css("left",self.containerDims.x+10).css("top",self.containerDims.y+10).css("background-color", "#eee");
        $("#GraphHighlight_legendDiv").css("position", "absolute").css("top", 0).css("left", self.containerDims.x+10).css("top", 80).css("background-color", "#eee");
        $("#graph_infosDiv").css("visibility", "hidden")
}



        self.onNodeClicked = function (node, point) {


            var permittedLabels=Schema.getPermittedLabels(node.labelNeo, true, true);
            common.fillSelectOptionsWithStringArray("graph_expandNodeLabelSelect",permittedLabels,true);
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

        self.showExpandNodeOptionsPopover=function(){

       $("#graph_expandNodeOptionsDiv") .popover('show')
        }

        self.expandNode = function (label) {
            self.hideNodePopover();
            GraphExpand.expandFromNode(visjsGraph.context.currentNode,label)


        }

        self.expandGraph=function(){


        }



        self.hideNode = function () {
            self.hideNodePopover();
            var id=visjsGraph.context.currentNode.id;
            if (id) {
                visjsGraph.removeNode(id);
            }
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