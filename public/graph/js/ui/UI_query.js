var UI_query = (function () {
    var self = {};
    self.currentIndex=-1;

    self.initQueryLabels = function () {

        DataModel.getDBstats(context.subGraph, function (err, result) {
            GraphSimpleQuery.drawLabelsWithSwitch(result)


        })
    }


    self.showQueryCardParamsDialog = function (label) {
        context.queryObject = {label: label};

        var properties = Schema.getLabelProperties(label);

        common.fillSelectOptionsWithStringArray("query_propertySelect", properties, true);
        $("#query_propertySelect").val(Schema.getNameProperty());

        $("#queryModalLabel").html("Query Label > " + label)

        $("#query_validateQueryButton").bind('click', function (target) {
            $('#query_filterLabelDialogModal').modal('hide');
            $('#dbQueryFilterLabelModal').modal('hide');

            $('#query_valueInput').focus();
         if(context.queryFilterValidateFn) {
             context.queryFilterValidateFn();
             context.queryFilterValidateFn=null;
         }
         else
             UI_query.addCardToQueryDeck();
        })


    }


    self.addCardToQueryDeck = function (queryObject, index) {


    }





    self.setContextQueryObjectParams = function (targetDialogPrefix) {
        if (!targetDialogPrefix)
            targetDialogPrefix = "query";

        var label = $("#" + targetDialogPrefix + "_labelSelect").val();
        if (context.queryObject.label && context.queryObject.label != "")
            label = context.queryObject.label;

        var property = $("#" + targetDialogPrefix + "_propertySelect").val();
        var operator = $("#" + targetDialogPrefix + "_operatorSelect").val();
        var value = $("#" + targetDialogPrefix + "_valueInput").val();

        var inResult = true /// $("#query_filterCardInResult").prop("checked");  à completer !!!!



        var booleanOperatorStr = "";//booleanOperator || ""; à finir
        var text = "";
        if (!value || value == "")
            text = "all"
        else
            text = property + " " + operator + " " + value;


        context.queryObject = {
            label: label,
            property: property,
            operator: operator,
            value: value,
            text: text,
            inResult: inResult,
            globalText: ""// a finir
        }
        return context.queryObject;


    }

    self.setUIPermittedLabels = function (label) {

        var opacityAllowed = 0.7;
        var opacityAll = 0.1;
        $(".btn_query_label").css("visibility", "visible");
        var allowedLabels = Schema.getPermittedLabels(label, true, true);
        $(".btn_query_label").each(function () {
            var thisLabel = $(this).attr("value");
            console.log(thisLabel)
            if (false) {
                if (allowedLabels.indexOf(thisLabel) < 0)
                    $(this).css("visibility", "hidden");
                else
                    $(this).css("visibility", "visible");
            }
            if (true) {
                if (label == thisLabel)
                    $(this).css("opacity", 1);
                else if (allowedLabels.indexOf(thisLabel) < 0)
                    $(this).css("opacity", opacityAll);

                else
                    $(this).css("opacity", opacityAllowed);
            }

        })
        //  self.configBooleanOperatorsUI();

    }

    self.displayTable = function () {
        context.currentQueryCardId = -1;

        buildPaths.executeQuery("dataTable", {}, function (err, result) {
            if (err)
                return MainController.error(err);


        })

    }

    self.displayGraph = function (addToGraph) {
        $("#navbar_graph_Graph_ul").removeClass("d-none");
        context.currentQueryCardId = -1;
        buildPaths.executeQuery("graph", {addToGraph: addToGraph}, function (err, result) {
            if (err)
                return MainController.error(err);



        })


    }


    self.newQuery = function () {
        $("#navbar_graph_Graph_ul").addClass("d-none");
        $(".btn_query_label").css("opacity", 1);
        $("#query_cardDeck").html("");
        $("#graphDiv").html("");
        $("#graph_legendDiv").html("");
        $("#hierarchy_treeContainerDiv").html("");
        $("#search_treeContainerDiv").html("");

        buildPaths.queryObjs = [];
        context.cardsMap = {};
        self.currentIndex=0;
        Cache.restoreGraphSchema();


    }
    self.showQueryMenu = function () {
      //  $("#dbFilterCollapseMenu").addClass("show");
    }

    self.listPropertyValues = function (targetDialogPrefix) {
        if (!targetDialogPrefix)
            targetDialogPrefix = "query";
        //  context.queryObject = {};
        var queryObj = self.setContextQueryObjectParams(targetDialogPrefix);

        $("#" + targetDialogPrefix + "_operatorSelect").val("=");


        var whereStr = "";
        if(context.subGraph)
            whereStr=" where n.subGraph='"+context.subGraph+"' "
        /* if (queryObj.value != "")
             whereStr = "where n." + queryObj.property + "=~'(?i).*" + queryObj.value.trim() + ".*'";*/
        var labelStr = ""
        if (queryObj.label)
            labelStr = ":" + queryObj.label

        var cypher = "Match (n" + labelStr + ") " + whereStr + " return distinct n." + queryObj.property + " as value order by value limit " + Config.maxListDisplayLimit;
        Cypher.executeCypher(cypher, function (err, result) {
            var html = "";
            if (err)
                html = err;
            else if (result.length == 0)
                html = "no values"
            else if (result.length > Config.maxListDisplayLimit+1)
                html = "...cannot display all values enter the beginning of word"
            else {
                result.splice(0, 0, {value: ""})
                html = "<select style='width:150px' onchange=$('#" + targetDialogPrefix + "_valueInput').val($(this).val());$('#" + targetDialogPrefix + "_operatorSelect').val('=');$('#" + targetDialogPrefix + "_possibleValuesSpan').html('')\n >"

                result.forEach(function (line) {
                    html += "<option>" + line.value + "</option>"

                })
                html += "</select>";


            }

            $("#" + targetDialogPrefix + "_possibleValuesSpan").html(html)

        })

    }
    self.onPossibleValueSelected = function () {

    }

    self.onCardClick = function (cardId) {

        context.currentQueryCardId = cardId;
        var label=context.cardsMap[cardId].label;
        self.showQueryCardParamsDialog(label)
        $("#dbQueryFilterLabelModal").modal("show")



        // self.showQueryCardParamsDialog()
    }

    return self;

})()