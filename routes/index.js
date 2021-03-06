var express = require('express');
var router = express.Router();


var neoProxy = require('../bin/neoProxy.js');

var httpProxy = require('../bin/httpProxy.js');
var fileUpload = require('../bin/fileUpload.js');
var jsonFileStorage = require('../bin/jsonFileStorage.js');
var importDataIntoNeo4j = require('../bin/importDataIntoNeo4j.js');
var exportToNeoBatch = require('../bin/exportToNeoBatch.js');
var uploadToNeo = require('../bin/uploadToNeo.js');
var uploadCsvForNeo = require('../bin/uploadCsvForNeo.js');

var serverParams = require("../bin/serverParams.js")
var socket = require('./socket.js');
var fileSystemProxy = require("../bin/fileSystemProxy..js")
var authentication = require("../bin/authentication..js")
var neoToJstree = require("../bin/transform/neoToJsTree..js")

var xlsxToNeoLoader = require("../bin/xlsxToNeoLoader..js")
var fileToNeoLoader = require("../bin/fileToNeoLoader..js")

var xlsxToNeo = require("../bin/transform/xlsxToNeo..js")
var jsonDBStorage = require("../bin/jsonDBStorage..js")






console.log("***********************serverParams.routesRootUrl " + serverParams.routesRootUrl + "*********")

/*const cors = require('cors');
 var app = express();
 app.use(cors()); // use CORS for all requests and all routes*/


router.get('/:url', function (req, res) {
    url = req.params.url;
    console.log(url);

});


router.get(serverParams.routesRootUrl + '/', function (req, res) {
    res.render('index', {title: 'Express'});
});

router.post(serverParams.routesRootUrl + '/test', function (req, response) {
    res.render('index', {title: 'TEST'});
});
router.post(serverParams.routesRootUrl + '/neo', function (req, response) {
    if (req.body && req.body.match)
        neoProxy.match(req.body.match, function (error, result) {
            //  neoProxy.matchRest(req.body.match, function (error, result) {
            processResponse(response, error, result)
        });
    if (req.body && req.body.cypher) {
        neoProxy.cypher("", req.body.urlSuffix, req.body.payload, function (error, result) {
            processResponse(response, error, result)
        });
    }
    if (req.body && req.body.executeStatements) {
        neoProxy.executeStatements(req.body.statements, function (error, result) {
            processResponse(response, error, result)
        });
    }


    if (req.body && req.body.generateTreeFromChildToParentRelType)
        neoToJstree.generateTreeFromChildToParentRelType(req.body.label, req.body.relType, req.body.rootNeoId, function (error, result) {
            processResponse(response, error, result)
        });
    if (req.body && req.body.generateTreeFromParentToChildrenRelType)
        neoToJstree.generateTreeFromParentToChildrenRelType(req.body.label, req.body.relType, req.body.rootNeoId, function (error, result) {
            processResponse(response, error, result)
        });
    if (req.body && req.body.generateAllDescendantsTreeFromChildToParentRelType)
        neoToJstree.generateAllDescendantsTreeFromChildToParentRelType(req.body.label, req.body.relType, req.body.rootNeoId, req.body.depth, function (error, result) {
            processResponse(response, error, result)
        });


});


router.post(serverParams.routesRootUrl + '/source', function (req, response) {
    if (req.body && req.body.find)
        mongoProxy.find(req.body.dbName, req.body.collectionName, req.body.sourceQuery, function (error, result) {
            processResponse(response, error, result)
        });
    if (req.body && req.body.distinct)
        mongoProxy.distinct(req.body.dbName, req.body.collectionName, req.body.field, req.body.sourceQuery, function (error, result) {
            processResponse(response, error, result)
        });
    if (req.body && req.body.insert)
        mongoProxy.insert(req.body.dbName, req.body.collectionName, req.body.data, function (error, result) {
            processResponse(response, error, result)
        });
    if (req.body && req.body.insertOne)
        mongoProxy.insertOne(req.body.dbName, req.body.collectionName, req.body.data, function (error, result) {
            processResponse(response, error, result)
        });
    if (req.body && req.body.updateOrCreate)
        mongoProxy.updateOrCreate(req.body.dbName, req.body.collectionName, req.body.query, req.body.data, function (error, result) {
            processResponse(response, error, result)
        });
    if (req.body && req.body.delete)
        mongoProxy.delete(req.body.dbName, req.body.collectionName, req.body.query, function (error, result) {
            processResponse(response, error, result)
        });
    if (req.body && req.body.listDatabases)
        mongoProxy.listDatabases(function (error, result) {
            processResponse(response, error, result)
        });
    if (req.body && req.body.listCollections)
        mongoProxy.listCollections(req.body.dbName, function (error, result) {
            processResponse(response, error, result)
        });
    if (req.body && req.body.listFields)
        mongoProxy.listFields(req.body.dbName, req.body.collectionName, function (error, result) {
            processResponse(response, error, result)
        });


});
router.post(serverParams.routesRootUrl + '/elastic', function (req, response) {
    if (req.body && req.body.searchWordAll)
        elasticProxy.searchWordAll(req.body.searchWordAll, function (error, result) {
            processResponse(response, error, result)
        });
    else if (req.body && req.body.searchDo)
        elasticProxy.searchUI.search(req.body.indexName, req.body.type, req.body.payload, function (error, result) {
            processResponse(response, error, result)
        });
    else if (req.body && req.body.indexOneDoc)
        elasticProxy.indexOneDoc(req.body.indexName, req.body.type, req.body.id, req.body.payload, function (error, result) {
            processResponse(response, error, result)
        });

    else if (req.body && req.body.findTerms)
        elasticProxy.findTerms(req.body.indexName, req.body.type, req.body.field, req.body.terms, function (error, result) {
            processResponse(response, error, result)
        });

    else if (req.body && req.body.findDocuments)
        elasticProxy.findDocuments(req.body.options, function (error, result) {
            processResponse(response, error, result)
        });
    else if (req.body && req.body.findDocumentsById)
        elasticProxy.findDocumentsById(req.body.indexName, req.body.ids, req.body.words, function (error, result) {
            processResponse(response, error, result)
        });

    else if (req.body && req.body.findByIds)
        elasticProxy.findByIds(req.body.options.indexName, req.body.ids, req.body.returnFields, function (error, result) {
            processResponse(response, error, result)
        });


    else if (req.body && req.body.getAssociatedWords)
        elasticProxy.getAssociatedWords(req.body.indexName, req.body.word, req.body.size, req.body.options, function (error, result) {
            processResponse(response, error, result)
        });
    else if (req.body && req.body.indexDocDirInNewIndex)
        elasticProxy.indexDocDirInNewIndex(req.body.indexName, req.body.type, req.body.rootDir, req.body.doClassifier, null, function (error, result) {
            processResponse(response, error, result)
        });
    else if (req.body && req.body.indexDirInExistingIndex)
        elasticProxy.indexDirInExistingIndex(req.body.indexName, req.body.type, req.body.rootDir, req.body.doClassifier, null, function (error, result) {
            processResponse(response, error, result)
        });
    else if (req.body && req.body.indexCsvFile)
        elasticProxy.indexCsvFile(req.body.indexName, req.body.newIndex, req.body.file, function (error, result) {
            processResponse(response, error, result)
        });
    else if (req.body && req.body.indexJsonFile)
        elasticProxy.indexjsonFile(req.body.indexName, req.body.newIndex, req.body.file, function (error, result) {
            processResponse(response, error, result)
        });

    else if (req.body && req.body.indexSqlTable)
        elasticProxy.indexSqlTable(req.body.connection, req.body.sql, req.body.elasticIndex, req.body.elasticType, function (error, result) {
            processResponse(response, error, result)
        });
    else if (req.body && req.body.indexSqlTableInNewIndex)
        elasticProxy.indexSqlTableInNewIndex(req.body.connection, req.body.sql, req.body.elasticIndex, req.body.settings, req.body.elasticType, function (error, result) {
            processResponse(response, error, result)
        });

    else if (req.body && req.body.createIndexClassifierFromWordsListAndOntology)
        classifierManager.createIndexClassifierFromWordsListAndOntology(req.body.indexName, req.body.words, req.body.ontologies, req.body.lang, parseInt("" + req.body.nSkosAncestors), function (error, result) {
            processResponse(response, error, result)
        });

    else if (req.body && req.body.createIndexClassifierFromElasticFrequentWordsAndOntology)
        classifierManager.createIndexClassifierFromElasticFrequentWordsAndOntology(req.body.indexName, parseInt("" + req.body.nWords), req.body.includedWords, req.body.excludedWords, parseInt("" + req.body.minFreq), req.body.ontologies, req.body.lang, parseInt("" + req.body.nSkosAncestors), function (error, result) {
            processResponse(response, error, result)
        });

    else if (req.body && req.body.findSimilarDocuments)
        elasticProxy.findSimilarDocuments(req.body.indexName, req.body.docId, parseInt("" + req.body.minScore), parseInt("" + req.body.size), function (error, result) {
            processResponse(response, error, result)
        });
    else if (req.body && req.body.loadSkosClassifier)
        skos.loadClassifier(req.body.indexName, function (error, result) {
            processResponse(response, error, result)
        });
    else if (req.body && req.body.saveSkosClassifier)
        skos.saveSkosClassifier(req.body.indexName, function (error, result) {
            processResponse(response, error, result)
        });
    else if (req.body && req.body.indexsourceCollection)
        elasticProxy.indexsourceCollection(req.body.sourceDB, req.body.sourceCollection, req.body.sourceQuery, req.body.elasticIndex, req.body.elasticType, function (error, result) {
            processResponse(response, error, result)
        });
    else if (req.body && req.body.deleteDoc)
        elasticProxy.deleteDoc(req.body.index, req.body.type, req.body.elasticId, function (error, result) {
            processResponse(response, error, result)
        });

    else if (req.body && req.body.indexJsonArray)
        elasticProxy.indexJsonArray(req.body.index, req.body.type, req.body.array, options, function (error, result) {
            processResponse(response, error, result)
        });
    else if (req.body && req.body.getMappingsFields)
        elasticProxy.getMappingsFields(req.body.index, function (error, result) {
            processResponse(response, error, result)
        });


    else if (req.body && req.body.getOriginalDocument)
        elasticProxy.getOriginalDocument(req.body.docRemotePath, function (error, result) {
            processResponse(response, error, result)
        });
    else if (req.body && req.body.getUserIndexes)
        elasticProxy.getUserIndexes(req.body.user, function (error, result) {
            processResponse(response, error, result)
        });

    else if (req.body && req.body.transformDirDocsToPlainText)
        elasticProxy.transformDirDocsToPlainText(req.body.rootDir, function (error, result) {
            processResponse(response, error, result)
        });


});
router.post(serverParams.routesRootUrl + '/neo2Elastic', function (req, response) {
    if (req.body && req.body.indexNeoNodes2Elastic) {
        neo2Elastic.indexNeoNodes2Elastic(req.body.subGraph, req.body.where, req.body.index, function (error, result) {
            processResponse(response, error, result)
        });
    }
    else if (req.body && req.body.elasticQuery2NeoNodes) {
        neo2Elastic.elasticQuery2NeoNodes(req.body.index, req.body.queryString, req.body.resultSize, function (error, result) {
            processResponse(response, error, result)
        });
    }
});


router.post(serverParams.routesRootUrl + '/elasticIndexJson', function (req, response) {
    fileUpload.upload(req, "jsonArray", function (err, req) {
        var dataStr = "" + req.file.buffer;
        try {
            var data = JSON.parse(dataStr);
        } catch (e) {
            processResponse(response, e, null);
        }
        elasticProxy.indexJsonArray(req.body.jsonIndexName, req.body.jsonType, data, options, function (error, result) {
            processResponse(response, error, result)
        });

    });
});

router.post(serverParams.routesRootUrl + '/importDataIntoNeo4j', function (req, response) {
    importDataIntoNeo4j.clearVars();
    if (req.body.type == "batch")
        exportToNeoBatch.exportBatch(req.body.sourceType, req.body.dbName, req.body.subGraph, JSON.parse(req.body.data), null, function (error, result) {
            processResponse(response, error, result)
        });
    if (req.body.type == "node")
        importDataIntoNeo4j.importNodes(JSON.parse(req.body.data), function (error, result) {
            processResponse(response, error, result)
        });
    if (req.body.type == "relation")
        importDataIntoNeo4j.importRelations(JSON.parse(req.body.data), function (error, result) {
            processResponse(response, error, result)
        });
    if (req.body.type == "copyNodes")
        importDataIntoNeo4j.copyNodes(JSON.parse(req.body.data), function (error, result) {
            processResponse(response, error, result)
        });
    if (req.body.type == "copyRelations")
        importDataIntoNeo4j.copyRelations(JSON.parse(req.body.data), function (error, result) {
            processResponse(response, error, result)
        });


});

router.post(serverParams.routesRootUrl + '/http', function (req, response) {
    if (req.body && req.body.get)
        httpProxy.get(req.body.get, function (error, result) {
            processResponse(response, error, result)
        });
    if (req.body && req.body.post)
        httpProxy.post(req.body.url, req.body.port, req.body.path, req.body.body, function (error, result) {
            processResponse(response, error, result)
        });
});

router.post(serverParams.routesRootUrl + '/rdf', function (req, response) {
    if (req.body && req.body.queryOntologyDataToNeoResult) {
        rdfProxy.queryOntologyDataToNeoResult(req.body.store, req.body.word, req.body.relations, req.body.lang, req.body.contains, req.body.limit, function (error, result) {
            processResponse(response, error, result)
        });
    }


    if (req.body && req.body.treeToSkos) {
        skos.treeDataToSkos(req.body.tree, req.body.identifier, req.body.date, description, creator, function (error, result) {
            processResponse(response, error, result)
        });
    }
    if (req.body && req.body.loadSkosToTree) {
        skos.loadSkosToTree(req.body.ontology, function (error, result) {
            processResponse(response, error, result)
        });
    }
    if (req.body && req.body.saveTreeToSkos) {
        skos.saveTreeToSkos(req.body.treeData, req.body.ontology, function (error, result) {
            processResponse(response, error, result)
        });
    }

    if (req.body && req.body.findOntologySKOSterms) {
        skos.findOntologySKOSterms(req.body.ontology, req.body.lang, req.body.words, function (error, result) {
            processResponse(response, error, result)
        });
    }

    if (req.body && req.body.getGoogleApiEntities) {
        googleAPIproxy.getEntities(req.body.text, function (error, result) {
            processResponse(response, error, result);
        });
    }

    if (req.body && req.body.generateSkosThesaurusFromWordsListAndOntology) {
        skos.generateSkosThesaurusFromWordsListAndOntology(req.body.thesaurusName, req.body.ontologies, req.body.lang, req.body.words, function (error, result) {
            processResponse(response, error, result);
        });
    }


    if (req.body && req.body.thesaurusToClassifier) {
        classifierManager.thesaurusToClassifier(req.body.thesaurus, req.body.indexName, function (error, result) {
            processResponse(response, error, result);
        });
    }
});


router.post(serverParams.routesRootUrl + '/storedParams', function (req, response) {
    if (req.body && req.body.load) {
        //  var payload={"load": "displayParams","user":Config.user};
        var type = req.body.load;
        var user = req.body.user;
        jsonFileProxy.load(type, user, function (error, result) {
            processResponse(response, error, result)
        });
    }
    if (req.body && req.body.save) {
        // var payload={save:"displayParams",obj:JSON.stringify( obj),"user":Config.user}};
        var type = req.body.save;
        var obj = JSON.parse(req.body.obj);
        var user = req.body.user;
        jsonFileProxy.save(type, obj, user, function (error, result) {
            processResponse(response, error, result)
        });
    }
});

router.post(serverParams.routesRootUrl + '/upload', function (req, response) {
    fileUpload.upload(req, function (error, result) {
        processResponse(response, error, result)
    });
});

router.post(serverParams.routesRootUrl + '/uploadData', function (req, response) {
    fileUpload.uploadData(req, function (error, result) {
        processResponse(response, error, result)
    });
});

router.post(serverParams.routesRootUrl + '/uploadToNeo', function (req, response) {
    uploadToNeo.uploadAndImport(req, function (error, result) {
        processResponse(response, error, result)
    });
});


router.post(serverParams.routesRootUrl + '/uploadCsvForNeo', function (req, response) {
    uploadCsvForNeo.upload(req, function (error, result) {
        processResponse(response, error, result)
    });

});
router.post(serverParams.routesRootUrl + '/loadLocalCsvForNeo', function (req, response) {
    uploadCsvForNeo.loadLocal(req.body.filePath, req.body.subGraph, function (error, result) {
        processResponse(response, error, result)
    });

});

router.post(serverParams.routesRootUrl + '/loadRemoteFileForNeo', function (req, response) {
    fileToNeoLoader.processForm(req, function (error, result) {
        processResponse(response, error, result)
    });

});
router.post(serverParams.routesRootUrl + '/loadLocalXLSXforNeo', function (req, response) {
    if (req.body.listSheets)
        xlsxToNeo.listSheets(req.body.filePath, function (error, result) {
            processResponse(response, error, result)
        });
    if (req.body.listSheetColumns)
        xlsxToNeo.listSheetColumns(req.body.filePath, req.body.sheetName, function (error, result) {
            processResponse(response, error, result)
        });

});


router.post(serverParams.routesRootUrl + '/xlsxToNeoLoader', function (req, response) {
    xlsxToNeoLoader.processForm(req, function (error, result) {
        processResponse(response, error, result)
    });
});
router.post(serverParams.routesRootUrl + '/fileToNeoLoader', function (req, response) {
    fileToNeoLoader.processForm(req, function (error, result) {
        processResponse(response, error, result)
    });
});

router.post(serverParams.routesRootUrl + '/jsonDBStorage', function (req, response) {

    jsonDBStorage.invoke(req, function (error, result) {
        processResponse(response, error, result)
    });

});


router.post(serverParams.routesRootUrl + '/rest', function (req, response) {
    if (req.query && req.query.updateNeoFromCSV) {
        restAPI.updateNeoFromCSV(req.body, function (error, result) {
            processResponse(response, error, result)
        });
    }
    else if (req.query && req.query.updateNeoFromsource) {
        restAPI.updateNeoFromsource(req.body, function (error, result) {
            processResponse(response, error, result)
        });
    }
    if (req.query && req.query.createNode) {
        restAPI.createNode(req.body, function (error, result) {
            processResponse(response, error, result)
        });
    }
    if (req.query && req.query.createRelation) {
        restAPI.createRelation(req.body, function (error, result) {
            processResponse(response, error, result)
        });
    }
    if (req.query && req.query.createNodeAndRelation) {
        restAPI.createNodeAndRelation(req.body, function (error, result) {
            processResponse(response, error, result)
        });
    }
    if (req.query && req.query.updateNode) {
        restAPI.updateNode(req.body, function (error, result) {
            processResponse(response, error, result)
        });
    }
    if (req.query && req.query.deleteNode) {
        restAPI.deleteNode(req.body, function (error, result) {
            processResponse(response, error, result)
        });
    }
    if (req.query && req.query.deleteRelation) {
        restAPI.deleteRelation(req.body, function (error, result) {
            processResponse(response, error, result)
        });
    }
    if (req.query && req.query.deleteRelationById) {
        restAPI.deleteRelationById(req.body, function (error, result) {
            processResponse(response, error, result)
        });
    }

    if (req.query && req.query.updateRelationById) {
        restAPI.updateRelationById(req.body, function (error, result) {
            processResponse(response, error, result)
        });
    }


    if (req.query && req.query.retrieve) {
        restAPI.retrieve(req.body, function (error, result) {
            processResponse(response, error, result)
        });
    }


});
router.get(serverParams.routesRootUrl + '/rest', function (req, response) {
    if (req.query && req.query.desc_updateNeoFromCSV) {
        restAPI.desc_updateNeoFromCSV(function (error, result) {
            processResponse(response, error, result)
        });
    }
    if (req.query && req.query.desc_updateNeoFromsource) {
        restAPI.desc_updateNeoFromsource(function (error, result) {
            processResponse(response, error, result)
        });
    }
    if (req.query && req.query.exportMappings) {
        restAPI.exportMappings(req.query, function (error, result) {
            processResponse(response, error, result)
        });
    }


});

router.post(serverParams.routesRootUrl + '/fs', function (req, response) {
    if (req.body.getFileContent) {
        fileSystemProxy.getFileContent(req.body.path, function (error, result) {
            processResponse(response, error, result)
        });
    }
    if (req.body.saveFileContent) {
        fileSystemProxy.saveFileContent(req.body.path, req.body.data, function (error, result) {
            processResponse(response, error, result)
        });
    }
})

router.post(serverParams.routesRootUrl + '/jsonFileStorage', function (req, response) {
    //  console.log("!!!!!!!!!!!!!!!!!!!!!!!!!!" + JSON.stringify(req.body));
    if (req.body.store)
        jsonFileStorage.store(req.body.path, req.body.data, function (error, result) {
            processResponse(response, error, result)
        });
    if (req.body.retrieve)
        jsonFileStorage.retrieve(req.body.path, function (error, result) {
            processResponse(response, error, result)
        });
    if (req.body.delete)
        jsonFileStorage.delete(req.body.path, function (error, result) {
            processResponse(response, error, result)
        });

});

router.post(serverParams.routesRootUrl + '/authentication', function (req, response) {
    if (req.body.authentify)
        authentication.authentify(req.body.login, req.body.password, function (error, result) {
            processResponse(response, error, result)
        });

});

//plugins
var ParagraphEntitiesGraphQuestions=require("../bin/nlp/paragraphEntitiesQuestions2..js");
var InteractiveQuestions=require("../bin/nlp/interactiveQuestions..js");
router.post(serverParams.routesRootUrl + '/paragraphEntitiesGraph', function (req, response) {
    if (req.body.getParagraphsMatchingEntitiesAndWords) {
        var question = req.body.question;
        var options=req.body.options;
        if (typeof question == "string")
            question = JSON.parse(question)
        if (typeof options == "string")
            options = JSON.parse(options)
        ParagraphEntitiesGraphQuestions.getParagraphsMatchingEntitiesAndWords(question, options,function (error, result) {
            processResponse(response, error, result)
        });
    }
    if (req.body.extractEntitiesFromPlainTextQuestion) {

        ParagraphEntitiesGraphQuestions.extractEntitiesFromPlainTextQuestion(req.body.questionText, function (error, result) {
            processResponse(response, error, result)
        });
    }

    if (req.body.getSentenceEntityProposals) {

        InteractiveQuestions.getSentenceEntityProposals(req.body.sentence, function (error, result) {
            processResponse(response, error, result)
        });
    }
    if(req.body.getAssociatedEntitiesInsidePaths){

        var ids=req.body.entityIds;
        if(typeof ids==="string")
            ids=JSON.parse(ids)
        ParagraphEntitiesGraphQuestions.getAssociatedEntitiesInsidePaths(ids,req.body.distance, function (error, result) {
            processResponse(response, error, result)
        });
    }

});




function processResponse(response, error, result) {
    if (response && !response.finished) {
        /* res.setHeader('Access-Control-Allow-Origin', '*');
         res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE'); // If needed
         res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,contenttype'); // If needed
         res.setHeader('Access-Control-Allow-Credentials', true); // If needed.setHeader('Content-Type', 'application/json');
         */
        response.setHeader('Access-Control-Allow-Origin', '*');
        response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE'); // If needed
        response.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,contenttype'); // If needed
        response.setHeader('Access-Control-Allow-Credentials', true); // If needed


        if (error) {
            if (typeof error == "object") {
                error = JSON.stringify(error, null, 2);
            }
            console.log("ERROR !!" + error);
            socket.message("ERROR !!" + error);
            response.status(404).send({ERROR: error});

        }
        else if (!result) {
            response.send({done: true});
        } else {

            if (typeof result == "string") {
                resultObj = {result: result};
                socket.message(resultObj);
                response.send(JSON.stringify(resultObj));
            }
            else {
                if (result.contentType && result.data) {
                    response.setHeader('Content-type', result.contentType);
                    if (typeof result.data == "object")
                        response.send(JSON.stringify(result.data));
                    else
                        response.send(result.data);
                }
                else {
                    var resultObj = result;
                    // response.send(JSON.stringify(resultObj));
                    response.send(resultObj);
                }
            }
        }


    }


}


module.exports = router;
