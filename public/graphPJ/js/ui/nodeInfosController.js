var nodeInfosController = (function () {

    var self = {};

    self.currentNodeId;


    self.setNodeInfoModalDiv = function (nodeId) {

        self.currentNodeId = nodeId;


        var cypher = "match(n)-[r]-(m) where id(n)=" + nodeId + " return n,r,m"
        Cypher.executeCypher(cypher, function (err, result) {
            if (err)
                return console.log(err);

            var nodeTitle="[" + result[0].n.labels[0] + "]" + result[0].n.properties[Schema.getNameProperty()]
            $("#graphNodeInfos_title").html(nodeTitle);

            var html = Layouts.formatNodeDetailsInfo(result[0].n.properties)
            $("#graphNodeInfos_DetailsDiv").html(html)

            var html = Layouts.formatNodeRelationsInfo(result);
            $("#graphNodeInfos_RelationsDiv").html(html)

            var options = {
                onNodeClick: "nodeInfosController.onNodeInfosNeighbourClick"
            }
            var html = Layouts.formatNodeNeighboursInfo(result, options)
            $("#graphNodeInfos_NeighboursDiv").html(html)
        })


    }

    self.onNodeInfosNeighbourClick = function (nodeId) {
        self.currentNodeId = nodeId;
        $("#nodeInfosPopoverWrapperDiv").css("top", context.mousePosition.y).css("left", context.mousePosition.x);
        $("#nodeInfosPopoverWrapperDiv").removeClass("d-none")
    }

    self.showNodeInfos = function (id) {
        $("#nodeInfosPopoverWrapperDiv").addClass("d-none")
        self.setNodeInfoModalDiv ( self.currentNodeId);


    }

    self.startFromNode = function () {
        $("#nodeInfosPopoverWrapperDiv").addClass("d-none")
        visjsGraph.context.currentNode.id=self.currentNodeId;
        GraphController.startFromNode();

    }

    self.showOnGraph = function () {
        $("#nodeInfosPopoverWrapperDiv").addClass("d-none");
        visjsGraph.setGraphOpacity(0.3,[self.currentNodeId]);

    }


    return self;
})()