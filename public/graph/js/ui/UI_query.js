var UI_query = (function () {
    var self = {};

    self.initQueryLabels = function () {

        DataModel.getDBstats(context.subGraph, function (err, result) {
            var html = "";
            for (var key in result.nodes) {
                var label = key;
                var count = result.nodes[key];
                var color = Schema.schema.labels[label].color;
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
        })
    }

    self.showQueryCardParamsDialog = function (label) {
        context.queryObject = {label: label};

        var properties = Schema.getLabelProperties(label);

        common.fillSelectOptionsWithStringArray("query_propertySelect", properties, true);
        $("#query_propertySelect").val(Schema.getNameProperty())

        $("#query_validateQueryButton").bind('click', function (target) {
            $('#query_filterLabelDialogModal').modal('hide');
            UI_query.addCardToQueryDeck();
            $('#query_valueInput').focus();
        })


    }


    self.addCardToQueryDeck = function (queryObject, index) {
        $('#dbQueryFilterLabelModal').modal('hide');


        if (!queryObject)
            queryObject = self.setContextQueryObjectParams();

        if (!index)
            index = buildPaths.queryObjs.length;
        buildPaths.queryObjs.push(JSON.parse(JSON.stringify(queryObject)));//clone

        self.setUIPermittedLabels(queryObject.label);

        var html = '<div class="card border-primary mb-3" id="query_filterCard_' + index + '" >' +
            '            <div class="card-header text-white  bg-primary">' + queryObject.label +
            '               <button type="button" onclick="UI_query.removeFilterCard(' + index + ')" class="close pull-right" aria-label="Close">' +
            '                   <span aria-hidden="true">&times;</span>  </button></div>' +
            '            <div class="card-body ">' +
            '               <p class="card-text"><small> ' + queryObject.text + '</small></p>' +
            '           </div>\n' +
            '       <div class="form-check" style="text-align:center" >' +
            '           <input type="checkbox" checked="checked" class="form-check-input" id="query_filterCardInResult">' +//à completer PB!!!!
            '           <label class="form-check-label" for="query_filterCardInResult">In Result</label>' +
            '       </div>' +
            '</div>';


        $("#query_cardDeck").append(html);
        $("#query_filterCard_" + index).addClass("type_" + queryObject.type);


        $('#query_filterLabelDialogModal').modal('hide')
        return index;

    }

    self.updateCardToQueryDeck = function (newQueryObject, index, boolOperator) {

        if (true || boolOperator == "only") {

            self.removeFilterCard(index);
            self.addCardToQueryDeck(newQueryObject, index - 1);

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
    self.removeFilterCard = function (index) {
        buildPaths.queryObjs.splice(index, 1);
        $("#query_filterCard_" + index).remove();


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
        $("#dbFilterCollapseMenu").removeClass("show");
        buildPaths.executeQuery("dataTable",{}, function (err, result) {
            if (err)
                return MainController.error(err);


        })

    }

    self.displayGraph = function () {

        buildPaths.executeQuery("graph",{}, function (err, result) {
            if (err)
                return MainController.error(err);
            $("#dbFilterCollapseMenu").removeClass("show");


        })


    }


    self.newQuery = function () {
        $(".btn_query_label").css("opacity", 1);
        $("#query_cardDeck").html("");
        //  $("#dbFilterCollapseMenu").removeClass("d-none");
        buildPaths.queryObjs = [];


    }
    self.showQueryMenu = function () {
        $("#dbFilterCollapseMenu").addClass("show");
    }

    self.listPropertyValues = function (targetDialogPrefix) {
        if (!targetDialogPrefix)
            targetDialogPrefix = "query";
        context.queryObject = {};
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

    return self;

})()