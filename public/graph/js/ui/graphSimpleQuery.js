var GraphSimpleQuery = (function () {
    var self = {};
    self.fromLabelCardId = null;
    self.toLabelCardId = null;

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


        var checked = $(input).prop("checked");
        if (checked) {


            for (var key in context.cardsMap) {
                if (key != self.fromLabelCardId)
                    delete context.cardsMap[key];
                $("#simpleQuery_labelOrder_" + key).html("");
            }


            var properties = Object.keys(Schema.schema.properties[label])
            common.fillSelectOptionsWithStringArray("query_propertySelect", properties, true);
            $("#query_propertySelect").val("name");
            $("#dbQueryFilterLabelModal").modal("show");
            $("#query_validateQueryButton").bind('click', function (target) {


                var queryObject = UI_query.setContextQueryObjectParams();
                queryObject.label = label;

                $("#dbQueryFilterLabelModal").modal("hide");
                if (Object.keys(context.cardsMap).length == 0) {
                    //  var cardId = Math.round(Math.random() * 10000);
                    var cardId = label;
                    context.cardsMap[cardId] = queryObject;
                    self.fromLabelCardId = cardId;

                    buildPaths.executeQuery("graph")

                    var permittedLabels = Schema.getPermittedLabels(label, true, true);
                    permittedLabels.forEach(function (label2) {
                        $("#simpleQuery_labelOrder_" + label2).html("*");
                    })


                }

                else {


                    var fromLabel = context.cardsMap[self.fromLabelCardId].label
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
                                    var queryObject = {
                                        label: label,
                                        text: "all",
                                        inResult: false,
                                        cardId: cardId
                                    }
                                    if (index == line.nodes.length - 1) {
                                        queryObject.inResult = true;
                                        self.toLabelCardId = cardId;
                                    }
                                    $("#simpleQuery_labelOrder_" + label).html(index + 1);
                                    $("#simpleQuery_switch_" + label).prop("checked", true);

                                    context.cardsMap[cardId] = queryObject;


                                }


                            })
                        })

                        buildPaths.executeQuery("graph")
                    })

                }
            })
        }
        else {//unchecked


            delete context.cardsMap[label];
            $("#simpleQuery_labelOrder_" + label).html("");


        }
        buildPaths.executeQuery("graph")

    }




self.drawLabelsWithSwitch = function (labels) {
    var keys = Object.keys(labels.nodes);
    keys.sort();
    var html = "<div style='background-color: #f4f0ec'>";
    keys.forEach(function (key) {
        var label = key;
        var count = labels.nodes[key];
        var color = Config.visjs.defaultNodeColor;
        if (Schema.schema.labels[label])
            color = Schema.schema.labels[label].color;
        html += " <div class='col-md'>" +
            "<div class='custom-control custom-switch'>" +
            "  <input type='checkbox' class='custom-control-input' name='simpleQuery_switch' id='simpleQuery_switch_" + label + "' onchange='GraphSimpleQuery.onSwitchLabelsChange(this)'>" +
            "  <label class=\"custom-control-label\" for='simpleQuery_switch_" + label + "'>" +
            "<span id='simpleQuery_labelOrder_" + label + "' style='color:blue;font-weight: bold'></span>" +
            "<span  value='" + label + "' style='font-size:14px;color:black;background-color:" + "white" + "'>" + label + "</span>" +
            "<span class='badge badge-pill badge-light' style='background-color: " + color + "'>" + count + "</span>" +
            "<span id='simpleQuery_text'></span>" +
            "</label>"

        html += "</div></div>"

    })
    html += "</div>"

    //  $("#dbFilterLabelButtonGroup").html(html);

    $("#simpleQuery_wrapper").html(html);


}


self.clear = function () {
    UI_query.newQuery();
    $("input[name='simpleQuery_switch']").prop("checked", false);


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