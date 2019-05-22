var GraphSimpleQuery = (function () {
    var self = {};
    self.fromLabelCardId = null;
    self.toLabelCardId = null;
    self.labelIndex = -1;
    self.labelObjs = {};
    self.fromLabelCardId = null;

    self.showDialog = function () {


        var labels = Schema.getAllLabelNames()
        common.fillSelectOptionsWithStringArray("simpleQuery_fromLabelSelect", labels, true);
        common.fillSelectOptionsWithStringArray("simpleQuery_toLabelSelect", labels, true);

        $("#SimpleQueryModalMenu").modal("show");

    }


    self.onFromLabel = function (fromLabel) {
        if (!fromLabel)
            fromLabel = $("#simpleQuery_fromLabelSelect").val();
        var cardId = Math.round(Math.random() * 10000);
        var queryObject = {
            label: fromLabel,
            text: "all",
            inResult: true,
            cardId: cardId
        }
        context.cardsMap[cardId] = queryObject;
        self.fromLabelCardId = cardId;

    }

    self.onToLabel = function (toLabel) {
        if (!fromLabel)
            var fromLabel = context.cardsMap[self.fromLabelCardId].label
        var toLabel = $("#simpleQuery_toLabelSelect").val();

        Schema.getPathsBetweenLabels(fromLabel, toLabel, function (err, result) {

            if (err)
                return console.log(err)
            var labelsRels = {}
            result.forEach(function (line) {
                line.nodes.forEach(function (node, index) {
                    labelsRels[node._id] = node.properties.name;
                    if (index > 0) {
                        var cardId = Math.round(Math.random() * 10000);
                        var queryObject = {
                            label: node.properties.name,
                            text: "all",
                            inResult: false,
                            cardId: cardId
                        }
                        if (index == line.nodes.length - 1) {
                            queryObject.inResult = true;
                            self.toLabelCardId = cardId;
                        }
                        context.cardsMap[cardId] = queryObject;


                    }


                })
                line.relations.forEach(function (relation, index) {

                })

            })
        })
    }


    self.onSwitchLabelsChange = function (input) {


        var inputId = $(input).attr("id");
        var label = inputId.substring(inputId.lastIndexOf("_") + 1);
        var previousLabel = self.currentLabel;
        self.currentLabel = label;


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


            if (($._data($("#query_validateQueryGraphButton")[0], "events")))
                return


            $("#query_validateQueryGraphButton").bind('click', function (target) {

                self.onExecQueryButton("graph");

            })
            $("#query_validateQueryTableButton").bind('click', function (target) {
                self.onExecQueryButton("table");

            })
            $("#query_cancelQueryButton").bind('click', function (target) {
                $("#simpleQuery_switch_" + label).prop("checked", false);

            })
        }
        else {//unchecked

            //on enlève toutes les cards dont l'index est >= à l'index de la   carte unchecked
            var cardIndex = context.cardsMap[label].index;

            for (var key in context.cardsMap) {
                if (context.cardsMap[key].index >= cardIndex) {

                    var count = self.labelObjs[key];
                    $("#simpleQuery_countBadge_" + key).html(count);
                    $("#simpleQuery_countBadge_" + key).css("opacity", 0.3)
                    $("#simpleQuery_labelDiv_" + key).prop("title", "All")
                    $("#simpleQuery_switch_" + key).prop("checked", false);

                    delete context.cardsMap[key];


                }
            }
            //   if(Object.keys(context.cardsMap).length==0)
            $("#graphDiv").html("");


        }


    }


    self.onExecQueryButton = function (type) {
        var label = self.currentLabel;


        function execQuery(label) {

            var withOrphanNodes=$("#query_OrphanNodesSwitch").prop("checked");
            var addToGraph =false ;

            if (Object.keys(context.cardsMap).length >0)
                addToGraph = true;
            var options = {
                addToGraph: addToGraph
            }


            buildPaths.executeQuery(type, options, function (err, result) {

                var oldCount = self.labelObjs[label];
                var newCount = "" + result.data.nodes.length + " / " + oldCount;

                $("#simpleQuery_countBadge_" + label).html(newCount);
                $("#simpleQuery_countBadge_" + label).css("opacity", 1.0)
                $("#simpleQuery_labelDiv_" + label).prop("title", queryObject.text)


                $("#navbar_graph_Graph_ul").removeClass("d-none");

            })
        }

        for (var key in context.cardsMap) {
            context.cardsMap[key].skip = false;
        }


        var queryObject = UI_query.setContextQueryObjectParams();
        queryObject.label = label;


        $("#dbQueryFilterLabelModal").modal("hide");
        var fromLabel = $("#query_relationFromLabelSelect").val();


        if (Object.keys(context.cardsMap).length == 0) {
            self.labelIndex = 1
            queryObject.index = 1;
            var cardId = label;
            context.cardsMap[cardId] = queryObject;

            $("#simpleQuery_labelOrder_" + label).html("o");

            $("#simpleQuery_labelDiv_" + label).css("order","1");
            var html=$("#simpleQuery_labelDiv_" + label).detach();
            $("#simpleQuery_selectedLabels").prepend(html)

            execQuery(label);
        }

        else {


            var fromLabel = $("#query_relationFromLabelSelect").val();


            var shiftFrom = $("#simpleQuery_labelOrder_" + fromLabel).html();
            var shiftTo = $("#simpleQuery_labelOrder_" + label).html();
            if (shiftFrom.length == 0) {
                shiftFrom = shiftFrom + "-|";
                $("#simpleQuery_labelOrder_" + fromLabel).html(shiftFrom);

            }

            for (var i = 0; i < shiftFrom.length; i++) {
                shiftTo += "-";
            }

            $("#simpleQuery_labelOrder_" + label).html( "|"+shiftTo);
            var html=$("#simpleQuery_labelDiv_" + label).detach();
            $("#simpleQuery_labelDiv_" + fromLabel).after(html)

            // var fromLabel = context.cardsMap[self.fromLabelCardId].label
            Schema.getPathsBetweenLabels(fromLabel, label, function (err, result) {
                if (err)
                    return console.log(err)
                var labelsRels = {}
                result.forEach(function (line) {
                    line.nodes.forEach(function (node, index) {
                        var label = node.properties.name;

                        labelsRels[node._id] = label;
                        if (index > 0) {
                            // var cardId = Math.round(Math.random() * 10000);
                            var cardId = label;
                            var queryObject = UI_query.setContextQueryObjectParams();
                            queryObject.label = label;
                            if (index == line.nodes.length - 1) {
                                queryObject.inResult = true;
                                self.toLabelCardId = cardId;
                            }
                            else {
                                queryObject.inResult = true;
                            }
                            self.labelIndex += 1;
                            queryObject.index = self.labelIndex;
                            context.cardsMap[cardId] = queryObject;


                            $("#simpleQuery_switch_" + label).prop("checked", true);


                        }


                    })
                })

                // si on ne choisit pas la derniere carte comme carte de  depart on skip les autre cartes avnt la requete
                if (self.fromLabelCardId && fromLabel != self.fromLabelCardId) {
                    for (var key in context.cardsMap) {
                        if (key != fromLabel && key != label)
                            context.cardsMap[key].skip = true;

                    }

                }
                execQuery(label);


            })

        }
        self.fromLabelCardId = label;
    }


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
            //  color = hexToRgba(node.initialColor, 0.4);
            if (Schema.schema.labels[label])
                color = Schema.schema.labels[label].color;

            html += " <div class='col-md'  id='simpleQuery_labelDiv_" + label + "' >" +
                "<div class='custom-control custom-switch' data-toggle='tooltip' data-placement='top' title='All'>" +
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
        $("#cardMenu").collapse('show')

        simpleQuery_shift
    }


    self.clear = function () {
        UI_query.newQuery();
        $("#simpleQuery_wrapper").html("");
        UI_query.initQueryLabels();
        $("#graphDiv").html("");
        self.fromLabelCardId = null;

    }


    self.setFromFilter = function () {
        var fromLabel = $("#simpleQuery_fromLabelSelect").val();
        var properties = Object.keys(Schema.schema.properties[fromLabel])
        common.fillSelectOptionsWithStringArray("query_propertySelect", properties, true);
        $("#dbQueryFilterLabelModal").modal("show");
        $("#query_validateQueryButton").off();

        $("#query_validateQueryButton").on("click", function () {
            var queryObj = UI_query.setContextQueryObjectParams;
            queryObj.cardId = self.fromLabelCardId;
            context.cardsMap[self.fromLabelCardId] = queryObj;
        }, 2000)


    }

    self.setToFilter = function () {

    }


    return self;

})
()