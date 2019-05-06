var datasets = (function () {
    var self = {};


    self.loadDatasetNames = function () {
        var payload = {
            jsonDBStorage: true,
            getDatasetNames: true
        }
        MainController.callServer(MainController.jsonDBStoragePath, payload, function (err, result) {
            context.datasets = result;

            UI.setDatasets(result);

        })


    }
    self.removeDataset = function (datasetName) {
        var payload = {
            removeDataSet: datasetName
        }
        MainController.callServer(MainController.jsonDBStoragePath, payload, function (err, result) {
            if (err) ;

            var index = context.datasets.indexOf(datasetName);
            context.datasets.splice(index, 1);
            UI.setDatasets(context.datasets);


        })

    }

    self.setCurrentNodeDataset = function (datasetName) {
        var payload = {
            getDataset: JSON.stringify({query: {name: datasetName}, fields: ["header"]})
        }
        MainController.callServer(MainController.jsonDBStoragePath, payload, function (err, result) {
            if (err) ;
            context.currentDataSet = {name:datasetName, header:result.header};

            UI.setMappingFieldsFromHeader(result.header);


        })


    }


    return self;
})()