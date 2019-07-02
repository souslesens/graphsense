var async = require("async")
var neoProxy = require("../neoProxy.js")
var httpProxy = require("../httpProxy.js");
var request = require("request");
var fs = require("fs");

var logger = require("../logger..js");

/**
 *
 *
 * * creation des chainages de paragrahes
 *
 *
 *  match(n:Paragraph)-->(:Document)<--(m:Paragraph) where n.subGraph="entitiesGraph2"  and m.subGraph="entitiesGraph2"  and m.TextOffset-n.TextOffset=1 create (n)-[:precede]->(m)
 *
 *
 *  match(n:ThesaurusConcept)-[:instanceOf]-(m)--(p:Paragraph)  create (p)-[:hasConcept]->(n)
 *
 *
 * match(c:Equipement)--(n:Document)--(p:Paragraph) create (p)-[:hasEntity{type:"document"}]->(c)
 *
 *match(n:Paragraph),(x:temp) where n.ID=x.ID set n.ChapterID=x.ChapterID
 *
 *
 *
 * /
 * @type {{extractEntitiesFromPlainTextQuestion: ParagraphEntitiesGraphQuestions.extractEntitiesFromPlainTextQuestion, getParagraphsMatchingEntitiesAndWords: ParagraphEntitiesGraphQuestions.getParagraphsMatchingEntitiesAndWords, executeNeoPathsQuery: ParagraphEntitiesGraphQuestions.executeNeoPathsQuery, testQuestions: ParagraphEntitiesGraphQuestions.testQuestions, testQuestion: ParagraphEntitiesGraphQuestions.testQuestion, getMatchingWordsParagraphs: ParagraphEntitiesGraphQuestions.getMatchingWordsParagraphs, getPathTextScore: ParagraphEntitiesGraphQuestions.getPathTextScore, filterWords: ParagraphEntitiesGraphQuestions.filterWords, callElastic: ParagraphEntitiesGraphQuestions.callElastic, printQuestionAndResponse: ParagraphEntitiesGraphQuestions.printQuestionAndResponse, checkifResponseAreInParagraphs: ParagraphEntitiesGraphQuestions.checkifResponseAreInParagraphs}}
 */




var ParagraphEntitiesGraphQuestions = {

    extractEntitiesFromPlainTextQuestion: function (questionText, callback) {
        var serviceUrl = "http://server-ctg-neo-question.azurewebsites.net/question/";
        request({
                url: serviceUrl + questionText,
                method: 'GET',
                // headers: {'Content-Type': 'application/json'}
            },
            function (err, res) {

                if (err)
                    callback(err)
                else if (res.body && res.body.errors && res.body.errors.length > 0) {
                    console.log(JSON.stringify(res.body.errors))
                    callback(res.body.errors)
                }
                else {
                    var data = res.body;
                    if (typeof data == "string")
                        try {
                            data = JSON.parse(data);
                        }
                        catch (e) {
                            callback(e);
                        }

                    callback(null, data)
                }
            })


    },

    getAssociatedEntitiesInsidePaths: function (entityIds, distance, callback) {


        if (entityIds.length == 0)
            return callback(null, [])
        var cypher = "match(n) where ID(n) in " + JSON.stringify(entityIds) + " return n"
        neoProxy.match(cypher, function (err, result) {

            if (err)
                return callback(err);

            var cards = {};
            result.forEach(function (entity, index) {
                var key = entity.n.labels[0] + "-" + index;


                cards[key] = {
                    "name": entity.n.properties.name,
                    "nodeSetIds": [
                        entity.n._id
                    ],
                    "label": entity.n.labels[0]
                }


            })
            var options = {
                "cards": cards,
                "distance": distance,
                "paragraphIds": [],
                "limit": 1000
            }

            ParagraphEntitiesGraphQuestions.executeNeoPathsQuery(options, function (err, result) {
                if (err)
                    return callback(err);
                var xx = result;
                var allParagraphsIds = [];
                var nPaths = 0
                result.forEach(function (path) {
                    if (path.entities.length >= Object.keys(options.cards).length) {
                        nPaths += 1;
                        path.forEach(function (node) {
                            allParagraphsIds.push(node._id)
                        })
                    }
                })

                var cypher = "match(n:Paragraph)-[:hasEntity]-(e) where ID(n) in " + JSON.stringify(allParagraphsIds) + " return e as entity, count(n)as count order by count desc";
                neoProxy.match(cypher, function (err, result2) {

                    if (err)
                        return callback(err);

                    var associatedEntities = [];
                    result2.forEach(function (line) {
                        associatedEntities.push({
                            id: line.entity._id,
                            name: line.entity.properties.name,
                            nParaGraphs: line.count,
                            label: line.entity.labels[0]
                        })

                    })

                    return callback(null, {entities: associatedEntities, nPaths: nPaths});


                })


            })


        })
    }
    ,

    getParagraphsMatchingEntitiesAndWords: function (questionObj, options, callback) {
        try {
            var response = {}

            var matchingNeoPaths = [];
            var paragraphIds = [];
            var cards = {};
            //  var paragraphScores = {};

            if (!options)
                options = {};
            if (!options.matchEntitiesLimit)
                options.matchEntitiesLimit = 1000;
            async.series([


                    //find Entities neo4j ids
                    function (callbackSeries) {

                        var entityNames = [];
                        if (false && questionObj.question_entities.length == 0)
                            return callback();


                        var subGraph = options.subGraph;
                        var subGraphStr = "";
                        if (subGraph)
                            subGraphStr = " and n.subGraph='" + subGraph + "' ";

                        function capitalize(str) {
                            return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
                        }

                        var index = 0;
                        async.eachSeries(questionObj.question_entities, function (entityObj, callbackEach) {


                                // var entityType = capitalize(entityObj.entity_label)
                                var entityType = entityObj.entity_label;
                                var cypher = "match (n:" + entityType + ") where n.name='" + entityObj.entity_normalized_value + "' " + subGraphStr + " return id(n) as neoId";
                                neoProxy.match(cypher, function (err, result) {
                                    if (err)
                                        callbackEach(err);
                                    if (result.length == 0)
                                        return callback("no entity " + entityType + ":" + entityObj.entity_normalized_value + " in graph")
                                    if (result.length > 1)
                                        return callback("more than on entity " + entityType + ":" + entityObj.entity_normalized_value + " in graph try specify subGraph")

                                    questionObj.question_entities[index].neoId = result[0].neoId;
                                    index++;
                                    callbackEach();
                                })

                            },
                            function (err) {
                                return callbackSeries(err);
                            })


                    },

                    //if options.filterNouns==true : search engine retreive ids of paragraphs matching nouns if no entities matching paragraphs
                    function (callbackSeries) {
                        if (true)
                            return callbackSeries();
                        var entityTypes = [];
                        if (options.filterNouns)
                            entityTypes.push("question_nouns")
                        if (options.filterAdjs)
                            entityTypes.push("question_adjs")
                        if (options.filterVerbs)
                            entityTypes.push("question_verbs")


                        if (entityTypes.length == 0)
                            return callbackSeries();
                        ParagraphEntitiesGraphQuestions.getMatchingWordsParagraphs(questionObj, entityTypes, function (err, result) {


                            result.forEach(function (paragraph) {
                                var id = paragraph.id;
                                if (typeof paragraph.id == "string")
                                    id = parseInt(paragraph.id);
                                //    paragraphScores[id] = paragraph.score;
                                paragraphIds.push(id);

                            })


                            callbackSeries();
                        })


                    },


                    // query Graph to extract paragraphs matching entities at distance
                    function (callbackSeries) {

                        var index = 0;

                        var entities = questionObj.question_entities;

                        if (entities.length == 0)
                            return callbackSeries(null, []);
                        entities.forEach(function (entity, index) {
                            var label = entity.entity_label;
                            var queryObject = {
                                name: entity.entity_normalized_value,
                                nodeSetIds: [entity.neoId],
                                label: label
                            }
                            cards[label + "-" + index] = queryObject;
                            index++;
                        })

                        var options2 = {
                            cards: cards,
                            distance: 2,
                            paragraphIds: paragraphIds,
                            limit: options.matchEntitiesLimit
                        }
                        ParagraphEntitiesGraphQuestions.executeNeoPathsQuery(options2, function (err, result) {


                            matchingNeoPaths = result
                            callbackSeries();
                        })

                    },
// if option strictMatching take only path whit a number of entities >= au nombre d'entité en entree
                    function (callbackSeries) {
                        if (false)
                            return callbackSeries();
                        var filteredNeoPaths = []
                        matchingNeoPaths.forEach(function (path) {
                            if (path.entities.length >= Object.keys(cards).length)
                                filteredNeoPaths.push(path);
                        })
                        matchingNeoPaths = filteredNeoPaths;
                        return callbackSeries();

                    },


                    //OBSOLETE : use search only for scoring : if options.filterNouns==true : search engine retreive ids of paragraphs matching nouns

                    function (callbackSeries) {
                        return callbackSeries();
                        var entityTypes = [];
                        if (options.filterNouns)
                            entityTypes.push("question_nouns")
                        if (options.filterAdjs)
                            entityTypes.push("question_adjs")
                        if (options.filterVerbs)
                            entityTypes.push("question_verbs")


                        if (entityTypes.length == 0)
                            return callbackSeries();

                        if (Object.keys(matchingNeoPaths).length == 0) {// pas de path avec entités -> recherche plein text seulement
                            ParagraphEntitiesGraphQuestions.getMatchingWordsParagraphs(questionObj, entityTypes, function (err, result) {
                                callbackSeries(err);
                            })
                        } else {
                            callbackSeries();

                        }

                    }
                    ,


                    // aggregate question and response paths in response object
                    function (callbackSeries) {

                        response = [];


                        //  for (var key in matchingNeoPaths) {
                        var responseObj = {}
                        var paths = matchingNeoPaths;
                        if (paths.length == 0)
                            return callback(null, response)

                        var str = "";
                        responseObj.paths = [];

                        paths.forEach(function (path, index) {


                            var responsePathObj = {entities: [], wordsScore: 0, entitiesScore: path.entitiesScore, globalScore: 0, location: "", paragraphs: []};
                            //  responsePathObj.score = 0;
                            var pathParagraphsIdsStr = ""
                            path.entities.forEach(function (entity) {
                                responsePathObj.entities.push({id: entity.nodeSetIds[0], label: entity.label, value: entity.name});
                            })
                            path.nodes.forEach(function (node, index) {

                                pathParagraphsIdsStr += node.properties.ID + "_";
                                if (responsePathObj.paragraphs.length == 0) {
                                    var chapterNum = node.properties.ChapterID.substring(node.properties.ChapterID.lastIndexOf("_") + 1)
                                    responsePathObj.location = {
                                        document: node.properties.Document,
                                        chapter: node.properties.ChapterTitle1,
                                        chapterNum: chapterNum,
                                        chapter2: node.properties.ChapterTitle2,
                                        chapterId: node.properties.ChapterID
                                    }
                                }
                                responsePathObj.paragraphs.push({
                                    id: node.properties.ID,
                                    text: node.properties.ParagraphText,
                                    style: node.properties.StyleParagraph,
                                    offset: node.properties.TextOffset
                                })


                            })

                            responsePathObj.pathParagraphsIdsStr = pathParagraphsIdsStr
                            response.push(responsePathObj);

                        })
                        // }


                        //   response[key] = responseObj;
                        callbackSeries();


                    },


                    //scoring using plain text search
                    function (callbackSeries) {

                        if (response.length == 0)
                            return callbackSeries();


                        var index = -1;
                        async.eachSeries(response, function (path, callbackEachPath) {
                            index += 1;
                            var paragraphIds = [];
                            path.paragraphs.forEach(function (node) {

                                paragraphIds.push(node.id);

                            })

                            if (paragraphIds.length == 0)
                                return callbackEachPath(null, 0)

                            var entityTypes = [];
                            if (options.filterNouns)
                                entityTypes.push("question_nouns")
                            if (options.filterAdjs)
                                entityTypes.push("question_adjs")
                            if (options.filterVerbs)
                                entityTypes.push("question_verbs")


                            if (entityTypes.length == 0)
                                return callbackSeries();

                            ParagraphEntitiesGraphQuestions.getPathWordMatchingScore(questionObj, entityTypes, paragraphIds, function (err, result) {

                                var score = result / paragraphIds.length; //avg
                                score = Math.round(score * 100) / 100
                                response[index].wordsScore = score;
                                if (response[index].entitiesScore)
                                    response[index].globalScore = response[index].entitiesScore + score;
                                else
                                    response[index].globalScore = score


                                callbackEachPath(err);
                            })


                        }, function (err) {


                            response.sort(function (a, b) {
                                if (a.globalScore < b.globalScore)
                                    return 1;
                                if (a.globalScore > b.globalScore)
                                    return -1;
                                return 0;


                            });
                            response.forEach(function (path, index) {
                                response[index].rank = (index + 1);
                            })

                            callbackSeries(err);

                        })


                    },


                    // if paragraphs are common to 2 consecutive paths merge paths
                    function (callbackSeries) {
                        if (false)
                            callbackSeries();


                        var allParagraphsPath = {};
                        var paths = response;
                        paths.forEach(function (path, pathIndex) {
                            var chapterId = path.location.chapterId;
                            paths[pathIndex].paragraphIds = [];
                            path.paragraphs.forEach(function (paragraph, paragraphIndex) {
                                paths[pathIndex].paragraphIds.push(paragraph.id);
                                if (!allParagraphsPath[paragraph.id])
                                    allParagraphsPath[paragraph.id] = [];
                                allParagraphsPath[paragraph.id].push(pathIndex)


                            })

                        })


                        paths.forEach(function (path, pathIndex1) {
                            path.paragraphs.forEach(function (paragraph, paragraphIndex) {
                                if (allParagraphsPath[paragraph.id].length > 1) {// si le paragraphe est commun à plusieurs paths
                                    allParagraphsPath[paragraph.id].forEach(function (pathIndex2) {// pour chacun des paragraphes communs
                                        paths[pathIndex2].toDelete = true;
                                        paths[pathIndex2].paragraphs.forEach(function (paragraph2, index2) {// si le paragraphe n'est pas déjà présent dans le path1
                                            if (myIndexOf(paths[pathIndex1].paragraphs,"id",paragraph2.id) <0) {
                                                if (paths[pathIndex1].location.chapterId == paths[pathIndex2].location.chapterId) {
                                                    paths[pathIndex1].paragraphs.push(paths[pathIndex2].paragraphs[index2]);

                                                }
                                            }
                                        })


                                    })
                                }

                            })

                        })
                        response = [];
                        paths.forEach(function (path, pathIndex) {




                            if (path.toDelete)
                                return;


                            path.paragraphs.sort(function(a,b){
                                if(a.offset>b.offset)
                                return 1;
                                if(b.offset<a.offset)
                                return -1;
                                return 0;

                            })
                            response.push(path);


                        })


                        callbackSeries();


                    },


                    //Reformat response to structure entities/chapter/path/text
                    function (callbackSeries) {

                        if (false)
                            return callbackSeries();


                        var tree = {};
                        response.forEach(function (path, pathIndex) {
                            var chapterId = path.location.chapterId;
                            var chapterNum = chapterId.substring(chapterId.lastIndexOf("_") + 1)
                            var documentRef = path.location.document;
                            var entitiesKey = "";
                            path.entities.forEach(function (entity, entityIndex) {
                                if (entityIndex > 0)
                                    entitiesKey += ";"
                                entitiesKey += entity.label + "_" + entity.value;
                            })


                            if (!tree[entitiesKey])
                                tree[entitiesKey] = {documents: {}}
                            if (!tree[entitiesKey].documents[documentRef])
                                tree[entitiesKey].documents[documentRef] = {title: "???", reference: documentRef, chapters: {}}
                            if (!tree[entitiesKey].documents[documentRef].chapters[chapterId])
                                tree[entitiesKey].documents[documentRef].chapters[chapterId] = {chapterId: chapterId, title: "???", paths: []}


                            tree[entitiesKey].documents[documentRef].chapters[chapterId].paths.push(path.paragraphs)


                        })


                        /*  var matchingChapters = []
                          for (var entitiesKey in tree) {
                              var entityObj = tree[entitiesKey]
                              for (var documentKey in entityObj) {
                                  var chapterObj = entityObj[documentKey];
                                  chapterObj.forEach(function(path))
                                      var chapterObj = entityObj[document];


                              }*/
                        response = tree;

                        callbackSeries();


                    }
                    ,

// OLD VERSION TO DELETE
                    function (callbackSeries) {

                        if (true)
                            return callbackSeries();


                        var chapterIds = {};
                        response.forEach(function (path, pathIndex) {
                            var chapterId = path.location.chapterId;
                            var entitiesKey = "";
                            path.entities.forEach(function (entity, entityIndex) {
                                if (entityIndex > 0)
                                    entitiesKey += ";"
                                entitiesKey += entity.label + "_" + entity.value;
                            })

                            if (!chapterIds[chapterId])
                                chapterIds[chapterId] = {location: path.location, entities: {}}
                            if (!chapterIds[chapterId].entities[entitiesKey])
                                chapterIds[chapterId].entities[entitiesKey] = {entities: path.entities, paragraphs: []}

                            var pathParagraph = [];


                            path.paragraphs.forEach(function (paragraph, index) {
                                if (myIndexOf(chapterIds[chapterId].entities[entitiesKey].paragraphs, "id", paragraph.id) < 0) {
                                    chapterIds[chapterId].entities[entitiesKey].paragraphs.push(paragraph);
                                }
                            })

                        })


                        var matchingChapters = []
                        for (var chapterId in chapterIds) {
                            var chapterObj = {location: chapterIds[chapterId].location, entities: []};


                            for (var entityKey in chapterIds[chapterId].entities) {

                                var paragraphs = [];


                                chapterIds[chapterId].entities[entityKey].paragraphs.forEach(function (paragraph) {
                                    paragraphs.push(paragraph);
                                })
                                paragraphs.sort(function (a, b) {
                                    if (a.TestOffset > b.textOffset)
                                        return 1;
                                    if (a.TestOffset < b.textOffset)
                                        return -1;
                                    return 0;
                                })
                                chapterObj.entities.push({entities: chapterIds[chapterId].entities[entityKey].entities, paragraphs: paragraphs})

                            }
                            matchingChapters.push(chapterObj);

                        }
                        response = matchingChapters;

                        callbackSeries();


                    }

                    ,


                    //if option expandToAllChapterParagraphs add all chapter paragraphs to each path
                    function (callbackSeries) {
                        if (!options.expandToAllChapterParagraphs)
                            return callbackSeries();

                        ParagraphEntitiesGraphQuestions.expandToAllChapterParagraphs(response, function (err, result) {
                            response = result;
                            callbackSeries(err);

                        })


                    }


                ],

                function (err) {
                    return callback(err, {matchingPathsNumber: response.length, question: questionObj, response: response});
                }
            )
        }
        catch
            (err) {
            logger.error(err)

        }

    },

    executeNeoPathsQuery: function (options, callbackOuter) {
        var getWhereClauseFromArray = function (property, _array, nodeSymbol) {
            var array;
            if (!nodeSymbol)
                nodeSymbol = "n";
            if (typeof _array == "string")
                array = _array.split(",");
            else
                array = _array;

            var query = nodeSymbol + "." + property + " in ["
            if (property == "_id")
                query = "ID(" + nodeSymbol + ") in ["
            var quote = "";
            for (var i = 0; i < array.length; i++) {
                if (i > 0 && i < array.length)
                    query += ","
                else if ((property != "_id" && typeof array[i] === 'string'))
                    var quote = "\"";
                query += quote + array[i] + quote;

            }
            query += "] ";
            return query;
        }
        var combination = function (arr, length) {
            var i, j, temp
            var result = []
            var arrLen = arr.length
            var power = Math.pow
            var combinations = power(2, arrLen)

            // Time & Space Complexity O (n * 2^n)

            for (i = 0; i < combinations; i++) {
                temp = ''

                for (j = 0; j < arrLen; j++) {
                    // & is bitwise AND
                    if ((i & power(2, j))) {
                        temp += arr[j] + ","
                    }
                }
                result.push(temp)
            }
            var result2 = [];

            result.forEach(function (str) {
                var result3 = str.split(",");
                if (result3[result3.length - 1] == "")
                    result3.splice(result3.length - 1, 1);
                result2.push(result3);
            })
            if (length) {
                var result3 = [];
                result2.forEach(function (line) {
                    if (line.length == length)
                        result3.push(line);
                })
                return result3;

            }


            return result2;
        };
        var getPathBetweenEntities = function (keys, options, paragraphIds, callback) {

            var where = "";
            var cypher = "";
            var index = 0;
            var withStr = ""
            keys.forEach(function (key) {
                index++;

                var where2 = getWhereClauseFromArray("_id", cardsMap[key].nodeSetIds, "x" + index);
                if (where2 == null || where2 == "")
                    where2 = "";
                if (where.indexOf(cardsMap[key].nodeSetIds) < 0) {//doublons
                    if (index == 1)
                        where += " WHERE " + where2
                    else
                        where += " AND " + where2
                }


                withStr += "x" + index + ",";

                var minCardinality = 1;

                if (index == 1) {
                    //  cypher += "MATCH   path=(x" + index + ")-[:hasEntity|:precede*1.." + distance + "]-(x" + (index + 1) + ")";
                    if (keys.length == 2)
                        cypher += "MATCH   path=(x" + index + ")<-[r:hasEntity*" + minCardinality + "..1]-(p1:Paragraph)-[:precede*0.." + options.distance + "]-(p2:Paragraph)-[:hasEntity*" + minCardinality + "..1]->(x" + (index + 1) + ")";
                    else
                        cypher += "MATCH   path=(x" + index + ")<-[r:hasEntity*" + minCardinality + "..1]-(p1:Paragraph)";//-[:precede*0.." + distance + "]-(p2)"

                }
            })

            if (paragraphIds && paragraphIds.length > 0) {


                var whereP1 = getWhereClauseFromArray("ID", paragraphIds, "p1");
                if (keys.length == 2) {
                    var whereP2 = getWhereClauseFromArray("ID", paragraphIds, "p2");
                    where += " AND (" + whereP1 + " OR " + whereP2 + ")"
                } else {
                    where += " AND " + whereP1
                }


            }

            cypher += where + " return distinct nodes(path) as nodes, relationships(path) as relations , count(r) as count order by count desc limit " + options.limit;

            logger.info(cypher);
            neoProxy.match(cypher, function (err, result) {
                if (err)
                    return callback(err);
                return callback(null, result)

            })

        }
        var computePathsIntersection = function (combinationResults, combinationsMap) {
// voir algo Neo https://stackoverflow.com/questions/35229964/need-only-common-nodes-across-multiple-paths-neo4j-cypher

            var intersectionResults = [];
            var allParagraphsMap = {};
            var allPaths = [];
            var index = 0;
            var combinationsMap = {}

            for (var key in combinationResults) {
                index += 1;
                var combinationName = key;
                var result = combinationResults[key];
                var pathEntities = {};

                result.forEach(function (path, index) {
                    var pathParagraphs = [];

                    //  var pathKey=""
                    path.nodes.forEach(function (node) {
                        if (node.labels[0] == "Paragraph") {
                            pathParagraphs.push(node);
                            if (!allParagraphsMap[node._id]) {
                                allParagraphsMap[node._id] = {node: node, combinationKeys: [], freq: 1};
                            }
// on affecte la combinaison du chemin a chaque noeud de celui-ci
                            if (allParagraphsMap[node._id].combinationKeys.indexOf(combinationName) < 0) {

                                allParagraphsMap[node._id].freq += 1;
                                allParagraphsMap[node._id].combinationKeys.push(combinationName);
                            }


                        }

                        else {
                            pathEntities[key + "_" + node._id] = node;


                        }
                    })


                    allPaths.push(pathParagraphs);
                })
            }


            //scoring of paths based on number of entity combinations it matches in its paragraphs

            // selection des chemins qui passent par les matching nodes;
            var matchingPaths = []
            var allPathNodeIdsStr = "";
            allPaths.forEach(function (path) {
                var nodes = [];
                var pathEntityCombinations = []
                var nodeEntitiesCount = 0// total des entités pour tous les paragraphes du chemin
                var pathNodeIdsStr = "";
                path.forEach(function (node) {
                    var freq = allParagraphsMap[node._id].freq;
                    pathNodeIdsStr += node._id + "_";
                    allParagraphsMap[node._id].combinationKeys.forEach(function (combinationKey) {
                        if (pathEntityCombinations.indexOf(combinationKey) < 0)
                            pathEntityCombinations.push(combinationKey);

                    })

                    nodeEntitiesCount += freq;
                    nodes.push(node);


                })

                if (allPathNodeIdsStr.indexOf(pathNodeIdsStr) < 0) {
                    allPathNodeIdsStr += pathNodeIdsStr;
                    var pathEntities = [];
                    var pathEntitiesKeys = [];
                    pathEntityCombinations.forEach(function (combinationKey) {
                        var keys = JSON.parse(combinationKey);
                        keys.forEach(function (key) {
                            if (pathEntitiesKeys.indexOf(key) < 0) {
                                pathEntitiesKeys.push(key);
                                var card = cardsMap[key];
                                pathEntities.push(card)
                            }

                        })


                    })
                    path.entities = pathEntities;
                    path.entitiesScore = nodeEntitiesCount;// / path.length  // avg
                    path.nodes = nodes;
                    matchingPaths.push(path)
                }
                else {

                }

            })

            matchingPaths.sort(function (a, b) {
                if (a.entitiesScore < b.entitiesScore)
                    return 1;
                if (a.entitiesScore > b.entitiesScore)
                    return -1;
                return 0;


            })


            return matchingPaths;
        }


        var cardsMap = options.cards;
        var distance = options.distance;
        var paragraphIds = options.paragraphIds

        if (cardsMap)


            var cardKeys = Object.keys(cardsMap);
        var countCards = cardKeys.length;


        var combinations2, combinations1, combinations0;
        var combinationResults = {};
        var matchCount = 0;

        if (countCards == 0) {
            if (paragraphIds.length > 0)
                combinations0 = true;
            else
                return callbackOuter(null, {});
        }
        else if (countCards == 1) {
            combinations2 = []
            combinations1 = [cardKeys]
        }

        else {

            combinations2 = combination(cardKeys, 2)// combinaisons deux à deux des keys de cards
            combinations1 = combination(cardKeys, 1);// liste des keys de cards prises individuelement
        }

        async.series([

            function (callback) {//pas d'entité
                if (!combinations0)
                    return callback();
                var cypher = "MATCH   path=(p1)-[:precede*0.." + distance + "]-(p2)";

                var whereP1 = getWhereClauseFromArray("ID", paragraphIds, "p1");
                var whereP2 = getWhereClauseFromArray("ID", paragraphIds, "p2");


                cypher += " where " + whereP1 + " return nodes(path) as nodes, relationships(path) as relations";

                logger.info(cypher);
                neoProxy.match(cypher, function (err, result) {
                    if (err)
                        return callback(err);
                    var key = "noMatchingEntities"
                    combinationResults[key] = result;
                    return callback(null, result)
                })

            },
            function (callback) {//combinasons 2à 2
                if (!combinations2 || combinations2.length == 0)
                    return callback();
                async.eachSeries(combinations2, function (combination, callbackEach) {
                        getPathBetweenEntities(combination, options, paragraphIds, function (err, result) {
                            if (err)
                                return callback(err);
                            if (result.length > 0) {
                                var key = JSON.stringify(combination);


                                combinationResults[key] = result;
                                matchCount += result.length;

                            }
                            return callbackEach(err);
                        });

                    },

                    function (err) {

                        callback(err);


                    })

            },
            function (callback) {//chaque entité séparéee si combinaison 2 à 2 echoue
                if (matchCount > 0)
                    return callback()
                async.eachSeries(combinations1, function (combination, callbackEach) {
                        getPathBetweenEntities(combination, {distance: 1, limit: options.limit}, paragraphIds, function (err, result) {
                            if (err)
                                return callback(err);
                            if (result.length > 0) {
                                var key = JSON.stringify(combination)
                                combinationResults[key] = result;

                            }
                            return callbackEach(err);
                        });

                    },

                    function (err) {
                        callback(err);
                    })

            }
            ,
        ], function (err) {
            combinationResults = computePathsIntersection(combinationResults);
            return callbackOuter(err, combinationResults)

        })


    }
    ,

    expandToAllChapterParagraphs: function (paths, callback) {

        var index = 0;
        var distinctChapterIds = [];

        paths.forEach(function (path, index) {
            var chapterId = path.location.chapterId;

            if (distinctChapterIds.indexOf(chapterId) < 0) {
                distinctChapterIds.push(chapterId);
            }

        })
        var expandedPaths = {};


        var cypher = "Match (n:Paragraph)-[:inChapter]-(c:Chapter) where n.ChapterID in" + JSON.stringify(distinctChapterIds) + " and n.subGraph=\"entitiesGraph3\" return collect(n) as nodes,c"
        //   var cypher = "Match (n:Paragraph) where n.ChapterID='" + chapterId + "'  return n order by n.TextOffset";
        neoProxy.match(cypher, function (err, result) {
            if (err)
                callback(err);

            result.forEach(function (line) {
                var nodes = line.nodes;
                nodes.sort(function (a, b) {
                    if (a.properties.TextOffset > b.properties.TextOffset)
                        return 1;
                    if (a.properties.TextOffset < b.properties.TextOffset)
                        return -1;
                    return 0;
                })
                var chapter = line.c
                var chapterParagraphs = []
                nodes.forEach(function (node) {
                    var obj = {
                        id: node.properties.ID,
                        text: node.properties.ParagraphText,
                        style: node.properties.StyleParagraph,
                        offset: node.properties.TextOffset
                    }

                    chapterParagraphs.push(obj)


                })


                paths.forEach(function (path) {
                    var chapterId = path.location.chapterId;
                    if (!expandedPaths[chapterId]) {
                        expandedPaths[chapterId] = path;
                        expandedPaths[chapterId].paragraphs = chapterParagraphs;
                    }
                    else {
                        var existingEntities = []
                        expandedPaths[chapterId].entities.forEach(function (entity) {
                            existingEntities.push(entity.value);
                        })
                        var entitiesToAdd = []
                        path.entities.forEach(function (entity) {

                            if (existingEntities.indexOf(entity.value) < 0) {
                                existingEntities.push(entity.value);
                                entitiesToAdd.push(entity)
                            }
                            ;


                        })


                        expandedPaths[chapterId].entities = expandedPaths[chapterId].entities.concat(entitiesToAdd)


                        /*  expandedPaths[chapterId].entities = expandedPaths[chapterId].entities.concat(path.entities)*/
                        expandedPaths[chapterId].wordsScore += path.wordsScore
                        expandedPaths[chapterId].entitiesScore += path.entitiesScore
                        expandedPaths[chapterId].globalScore += path.globalScore;


                    }
                })

            })

            var paths2 = [];
            for (var key in expandedPaths) {
                paths2.push(expandedPaths[key])


            }
            return callback(null, paths2)

        })


    },

    testQuestions: function (method, ids, callback) {
        var allQuestionsResults = [];
        async.eachSeries(ids, function (id, callbackEach) {
            ParagraphEntitiesGraphQuestions.testQuestion(method, id, function (err, result) {


            })

        })
    }
    ,


    getMatchingWordsParagraphs: function (queryObject, wordEntityTypes, callback) {
        var matchStr = "";
        var matchingWordsParagraphs = []
        wordEntityTypes.forEach(function (type) {
            var obj = queryObject[type];
            if (Array.isArray(obj)) {
                obj.forEach(function (val) {
                    matchStr += val + " "
                })
            }
            else
                matchStr += obj + " ";

        })


        var elasticUrl = "http://localhost:9200/paragraphs/_search"
        var payload;

        if (matchStr == "")
            return callback(null, matchingWordsParagraphs)
        payload = {
            "size": 100,
            "query": {

                "bool": {
                    "should": [
                        {
                            "match": {
                                "paragraphText": matchStr
                            }
                        }]
                }
            }


        }

        logger.info(JSON.stringify(payload, null, 2))


        request({
                url: elasticUrl,
                json: payload,
                method: 'POST',
                headers: {'Content-Type': 'application/json'}
            },
            function (err, res) {

                if (err)
                    return callback(err)
                else if (res.body && res.body.errors && res.body.errors.length > 0) {
                    logger.error(JSON.stringify(res.body.errors))
                    return callback(res.body.errors)
                }
                else {
                    if (res.body.hits.hits.length > 0) {
                        var xx = res.body
                        res.body.hits.hits.forEach(function (hit) {
                            var paragraph = {id: hit._source.iD, score: hit._score};
                            matchingWordsParagraphs.push(paragraph)
                        })
                    }
                    callback(null, matchingWordsParagraphs)
                }
            })


    }
    ,
    getPathWordMatchingScore: function (queryObject, wordEntityTypes, paragraphIds, callback) {
        var matchStr = "";
        var matchingWordsParagraphs = [];
        var countWords = 0;
        wordEntityTypes.forEach(function (type) {
            var obj = queryObject[type];
            if (Array.isArray(obj)) {
                obj.forEach(function (val) {
                    countWords += 1;
                    matchStr += val + " "
                })
            }
            else
                matchStr += obj + " ";

        })


        var elasticUrl = "http://localhost:9200/paragraphs/_search"
        var payload;


        payload = {
            "size": 100,
            "query": {
                "bool": {
                    "must": {
                        "terms": {
                            "iD": paragraphIds
                        }
                    }
                }
            }
        }
        if (matchStr != "") {
            payload.query.bool.should = [
                {
                    "match": {
                        "paragraphText": matchStr
                    }
                }
            ]

        }
        //   payload.query.bool.should.minimum_should_match=1;
        //  payload.query.bool.should= {"boost": 1.0}

        logger.info(JSON.stringify(payload, null, 2))


        request({
                url: elasticUrl,
                json: payload,
                method: 'POST',
                headers: {'Content-Type': 'application/json'}
            },
            function (err, res) {

                if (err)
                    return callback(err)
                else if (res.body && res.body.errors && res.body.errors.length > 0) {
                    logger.error(JSON.stringify(res.body.errors))
                    return callback(res.body.errors)
                }
                else {
                    if (res.body.hits.hits.length > 0)
                        var xx = res.body;
                    var score = 0;
                    res.body.hits.hits.forEach(function (hit) {
                        score += hit._score;
                        /*  var paragraph = {id: hit._source.iD, score: hit._score};
                          matchingWordsParagraphs.push(paragraph)*/
                    })

                    callback(null, score / countWords)
                }
            })


    }
    ,

    getPathTextScore: function (path, words) {

        var wordsStr = "";
        words.forEach(function (word) {
            if (word.length < 2)
                return;
            if (wordsStr != "")
                wordsStr += "|";
            wordsStr += ("(" + word + ")")

        })

        var regex = new RegExp(wordsStr, "gi");
        var filteredPaths = [];

        var score = 0;
        var pathText = ""
        path.nodes.forEach(function (node, index) {

            if (node.labels[0] != "Paragraph") {
                return;
            }
            pathText += node.properties.ParagraphText + " ";
        })

        var array = regex.exec(pathText)
        //  console.log(array.toString())
        if (array != null) {
            var x = array.length;
            array.forEach(function (word) {
                if (typeof word == "string")
                    score += 1;

            })
        }

        //    console.log(score / path.nodes.length)
        return score;// / pathText.length;
    }

    ,
    filterWords: function (path, words) {

        var wordsStr = "";
        words.forEach(function (word) {
            if (word.length < 2)
                return;
            if (wordsStr != "")
                wordsStr += "|";
            wordsStr += ("(" + word + ")")

        })

        var regex = new RegExp(wordsStr, "gi");
        var filteredPaths = [];

        var score = 0;
        path.nodes.forEach(function (node, index) {

            if (node.labels[0] != "Paragraph") {
                return;
            }

            var array;
            while ((array = regex.exec(node.properties.ParagraphText)) !== null) {
                //  console.log(array.toString())
                var x = array.length;
                array.forEach(function (word) {
                    if (typeof word == "string")
                        score += 1;

                })
            }

        })

        // console.log(score / path.nodes.length)
        return score / path.nodes.length;
    }
    ,
    callElastic: function () {

        var elasticUrl = "http://localhost:9200/paragraphs/_search"
        var query = {
            "query": {
                "bool": {
                    "must": [
                        {
                            "terms": {
                                "iD": paragraphIds
                            }
                        },
                        {
                            "match": {
                                "paragraphText": matchStr
                            }
                        }]
                }
            }


        }

        var matchingWordsParagraphs = []
        request({
                url: elasticUrl,
                json: query,
                method: 'POST',
                headers: {'Content-Type': 'application/json',}
            },
            function (err, res) {

                if (err)
                    callbackEach(err)
                else if (res.body && res.body.errors && res.body.errors.length > 0) {
                    logger.error(JSON.stringify(res.body.errors))
                    callbackEach(res.body.errors)
                }
                else {
                    if (res.body.hits.hits.length > 0)
                        var xx = res.body
                    res.body.hits.hits.forEach(function (hit) {
                        var obj = {score: hit._score, text: hit._source.paragraphText, iD: hit._source.iD, entities: entities, words: questionObj.words}
                        matchingWordsParagraphs.push(obj)
                    })
                    if (matchingWordsParagraphs.length > 0) {
                        matchingWordsPaths.push({path: "", words: matchingWordsParagraphs})
                    }
                    callbackEach();


                }

            }
        );


    }
    ,


    printQuestionAndResponse: function (obj) {


        var strEntities = "";
        for (var key in obj.question.entities) {
            obj.question.entities[key].forEach(function (entity) {
                strEntities += key + ":" + entity.name + ",";
            })

        }

        var strNouns = "";
        obj.question.nouns.forEach(function (noun) {
            strNouns += noun + ","
        })


        var str = "<table>";

        var strQuestion = "<table>" +
            "<tr><td>question</td><td>" + obj.question.question.ID + " " +
            obj.question.question.Question + " </td></tr>" +
            "<tr><td>expected answer</td><td>" + obj.question.question.Expected_Answer + "</td></tr> " +
            "<tr><td>ResultatSinequa</td><td>" + obj.question.question.Resultat + "</td></tr> " +
            "<tr><td>entities</td><td>" + strEntities + "</td></tr> " +
            "<tr><td>nouns</td><td>" + strNouns + "</td></tr> " +
            "</table>"


        var strResponse = "<table>";
        for (var key in obj.response) {
            if (key != "maxNounSearchScore") {

                strResponse += "<tr><td>entities</td><td>" + key + "</td></tr> ";
                obj.response[key].paths.forEach(function (path) {

                    strResponse += "<tr><td>score</td><td>" + path.score + "</td></tr> ";

                    path.paragraphs.forEach(function (paragraph) {
                        strResponse += "<tr><td>" + paragraph.id + "</td><td>" + paragraph.text + "</td></tr> ";
                    })

                })
            }
        }
        strResponse += "</table>"


        var strGlobal = "<table>" +
            "<tr><td>" + strQuestion + "</td>" +
            "<td>" + strResponse + "</td></tr>" +
            "</table>"

        return strGlobal;
    }
    ,


    checkifResponseAreInParagraphs: function () {
        var questions = {};
        async.series([

                function (callback) {// take all paragraphs in question
                    var payload = {
                        "size": 500,
                        "query": {
                            "match_all": {}
                        }
                    }
                    var elasticUrl = "http://localhost:9200/questions/_search"
                    request({
                            url: elasticUrl,
                            json: payload,
                            method: 'POST',
                            headers: {'Content-Type': 'application/json'}
                        },
                        function (err, res) {

                            if (err)
                                callback(err)
                            else if (res.body && res.body.errors && res.body.errors.length > 0) {
                                logger.error(JSON.stringify(res.body.errors))
                                callback(res.body.errors)
                            }
                            else {
                                if (res.body.hits.hits.length > 0) {
                                    var xx = res.body
                                    res.body.hits.hits.forEach(function (hit) {

                                        questions[hit._source.iD] = {data: hit._source};

                                    })
                                    callback()
                                }
                            }


                        })
                }
                ,
                function (callback) {//look response exact match


                    async.eachSeries(Object.keys(questions), function (questionId, callbackEach) {
                            var question = questions[questionId]
                            var expectedAnswer = question.data.expectedAnswer
                            var payload = {
                                "size": 500,
                                "query": {
                                    "match_phrase": {
                                        "paragraphText": expectedAnswer
                                    }
                                }
                            }
                            var elasticUrl = "http://localhost:9200/paragraphs/_search"
                            request({
                                    url: elasticUrl,
                                    json: payload,
                                    method: 'POST',
                                    headers: {'Content-Type': 'application/json'}
                                },
                                function (err, res) {

                                    if (err)
                                        callbackEach(err)
                                    else if (res.body && res.body.errors && res.body.errors.length > 0) {
                                        logger.error(JSON.stringify(res.body.errors))
                                        callbackEach(res.body.errors)
                                    }
                                    else {
                                        if (res.body.hits)
                                            questions[questionId].exactMatch = res.body.hits.total
                                        else
                                            questions[questionId].exactMatch = "??"

                                        /*     if(res.body.hits && res.body.hits.hits)
                                                   logger.info(question.iD+"\t"+question.typeReponse+"\t"+question.resultat+"\t"+res.body.hits.hits.length)
                                             else
                                                   logger.info(question.iD+"\t"+question.typeReponse+"\t"+question.resultat+"\t"+"??")*/
                                        //     logger.info(index);
                                        callbackEach()
                                    }
                                })


                        }, function (err) {
                            callback();
                        }
                    )
                },
                function (callback) {//look response approx match

                    logger.info("-------------------");

                    async.eachSeries(Object.keys(questions), function (questionId, callbackEach) {
                        var question = questions[questionId]
                        var expectedAnswer = question.expectedAnswer
                        var payload = {
                            "size": 500,
                            "query": {
                                "match": {
                                    "paragraphText": expectedAnswer
                                }
                            }
                        }
                        var elasticUrl = "http://localhost:9200/paragraphs/_search"
                        request({
                                url: elasticUrl,
                                json: payload,
                                method: 'POST',
                                headers: {'Content-Type': 'application/json'}
                            },
                            function (err, res) {

                                if (err)
                                    callbackEach(err)
                                else if (res.body && res.body.errors && res.body.errors.length > 0) {
                                    logger.error(JSON.stringify(res.body.errors))
                                    callbackEach(res.body.errors)
                                }
                                else {
                                    if (res.body.hits)
                                        questions[questionId].approxMatch = res.body.hits.total
                                    else
                                        questions[questionId].approxMatch = "??"

                                    callbackEach()
                                }
                            })


                    }, function (err) {
                        callback();
                    })
                }


            ],

            function (err) {
                Object.keys(questions).forEach(function (questionId) {
                    var question = questions[questionId];
                    console.infos(question.data.iD + "\t" + question.data.typeReponse + "\t" + question.data.resultat + "\t" + question.exactMatch + "\t" + question.approxMatch)


                })
            }
        )


    }
    ,

    createPostImportRelations: function () {

        var entities = [

            "Equipment",
            "Phenomenon",
            "Component",
            "Characterisation",
            "Temperature",
            "Time",
            "Vibration",
            "Method"
        ]
        async.series([
                function (callbackSeries) {  // relation thesaurus entity
                    return callbackSeries();
                    async.eachSeries(entities, function (entity, callback) {


                        var cypher = "Match(c:ThesaurusConcept),(x:" + entity + ") where c.concept=x.name and  x.subGraph=\"entitiesGraph3\" create(x)-[:instanceOf]->(c)"
                        neoProxy.match(cypher, function (err, result) {
                            callback(err);

                        })
                    }, function (err) {

                        return callbackSeries(err);
                    })
                },

                function (callbackSeries) { // relation document Entity to Paragraph entity
                    return callbackSeries();
                    async.eachSeries(entities, function (entity, callback) {

                        var cypher = "match(c:" + entity + ")--(n:Document)--(p:Paragraph) where p.subGraph=\"entitiesGraph3\"   create (p)-[:hasEntity{type:\"document\"}]->(c)"
                        neoProxy.match(cypher, function (err, result) {
                            callback(err);

                        })
                    }, function (err) {

                        return callbackSeries(err);
                    })
                },

                function (callbackSeries) { // relation document Entity to Paragraph entity
                    //   return callbackSeries();
                    async.eachSeries(entities, function (entity, callback) {
                        // relation chapter Entity to Paragraph entity
                        var cypher = "match(c:" + entity + ")--(n:Chapter)--(p:Paragraph) where p.subGraph=\"entitiesGraph3\" create (p)-[r:hasEntity{type:\"chapter\"}]->(c) return count(r)"
                        neoProxy.match(cypher, function (err, result) {
                            callback(err);

                        })
                    }, function (err) {

                        return callbackSeries(err);
                    })
                },

                function (callbackSeries) {//lien entre paragraphes du meme chapitre (precede)
                    return callbackSeries();

                    var cypher = "Match(n:Paragraph),(m:Paragraph) where n.subGraph=\"entitiesGraph3\" and  m.subGraph=\"entitiesGraph3\"  and n.Document=m.Document and n._ChapterTitle1=m._ChapterTitle1 and m.TextOffset-n.TextOffset=1 create (m)-[:precede]->(n)"
                    neoProxy.match(cypher, function (err, result) {

                        return callbackSeries(err);
                    })
                },
            ],

            function (err) {
                console.log("all done")

            }
        )
    }
    ,
    testQuestion: function (method, id, callback) {

        var where = "";
        if (id)
            where = " and q.id=" + id + " "

        var cypher = "Match path=(q:Question)--(n) where q.subGraph='entitiesGraph2' " + where + " return q,n";

        logger.info(cypher);
        neoProxy.match(cypher, function (err, result) {


            var questionObj = {
                question: {},
                words: [],
                nouns: [],
                verbs: [],
                entities: {}
            }
            var questionNode;


            result.forEach(function (node, index) {
                if (index == 0)
                    questionObj.question = node.q.properties
                var node = node.n;
                var label = node.labels[0];
                if (label == "Question_Noun") {
                    questionObj.nouns.push(node.properties.name)
                }
                else if (label == "Question_Verb") {
                    questionObj.verbs.push(node.properties.name)
                }
                else if (label == "Words") {
                    questionObj.words.push(node.properties.name)
                }
                else {
                    if (!questionObj.entities[label])
                        questionObj.entities[label] = [];
                    questionObj.entities[label].push({name: node.properties.name, id: node._id})

                }


            })
            questionObj.options = {
                filterNouns: false,
                rankPathsByNounfrequency: false,
                maxParagraphDistance: 2,
            }

            ParagraphEntitiesGraphQuestions.getParagraphsMatchingEntitiesAndWords(questionObj, callback)

        })

    }

}


function myIndexOf(array, field, value) {
    var index = -1
    array.forEach(function (line, arrayIndex) {
        if (line[field] == value)
            return index = arrayIndex;
    })
    return index;
}


module.exports = ParagraphEntitiesGraphQuestions


if (false)
    ParagraphEntitiesGraphQuestions.createPostImportRelations();


if (false) {
    ParagraphEntitiesGraphQuestions.testQuestion("nounsFirst", 117, function (err, result) {
        var print = ParagraphEntitiesGraphQuestions.printQuestionAndResponse(result);

        fs.writeFileSync("D:\\Total\\graphNLP\\test.html", print)
        //  console.log(print)
    });
}


if (false) {
    var questionIds = [4, 8, 9, 10, 11, 12, 13, 15, 16, 17, 22, 23, 26, 32, 33, 36, 37, 38, 39, 40, 41, 42, 44, 45, 46, 47, 48, 49, 53, 55, 56, 57, 58, 59, 60, 63, 65, 68, 71, 79, 84, 88, 94, 95, 98, 99, 100, 102, 104, 106, 109, 111, 112, 113, 114, 115, 116, 117, 118, 123, 133, 135];


    ParagraphEntitiesGraphQuestions.testQuestions("nounsFirst", questionIds, function (err, result) {

    });
}

if (false) {

    ParagraphEntitiesGraphQuestions.checkifResponseAreInParagraphs();
}
if (true) {


}

