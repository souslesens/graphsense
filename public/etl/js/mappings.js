var Mappings=(function(){
    var self={};



    self.saveNodeMapping=function(obj,callback){

        var payload = {
            writeMapping: JSON.stringify(obj)
        }
        MainController.callServer(MainController.jsonDBStoragePath, payload,callback)






    }

    return self;




})()