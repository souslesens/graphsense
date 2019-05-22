var GraphSimpleQuery = (function () {
    var self = {};
    self.fromLabelCardId = null;
    self.toLabelCardId = null;
    self.labelIndex = -1;
    self.labelObjs = {};
    self.fromLabelCardId = null;
    self.filterDialogBinded = false;




    self.onSwitchLabelsChange = function (input) {


        var inputId = $(input).attr("id");
        var label = inputId.substring(inputId.lastIndexOf("_") + 1);
        var previousLabel = self.currentLabel;
        self.currentLabel = label;
        context.queryObject = {label: label};


        var checked = $(input).prop("checked");
        if (checked) {

            /*    for (var key in context.cardsMap) {
                    if (key != self.fromLabelCardId)
                        delete context.cardsMap[key];
                    $("#simpleQuery_labelOrder_" + key).html("");
                }*/
            // gestion des lables associés
            for (var key in Schema.schema.labels) {
                $("#simpleQuery_labelDiv_" + key).addClass("simpleQuery_notAllowedLabel")
            }

            var permittedLabels = Schema.getPermittedLabels(label, true, true);
            permittedLabels.push(label);
            permittedLabels = permittedLabels.concat(visjsGraph.legendLabels)
            permittedLabels.forEach(function (label2) {
                //  if (Object.keys(context.cardsMap).indexOf(label2) >-1)
                $("#simpleQuery_labelDiv_" + label2).removeClass("simpleQuery_notAllowedLabel");


            })


            var selectedLabels = Object.keys(context.cardsMap)
            common.fillSelectOptionsWithStringArray("query_relationFromLabelSelect", selectedLabels);
            $("#query_relationFromLabelSelect").val(previousLabel);


            var properties = Object.keys(Schema.schema.properties[label])
            common.fillSelectOptionsWithStringArray("query_propertySelect", properties, true);
            $("#query_propertySelect").val("name");
            $("#queryModalLabel").html("Query Label > " + label);

            $("#dbQueryFilterLabelModal").modal("show");


            if (!self.filterDialogBinded) {//($._data($("#query_validateQueryGraphButton")[0], "events")))
                self.filterDialogBinded = true;

                $("#query_validateQueryGraphButton").bind('click', function (target) {

                    // self.onExecQueryButton("graph");
                    self.onExecTreeQueryButton("graph");


                })
                $("#query_validateQueryTableButton").bind('click', function (target) {
                    self.onExecQueryButton("table");


                })
                $("#query_cancelQueryButton").bind('click', function (target) {

                    self.onCancelTreeQueryButton();

                })
            }
        }
        else {//unchecked


            delete context.cardsMap[self.currentLabel];
            delete context.cardsMap["*"];
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
            visjsGraph.drawLegend2(visjsGraph.legendLabels)
            if(visjsGraph.legendLabels.length==0)
                $("#simpleQuery_erase").addClass("d-none")
            var oldCount = self.labelObjs[label];


            $("#simpleQuery_countBadge_" + label).html(oldCount);
            $("#simpleQuery_countBadge_" + label).css("opacity", 1.0)
            $("#simpleQuery_labelDiv_" + label).prop("title", "")





        }


    }


    self.drawLabelsWithSwitch = function (labels) {
        //  return self.drawLabelsInJstree(labels)
        var keys = Object.keys(labels.nodes);
        keys.sort();
        var html = "<div  id='simpleQuery_selectedLabels' style='background-color: #f4f0ec;display:flex;flex-direction: column; border:blue'></div>";
        html += "<div  style='background-color: #f4f0ec;display:flex;flex-direction: column'>";
        keys.forEach(function (key) {
            self.labelObjs[key] = labels.nodes[key];
            var label = key;
            var count = labels.nodes[key];
            var color = Config.visjs.defaultNodeColor;
            //  color = hexToRgba(node.initialColor, 0.4);
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

        //  $("#dbFilterLabelButtonGroup").html(html);

        $("#simpleQuery_wrapper").html(html);
        visjsGraph.legendLabels = [];
        $("#cardMenu").collapse('show')


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

        var label = obj.node.id;
        var previousLabel = self.currentLabel;
        self.currentLabel = label;

        /***************************gestion des labels autorisés*******************************/
        /*  for (var key in Schema.schema.labels) {
              $("#simpleQuery_labelDiv_" + key).addClass("simpleQuery_notAllowedLabel")
          }*/

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

                self.onExecTreeQueryButton("graph");

            })
            $("#query_validateQueryTableButton").bind('click', function (target) {
                self.onExecTreeQueryButton("table");

            })
            $("#query_cancelTreeQueryButton").bind('click', function (target) {
                $("#simpleQuery_switch_" + label).prop("checked", false);

            })
        }
        $("#dbQueryFilterLabelModal").modal("show");


    }

    self.onExecTreeQueryButton = function (type) {

        var label = self.currentLabel;

        function execQuery(label, addToGraph, callback) {
            var options = {
                addToGraph: addToGraph,
            }
            buildPaths.executeQuery(type, options, callback);
        }


        for (var key in context.cardsMap) {
            context.cardsMap[key].skip = false;
        }


        var queryObject = UI_query.setContextQueryObjectParams();
        queryObject.label = label;


        $("#dbQueryFilterLabelModal").modal("hide");
        var fromLabel = $("#query_relationFromLabelSelect").val();

        var addToGraph = false;


        if (visjsGraph.legendLabels.length == 0) {

            self.labelIndex = 1
            queryObject.index = 1;
            var cardId = label;
            context.cardsMap[cardId] = queryObject;

        }

        else {
            context.cardsMap = {};

            context.cardsMap[label] = queryObject;
            var idsQueryObject = {}
            idsQueryObject.label = null;

            idsQueryObject.type = "nodeSet" + key;

            idsQueryObject.nodeSetIds = Object.keys(visjsGraph.nodes._data);
            idsQueryObject.inResult = true;
            idsQueryObject.origin = "simpleQueryTree";


            context.cardsMap["*"] = idsQueryObject;
            addToGraph = true;


        }


        execQuery(label, addToGraph, function (err, result) {
            if (err)
                return console.log(err);




            if (result.data.nodes.length == 0) {

                delete context.cardsMap[self.currentLabel];
                delete context.cardsMap["*"];
                return;


            }


            function setCountBadge(data) {
                var oldCount = self.labelObjs[label];
                var newCount = "" + data.nodes.length + " / " + oldCount;

                $("#simpleQuery_countBadge_" + label).html(newCount);
                $("#simpleQuery_countBadge_" + label).css("opacity", 1.0)
                $("#simpleQuery_labelDiv_" + label).prop("title", queryObject.text)

            }

            $("#navbar_graph_Graph_ul").removeClass("d-none");
            $("#simpleQuery_erase").removeClass("d-none")
            var withOrphans = $("#query_OrphanNodesSwitch").prop("checked");
            if (withOrphans && context.cardsMap["*"]) {
                delete  context.cardsMap["*"];

                execQuery(label, addToGraph, function (err, result) {
                    setCountBadge(result.data)
                })
            }
            else
                setCountBadge(result.data)

        })


    }

    self.onCancelTreeQueryButton = function () {
        $("#simpleQuery_switch_" + self.currentLabel).prop("checked", false);
        delete context.cardsMap(self.currentLabel);

    }


    return self;

})
()