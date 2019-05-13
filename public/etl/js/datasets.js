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

            getDatasets: datasetCollectionName
        }
        MainController.callServer(MainController.jsonDBStoragePath, payload, function (err, result) {
            if (err) ;

            context.datasets = result;

            context.nodeMappings={};
            context.relationMappings= [];
            var names=Object.keys(result);
            names.sort();


            UI.setDatasets(names);

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
     /*   var payload = {
            getDataset:  datasetName
        }
        MainController.callServer(MainController.jsonDBStoragePath, payload, function (err, result) {
            if (err) ;
            context.currentDataSet = {name:datasetName, header:result.header};*/
        context.currentDataSet=context.datasets[ datasetName]
            UI.setMappingFieldsFromHeader(context.currentDataSet.header);


     //   })


    }



    return self;
})()