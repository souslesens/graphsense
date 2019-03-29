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
                    " class='btn btn_query_label' data-toggle='modal'" +
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






    }
    self.setContextQueryObjectParams = function () {
        var property = $("#query_propertySelect").val();
        var operator = $("#query_operatorSelect").val();
        var value = $("#query_valueInput").val();
        var booleanOperatorStr = "";//booleanOperator || ""; à finir
        var text = "";
        if (!value || value == "")
            text = "all"
        else
            text = property + " " + operator + " " + value;


        context.queryObject = {
            label: context.queryObject.label,
            property: $("#").val(),
            operator: $("#").val(),
            value: value,
            text: text,
            globalText: ""// a finir
        }
        return context.queryObject;


    }


    self.addCardToQueryDeck = function () {

        var queryObject=self.setContextQueryObjectParams();
        buildPaths.queryObjs.push(queryObject);
        self.setUIPermittedLabels(queryObject.label);

        var html = '<div class="card border-primary mb-3" >\n' +
            '            <div class="card-header text-white  bg-primary">' + queryObject.label + '\n' +
            '        <button type="button" class="close pull-right" aria-label="Close">\n' +
            '            <span aria-hidden="true">&times;</span>\n' +
            '        </button>\n' +
            '        </div>\n' +
            '        <div class="card-body ">\n' +
            '            <p class="card-text"><small> ' + queryObject.text + '</small></p>\n' +
            '        </div>\n' +
            '        </div>';


        $("#query_cardDeck").append(html)


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

    self.displayTable=function(){




    }

    self.displayGraph=function(){




    }


    self.newQuery=function(){
        $(".btn_query_label").css("opacity", 1);
        $("#query_cardDeck").html("");
        buildPaths.queryObjs=[];



    }

    return self;

})()