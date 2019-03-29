var UI_query = (function () {
    var self = {};

    self.initDbQueryFilter = function () {

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
                    " class='btn' data-toggle='modal'" +
                    " data-target='#dbQueryFilterLabelModal'>"
                    + label +
                    " <span class='badge badge-pill badge-light'>" + count + "</span></button>";

            }
            $("#dbFilterLabelButtonGroup").append(html);
        })
    }

    self.showQueryCardParamsDialog = function (label) {
        context.queryObject = {label: label};

            var properties = Schema.getLabelProperties(label);

            common.fillSelectOptionsWithStringArray("query_propertySelect", properties, true);
            $("#query_propertySelect").val(Schema.getNameProperty())

            $("#query_validateQueryButton").bind('click', function () {
                var xx = $('#query_filterLabelDialogModal')
                $('#query_filterLabelDialogModal').modal('hide')
                UI_query.addCardToQueryDeck();
            })




    }
    self.setQueryObjectParams = function () {
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

        self.setQueryObjectParams();

        var html = '<div class="card border-primary mb-3" >\n' +
            '            <div class="card-header text-white  bg-primary">' + context.queryObject.label + '\n' +
            '        <button type="button" class="close pull-right" aria-label="Close">\n' +
            '            <span aria-hidden="true">&times;</span>\n' +
            '        </button>\n' +
            '        </div>\n' +
            '        <div class="card-body ">\n' +
            '            <p class="card-text"><small> ' + context.queryObject.text + '</small></p>\n' +
            '        </div>\n' +
            '        </div>';


        $("#query_cardDeck").append(html)


    }


    return self;

})()