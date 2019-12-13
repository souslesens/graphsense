var GraphEdgesDialog = (function () {
    var self = {};
    self.queryObjects = [];
var relations=null;
    self.initDialog = function () {
        
        $('#GraphEdgesModalMenu').modal('show');

       relations =Schema.getAllRelationsProperties()
        var relationNames = Object.keys(relations).sort()
        common.fillSelectOptionsWithStringArray("edgesDialog_labelSelect", relationNames,true);



    }
    self.setEdgePropertiesSelect = function (relation) {
        if (relation == "")
            return;
        $('.edgesDialog_propertyPropNameDiv').removeClass("d-none")
        var properties = relations[relation].properties
        common.fillSelectOptionsWithStringArray("edgesDialog_propertySelect", properties, true);
    }




    self.addQueryObject = function () {
        var queryObj = UI_query.getNodeQueryObjectFromUI("edgesDialog")
        if(queryObj.property=="" && queryObj.value!=="")
           return alert(" select a property for value "+queryObj.value)
        var index = self.queryObjects.length
        if (index > 0)
            var distanceFromPrecious = self.calculateLabelsDistance(self.queryObjects[index - 1].label, queryObj.label);
        if (distanceFromPrecious > 1)
            queryObj.distanceFromPrecious = distanceFromPrecious;
        self.queryObjects.push(queryObj)


        var html = "<div class='queryObj' id='edgesDialog_queryObjDiv_" + index + "'>" +
            "<span class='queryObjAttr' onclick='GraphedgesDialog.setQueryObjectInResult(" + index + ")'>No</span>" +
            "<span class='queryObjAttr' onclick='GraphedgesDialog.removeQueryObject(" + index + ")'>-</span>"
            + queryObj.text

        $("#edgesDialog_queryObjectsDiv").append(html)

    }

    self.removeQueryObject = function (index) {
        self.queryObjects.splice(index, 1)
        $("#edgesDialog_queryObjDiv_" + index).remove();
    }
    self.setQueryObjectInResult = function (index) {
        self.queryObjects[index].inResult = ! self.queryObjects[index].inResult;
    }

    self.clear=function(){
        self.queryObjects=[];
        $("#edgesDialog_queryObjectsDiv").html("");

    }

    self.validateDialog = function (booleanOption) {
        buildPaths.queryObjs = self.queryObjects;
        RequestProcessor.showGraph("graph", {})

    }

    self.calculateLabelsDistance = function (startLabel, endLabel) {

        var distance = 1;
        var visitedLabels = {};

        function recurse(startLabel, _endLabel) {
            var endLabel = _endLabel
            if (visitedLabels[startLabel])
                return false;
            visitedLabels[startLabel] = 1;
            var permittedLabels = Schema.getPermittedLabels(startLabel, true, true);
            if (permittedLabels.length == 0)
                return false;
            if (permittedLabels.indexOf(endLabel) < 0) {
                var stop = false;
                distance += 1
                permittedLabels.forEach(function (childLabel) {
                    if (stop)
                        return;
                    stop = recurse(childLabel, endLabel)
                })
                return stop;
            } else {

                return true;
            }
        }

        recurse(startLabel, endLabel);
        return distance ;

    }


    return self;
})()
