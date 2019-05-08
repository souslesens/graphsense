var UI = (function () {
    var self = {};

    /*self.loadSubGraphSelects=function(){

        var requests=Requests.listStoredRequests();
        var nodeRequests=[];
        var relationRequests=[];

        requests.forEach(function(request){



        })

    }*/


    self.addMappingSet=function(){
        var mappingSet=prompt("New Mapping Set Name")
        if(!mappingSet || mappingSet=="")
            return ;
        $("#mainMenu_MappingSetSelect").append('<option selected="selected">'+mappingSet+'</option>');
        context.currentMappingSet=mappingSet;


    }

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


        common.fillSelectOptionsWithStringArray("relationMapping_ColFromIdSelect", header);
        common.fillSelectOptionsWithStringArray("relationMapping_ColToIdSelect", header);



    }





    self.setMappingNeoFieldsFromSubGraph=function(subGraph){



    }
    self.setNodeMappingName = function () {

        var name = $("#nodeMapping_DatasetSelect").val();
        name += "_" + $("#relationMapping_labelName").val();
        $("#nodeMapping_MappingName").val(name);


    }
    self.setRelationMappingName = function () {

        var name = $("#relationMapping_DatasetSelect").val();
        name += "_" + $("#relationMapping_typeName").val();
        $("#relationMapping_MappingName").val(name);


    }




    self.showNodeMappingDialog = function (mappingName) {

        $("#NodeMappingModal").modal("show");
        if (mappingName) {
            self.initNodeMapping(mappingName);
        }

    }

    self.showRelationMappingDialog = function (mappingName) {

        $("#RelationMappingModal").modal("show");
        if (mappingName) {
            self.initRelationMapping(mappingName);
        }

    }


    self.saveNodeMapping = function () {
        var obj = {};

        obj.colName = $("#nodeMapping_ColNameSelect").val();
        obj.colId = $("#nodeMapping_ColIdSelect").val();
        obj.exportedFields = $("#nodeMapping_ColPropertiesSelect").val();
        obj.label = $("#nodeMapping_labelName").val();
        obj.source = $("#nodeMapping_DatasetSelect").val();
        obj.name = $("#nodeMapping_MappingName").val();
        obj.type = "node";
        obj.currentMappingSet=context.currentMappingSet;
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
    self.saveRelationMapping = function () {
        var obj = {};

        $("#relationMapping_DatasetSelect").val(mapping.source);
        $("#relationMapping_MappingName").val(mapping.name);
        $("#relationMapping_ColFromIdSelect").val(mapping.colFromId);
        $("#relationMapping_NeoFromLabelSelect").val(mapping.neoFromLabel);
        $("#relationMapping_NeoFromIdSelect").val(mapping.neoFromId);

        $("#relationMapping_ColToIdSelect").val(mapping.colToId);
        $("#relationMapping_NeoToLabelSelect").val(mapping.neoToLabel);
        $("#relationMapping_NeoToIdSelect").val(mapping.neoToId);


        obj.source = $("#relationMapping_DatasetSelect").val();
        obj.name = $("#relationMapping_MappingName").val();

        obj.colFromId = $("#relationMapping_ColFromIdSelect").val();
        obj.neoFromLabel = $("#relationMapping_NeoFromLabelSelect").val();
        obj.neoFromId = $("#relationMapping_NeoFromIdSelect").val();
        obj.colToId = $("#relationMapping_NeoToLabelSelect").val();
        obj.neoToLabel = $("#relationMapping_NeoToLabelSelect").val();
        obj.neoToId = $("#relationMapping_NeoToIdSelect").val();
        obj.type = $("#relationMapping_typeName").val();
        obj.currentMappingSet=context.currentMappingSet;

        obj.type = "relation";
        var header = [];
        $("#relationMapping_ColFromIdSelect option").each(function (aaa) {
            var value=$(this).val();
            if(value!="")
                header.push(value)
        });
        obj.header = header;
        Mappings.saveRelationMapping(obj, function (err, result) {
            if (err)
                return $("#message.div").html(err);

            $("#message.div").html("mapping saved");
            $("#RelationMappingModal").modal("hide");

        });


    }

   self.initNodeMapping=function(mappingName){
        var mapping=context.nodeMappings[mappingName];
       self.setMappingFieldsFromHeader(mapping.header);
       $("#nodeMapping_DatasetSelect").val(mapping.source);
       $("#nodeMapping_MappingName").val(mapping.name);
       $("#nodeMapping_labelName").val(mapping.label);
       $("#nodeMapping_ColPropertiesSelect").val(mapping.exportedFields);
       mapping.exportedFields.forEach(function(colName){
           var xx=  $("#nodeMapping_ColPropertiesSelect").find('option[text='+colName+']')
           $("#nodeMapping_ColPropertiesSelect").find('option[text='+colName+']').prop('selected', true);
       })

       $("#nodeMapping_ColIdSelect").val(mapping.colId);
       $("#nodeMapping_ColNameSelect").val(mapping.colName);

   }


    self.initRelationMapping=function(mappingName){
        var mapping=context.nodeMappings[mappingName];
        self.setMappingFieldsFromHeader(mapping.header);
        $("#relationMapping_DatasetSelect").val(mapping.source);
        $("#relationMapping_MappingName").val(mapping.name);
        $("#relationMapping_ColFromIdSelect").val(mapping.colFromId);
        $("#relationMapping_NeoFromLabelSelect").val(mapping.neoFromLabel);
        $("#relationMapping_NeoFromIdSelect").val(mapping.neoFromId);

        $("#relationMapping_ColToIdSelect").val(mapping.colToId);
        $("#relationMapping_NeoToLabelSelect").val(mapping.neoToLabel);
        $("#relationMapping_NeoToIdSelect").val(mapping.neoToId);

    }


   self.selectAllNodeMappingProperties=function(){

           $('#nodeMapping_ColPropertiesSelect option').prop('selected', true);


   }


    return self;

})()