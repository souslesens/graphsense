var Mappings = (function () {
    var self = {};


    self.loadMappingsets = function () {

        var payload = {
            getMappingsetNames: true
        }
        MainController.callServer(MainController.jsonDBStoragePath, payload, function (err, result) {
            if (err)
                return $("#messageDiv").html(err);

            common.fillSelectOptionsWithStringArray("mainMenu_mappingsetSelect", result)

        })
    }

    self.addmappingset = function (mappingsetName) {

        var payload = {
            addMappingset: mappingsetName
        }
        MainController.callServer(MainController.jsonDBStoragePath, payload, function (err, result) {
            if (err)
                return $("#messageDiv").html(err);

            common.fillSelectOptionsWithStringArray("mainMenu_mappingsetSelect", result)

        })

    }
    self.getMappingFields = function (label) {
        var fields = [];
        for (var key in context.nodeMappings) {
            var mapping = context.nodeMappings[key];
            if (mapping.label == label) {
                if (mapping.exportedFields)
                    fields = fields.concat(mapping.exportedFields);
                if(fields.indexOf(mapping.colName)<0)
                fields.push(mapping.colName);
                if(fields.indexOf(mapping.colId)<0)
                fields.push(mapping.colId);

            }
        }
        fields.sort();
        return fields;


        return fields;

    }

    self.saveMapping = function (obj, callback) {

        var payload = {
            writeMapping: JSON.stringify(obj)
        }
        MainController.callServer(MainController.jsonDBStoragePath, payload, callback)

    }




    self.initMappingSet = function (mappingset) {
        context.currentmappingset = mappingset;
        var payload = {
            getMappings: mappingset
        }
        MainController.callServer(MainController.jsonDBStoragePath, payload, function (err, result) {
            if (err)
                return $("#messageDiv").html(err);

            var nodeNames = []
            var relationNames = [];

            for (var key in result.nodes) {
                nodeNames.push(key)
            }
            context.nodeMappings = result.nodes;

            for (var key in result.relations) {
                relationNames.push(key)
            }
            context.relationMappings = result.relations;


            common.fillSelectOptionsWithStringArray("nodeMappings_MappingSelect", nodeNames);
            common.fillSelectOptionsWithStringArray("relationMappings_MappingSelect", relationNames);
        })


    }
    self.removeMapping=function(type,mappingName){

        var payload = {
            removeMapping: true,
            mappingsetName:context.currentmappingset,
            type:type,
            mappingName:mappingName

        }
        MainController.callServer(MainController.jsonDBStoragePath, payload, function (err, result) {
            if (err)
                return $("#messageDiv").html(err);
            if(type=='nodes'){
                delete context.nodeMappings[mappingName]
                $("#nodenMappings_MappingSelect option[value='"+ mappingName+"']").remove();

            }

            else if (type=='relations'){
                delete context.relationMappings[mappingName]
                $("#relationMappings_MappingSelect option[value='"+mappingName+"']").remove();
            }


        })


    }

    self.removeRelationMapping=function(mappingName){
        Mappings.removeRelationMapping(mappingName);


    }


    return self;


})()