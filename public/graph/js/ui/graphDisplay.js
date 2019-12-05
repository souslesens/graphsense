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
        visjsGraph.nodesDS.update(newNodes)


    }*/


    self.showDialog = function () {
        $("#displayModalContent").modal("show");
        GraphDisplay.setGraphSettings();
    }

    self.setGraphNodeShape = function (shape) {
        Config.defaultNodeShape = shape;

        var newNodes = [];
        for (var id in visjsGraph.nodes._data) {
            newNodes.push({id: id, shape: shape});
        }
        visjsGraph.nodesDS.update(newNodes)

    }
    self.setGraphNodeSize = function (size) {
        $("graphDisplay_sizeSliderInput").html(size);
        Config.defaultNodeSize = size;
        var size = parseInt(size);
        var newNodes = [];
        for (var id in visjsGraph.nodes._data) {
            newNodes.push({id: id, size: size});
        }
        visjsGraph.nodesDS.update(newNodes)

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

    self.resetDefaultValues = function () {
        $("#graphDisplay_nodeSize").val("8");
        $("#graphDisplay_nodeShape").val("dot");
        $("#graphDisplay_gravitationalConstant").val("-2000");
        $("#graphDisplay_centralGravity").val(".3");
        $("#graphDisplay_springLength").val("95");
        $("#graphDisplay_springConstant").val("0.04");
        $("#graphDisplay_damping").val("0.09");
        $("#graphDisplay_edgeType").val("Continuous");


        $("#graphDisplay_nodeSizeInput").html("8");
        $("#graphDisplay_gravitationalConstantInput").html("-2000");
        $("#graphDisplay_centralGravityInput").html(".3");
        $("#graphDisplay_springLengthInput").html("95");
        $("#graphDisplay_springConstantInput").html("0.04");
        $("#graphDisplay_dampingInput").html("0");

        self.saveGraphSettings();


    }

    self.setGraphSettings = function () {
        if (context.user && context.user.graphDisplaySettings) {
            for (var key in  context.user.graphDisplaySettings) {
                $("#" + key).val(context.user.graphDisplaySettings[key])
                $("#" + key + "Input").html(context.user.graphDisplaySettings[key])


            }

            Config.defaultNodeShape = context.user.graphDisplaySettings["graphDisplay_nodeShape"];
            Config.defaultNodeSize = context.user.graphDisplaySettings["graphDisplay_nodeSize"];
            Config.defaultEdgeType = "Continuous" //context.user.graphDisplaySettings["graphDisplay_edgeType"];
        }


    }

    self.showLabelsIconDialog = function () {

        var labels = Schema.getAllLabelNames();
        var savedLabels = context.user.graphDisplaySettings.labels;
        if (!savedLabels)
            savedLabels = {};
        var html = "<div style='overflow: auto;margin: 5px'><form id='graphDisplay_labelIconForm'>";
        labels.forEach(function (label) {
            var value = savedLabels[label];
            if (!value)
                value = "";

            html += "<div class='form-group row'>" +
                "  <label class='col-sm-4 col-form-label' for='graphDisplay_labelIcon#" + label + "'>" + label + "</label>" +

                "<div class='col-sm-15'><input class='form-control' id='graphDisplay_labelIcon#" + label + "' value=" + value + "></div></div>"
        })
        html += "</form></div>";

        MainController.openDialog(html, function () {
            var settings = {}
            $("#graphDisplay_labelIconForm input").each(function () {

                var name = $(this).attr("id");
                name = name.substring(name.indexOf("#") + 1)
                var value = $(this).val();
                if(value!="")
                settings[name] = value;
            })

            context.user.graphDisplaySettings.labels=settings;
            UserController.saveUser();
            MainController.closeDialog();

        })
    }


    return self;


})()
