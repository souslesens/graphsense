var GraphComplexQuery = (function () {
    var self = {};
    self.queryObjects = [];
    var relations;
    var currentObjectType = null;
    self.initDialog = function () {

        $('.wrapper').removeClass('active');
        $('#GraphComplexQueryMenu').modal('show');
        $('.complexQuery_propertyDiv').addClass("d-none")
        $('.complexQuery_propertyPropNameDiv').addClass("d-none")

        var labels = Schema.getAllLabelNames();
        common.fillSelectOptionsWithStringArray("complexQuery_labelSelect", labels, true);


        relations = Schema.getAllRelationsProperties()
        var relationNames = Object.keys(relations).sort()
        common.fillSelectOptionsWithStringArray("complexQuery_relationSelect", relationNames, true);


    }
    self.setLabelPropertiesSelect = function (label) {
        currentObjectType = "label";
        if (label == "")
            return;
        $('.complexQuery_propertyPropNameDiv').removeClass("d-none")
        var properties = Schema.getLabelProperties(label)
        common.fillSelectOptionsWithStringArray("complexQuery_propertySelect", properties, true);
    }

    self.setRelationPropertiesSelect = function (relation) {
        currentObjectType = "relation";
        if (relation == "")
            return;
        $('.complexQuery_propertyPropNameDiv').removeClass("d-none")
        var properties = relations[relation].properties
        common.fillSelectOptionsWithStringArray("complexQuery_propertySelect", properties, true);
    }


    self.addQueryObject = function () {

        if (currentObjectType == "relation") {
            var queryObj = UI_query.getRelationQueryObjectFromUI("complexQuery")
            self.queryObjects.push(queryObj)
        } else if (currentObjectType == "label") {

            var queryObj = UI_query.getNodeQueryObjectFromUI("complexQuery")

            var index = self.queryObjects.length
            if (index > 0)
                var distanceFromPrecious = self.calculateLabelsDistance(self.queryObjects[index - 1].label, queryObj.label);
            if (distanceFromPrecious > 1)
                queryObj.distanceFromPrecious = distanceFromPrecious;
            self.queryObjects.push(queryObj)
        }

        if (queryObj.property == "" && queryObj.value !== "")
            return alert(" select a property for value " + queryObj.value)


        var html = "<div class='queryObj' id='complexQuery_queryObjDiv_" + index + "'>" +
            "<span class='queryObjAttr' onclick='GraphComplexQuery.setQueryObjectInResult(" + index + ")'>No</span>" +
            "<span class='queryObjAttr' onclick='GraphComplexQuery.removeQueryObject(" + index + ")'>-</span>"
            + queryObj.text

        $("#complexQuery_queryObjectsDiv").append(html)
        $('.complexQuery_propertyDiv').addClass("d-none")
        $('.complexQuery_propertyPropNameDiv').addClass("d-none")
        $('#complexQuery_valueInput').val("");

    }

    self.removeQueryObject = function (index) {
        self.queryObjects.splice(index, 1)
        $("#complexQuery_queryObjDiv_" + index).remove();
    }
    self.setQueryObjectInResult = function (index) {
        self.queryObjects[index].inResult = !self.queryObjects[index].inResult;
    }

    self.clear = function () {
        self.queryObjects = [];
        $("#complexQuery_queryObjectsDiv").html("");

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
        return distance;

    }


    return self;
})()
