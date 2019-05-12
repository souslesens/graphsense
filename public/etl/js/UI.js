var UI = (function () {
    var self = {};

    /*self.loadSubGraphSelects=function(){

        var requests=Requests.listStoredRequests();
        var nodeRequests=[];
        var relationRequests=[];

        requests.forEach(function(request){



        })

    }*/


    self.addmappingset=function(){
        var mappingset=prompt("New Mapping Set Name")
        if(!mappingset || mappingset=="")
            return ;
        $("#mainMenu_mappingsetSelect").append('<option selected="selected">'+mappingset+'</option>');
        context.mappingsets.push(mappingset);
        context.mappingsets.index=context.mappingsets.length-1;
        Mappings.addmappingset(mappingset)


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



    self.setRelationFieldSelect=function(labelValue, targetSelect){

       var fields=Mappings.getMappingFields(labelValue);
        common.fillSelectOptionsWithStringArray(targetSelect, fields,true);

    }





    self.setMappingNeoFieldsFromSubGraph=function(subGraph){



    }
    self.setNodeMappingName = function () {

        var name = $("#nodeMapping_DatasetSelect").val();
        name += "_" + $("#nodeMapping_labelName").val();
        $("#nodeMapping_MappingName").val(name);


    }
    self.setRelationMappingName = function () {

        var name = $("#relationMapping_NeoFromLabelSelect").val();
        name += "-" + $("#relationMapping_typeName").val();
        name += "->" + $("#relationMapping_NeoToLabelSelect").val();

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
        var labels=[];
        for(var key in context.nodeMappings){
           labels.push(context.nodeMappings[key].label);
        }
        common.fillSelectOptionsWithStringArray("relationMapping_NeoFromLabelSelect", labels,true);
        common.fillSelectOptionsWithStringArray("relationMapping_NeoToLabelSelect", labels,true);
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
        obj.mappingset=context.currentmappingset;
        var header = [];
        $("#nodeMapping_ColNameSelect option").each(function (aaa) {
            var value=$(this).val();
            if(value!="")
            header.push(value)
        });
        obj.header = header;
        Mappings.saveMapping(obj, function (err, result) {
            if (err)
                return $("#message.div").html(err);

            $("#message.div").html("mapping saved");
            $("#NodeMappingModal").modal("hide");

        });


    }
    self.saveRelationMapping = function () {
        var obj = {};




        obj.source = $("#relationMapping_DatasetSelect").val();
        obj.name = $("#relationMapping_MappingName").val();

        obj.colFromId = $("#relationMapping_ColFromIdSelect").val();
        obj.neoFromLabel = $("#relationMapping_NeoFromLabelSelect").val();
        obj.neoFromId = $("#relationMapping_NeoFromIdSelect").val();
        obj.colToId = $("#relationMapping_ColToIdSelect").val();
        obj.neoToLabel = $("#relationMapping_NeoToLabelSelect").val();
        obj.neoToId = $("#relationMapping_NeoToIdSelect").val();
        obj.relationType = $("#relationMapping_typeName").val();
        obj.mappingset=context.currentmappingset;

        obj.type = "relation";
        var header = [];
        $("#relationMapping_ColFromIdSelect option").each(function (aaa) {
            var value=$(this).val();
            if(value!="")
                header.push(value)
        });
        obj.header = header;
        Mappings.saveMapping(obj, function (err, result) {
            if (err)
                return $("#message.div").html(err);

            $("#message.div").html("mapping saved");
            $("#RelationMappingModal").modal("hide");

        });


    }

   self.initNodeMapping=function(mappingName){
        var mapping=context.nodeMappings[mappingName];
     //  self.setMappingFieldsFromHeader(mapping.header);
       self.setMappingFieldsFromHeader(context.datasets[mapping.source].header);
       $("#nodeMapping_DatasetSelect").val(mapping.source);
       $("#nodeMapping_MappingName").val(mapping.name);
       $("#nodeMapping_labelName").val(mapping.label);
       $("#nodeMapping_ColPropertiesSelect").val(mapping.exportedFields);
       if(mapping.exportedFields && Array.isArray(mapping.exportedFields)) {
           mapping.exportedFields.forEach(function (colName) {
               var xx = $("#nodeMapping_ColPropertiesSelect").find('option[text=' + colName + ']')
               $("#nodeMapping_ColPropertiesSelect").find('option[text=' + colName + ']').prop('selected', true);
           })
       }

       $("#nodeMapping_ColIdSelect").val(mapping.colId);
       $("#nodeMapping_ColNameSelect").val(mapping.colName);

   }


    self.initRelationMapping=function(mappingName){
        var mapping=context.relationMappings[mappingName];
      //  self.setMappingFieldsFromHeader(mapping.header);
        self.setMappingFieldsFromHeader(context.datasets[mapping.source].header);
        $("#relationMapping_DatasetSelect").val(mapping.source);
        $("#relationMapping_MappingName").val(mapping.name);
        $("#relationMapping_typeName").val(mapping.relationType);

        $("#relationMapping_ColFromIdSelect").val(mapping.colFromId);
        $("#relationMapping_NeoFromLabelSelect").val(mapping.neoFromLabel);
        common.fillSelectOptionsWithStringArray("relationMapping_NeoFromIdSelect",context.nodeMappings[mapping.neoFromLabel].header,true,mapping.neoFromId);


        $("#relationMapping_ColToIdSelect").val(mapping.colToId);
        $("#relationMapping_NeoToLabelSelect").val(mapping.neoToLabel);
        common.fillSelectOptionsWithStringArray("relationMapping_NeoToIdSelect",context.nodeMappings[mapping.neoToLabel].header,true,mapping.neoFromId);
       /* setTimeout(function(){// le temps que les select soient alimentés
            $("#relationMapping_NeoFromIdSelect").val(mapping.neoFromId);
            $("#relationMapping_NeoToIdSelect").val(mapping.neoToId);
        },300)*/


    }


   self.selectAllNodeMappingProperties=function(){

           $('#nodeMapping_ColPropertiesSelect option').prop('selected', true);


   }


    return self;

})()