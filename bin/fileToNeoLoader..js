var multer = require('multer');
var neoProxy = require("../bin/neoProxy")
const csv = require('csv-parser');
var socket = require('../routes/socket.js');
var async = require('async');

const xlsxToNeo = require("../bin/transform/xlsxToNeo..js")
var util = require("./util.js")
var jsonDBStorage = require("../bin/jsonDBStorage..js")
var importDataIntoNeo4j = require("../bin/importDataIntoNeo4j.js");
var neoProxy = require("../bin/neoProxy")
var Readable = require('stream').Readable

var fileToNeoLoader = {

    processForm: function (req, callbackOuter) {
        var xlsxBuffer;
        var mappingsStr;
        var storage = multer.memoryStorage();
        var uploadMaxSize = 100 * 1000 * 1000; //100M;
        var upload = multer({
            storage: storage,
            limits: {fileSize: uploadMaxSize}
        }).any();
        upload(req, null, function (err, data) {
                if (err) {
                    if (callback)
                        callback('Error Occured' + err);
                    return;
                }
                var datasetCollectionName = req.body.datasetCollectionName;
                var selectedNodeMappings = req.body.nodeMappings_MappingSelect;
                var selectedRelationMappings = req.body.relationMappings_MappingSelect;
                var collectionName = req.body.dataset_CollectionSelect;
                var subGraph = req.body.subGraph;
                var replaceSubGraph = req.body.replaceSubGraphCbx
                var nodeImports = [];
                var relationImports = [];
                var xlsSheets = {}
                var extension = null;
                var xlsxFileBuffer = null;


                if(req.files.length==0){
                    var message="ERROR :No File in upload";
                    socket.message(message)
                    return callbackOuter(message);

                }



                async.series([


                        function (callback) {
                            req.files.forEach(function (file) {
                                if (file.fieldname == "file") {
                                    extension = file.originalname.substring(file.originalname.lastIndexOf(".") + 1).toLowerCase().toLowerCase();

                                    // getMappings et set sheets selection sheets set relationImports and nodeImports arrays

                                    if (collectionName) {// import collection
                                        var mappings = jsonDBStorage.getMappings(collectionName);
                                        if (selectedNodeMappings && selectedNodeMappings.length > 0) {
                                            if (!Array.isArray(selectedNodeMappings))
                                                selectedNodeMappings = [selectedNodeMappings]
                                            selectedNodeMappings.forEach(function (mapppingName) {
                                                var mappingObj = mappings.nodes[mapppingName];
                                                if (extension == "xlsx") {
                                                    xlsxFileBuffer = file.buffer
                                                    var sheetName = mappingObj.source.substring(mappingObj.source.indexOf("#") + 1)
                                                    nodeImports.push({type: "xlsx", sheetName: sheetName, mapping: mappingObj})
                                                } else if (extension == "csv") {
                                                    var sheetName = mappingObj.source;
                                                    nodeImports.push({type: "csvDir", sheetName: sheetName, mapping: mappingObj})
                                                }

                                            })
                                        }
                                        if (selectedRelationMappings && selectedRelationMappings.length > 0) {
                                            if (!Array.isArray(selectedRelationMappings))
                                                selectedRelationMappings = [selectedRelationMappings]
                                            selectedRelationMappings.forEach(function (mapppingName) {
                                                var mappingObj = mappings.relations[mapppingName];
                                                if (extension == "xlsx") {
                                                    xlsxFileBuffer = file.buffer
                                                    var sheetName = mappingObj.source.substring(mappingObj.source.indexOf("#") + 1)
                                                    relationImports.push({type: "xlsx", sheetName: sheetName, mapping: mappingObj})
                                                } else if (extension == "csv") {
                                                    var sheetName = mappingObj.source;
                                                    relationImports.push({type: "csvDir", sheetName: sheetName, mapping: mappingObj})
                                                }

                                            })
                                        }

                                    }
                                    else { // pas de collection import des header dans la base locale (appel depuis etl studio)
                                        if (extension == "xlsx") {
                                            fileToNeoLoader.xlsxToNeo(file, datasetCollectionName, function (err, result) {
                                                return callbackOuter(err, result);
                                            })

                                        } else if (extension == "csv") {

                                            fileToNeoLoader.csvToNeo(file, datasetCollectionName, function (err, result) {
                                                return callbackOuter(err, result);
                                            })
                                        }

                                    }
                                }


                            })
                            callback();
                        },


                        function (callback) {// clear suGraph
                            if (replaceSubGraph) {
                                neoProxy.matchCypher("match (n) where n.subGraph='" + subGraph + "' detach delete n", function (err, result) {
                                    if (err)
                                        return callbackOuter(err);
                                    return callback();
                                });


                            }
                            else
                                callback();

                        },
                        function (callback) {// read xls sheets
                            if (xlsxFileBuffer) {
                                var message = "<b>parsing xls file";
                                console.log(message)
                                socket.message(message);
                                xlsxToNeo.extractWorkSheets(xlsxFileBuffer, null, function (err, result) {
                                    xlsSheets = result;
                                    return callback();
                                })
                            }
                            else
                                return callback();

                        },


                        function (callback) {// if nodeMappings
                            async.eachSeries(nodeImports, function (importObj, callbackEach) {
                                    var sheet = xlsSheets[importObj.sheetName];
                                    if (!sheet) {
                                        var message = importObj.sheetName + " does not exist in importing  xlsx"
                                        socket.message(message);
                                        console.log(message);
                                        return callbackEach();
                                    }


                                    xlsxToNeo.worksheetJsonToSouslesensJson(sheet, function (err, sheetJson) {

                                        var params = importObj.mapping;
                                        params.type = "json";
                                        params.data = sheetJson;
                                        params.subGraph = subGraph;

                                        importDataIntoNeo4j.importNodes(params, function (err, result) {
                                            if (err)
                                                return callbackOuter(err.message);
                                            var message = result;
                                            callbackEach(null, message);
                                        })
                                    })

                                }, function (err) {
                                    return callback(err, "done");
                                }
                            )

                        },

                        function (callback) {// if relationMappings
                            async.eachSeries(relationImports, function (importObj, callbackEach) {
                                    var sheet = xlsSheets[importObj.sheetName];
                                    if (!sheet) {
                                        var message = importObj.sheetName + " does not exist in importing  xlsx"
                                        socket.message(message);
                                        console.log(message);
                                        return callbackEach();
                                    }

                                    xlsxToNeo.worksheetJsonToSouslesensJson(sheet, function (err, sheetJson) {
                                        var params = importObj.mapping;
                                        params.type = "json";
                                        params.data = sheetJson;
                                        params.subGraph = subGraph;

                                        importDataIntoNeo4j.importRelations(params, function (err, result) {
                                            if (err)
                                                return callbackOuter(err.message);
                                            var message = result;
                                            callbackEach(null, message);
                                        })
                                    })

                                }, function (err) {
                                    return callback(err, "done");
                                }
                            )


                        },
                        function (callback) {// if nodeMappings
                            if (extension == "xlsx") {
                                callback()
                            } else {
                                callback()
                            }

                        },
                        function (callback) {// if nodeMappings

                            callback()
                        }
                    ],

                    function (err) {
                        return callbackOuter(null, " AlL DONE !!!")

                    })


            }
        )

    }


    ,


    csvToNeo: function (file, datasetCollectionName, callback) {
        var dataArray = [];
        var headers = [];
        var fileName = file.originalname.substring(0, file.originalname.lastIndexOf("."))
        var separator = util.getCsvStringSeparator("" + file.buffer);
        if (!separator)
            return callback("no correct column or line separator in file")
        var count = 0;

        var countLines = 0


        var streamBuffer = new Readable
        streamBuffer.push(file.buffer)
        streamBuffer.push(null)

// With a buffer
        streamBuffer.pipe(csv(
            {
                separator: separator,
                mapHeaders: ({header, index}) =>
                    util.normalizeHeader(headers, header)
                ,


            })
            .on('header', (header) => {
                headers.push(header);
            })

            .on('data', function (data) {

                dataArray.push(data)

            })
            .on('end', function () {
                console.log(countLines)
                var xx = dataArray;
                var yy = headers;


                jsonDBStorage.writeDataset({datasetCollectionName: datasetCollectionName, name: fileName, header: headers});// data: dataArray})
                //  fs.writeFileSync(filePath, JSON.stringify({headers: headers, data: results}, null, 2));
                var result = {
                    message: "file " + fileName + " loaded",
                    name: fileName,
                    header: headers,
                    type: "csvFile",
                    status: "loaded"

                };
                socket.message(result);
                callback(null, result);
            }))
        /*  .on('headers', (headers) => {
              console.log(`First header: ${headers[0]}`)
          })*/


    }

    ,


    xlsxToNeo: function (file, datasetCollectionName, callbackOuter) {


        var sheets = [];
        async.series([
                function (callback) {// read xls sheets

                    var message = "<b>parsing xls file";
                    console.log(message)
                    socket.message(message);
                    xlsxToNeo.extractWorkSheets(file.buffer, null, function (err, result) {
                        sheets = result;
                        return callback();
                    })


                },
                function (callback) {//transform in json
                    for (var key in sheets) {
                        console.log(key)
                        xlsxToNeo.worksheetJsonToSouslesensJson(sheets[key], function (err, result) {
                            if (err)
                                return callback(err)
                            if (result != null)
                                sheets[key] = result;


                        })

                    }
                    return callback();


                },
                function (callback) {// store each sheet in datatbase
                    for (var key in sheets) {
                        var fileName = file.originalname.substring(0, file.originalname.lastIndexOf(".")) + "#" + key;
                        var header = sheets[key].header;
                        if (header && header.length > 0)
                            var header = jsonDBStorage.writeDataset({datasetCollectionName: datasetCollectionName, name: fileName, header: header});// data: dataArray})
                        //  fs.writeFileSync(filePath, JSON.stringify({headers: headers, data: results}, null, 2));

                        var result = {
                            message: "file " + fileName + " loaded",
                            name: fileName,
                            header: header,
                            type: "csvFile",
                            status: "loaded"
                        }
                        socket.message(result);
                    }


                    return callback();


                }


            ],


            function (err) {
                if (err)
                    console.log(err);
                console.log("done");
                return callbackOuter(err, "All Done!")
            })
    }
    ,


}

module.exports = fileToNeoLoader;