var UI = (function () {
    var self = {};

    /*self.loadSubGraphSelects=function(){

        var requests=Requests.listStoredRequests();
        var nodeRequests=[];
        var relationRequests=[];

        requests.forEach(function(request){



        })

    }*/


    self.setDatasets = function (datasets, selectedValue) {

        common.fillSelectOptionsWithStringArray("mainMenu_datasetSelect", datasets);
        common.fillSelectOptionsWithStringArray("nodeMapping_DatasetSelect", datasets, true);
        common.fillSelectOptionsWithStringArray("relationMapping_DatasetSelect", datasets, true);
        if (selectedValue) {
            $("#mainMenu_datasetSelect").val(selectedValue);
            $("#nodeMapping_DatasetSelect").val(selectedValue);
            $("#relationMapping_DatasetSelect").val(selectedValue);
        }


    }

    self.setMappingFieldsFromHeader = function (header) {
        header.sort();
        header.splice(0, 0, "");
        common.fillSelectOptionsWithStringArray("nodeMapping_ColPropertiesSelect", header);
        common.fillSelectOptionsWithStringArray("nodeMapping_ColIdSelect", header);
        common.fillSelectOptionsWithStringArray("nodeMapping_ColNameSelect", header);


        common.fillSelectOptionsWithStringArray("relationMapping_ColPropertiesSelect", header);
        common.fillSelectOptionsWithStringArray("relationMapping_ColIdSelect", header);
        common.fillSelectOptionsWithStringArray("relationMapping_ColNameSelect", header);


    }
    self.setNodeMappingName = function () {

        var name = $("#nodeMapping_DatasetSelect").val();
        name += "_" + $("#labelName").val();
        $("#nodeMapping_MappingName").val(name);


    }


    self.showNodeMappingDialog = function (mappingName) {

        $("#NodeMappingModal").modal("show");
        if (mappingName) {
            ;
        }

    }


    self.saveNodeMapping = function () {
        var obj = {};

        obj.sourceField = $("#nodeMapping_ColNameSelect").val();
        obj.sourceKey = $("#nodeMapping_ColIdSelect").val();
        obj.exportedFields = $("#nodeMapping_ColPropertiesSelect").val();
        obj.label = $("#labelName").val();
        obj.source = $("#nodeMapping_DatasetSelect").val();
        obj.name = $("#nodeMapping_MappingName").val();
        obj.type = "node";
        var header = [];
        $("#nodeMapping_ColNameSelect option").each(function (aaa) {
            var value=$(this).val();
            if(value!="")
            header.push(value)
        });
        obj.header = header;
        Mappings.saveNodeMapping(obj, function (err, result) {
            if (err)
                return $("#message.div").html(err);

            $("#message.div").html("mapping saved");
            $("#NodeMappingModal").modal("hide");

        });


    }


    return self;

})()