var Layouts=(function(){
    var self={};

    self.formatNodeDetailsInfo = function (obj) {
        var str = "";
        var imageBlog;

        var keysToExclude = ["name", "imageBlog", "subGraph", "myId"];
        var orderedKeys = [];

        for (var i = 0; i < orderedKeys.length; i++) {
            var key = orderedKeys[i];
            if (obj[key])
                str += "<i>" + key + "</i> : " + obj[key] + "<br>";
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
                str += "<b>" + key + "</b> : " + obj[key] + "<br>";
        }

        str += "<br> NeoId:" +obj.neoId;
        return str;

    }

    self.formatNodeRelationsInfo = function (dataSet,options) {
        var str = "<ul>";

        dataSet.forEach(function(relation){
            var relStr;

if(relation.r._fromId==relation.n._id)
            relStr="   -"+relation.r.type+"->"+"["+relation.m.labels[0]+"]"+relation.m.properties[Schema.getNameProperty()];
          else

    relStr="   <-"+relation.r.type+"-"+"["+relation.m.labels[0]+"]"+relation.m.properties[Schema.getNameProperty()];


            str += "<li>"+relStr+"</li>";
        })
        str += "</ul>";
        return str;

    }


    self.formatNodeNeighboursInfo = function (dataSet,options) {
        var str = "<ul>";

        dataSet.forEach(function(relation){
            var neighboursStr;
            var targetNode;
            if(relation.r._fromId==relation.n._id) {
                neighboursStr = "[" + relation.m.labels[0] + "]" + relation.m.properties[Schema.getNameProperty()];
                targetNode=relation.m._id;
            }
            else {
                neighboursStr = "[" + relation.m.labels[0] + "]" + relation.m.properties[Schema.getNameProperty()];
                targetNode=relation.m._id;
            }

            if(options && options.onNodeClick)
                neighboursStr="<a href='javascript:"+options.onNodeClick+"("+targetNode+")'>"+neighboursStr+"</a>"


            str += "<li>"+neighboursStr+"</li>";
        })
        str += "</ul>";
        return str;




    }






        return self;


})();