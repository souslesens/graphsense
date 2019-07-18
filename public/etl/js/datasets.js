var datasets = (function () {
    var self = {};






    self.loadDatasetCollectionNames = function (callback) {
        var payload = {

            getDatasetCollectionNames: true
        }
        MainController.callServer(MainController.jsonDBStoragePath, payload, function (err, result) {
            if (err)
               return console.log(err);
            result.sort();
            common.fillSelectOptionsWithStringArray("dataset_CollectionSelect", result,true);
            if(callback)
                callback();


        })
    }



    self.initDatasetCollection = function (mappingsetName) {
        context.currentmappingset = mappingsetName;
        var payload = {

            getDatasets: mappingsetName
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

        Mappings.initMappingSet(mappingsetName)


    }
    self.removeDataset = function (datasetName) {
        var payload = {
            removeDataset: 1,
            datasetName:datasetName,
            mappingsetName:context.currentmappingset
        }
        MainController.callServer(MainController.jsonDBStoragePath, payload, function (err, result) {
            if (err)
              return   console.log(err);

           delete  context.datasets[datasetName];
            UI.setDatasets(Object.keys(context.datasets));


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