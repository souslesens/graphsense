var GraphComplexQuery = (function () {
    var self = {};
    self.queryObjects = [];

    self.initDialog = function () {


        $('#GraphComplexQueryMenu').modal('show');
        var labels = Object.keys(DataModel.DBstats.nodes).sort()
        common.fillSelectOptionsWithStringArray("complexQuery_labelSelect", labels, true);


    }
    self.setLabelPropertiesSelect = function (label) {
        if (label == "")
            return;
        var properties = Schema.getLabelProperties(label)
        common.fillSelectOptionsWithStringArray("complexQuery_propertySelect", properties, true);
    }




    self.addQueryObject = function () {
        var queryObj = UI_query.getQueryObjectFromUI("complexQuery")
        if(queryObj.property=="" && queryObj.value!=="")
           return alert(" select a property for value "+queryObj.value)
        var index = self.queryObjects.length
        if (index > 0)
            var distanceFromPrecious = self.calculateLabelsDistance(self.queryObjects[index - 1].label, queryObj.label);
        if (distanceFromPrecious > 1)
            queryObj.distanceFromPrecious = distanceFromPrecious;
        self.queryObjects.push(queryObj)


        var html = "<div class='queryObj' id='complexQuery_queryObjDiv_" + index + "'>" +
            "<span class='queryObjAttr' onclick='GraphComplexQuery.setQueryObjectInResult(" + index + ")'>No</span>" +
            "<span class='queryObjAttr' onclick='GraphComplexQuery.removeQueryObject(" + index + ")'>-</span>"
            + queryObj.text

        $("#complexQuery_queryObjectsDiv").append(html)

    }

    self.removeQueryObject = function (index) {
        self.queryObjects.splice(index, 1)
        $("#complexQuery_queryObjDiv_" + index).remove();
    }
    self.setQueryObjectInResult = function (index) {
        self.queryObjects[index].inResult = ! self.queryObjects[index].inResult;
    }

    self.clear=function(){
        self.queryObjects=[];
        $("#complexQuery_queryObjectsDiv").html("");

    }

    self.validateDialog = function (booleanOption) {
        buildPaths.queryObjs = self.queryObjects;
        RequestProcessor.showGraph("graph", {})

    }

    self.calculateLabelsDistance = function (startLabel, endLabel) {

        var distance = 0;
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
                permittedLabels.forEach(function (childLabel) {
                    if (stop)
                        return;
                    stop = recurse(childLabel, endLabel)
                })
                return stop;
            } else {
                distance += 1
                return true;
            }
        }

        recurse(startLabel, endLabel);
        return distance ;

    }


    return self;
})()
