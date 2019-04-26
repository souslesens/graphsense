var ExportData = (function () {
    var self = {};
    self.dataset;
    self.connections;
    self.datatable = null;
    self.initDialog = function (data, disableStatsTab) {


        self.dataset = data;
        var properties = []
        data.forEach(function (line) {
            for (var key in line) {
                if (properties.indexOf(key) < 0)
                    properties.push(key);
            }
        })
        var html = "<input type=checkbox onchange=ExportData.swithCbxSelectAll($(this))>select all<br>";
        properties.forEach(function (prop) {
            var checked = "";
            if (prop == "connectedTo" || prop == Schema.schema.defaultNodeNameProperty)
                checked = "checked='checked'"
            if (prop == "label")
                checked = "checked='checked'"

            html += "<br><input type=checkbox class='exportData_propcbx' value='" + prop + "'" + checked + "> " + prop;
        })
        $("#exportData_DatatablecbxsDiv").html(html);



    }
    self.swithCbxSelectAll = function (cbx) {

        var checked = $(cbx).prop("checked")
        $(".exportData_propcbx").each(function (index, cbx) {
            $(this).prop("checked", checked)

        })
    }


    self.execute = function () {

        var checkedProperties = [];
        $(".exportData_propcbx").each(function (index, cbx) {
            if ($(this).prop("checked")) {
                checkedProperties.push(cbx.value)
            }
            checkedProperties.push("neoId")
        })
        var filteredDataset = [];
        var filter = $("#exportData_filterDiv").val();

        self.dataset.forEach(function (line, index) {
            if (filter && filter != "") {
                if (line.label && line.label != filter)
                    return;
                else if (line.labelNeo && line.labelNeo != filter)
                    return;

            }
            var filteredLine = {}
            for (var key in line) {

                if (key == "connectedTo") {
                    if (line[key].length > 200)
                        self.dataset[index][key] = line[key].substring(0, 200) + "...";
                }


                if (checkedProperties.indexOf(key) > -1)
                    filteredLine[key] = line[key];

            }
            filteredDataset.push(filteredLine)
        })


      //  var divName = "exportData_datatableDiv";

        var divName = "graphDiv";
      //  $("#ExportDataTableModalMenu").html("");
      //  $("#ExportDataTableModalMenu").modal("show")
        self.drawDataTable(divName, filteredDataset);


    }


    self.drawDataTable = function (divName, json) {

        var htmlStr = "<table  id='table_" + divName + "'  class='dataTables_wrapper  display nowrap' ></table>"
        $('#' + divName).css("font-size", "10px");
        $("#" + divName).html(htmlStr);

        $(".dataTables_wrapper").css("overflow","auto").width("width", $("#" + divName).width()-50).css("height",$("#" + divName).height()-50)

        var columns = self.getColumns(json);


        self.table = $("#table_" + divName).DataTable({
            data: json,
            columns: columns,
            fixedHeader: true,
            pageLength: 20,
         //   order: order,
            //   "autoWidth": false,
            dom: '<"topbuttons"B>fript',
            //  fixedColumns: true,
            buttons: [
                'copy', 'csv', //'print'
                // 'copy', 'csv', 'excel', 'pdf', 'print'
            ],
            select: true,


            drawCallback: function (settings, json) {
                //#table_graphDiv td{border:solid 1px #ccc}
                $("#table_graphDiv td").css("border","solid 1px #ccc");

            }


        });





    }
    self.getColumns = function (json, definedColumns) {

        var columns = [];
        var keys = [];
        var types = {};


        if (definedColumns) {

            definedColumns.forEach(function (column) {
                keys.push(column)
            })
        } else {
            json.forEach(function (line, index) {
                for (var key in line) {
                    if (keys.indexOf(key) < 0) {
                        keys.push(key);
                        if (isNaN(line[key]))
                            types[key] = "string"
                        else
                            types[key] = "number"
                    }

                }
            })
        }

        var columns = [];
        self.dateColumns = [];
        self.numberColumns = [];
        var sortColumns = [];
        var textColumns = [];
        keys.forEach(function (key, index) {
            var type = types[key];
            var obj = {data: key, title: key, width: "100px"};
            if (type == "date") {
                self.dateColumns.push(index);
            }
            if (type == 'number') {
                self.numberColumns.push(index);
            }

            if (false && mainController.isTextField(table, key)) {
                obj.width = 400;

                textColumns.push(index)
            }

            columns.push(obj);


            //sort datatable
            if (sortColumns.length > 0 && sortColumns[0].indexOf(key) > -1) {
                var order = sortColumns[0].indexOf("desc") > -1;
                if (order)
                    order = "desc"
                else
                    order = "asc"

                //   this.dataTableSortArray.push([index, order])
            }
        })

        columns.sortColumns = sortColumns;
        columns.dateColumns = self.dateColumns;
        columns.numberColumns = self.numberColumns;
        columns.textColumns = textColumns;
        this.columns = columns
        return columns;

    }


    self.initStatsDialog = function () {
        $("#exportData_statsDiv").css("visibility", "visible");

        var labels = []
        ExportData.dataset.forEach(function (line) {
            if (labels.indexOf(line.label) < 0) {
                labels.push(line.label)
            }
        })


        common.fillSelectOptionsWithStringArray(exportData_filterDiv, labels, true)
        common.fillSelectOptionsWithStringArray(stats_sourceLabelSelect, labels, true)
        common.fillSelectOptionsWithStringArray(stats_targetLabelSelect, labels, true)


    }


    return self;

})()