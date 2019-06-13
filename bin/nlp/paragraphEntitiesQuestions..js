var async = require("async")
var neoProxy = require("../neoProxy.js")
var httpProxy = require("../httpProxy.js");
var request = require("request");
var fs = require("fs");


var ParagraphEntitiesGraphQuestions = {

    extractEntitiesFromPlainTextQuestion:function(questionText,callback){
        var serviceUrl = "http://server-ctg-neo-question.azurewebsites.net/question/";
        request({
                url: serviceUrl+questionText,
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
                   var data=res.body;
                   if(typeof data=="string")
                       data=JSON.parse(data);
                    callback(null, data)
                }
            })


    },

    getParagraphsMatchingEntitiesAndWords: function (questionObj, callback) {
        var response = {}
        var paragraphIdsWordsFilter = [];
        var matchingNeoPaths = {};
        var options = questionObj.options;
        if (!options)
            options = {};

        async.series([

                //find Entities neo4j ids
                function (callbackSeries) {

            if(options.format=="TotalQuestionService"){
                var entityNames = [];
                if (questionObj.question_entities.length == 0)
                    return callback();



                var subGraph = options.subGraph;
                var subGraphStr = "";
                if (subGraph)
                    subGraphStr = " and n.subGraph='" + subGraph + "' ";

                function capitalize(str){
                    return str.charAt(0).toUpperCase() + str.slice(1);
                }
                var index=0;
                async.eachSeries(questionObj.question_entities, function (entityObj, callbackEach) {


                    var entityType=capitalize(entityObj.question_label)
                        var cypher = "match (n:" + entityType + ") where n.name='" + entityObj.question_normalized_value + "' " + subGraphStr + " return id(n) as neoId";
                        neoProxy.match(cypher, function (err, result) {
                            if (result.length == 0)
                                return callback("no entity " + entityType + ":" + entityObj.question_normalized_value + " in graph")
                            if (result.length > 1)
                                return callback("more than on entity " + entityType + ":" + entityObj.question_normalized_value + " in graph try specify subGraph")

                            questionObj.question_entities[index].neoId = result[0].neoId;
                            index++;
                            callbackEach();
                        })

                    },
                    function (err) {
                        return callbackSeries();
                    })



            }else {

                var entityNames = [];
                if (Object.keys(questionObj.entities).length == 0)
                    return callback();

                for (var key in questionObj.entities) {
                    var entities = questionObj.entities[key];
                    entities.forEach(function (entity, index) {
                        if (!entity.neodId && key) {
                            entityNames.push({entityType: key, name: entity.name, index: index})
                        }
                    })
                }
                if (entityNames.length == 0)
                    return callback();

                var subGraph = options.subGraph;
                var subGraphStr = "";
                if (subGraph)
                    subGraphStr = " and n.subGraph='" + subGraph + "' "
                async.eachSeries(entityNames, function (entityObj, callbackEach) {
                        var cypher = "match (n:" + entityObj.entityType + ") where n.name='" + entityObj.name + "' " + subGraphStr + " return id(n) as neoId";
                        neoProxy.match(cypher, function (err, result) {
                            if (result.length == 0)
                                return callback("no entity " + entityObj.entityType + ":" + entityObj.name + " in graph")
                            if (result.length > 1)
                                return callback("more than on entity " + entityObj.entityType + ":" + entityObj.name + " in graph try specify subGraph")

                            questionObj.entities[entityObj.entityType][entityObj.index].neoId = result[0].neoId;
                            callbackEach();
                        })

                    },
                    function (err) {
                        return callbackSeries();
                    })

            }
                },

                //if options.searchNounsFirst==true : search engine retreive ids of paragraphs matching nouns
                function (callbackSeries) {
                    if (!options.searchNounsFirst)
                        return callbackSeries();
                    ParagraphEntitiesGraphQuestions.getMatchingWordsParagraphs(questionObj, function (err, result) {

                        result.forEach(function (paragraph) {
                            if (typeof paragraph.id == "string")
                                paragraphIdsWordsFilter.push(parseInt(paragraph.id))
                            else
                                paragraphIdsWordsFilter.push(paragraph.id)
                        })
                        response.maxNounSearchScore = result[0].score;
                        callbackSeries();
                    })


                },


                // query Graph to extract paragraphs matching entities at distance
                function (callbackSeries) {
                    if(options.format=="TotalQuestionService"){

                    }else{
                    var cards = {};
                    var index = 0
                    for (var key in questionObj.entities) {
                        var entities = questionObj.entities[key];
                        entities.forEach(function (entity) {
                            var queryObject = {
                                name: entity.name,
                                nodeSetIds: [entity.neoId],
                                label: key
                            }
                            cards[key + index] = queryObject;
                            index++;
                        })
                        var options = {
                            cards: cards,
                            distance: 2,
                            paragraphIds: paragraphIdsWordsFilter
                        }
                    }

                    ParagraphEntitiesGraphQuestions.executeNeoPathsQuery(options, function (err, result) {

                        matchingNeoPaths = result
                        callbackSeries();
                    })
                },


                //if option rankPathsByNounfrequency use regex to rank neo path by counting nouns in each path (aggregate or paragraphs between entities)
                function (callbackSeries) {

                    if (!options.rankPathsByNounfrequency) {
                        return callbackSeries();
                    }

                    for (var key in matchingNeoPaths) {

                        var paths = matchingNeoPaths[key];
                        paths.forEach(function (path, index) {
                            var score = ParagraphEntitiesGraphQuestions.getPathTextScore(path, questionObj.nouns);
                            paths[index].score = score;

                        })

                        paths.sort(function (a, b) {
                            if (a.score < b.score)
                                return 1;
                            if (a.score > b.score)
                                return -1;
                            return 0;
                        })

                        matchingNeoPaths[key].paths = paths;

                    }
                    callbackSeries();
                }

                ,

                // aggregate question and response paths in response object
                function (callbackSeries) {
                    for (var key in matchingNeoPaths) {
                        var responseObj = {}
                        var paths = matchingNeoPaths[key];

                        var str = "";
                        responseObj.paths = [];

                        paths.forEach(function (path, index) {
                            var responsePathObj = {score: path.score, paragraphs: []};

                            path.nodes.forEach(function (node, index) {
                                if (node.labels[0] != "Paragraph") {
                                    return;
                                }
                                responsePathObj.paragraphs.push({id: node.properties.ID, text: node.properties.ParagraphText})
                            })

                            responseObj.paths.push(responsePathObj);
                        })


                        response[key] = responseObj;
                        callbackSeries();
                    }


                }


            ],
            function (err) {
                return callback(err, {question: questionObj, response: response});
            })


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

        var getPathBetweenEntities = function (keys, distance, paragraphIds, callback) {

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
                    if (distance > 1)
                        cypher += "MATCH   path=(x" + index + ")<-[:hasEntity*" + minCardinality + "..1]-(p1)-[:precede*0.." + distance + "]-(p2)-[:hasEntity*" + minCardinality + "..1]->(x" + (index + 1) + ")";
                    else
                        cypher += "MATCH   path=(x" + index + ")<-[:hasEntity*" + minCardinality + "..1]-(p1)";//-[:precede*0.." + distance + "]-(p2)"


                    /*    if (distance > 1)
                            cypher += "MATCH   path=(x" + index + ")-[:instanceOf*0..1]->(c"+ index +":ThesaurusConcept  )<-[:hasConcept*0..1]-(p1)-[:precede*0.." + distance + "]-(p2)-[:hasConcept*0..1]->(c"+ (index+1) +":ThesaurusConcept)<-[:instanceOf*0..1]-(x" + (index + 1) + ")";
                        else
                            cypher += "MATCH   path=(x" + index + ")-[:instanceOf*0..1]->(c"+ index +":ThesaurusConcept  )<-[:hasConcept*0..1]-(p1)-[:precede*0.." + distance + "]-(p2)"
                  */

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
            cypher += where + " return nodes(path) as nodes, relationships(path) as relations";

            console.log(cypher);
            neoProxy.match(cypher, function (err, result) {
                if (err)
                    return callback(err);
                return callback(null, result)

            })

        }


        var cardsMap = options.cards;
        var distance = options.distance;
        var paragraphIds = options.paragraphIds

        if (cardsMap)


            var cardKeys = Object.keys(cardsMap);
        var countCards = cardKeys.length;

        var combinations2, combinations1;
        var combinationResults = {};
        var matchCount = 0;

        if (countCards == 0) {
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
            function (callback) {//combinasons 2à 2
                if (combinations2.length == 0)
                    return callback();
                async.eachSeries(combinations2, function (combination, callbackEach) {
                        getPathBetweenEntities(combination, distance, paragraphIds, function (err, result) {
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
                        getPathBetweenEntities(combination, 1, paragraphIds, function (err, result) {
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
        ], function (err) {
            return callbackOuter(err, combinationResults)

        })


    }
    ,


    testQuestions: function (method, ids, callback) {
        var allQuestionsResults = [];
        async.eachSeries(ids, function (id, callbackEach) {
            ParagraphEntitiesGraphQuestions.testQuestion(method, id, function (err, result) {


            })

        })
    }
    ,


    testQuestion: function (method, id, callback) {

        var where = "";
        if (id)
            where = " and q.id=" + id + " "

        var cypher = "Match path=(q:Question)--(n) where q.subGraph='entitiesGraph2' " + where + " return q,n";

        console.log(cypher);
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
                searchNounsFirst: false,
                rankPathsByNounfrequency: false,
                maxParagraphDistance: 2,
            }

            ParagraphEntitiesGraphQuestions.getParagraphsMatchingEntitiesAndWords(questionObj, callback)

        })

    }

    ,
    getMatchingWordsParagraphs: function (queryObject, callback) {
        var matchStr = ""
        queryObject.nouns.forEach(function (noun) {
            matchStr += noun + " "
        })

        var elasticUrl = "http://localhost:9200/paragraphs/_search"
        var query = {
            "size": 100,
            "query": {

                "bool": {
                    "must": [
                        {
                            "match": {
                                "paragraphText": matchStr
                            }
                        }]
                }
            }


        }
        console.log(JSON.stringify(query, null, 2))

        var matchingWordsParagraphs = []
        request({
                url: elasticUrl,
                json: query,
                method: 'POST',
                headers: {'Content-Type': 'application/json'}
            },
            function (err, res) {

                if (err)
                    callback(err)
                else if (res.body && res.body.errors && res.body.errors.length > 0) {
                    console.log(JSON.stringify(res.body.errors))
                    callback(res.body.errors)
                }
                else {
                    if (res.body.hits.hits.length > 0)
                        var xx = res.body
                    res.body.hits.hits.forEach(function (hit) {
                        var paragraph = {id: hit._source.iD, score: hit._score};
                        matchingWordsParagraphs.push(paragraph)
                    })
                    callback(null, matchingWordsParagraphs)
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
                    console.log(JSON.stringify(res.body.errors))
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


    /*
    
    {
      {
      "query": {  "bool" : {
          "must" : [
    
            { "terms" : {
            "ID" : [20, 30,31,32]
        }},
             { "match": {
          "ParagraphText": "surge "
        }}]
      }
               }
    }
    
    }
     */


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
                                console.log(JSON.stringify(res.body.errors))
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
                                        console.log(JSON.stringify(res.body.errors))
                                        callbackEach(res.body.errors)
                                    }
                                    else {
                                        if (res.body.hits)
                                            questions[questionId].exactMatch = res.body.hits.total
                                        else
                                            questions[questionId].exactMatch = "??"

                                        /*     if(res.body.hits && res.body.hits.hits)
                                                 console.log(question.iD+"\t"+question.typeReponse+"\t"+question.resultat+"\t"+res.body.hits.hits.length)
                                             else
                                                 console.log(question.iD+"\t"+question.typeReponse+"\t"+question.resultat+"\t"+"??")*/
                                        //   console.log(index);
                                        callbackEach()
                                    }
                                })


                        }, function (err) {
                            callback();
                        }
                    )
                },
                function (callback) {//look response approx match

                    console.log("-------------------");

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
                                    console.log(JSON.stringify(res.body.errors))
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
                    console.log(question.data.iD + "\t" + question.data.typeReponse + "\t" + question.data.resultat + "\t" + question.exactMatch + "\t" + question.approxMatch)


                })
            }
        )


    }


}
module.exports = ParagraphEntitiesGraphQuestions


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
/***
 {
  "mappings": {
    "type_name": {
      "properties": {
        "idNeo": {
          "type": "integer"
        },

        "vectors": {
        "type":        "text",
        "term_vector": "with_positions_offsets"
      }
      }
    }
  }

}







 */

var obj = {
    "options": {
        "maxParagraphDistance": 2,
        "searchNounsFirst": false,
        "rankPathsByNounfrequency": true,
    },
    "nouns": [
        "measurment",
        "turbine",
        "steam",
        "inlet"
    ],

    "entities": {
        "Equipement": [
            {
                "name": "Steam Turbine",
                "id": 311014
            }
        ],
        "Characterisation": [
            {
                "name": "Mawp",
                "id": 311227
            }
        ]
    }
}