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
        context.nodeMappings={};
        context.relationMappings= {};
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

        common.fillSelectOptionsWithStringArray("relationMapping_ColPropertiesSelect", header);
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

        var name ="";// $("#nodeMapping_DatasetSelect").val();
        name +=  $("#nodeMapping_labelName").val();
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
   self.getEmptyFieldsInForm=function(formId){
        var emptyFields=[];
        $("#"+formId).find("input,select,textarea").each(function(){
            if($(this).val()=="" || $(this).val()==null)
                emptyFields.push($(this).attr("id"))

        })
        return emptyFields;

    }


    self.saveNodeMapping = function () {

        var emptyFields=self.getEmptyFieldsInForm("nodeMapping_form");
        if(emptyFields.length>0 && emptyFields[0]!="nodeMapping_ColPropertiesSelect" )
            return alert("All fields are mandatory " +emptyFields.toString())

        var obj = {};

        obj.colName = $("#nodeMapping_ColNameSelect").val();
        obj.colId = $("#nodeMapping_ColIdSelect").val();
        obj.exportedFields = $("#nodeMapping_ColPropertiesSelect").val();
        obj.label = $("#nodeMapping_labelName").val();
        obj.source = $("#nodeMapping_DatasetSelect").val();
        obj.name = $("#nodeMapping_MappingName").val();
        obj.distinctValues = $("#nodeMapping_distinctValues").val();
        obj.type = "node";
        obj.mappingset=context.currentmappingset;



        Mappings.saveMapping(obj, function (err, result) {
            if (err)
                return $("#message.div").html(err);
            datasets.initDatasetCollection(context.currentmappingset)
            $("#messageDiv").html("mapping saved");
            $("#NodeMappingModal").modal("hide");

        });


    }
    self.saveRelationMapping = function () {
        var obj = {};


        var emptyFields=self.getEmptyFieldsInForm("relationMapping_form");
        if(emptyFields.length>0 && emptyFields[0]!="relationMapping_ColPropertiesSelect" )
            return alert("All fields are mandatory " +emptyFields.toString())

        obj.source = $("#relationMapping_DatasetSelect").val();
        obj.name = $("#relationMapping_MappingName").val();

        obj.colFromId = $("#relationMapping_ColFromIdSelect").val();
        obj.neoFromLabel = $("#relationMapping_NeoFromLabelSelect").val();
        obj.neoFromId = $("#relationMapping_NeoFromIdSelect").val();
        obj.colToId = $("#relationMapping_ColToIdSelect").val();
        obj.neoToLabel = $("#relationMapping_NeoToLabelSelect").val();
        obj.neoToId = $("#relationMapping_NeoToIdSelect").val();
        obj.relationType = $("#relationMapping_typeName").val();
        obj.exportedFields = $("#relationMapping_ColPropertiesSelect").val();
        obj.mappingset=context.currentmappingset;
        obj.type = "relation";



        Mappings.saveMapping(obj, function (err, result) {
            if (err)
                return $("#message.div").html(err);
            datasets.initDatasetCollection(context.currentmappingset)
            $("#messageDiv").html("mapping saved");
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
       var distinctValues=   mapping.distinctValues ;
    //   if(distinctValues)$("#nodeMapping_distinctValues").val();

       $("#nodeMapping_ColPropertiesSelect").val(mapping.exportedFields);
       if(mapping.exportedFields && Array.isArray(mapping.exportedFields)) {
           mapping.exportedFields.forEach(function (colName) {
               var xx = $("#nodeMapping_ColPropertiesSelect").find('option[text=' + colName + ']')
               $("#nodeMapping_ColPropertiesSelect").find('option[text=' + colName + ']').prop('selected', true);
           })
       }

       $("#nodeMapping_ColIdSelect").val(mapping.colId);
       $("#nodeMapping_ColNameSelect").val(mapping.colName);
       context.currentNodeMapping=mapping.name;

   }


    self.initRelationMapping=function(mappingName){
        var mapping=context.relationMappings[mappingName];
      //  self.setMappingFieldsFromHeader(mapping.header);
        var header=context.datasets[mapping.source].header;
        self.setMappingFieldsFromHeader(header);
        $("#relationMapping_DatasetSelect").val(mapping.source);
        $("#relationMapping_MappingName").val(mapping.name);
        $("#relationMapping_typeName").val(mapping.relationType);

        $("#relationMapping_ColFromIdSelect").val(mapping.colFromId);
        $("#relationMapping_NeoFromLabelSelect").val(mapping.neoFromLabel);
        common.fillSelectOptionsWithStringArray("relationMapping_NeoFromIdSelect",header,true,mapping.neoFromId);


        $("#relationMapping_ColToIdSelect").val(mapping.colToId);
        $("#relationMapping_NeoToLabelSelect").val(mapping.neoToLabel);
        common.fillSelectOptionsWithStringArray("relationMapping_NeoToIdSelect",header,true,mapping.neoToId);

        $("#relationMapping_ColPropertiesSelect").val(mapping.exportedFields);
        if(mapping.exportedFields && Array.isArray(mapping.exportedFields)) {
            mapping.exportedFields.forEach(function (colName) {
                $("#nodeMapping_ColPropertiesSelect").find('option[text=' + colName + ']').prop('selected', true);
            })
        }
        context.currentRelationMapping=mapping.name;



    }



    self.selectAllNodeMappingProperties=function(){

           $('#nodeMapping_ColPropertiesSelect option').prop('selected', true);


   }


    return self;

})()
