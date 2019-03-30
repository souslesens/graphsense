Tree=(function(){
    var self={};

    self.selection = [];
    self.selectionName = "";
    self.currentNode;
    self.initiated = false;
    self.loadedNodes = [];
    self.currentRootNeoId;
    self.currentType;


    self.getNodes = function (type, rootNeoId, callback) {
        var relType
        if (type == 'physicalClass') {
            relType = "childOf"
            //  context.queryObject.label = "tag";
        }
        else if (type == 'functionalClass') {
            relType = 'childOf';

        }
        var payload = {
            generateTreeFromChildToParentRelType: 1,
            label: type,
            relType: relType,
            rootNeoId: rootNeoId
        }


        $.ajax({
            type: "POST",
            url: neoUrl,
            dataType: "json",
            data: payload,
            success: function (data, textStatus, jqXHR) {
                var jsTreeData = []
                data.forEach(function (line, index) {
                    if (self.loadedNodes.indexOf(line.id) < 0) {
                        self.loadedNodes.push(line.id)
                        jsTreeData.push(line)
                    }

                })
                return callback(null, jsTreeData)
            },
            error: function (error) {
                return callback(error)
            }
        })
    }





    return self;


})()