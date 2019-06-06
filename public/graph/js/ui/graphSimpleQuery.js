var GraphSimpleQuery = (function () {
    var self = {};
    self.toLabelCardId = null;
    self.labelObjs = {};
    self.fromLabelCardId = null;
    self.filterDialogBinded = false;


    self.drawLabelsWithSwitch = function (labels) {

        var keys = Object.keys(labels.nodes);
        keys.sort();
        var html = "<div  id='simpleQuery_selectedLabels' style='background-color: #f4f0ec;display:flex;flex-direction: column; border:blue'></div>";
        html += "<div  style='background-color: #f4f0ec;display:flex;flex-direction: column'>";
        keys.forEach(function (key) {
            self.labelObjs[key] = labels.nodes[key];
            var label = key;
            var count = labels.nodes[key];
            var color = Config.visjs.defaultNodeColor;
            if (Schema.schema.labels[label])
                color = Schema.schema.labels[label].color;

            html += " <div class='col-md'  id='simpleQuery_labelDiv_" + label + "'  title='None' >" +
                "<div class='custom-control custom-switch' >" +
                "  <input type='checkbox' class='custom-control-input' name='simpleQuery_switch' id='simpleQuery_switch_" + label + "' onclick='GraphSimpleQuery.onSwitchLabelsChange(this)'>" +
                "  <label class=\"custom-control-label\" for='simpleQuery_switch_" + label + "'>" +
                "<span id='simpleQuery_labelOrder_" + label + "' style='color:blue;font-weight: normal;font-family: monospace;'></span>" +
                "<span  value='" + label + "' style='font-size:14px;font-weight:bold;color:black;background-color:" + "white" + "'><i></i>" + label + "</span>" +
                "<span  id='simpleQuery_countBadge_" + label + "' class='badge badge-pill badge-light' style='opacity:.4;background-color: " + color + "'>" + count + "</span>" +
                "<span id='simpleQuery_text'></span>" +
                "</label>"

            html += "</div></div>"

        })
        html += "</div>"


        $("#simpleQuery_wrapper").html(html);
        visjsGraph.legendLabels = [];
        $("#cardMenu").collapse('show');
    }

    self.onSwitchLabelsChange = function (input) {
        var inputId = $(input).attr("id");
        var label = inputId.substring(inputId.lastIndexOf("_") + 1);
        var previousLabel = self.currentLabel;
        self.currentLabel = label;
        context.queryObject = {label: label};

        $("#simpleQuery_erase").removeClass("d-none")
        var checked = $(input).prop("checked");
        if (checked) {
            // *****************gestion des labels associés****************************
            for (var key in Schema.schema.labels) {
                $("#simpleQuery_labelDiv_" + key).addClass("simpleQuery_notAllowedLabel")
            }
            var permittedLabels = Schema.getPermittedLabels(label, true, true);
            permittedLabels.push(label);
            permittedLabels = permittedLabels.concat(visjsGraph.legendLabels)
            permittedLabels.forEach(function (label2) {
                $("#simpleQuery_labelDiv_" + label2).removeClass("simpleQuery_notAllowedLabel");
            })
            var selectedLabels = Object.keys(context.cardsMap)
            common.fillSelectOptionsWithStringArray("query_relationFromLabelSelect", selectedLabels);
            $("#query_relationFromLabelSelect").val(previousLabel);


            //*********************ouverture dialogue filtres*******************
            var properties = Object.keys(Schema.schema.properties[label])
            common.fillSelectOptionsWithStringArray("query_propertySelect", properties, true);
            $("#query_propertySelect").val("name");
            $("#queryModalLabel").html("Query Label > " + label);
            $("#dbQueryFilterLabelModal").modal("show");
            $("#query_OrphanNodesSwitch").prop('checked', false);
            $("#query_valueInput").focus();
            if (!self.filterDialogBinded) {//($._data($("#query_validateQueryGraphButton")[0], "events")))
                self.filterDialogBinded = true;

                $("#query_validateQueryGraphButton").bind('click', function (target) {
                    self.onExecQueryButton("graph");
                })
                $("#query_validateQueryTableButton").bind('click', function (target) {
                    self.onExecQueryButton("dataTable");
                })
                $("#query_cancelQueryButton").bind('click', function (target) {
                    self.onCancelTreeQueryButton();
                })
            }
        }
        else {//unchecked


            delete context.cardsMap[self.currentLabel];
            delete context.cardsMap["*"];
            //***********suppression des noeuds ert relations du graphe correspondant au label unchecked
            var nodes = [];
            var nodeIds = [];
            for (var key in visjsGraph.nodes._data) {
                var node = visjsGraph.nodes._data[key];
                if (node.labelNeo == self.currentLabel) {
                    nodeIds.push(node.id)
                    nodes.push({id: node.id, hidden: true})
                }
            }
            visjsGraph.nodes.remove(nodeIds);
            var edges = [];
            for (var key in visjsGraph.edges._data) {

                var edge = visjsGraph.edges._data[key];
                if (nodeIds.indexOf(edge.from) > -1 || nodeIds.indexOf(edge.to) > -1) {
                    //edges.push({id:edge.id,hidden:true})
                    edges.push(edge.id)
                }
            }
            visjsGraph.edges.remove(edges);
            visjsGraph.legendLabels.splice(visjsGraph.legendLabels.indexOf(label), 1);
            //***********fin suppression des noeuds ert relations du graphe correspondant au label unchecked


            visjsGraph.drawLegend2(visjsGraph.legendLabels)

            if (visjsGraph.legendLabels.length == 0)
                $("#simpleQuery_erase").addClass("d-none")

            var oldCount = self.labelObjs[label];
            $("#simpleQuery_countBadge_" + label).html(oldCount);
            $("#simpleQuery_countBadge_" + label).css("opacity", 1.0)
            $("#simpleQuery_labelDiv_" + label).prop("title", "")


        }


    }


    self.clear = function () {
        UI_query.newQuery();
        $("#simpleQuery_wrapper").html("");
        UI_query.initQueryLabels();
        $("#graphDiv").html("");
        $("#simpleQuery_erase").addClass("d-none")
        visjsGraph.legendLabels = [];
        self.fromLabelCardId = null;
        self.currentLabel = null;

    }


    self.onLabelSelect = function (obj) {
        $("#simpleQuery_erase").removeClass("d-none")
        var label = obj.node.id;
        var previousLabel = self.currentLabel;
        self.currentLabel = label;

        /***************************gestion des labels autorisés*******************************/

        var permittedLabels = Schema.getPermittedLabels(label, true, true);
        permittedLabels.push(label);
        permittedLabels = permittedLabels.concat(visjsGraph.legendLabels)
        permittedLabels.forEach(function (label2) {

            $("#simpleQuery_labelDiv_" + label2).addClass("simpleQuery_allowedLabel");


        })


        /*************************preparation du dialogue de filtre**************************/
        var selectedLabels = Object.keys(context.cardsMap)
        common.fillSelectOptionsWithStringArray("query_relationFromLabelSelect", selectedLabels);
        $("#query_relationFromLabelSelect").val(previousLabel);
        var properties = Object.keys(Schema.schema.properties[label])
        common.fillSelectOptionsWithStringArray("query_propertySelect", properties, true);
        $("#query_propertySelect").val("name");
        $("#queryModalLabel").html("Query Label > " + label);


        if (!($._data($("#query_validateQueryGraphButton")[0], "events"))) {


            $("#query_validateQueryGraphButton").bind('click', function (target) {

                self.onExecQueryButton("graph");

            })
            $("#query_validateQueryTableButton").bind('click', function (target) {
                self.onExecQueryButton("dataTable");

            })
            $("#query_cancelTreeQueryButton").bind('click', function (target) {
                $("#simpleQuery_switch_" + label).prop("checked", false);

            })
        }
       // $("#dbQueryFilterLabelModal").modal("show");



    }

    self.onExecQueryButton = function (type) {

        var addToGraph;
        var queryObject = UI_query.setContextQueryObjectParams();
        var label = self.currentLabel;
        queryObject.label = label;


        $("#dbQueryFilterLabelModal").modal("hide");
        var fromLabel = $("#query_relationFromLabelSelect").val();


        // premier label du graphe (debut ou apres clear)
        if (type!="graph" || visjsGraph.legendLabels.length == 0 ) {
            addToGraph = false;
            context.cardsMap[label] = queryObject;
        }

        else {
            // requete sur les ids existants du graphe sans label dans la requete et  avec les filtres du dialogue (si existent)
            addToGraph = true;
            context.cardsMap = {};
            context.cardsMap[label] = queryObject;
            var idsQueryObject = {}
            idsQueryObject.label = null;//tous les labels
            idsQueryObject.type = "nodeSet" + label;
            idsQueryObject.nodeSetIds = Object.keys(visjsGraph.nodes._data);
            idsQueryObject.inResult = true;
            idsQueryObject.origin = "simpleQueryTree";

            context.cardsMap["*"] = idsQueryObject;


        }

        function afterQuery(data) {
            var oldCount = self.labelObjs[label];
            var newCount = "" + data.nodes.length + " / " + oldCount;
            $("#simpleQuery_countBadge_" + label).html(newCount);
            $("#simpleQuery_countBadge_" + label).css("opacity", 1.0)
            $("#simpleQuery_labelDiv_" + label).prop("title", queryObject.text);


            $("#navbar_graph_Graph_ul").removeClass("d-none");
            $("#simpleQuery_erase").removeClass("d-none")

            delete context.cardsMap[self.currentLabel];
            delete context.cardsMap["*"];

        }



        var options = {
            addToGraph: addToGraph,
        }
        var withOrphans = $("#query_OrphanNodesSwitch").prop("checked");

        buildPaths.executeQuery(type, options, function (err, result) {
            if (err)
                return console.log(err);

            if (result.data.nodes.length == 0 || withOrphans) {
                delete  context.cardsMap["*"];

                buildPaths.executeQuery(type, options, function (err, result) {
                    afterQuery(result.data)
                })
                return;
            }
            else{

                afterQuery(result.data)
            }





        })


    }

    self.onCancelTreeQueryButton = function () {
        $("#simpleQuery_switch_" + self.currentLabel).prop("checked", false);
        delete context.cardsMap(self.currentLabel);

    }


    return self;

})
()