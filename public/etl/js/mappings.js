var Mappings=(function(){
    var self={};



    self.saveNodeMapping=function(obj,callback){

        var payload = {
            writeMapping: JSON.stringify(obj)
        }
        MainController.callServer(MainController.jsonDBStoragePath, payload,callback)

    }
    self.loadMappingNames=function(){
        var payload = {
            getMapping: JSON.stringify({query:"*"})
        }
        MainController.callServer(MainController.jsonDBStoragePath,payload,function(err, result){
            if(err)
                return $("#messageDiv").html(err);

            var nodeNames=[]
            var relationNames=[]
            result.forEach(function(mapping){
                if(mapping.type=="node") {
                    nodeNames.push(mapping.name)
                    context.nodeMappings[mapping.name]=mapping;
                }
                else {
                    relationNames.push(mapping.name);
                    context.relationMappings[mapping.name]=mapping;
                }


            })
            common.fillSelectOptionsWithStringArray("nodeMappings_MappingSelect",nodeNames);
            common.fillSelectOptionsWithStringArray("relationMappings_MappingSelect",relationNames);
        })


    }


    return self;




})()