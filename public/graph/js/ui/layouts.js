var Layouts=(function(){
    var self={};

    self.formatNodeInfo = function (obj) {
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
                str += "<i>" + key + "</i> : " + obj[key] + "<br>";
        }

        str += "<br> NeoId:" +obj.id;
        return str;

    }







    return self;


})();