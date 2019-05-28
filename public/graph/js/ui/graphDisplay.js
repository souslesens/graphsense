var GraphDisplay = (function () {

    var self = {};


    /*self.applyDisplaySettings=function(){

       var size=parseInt( $("#graphDisplay_sizeInput").val());
        var shape= $("#graphDisplay_shapeSelect").val();
        var relationNames=$("#graphDisplay_relationsNamesCheck").val();
        var hideNodesWR=$("#graphDisplay_hideNodesWithNoRelationsCheck").val();


        Config.defaultNodeShape=shape;
        Config.defaultNodeSize=size;

        var nodes=visjsGraph.nodes._data;
        var newNodes=[];
        for(var id in nodes){
            newNodes.push({id:id,shape:shape,size:size});
        }
        visjsGraph.nodes.update(newNodes)


    }*/


    self.setGraphNodeShape = function (shape) {
        Config.defaultNodeShape = shape;

        var newNodes = [];
        for (var id in visjsGraph.nodes._data) {
            newNodes.push({id: id, shape: shape});
        }
        visjsGraph.nodes.update(newNodes)

    }
    self.setGraphNodeSize = function (size) {
        $("graphDisplay_sizeSliderInput").html(size);
        Config.defaultNodeSize = size;
        var size = parseInt(size);
        var newNodes = [];
        for (var id in visjsGraph.nodes._data) {
            newNodes.push({id: id, size: size});
        }
        visjsGraph.nodes.update(newNodes)

    }


    self.setGraphPhysicsOption = function (param, value) {
        $("#graphDisplay_" + param + "Input").html(value);
        visjsGraph.network.physics.options.barnesHut[param] = value;
        visjsGraph.network.startSimulation();

    }

    self.saveGraphSettings = function () {
        var settings = {}
        var array = $("#display_settingsForm input").each(function (aa, bb) {
            var name = $(this).attr("id");
            var value = $(this).val();
            settings[name] = value;

        });
        var array = $("#display_settingsForm select").each(function (aa, bb) {
            var name = $(this).attr("id");
            var value = $(this).val();
            settings[name] = value;

        });
        context.user.graphDisplaySettings = settings;


        UserController.saveUser();


    }

    self.setGraphSettings = function () {
      if(context.user && context.user.graphDisplaySettings) {
          for (var key in  context.user.graphDisplaySettings) {
              $("#"+key).val( context.user.graphDisplaySettings[key])
              $("#"+key+"Input").html( context.user.graphDisplaySettings[key])


          }

          Config.defaultNodeShape = context.user.graphDisplaySettings["graphDisplay_nodeShape"];
          Config.defaultNodeSize = context.user.graphDisplaySettings["graphDisplay_nodeSize"];
          Config.defaultEdgeType = context.user.graphDisplaySettings["graphDisplay_edgeType"];
      }



    }


    return self;


})()