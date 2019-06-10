var Layouts=(function(){
    var self={};

    self.formatNodeDetailsInfo = function (obj) {
        var str = "";
        var imageBlog;

        var keysToExclude = ["name", "imageBlog", "subGraph", "myId"];
        var orderedKeys = [];

        str = "<table class='table table-bordered'><thead><tr><th scope='col'>Property Name</th><th scope='col'>Property Value</th></tr></thead><tbody>";
        for (var i = 0; i < orderedKeys.length; i++) {
            var key = orderedKeys[i];
            if (obj[key])
                str += "<tr><th scope='row'>" + key + "</th><td>" + obj[key] + "</td></tr>";
        }
        
        for (var key in obj) {  // to be finished
            if (key == "path") {
                self.decodePath(obj[key]);
                toutlesensController.showThumbnail(str);
                obj[key] = "<a href='javascript:showImage(\"" + encodeURI(Gparams.imagesRootPath + str) + "\")'>voir <a/>";
            }
            if (obj[key] && ("" + obj[key]).toLowerCase().indexOf("http") == 0)
                obj[key] = "<a href='" + decodeURIComponent(obj[key])
                    + "' target =='_blank'>cliquez ici</a>"

            if (obj["imageBlog"]) {
                imageBlog = obj["imageBlog"];

                externalRessourcesCommon.generateExternalImg(imageBlog);

            }

            if (keysToExclude.indexOf(key) < 0 && orderedKeys.indexOf(key) < 0)
                str += "<tr><th scope='row'>" + key + "</th><td>" + obj[key] + "</td></tr>";    
        }
        str += "</tbody></table>";
        str += "<br> NeoId:" +obj.neoId;
        return str;

    }

    self.formatNodeRelationsInfo = function (dataset, options) {
        //var str = "<ul>";
        var str = "<table class='table table-bordered'><thead><tr><th scope='col'>Relation Name</th><th scope='col'>Direction</th><th scope='col'>Node Label</th><th scope='col'>Node Name</th></tr></thead><tbody>";

        dataset.forEach(function(relation){
            var relStr;

            var relationType  = relation.r.type;
            var nodeType = relation.m.labels[0];
            var nodeName = relation.m.properties[Schema.getNameProperty()];
            var relationDirection ="";

            if(relation.r._fromId==relation.n._id)
                relationDirection = "->"
                //relStr="   -"+relation.r.type+"->"+"["+relation.m.labels[0]+"]"+ relation.m.properties[Schema.getNameProperty()];
            else
                relationDirection = "<-"
                //relStr="   <-"+relation.r.type+"-"+"["+relation.m.labels[0]+"]"+relation.m.properties[Schema.getNameProperty()];
                //str += "<li>"+relStr+"</li>";
            str += "<tr><th scope='row'>" + relationType + "</th><td style='text-align:center'>" + relationDirection + "</td><td>" + nodeType + "</td><td>" + nodeName + "</td></tr>";

            })

        //str += "</ul>";
        str += "</tbody></table>";
        return str;
    }


    self.formatNodeNeighboursInfo = function (dataset,options) {
        //var str = "<ul>";
        var str = "<table class='table table-bordered'><thead><tr><th scope='col'>Node Label</th><th scope='col'>Node Value</th></tr></thead><tbody>";

        dataset.forEach(function(relation){
            var nodeType;
            var nodeValue;
            var targetNode;
            if(relation.r._fromId==relation.n._id) {
                nodeType = relation.m.labels[0];
                nodeValue = relation.m.properties[Schema.getNameProperty()];
                //neighboursStr = "[" + relation.m.labels[0] + "]" + relation.m.properties[Schema.getNameProperty()];
                targetNode=relation.m._id;
            }
            else {
                nodeType = relation.m.labels[0];
                nodeValue = relation.m.properties[Schema.getNameProperty()];
                //neighboursStr = "[" + relation.m.labels[0] + "]" + relation.m.properties[Schema.getNameProperty()];
                targetNode = relation.m._id;
            }

            if(options && options.onNodeClick) {
                nodeValue = "<a href='javascript:"+options.onNodeClick+"("+targetNode+")'>"+nodeValue+"</a>"
                //neighboursStr="<a href='javascript:"+options.onNodeClick+"("+targetNode+")'>"+neighboursStr+"</a>"
            }


            //str += "<li>"+neighboursStr+"</li>";
            str += "<tr><th scope='row'>" + nodeType + "</th><td>" + nodeValue + "</td></tr>";

        })
        //str += "</ul>";
        str += "</tbody></table>";
        return str;
    }

        return self;


})();