var datasets = (function () {
    var self = {};






    self.loadDatasetCollectionNames = function () {
        var payload = {

            getDatasetCollectionNames: true
        }
        MainController.callServer(MainController.jsonDBStoragePath, payload, function (err, result) {
            if (err) ;
            result.sort();
            common.fillSelectOptionsWithStringArray("dataset_CollectionSelect", result,true)


        })
    }



    self.initDatasetCollection = function (datasetCollectionName) {
        context.currentmappingset = datasetCollectionName;
        var payload = {

            getDatasetNames: datasetCollectionName
        }
        MainController.callServer(MainController.jsonDBStoragePath, payload, function (err, result) {
            if (err) ;
            result.sort();
            context.datasets = result;

            UI.setDatasets(result);

        })

        Mappings.initMappingSet(datasetCollectionName)


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

    self.setCurrentDataset = function (datasetName) {
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