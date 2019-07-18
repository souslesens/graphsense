const async = require('async');
const jsonDBStorage = require('../jsonDBStorage.')
const importDataIntoNeo4j = require('../importDataIntoNeo4j');
const fileToNeoLoader = require('../fileToNeoLoader.');
const neoProxy = require('../neoProxy');
const xlsxToNeo = require('../transform/xlsxToNeo.');
const fs = require('fs');


const EntitiesGraph = {
    buildGraph: function (allParams, callBackOuter) {


        async.eachSeries(allParams.mappings, function (params, callbackEachMainParams) {
//return callbackEachMainParams();
                params.subGraph = allParams.subGraph;

                var nodeImports = [];
                var relationImports = [];
                var xlsSheets = null;
                var fileMappingsMap = {}
                async.series([

//loadMappings
                        function (callbackSeries) {
                            var nodeNames = []
                            var relationNames = [];
                            jsonDBStorage.getMappings(params.mappingSetName, function (err, mappingSet) {
                                if (err)
                                    return callBackOuter(err)
                                for (var key in mappingSet.nodes) {
                                    nodeNames.push(key)
                                }

                                for (var key in mappingSet.relations) {
                                    relationNames.push(key)
                                }


                                nodeNames.forEach(function (mappingName) {

                                    if (params.mappingSetNodeMappings && params.mappingSetNodeMappings.indexOf(mappingName) < 0)
                                        return;


                                    var mappingObj = mappingSet.nodes[mappingName];
                                    var sheetName = mappingObj.source.substring(mappingObj.source.indexOf("#") + 1);
                                    ;
                                    var fileName = mappingObj.source.substring(0, mappingObj.source.indexOf("#"));
                                    if (!fileMappingsMap[fileName])
                                        fileMappingsMap[fileName] = []
                                    fileMappingsMap[fileName].push(mappingName);
                                    nodeImports.push({type: "xlsx", sheetName: sheetName, mapping: mappingObj})
                                })

                                relationNames.forEach(function (mappingName) {
                                    if (params.mappingSetRelationMappings && params.mappingSetRelationMappings.indexOf(mappingName) < 0)
                                        return;
                                    var mappingObj = mappingSet.relations[mappingName];
                                    var sheetName = mappingObj.source.substring(mappingObj.source.indexOf("#") + 1)
                                    var fileName = mappingObj.source.substring(0, mappingObj.source.indexOf("#"));
                                    if (!fileMappingsMap[fileName])
                                        fileMappingsMap[fileName] = []
                                    fileMappingsMap[fileName].push(mappingName);
                                    relationImports.push({type: "xlsx", sheetName: sheetName, mapping: mappingObj})


                                })
                                callbackSeries();
                            })
                        },
                        // clear suGraph
                        function (callbackSeries) {
                            if (params.replaceGraph) {
                                neoProxy.matchCypher("match (n) where n.subGraph='" + params.subGraph + "' detach delete n", function (err, result) {
                                    if (err)
                                        return callBackOuter(err);
                                    return callbackSeries();
                                });
                            }
                            else
                                callbackSeries();

                        },


//import nodes for each file
                        function (callbackSeries) {// if nodeMappings
                            if (!fs.statSync(params.xlsxFileOrDir).isFile()) {
                                fileMappingsMap[params.xlsxFileOrDir] = [];
                            } else {
                                ;// file mappings already set
                            }
                            var fileNames = Object.keys(fileMappingsMap);
                            if (fileNames.length == 0)
                                return callBackOuter("no files associated")
                            // pour chaque fichier avec ses mappings
                            async.eachSeries(fileNames, function (fileName, callbackEachFile) {


                                var fileMapping = fileMappingsMap[fileName];
                                var file;
                                if (fs.statSync(params.xlsxFileOrDir).isDirectory()) {// fichiers déclarés dans mappings
                                    file = params.xlsxFileOrDir + fileName + ".xlsx"
                                    try {
                                        if (!fs.statSync(file).isFile()) {
                                            return callbackEachFile(file + " does not not exists")
                                        }
                                    }
                                    catch (e) {
                                        console.log(e)
                                        return callbackEachFile();
                                    }
                                }
                                else {// fichier déclaré dans params
                                    file = params.xlsxFileOrDir;

                                }


                                xlsxToNeo.extractWorkSheets(file, null, function (err, xlsSheets) {
                                    if (err)
                                        return callBackOuter(err);
                                    if (nodeImports.length == 0)
                                        return callbackEachFile()
                                    async.eachSeries(nodeImports, function (importObj, callbackEachNode) {
                                            var sheet = null;
                                            if (fileMapping.length > 0 && fileMapping.indexOf(importObj.mapping.name) < 0) {// on importe que les mappings du fichier source
                                                return callbackEachNode();
                                            }
                                            else {
                                                sheet = xlsSheets[importObj.sheetName];

                                            }

                                            if (!sheet) {
                                                var message = importObj.sheetName + " does not exist in importing  xlsx"
                                                //   socket.message(message);
                                                console.log(message);
                                                return callbackEachNode();
                                            }

                                            xlsxToNeo.worksheetJsonToSouslesensJson(sheet, function (err, sheetJson) {
                                                if (err)
                                                    return callBackOuter(err);

                                                var options = importObj.mapping;
                                                options.type = "json";
                                                options.data = sheetJson;
                                                options.subGraph = params.subGraph;

                                                importDataIntoNeo4j.importNodes(options, function (err, result) {
                                                    if (err) {
                                                        console.log(err.message)
                                                        return callbackEachNode(err.message);
                                                    }
                                                    var message = result;
                                                    console.log(message);
                                                    callbackEachNode(null, message);
                                                })
                                            })
                                        }, function (err) {
                                            return callbackEachFile();

                                        }
                                    )
                                })
                            }, function (err) {
                                return callbackSeries();
                            })

                        }

                        ,
// import des relations pour chaque fichier
                        function (callbackSeries) {// if nodeMappings
                            if (!fs.statSync(params.xlsxFileOrDir).isFile()) {
                                fileMappingsMap[params.xlsxFileOrDir] = [];
                            } else {
                                ;// file mappings already set
                            }
                            var fileNames = Object.keys(fileMappingsMap);
                            if (fileNames.length == 0)
                                return callBackOuter("no files associated");
                            // pour chaque fichier avec ses mappings
                            async.eachSeries(fileNames, function (fileName, callbackEachFile) {

                                var fileMapping = fileMappingsMap[fileName];
                                var file;
                                if (fs.statSync(params.xlsxFileOrDir).isDirectory()) {// fichiers déclarés dans mappings
                                    file = params.xlsxFileOrDir + fileName + ".xlsx"
                                    try {
                                        if (!fs.statSync(file).isFile()) {
                                            return callbackEachFile(file + " does not not exists")
                                        }
                                    }
                                    catch (e) {
                                        console.log(e)
                                        return callbackEachFile();
                                    }
                                }
                                else {// fichier déclaré dans params
                                    file = params.xlsxFileOrDir;

                                }

                                xlsxToNeo.extractWorkSheets(file, null, function (err, xlsSheets) {
                                    if (err)
                                        return callBackOuter(err);

                                    if (relationImports.length == 0)
                                        return callbackEachFile();
                                    async.eachSeries(relationImports, function (importObj, callbackEachNode) {
                                            if (fileMapping.length > 0 && fileMapping.indexOf(importObj.mapping.name) < 0) {// on importe que les mappings du fichier source
                                                return callbackEachNode();
                                            }
                                            else {
                                                sheet = xlsSheets[importObj.sheetName];

                                            }

                                            if (fileMapping.length > 0 && fileMapping.indexOf(importObj.name) < 0)// on importe que les mappings du fichier source
                                                var sheet = xlsSheets[importObj.sheetName];
                                            if (!sheet) {
                                                var message = importObj.sheetName + " does not exist in importing  xlsx"
                                                // socket.message(message);
                                                console.log(message);
                                                return callbackEachNode();
                                            }

                                            xlsxToNeo.worksheetJsonToSouslesensJson(sheet, function (err, sheetJson) {
                                                if (err)
                                                    return callBackOuter(err);

                                                var options = importObj.mapping;
                                                options.type = "json";
                                                options.data = sheetJson;
                                                options.subGraph = params.subGraph;

                                                importDataIntoNeo4j.importRelations(options, function (err, result) {
                                                    if (err) {
                                                        console.log(err.message)
                                                        return callbackEachNode(err.message);
                                                    }
                                                    var message = result;
                                                    console.log(message)
                                                    callbackEachNode(null, message);
                                                })
                                            })
                                        }, function (err) {
                                            return callbackEachFile();

                                        }
                                    )
                                })
                            }, function (err) {
                                return callbackSeries();
                            })

                        },


                        function (callbackSeries) {// end each series (all params array)
// import form xlsx sheets is done for all items in allParams



                            async.series([ // create post import relations


                                function (callbackSeries) {// chainage des paragraphes
                                    var cypher = "match(n:Paragraph)-->(:Chapter)<--(m:Paragraph) where n.subGraph=\"" + allParams.subGraph + "\"   and m.TextOffset-n.TextOffset=1 create (n)-[:precede]->(m)";
                                    neoProxy.match(cypher, function (err, result) {
                                        callbackSeries(err);
                                    })
                                },
                                function (callbackSeries) {// create post import relations
                                    return callbackSeries();
                                    var cypher = " match(n:Concept)-[:instanceOf]-(m)--(p:Paragraph) where n.subGraph=\"" + allParams.subGraph + "\"  create (p)-[:hasConcept]->(n)";
                                    neoProxy.match(cypher, function (err, result) {
                                        callbackSeries(err);
                                    })
                                }


                            ], function (err) {
                                if (err)
                                    console.log(err);
                                console.log("postImport processing done")
                                callbackSeries(err);

                            })


                        }

                    ],

                    function (err) {//en series
                        callbackEachMainParams(err);

                    }
                )
            }, function (err) {
                callBackOuter(err)
            }
        )


    }
}


module.exports = EntitiesGraph;

var allParams = {
    subGraph: "entitiesGraph3",
    mappings: [
       {
              mappingSetName: "thesaurusTotal",
              xlsxFileOrDir: "D:\\Total\\graphNLP\\thesaurus.xlsx",
              subGraph: "entitiesGraph4",
              replaceGraph: true,

          },
        {
            mappingSetName: "graphNlp",
            xlsxFileOrDir: "D:\\Total\\graphNLP\\17_06\\",
            replaceGraph: false,
            mappingSetNodeMappings: ["Paragraph", "Chapter", "Component", "Equipment", "Phenomenon", "Method", "Product", "Characterisation", "Vibration", "Time", "Temperature","Document",],
            mappingSetRelationMappings: [

                "Paragraph-hasEntity->Equipment",
                "Paragraph-hasEntity->Phenomenon",
                "Paragraph-hasEntity->Component",
                "Paragraph-hasEntity->Characterisation",
                "Paragraph-hasEntity->Time",
                "Paragraph-hasEntity->Temperature",
                "Paragraph-hasEntity->Vibration",
                "Paragraph-hasEntity->Method",
                "Paragraph-hasEntity->Product",

                "Paragraph-inDocument->Document",
                "Document-hasEntity->Equipment",
                "Document-hasEntity->Phenomenon",
                "Document-hasEntity->Component",
                "Document-hasEntity->Characterisation",
                "Document-hasEntity->Time",
                "Document-hasEntity->Temperature",
                "Document-hasEntity->Vibration",
                "Document-hasEntity->Method",
                "Document-hasEntity->Product",

                "Paragraph-inChapter->Chapter",
                "Chapter-hasEntity->Equipment",
                "Chapter-hasEntity->Phenomenon",
                "Chapter-hasEntity->Component",
                "Chapter-hasEntity->Characterisation",
                "Chapter-hasEntity->Time",
                "Chapter-hasEntity->Temperature",
                "Chapter-hasEntity->Vibration",
                "Chapter-hasEntity->Method",
                "Chapter-hasEntity->Product",

                "ThesaurusConcept-childConceptOf->ThesaurusConcept",
                "Equipment-parentOf->Equipment",
                "Component-hasConcept->ThesaurusConcept",
                "Paragraph-inChapter->Chapter",


            ]
        }
    ]
}


EntitiesGraph.buildGraph(allParams, function (err, result) {
    var x = result;
    if (err)
        console.log(err)
});