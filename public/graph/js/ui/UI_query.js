var UI_query = (function () {
    var self = {};

    self.initQueryLabels = function () {

        DataModel.getDBstats(context.subGraph, function (err, result) {
            self.drawQueryLabels(result);
        })
    }


    self.drawQueryLabels = function (labels) {
        var html = "";
        for (var key in labels.nodes) {
            var label = key;
            var count = labels.nodes[key];
            var color = Config.visjs.defaultNodeColor;
            if (Schema.schema.labels[label])
                color = Schema.schema.labels[label].color;
            html += "<button type='button'" +
                " value='" + label + "'" +
                " onclick='UI_query.showQueryCardParamsDialog($(this).val())'" +
                " style='background-color: " + color + "'" +
                //" class='btn btn_query_label' data-toggle='modal'" +
                " class='btn btn-dark' data-toggle='modal'" +
                " data-target='#dbQueryFilterLabelModal'>"
                + label +
                " <span class='badge badge-pill badge-light'>" + count + "</span></button>";

        }

        $("#dbFilterLabelButtonGroup").html(html);
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
            UI_query.addCardToQueryDeck();
            $('#query_valueInput').focus();
        })


    }


    self.addCardToQueryDeck = function (queryObject, index) {





        if (!queryObject)
            queryObject = self.setContextQueryObjectParams();


        if (!queryObject.cardTitle)
            queryObject.cardTitle = queryObject.label;
        if (!buildPaths.queryObjs.currentIndex)
            buildPaths.queryObjs.currentIndex = -1;

        if(!index)
            index = buildPaths.queryObjs.currentIndex += 1;
        else
            buildPaths.queryObjs.currentIndex =index;


        if (!index && context.currentQueryCardId > -1) {

             self.updateCardToQueryDeck(queryObject, context.currentQueryCardId);
            context.currentQueryCardId = -1;
            return;

        }

        var cardId = Math.round(Math.random() * 1000);
        var card = JSON.parse(JSON.stringify(queryObject));//clone
        card.index = index;
        context.cardsMap[cardId] = card;



        if (queryObject.label) {
            self.setUIPermittedLabels(queryObject.label);
            var color = Schema.schema.labels[queryObject.label].color;
        }
        else color = "#ddd"

        var filterCardId = 'query_filterCard_' + cardId;
        var iconCardId = 'query_icon_' + cardId;


        var html = "";
        if (index > 0)
            html = '<div id="' + iconCardId + '" style="padding: 4px 2px 2px;float:right"><img src="img/FilterLabel.png" style="width: 40px; height: 40px;"/></div>';

        html += '<div class="card" onclick="UI_query.onCardClick(' + cardId + ')" id="' + filterCardId + '" style="width: 15rem;"> ' +
            '   <div class="card-header">' +
            '       <div class="circle rounded-circle" style="padding-left:5px;background-color:' + color + '">&nbsp;</div> ' +
            '        <span class="badge">' + queryObject.cardTitle + '</span> ' +
            '       <button type="button"  onclick="UI_query.removeFilterCard(' + cardId + ')" class="close" aria-label="Close"> ' +
            '           <span aria-hidden="true">&times;</span></button> ' +
            '       </div>' +
            '       <div>' +
            '       <div class="card-body text-center" style="padding:5px"> ' +
            '           <p class="card-text" id="cardText_' + cardId + '"><small class="text-muted">' + queryObject.text + '</small></p>' +
            '       </div> ' +
            '       <div class="form-check" style="text-align:center" >' +
            '               <input type="checkbox" checked="checked" class="form-check-input" id="query_filterCardInResult">' +//à completer PB!!!!
            '               <label class="form-check-label" for="query_filterCardInResult">In Result</label>' +
            '        </div>' +
            '  </div>' +
            '</div>'


        $("#query_cardDeck").append(html);
        $("#query_filterCard_" + index).addClass("type_" + queryObject.type);


        $('#query_filterLabelDialogModal').modal('hide')
        return index;

    }

    self.updateCardToQueryDeck = function (newQueryObject, cardId, boolOperator) {

        if (true || boolOperator == "only") {
            var cardIndex =  context.cardsMap[cardId].index;
            context.cardsMap[cardId]=newQueryObject;
            context.cardsMap[cardId].index=cardIndex;
            $('#cardText_' + cardId).html(newQueryObject.text);

         /*   var index = context.cardsMap[cardId].index;

            self.removeFilterCard(cardId);
            self.addCardToQueryDeck(newQueryObject, index - 1);*/

        }
        if (boolOperator == "or") {

            context.queryObject.nodeSetIds = context.queryObject.nodeSetIds.concat(queryObject.nodeSetIds);
            context.queryObject.where = context.queryObject.where + " or " + queryObject.where;
            var clauseText = " hierarchy (" + context.queryObject.nodeSetIds.length + " nodes)";
            context.queryObject.text = clauseText;
//to finish !!!!!!!!!!!!!!!!!!!!!
        }

        if (boolOperator == "and") {

        }


    }
    self.removeFilterCard = function (cardId) {

        buildPaths.queryObjs.currentIndex -= 1;
        context.currentQueryCardId = -1;
        delete context.cardsMap[cardId];


        $("#query_filterCard_" + cardId).remove();
        $("#query_icon_" + cardId).remove();
        event.stopPropagation();


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
        $("#dbFilterCollapseMenu").removeClass("show");
        buildPaths.executeQuery("dataTable", {}, function (err, result) {
            if (err)
                return MainController.error(err);


        })

    }

    self.displayGraph = function (withOrphanNodes) {
        $("#navbar_graph_Graph_ul").removeClass("d-none");
        context.currentQueryCardId = -1;
        buildPaths.executeQuery("graph", {withOrphanNodes: withOrphanNodes}, function (err, result) {
            if (err)
                return MainController.error(err);
            $("#dbFilterCollapseMenu").removeClass("show");


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
        //  $("#dbFilterCollapseMenu").removeClass("d-none");
        buildPaths.queryObjs = [];
        context.cardsMap = {};


    }
    self.showQueryMenu = function () {
        $("#dbFilterCollapseMenu").addClass("show");
    }

    self.listPropertyValues = function (targetDialogPrefix) {
        if (!targetDialogPrefix)
            targetDialogPrefix = "query";
        //  context.queryObject = {};
        var queryObj = self.setContextQueryObjectParams(targetDialogPrefix);

        $("#" + targetDialogPrefix + "_operatorSelect").val("=");


        var whereStr = "";
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
            else if (result.length > Config.maxListDisplayLimit)
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