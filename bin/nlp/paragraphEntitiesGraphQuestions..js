var async = require("async")
var neoProxy = require("../neoProxy.js")
var request = require("request")

var ParagraphEntitiesGraph = require("./paragraphEntitiesGraph..js")

var ParagraphEntitiesGraphQuestions = {


    testQuestions: function (method, ids, callback) {
        var allQuestionsResults = [];
        async.eachSeries(ids, function (id, callbackEach) {
            ParagraphEntitiesGraphQuestions.testQuestion(method, id, function (err, result) {


            })

        })
    },


    testQuestion: function (method, id, callback) {


        var response = {}

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
            if (method == "entitiesFirst") {
                ParagraphEntitiesGraphQuestions.getPathsByEntities(questionObj);
            }
            else if (method == "nounsFirst") {
                ParagraphEntitiesGraphQuestions.getPathsByNouns(questionObj, function (err, matchingWordsParagraphs) {

                        if (matchingWordsParagraphs.length == 0) {
                            return callback(null, "no matching noun");
                        }

                        response.maxNounSearchScore = matchingWordsParagraphs[0].score;


                        var paragraphIds = [];
                        matchingWordsParagraphs.forEach(function (paragraph) {
                            if (typeof paragraph.id == "string")
                                paragraphIds.push(parseInt(paragraph.id))
                            else
                                paragraphIds.push(paragraph.id)
                        })


                        var cards = {};
                        var index = 0
                        for (var key in questionObj.entities) {
                            var entities = questionObj.entities[key];
                            entities.forEach(function (entity) {
                                var queryObject = {
                                    name: entity.name,
                                    nodeSetIds: [entity.id],
                                    label: key
                                }
                                cards[key + index] = queryObject;
                                index++;
                            })
                            var options = {
                                cards: cards,
                                distance: 2,
                                paragraphIds: paragraphIds
                            }
                        }

                        ParagraphEntitiesGraph.executeQuery(options, function (err, matchingNeoPaths) {


                            for (var key in matchingNeoPaths) {
                                var responseObj = {}
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

                                var str = "";
                                responseObj.paths = [];

                                paths.forEach(function (path, index) {
                                    var responsePathObj = {score: path.score, paragraphs: []};


                                    //  str += "-----------------------------------\n"

                                    path.nodes.forEach(function (node, index) {
                                        if (node.labels[0] != "Paragraph") {
                                            return;
                                        }
                                        //   str += node.properties.ID + "----" + path.score + "\n" + node.properties.ParagraphText + "\n";
                                        responsePathObj.paragraphs.push({id: node.properties.ID, text: node.properties.ParagraphText})
                                    })

                                    responseObj.paths.push(responsePathObj);
                                })
                                //  console.log(str)


                                response[key] = responseObj;

                            }
                            return callback(null, {question: questionObj, response: responseObj})


                        })
                    }
                );
            }


        })

    },


    getPathsByEntities: function (questionObj) {
        var cards = {}
        var index = 0;
        for (var key in questionObj.entities) {
            var entities = questionObj.entities[key];
            entities.forEach(function (entity) {
                var queryObject = {
                    name: entity.name,
                    nodeSetIds: [entity.id],
                    label: key
                }
                cards[key + index] = queryObject;
            })


            index++
        }


        ParagraphEntitiesGraph.executeQuery(cards, 2, function (err, matchingNeoPaths) {


            var uniquePaths = [];


            var matchingWordsPaths = []
            //   async.eachSeries(matchingNeoPaths, function (path, callbackEach) {
            matchingNeoPaths.forEach(function (path) {

                var paragraphIds = [];
                var entities = {};
                var pathId = ""
                path.nodes.forEach(function (node) {
                    pathId += node.properties.ID;
                    if (node.properties.ParagraphText) {
                        paragraphIds.push(node.properties.ID)
                    }
                    else {
                        entities[node.labels[0]] = node.properties.name;

                    }
                })
                if (uniquePaths.indexOf(pathId) < 0) {
                    uniquePaths.push(pathId);

                }


            })


        })
    }


    , getPathsByNouns: function (queryObject, callback) {
        var matchStr = ""
        queryObject.nouns.forEach(function (noun) {
            matchStr += noun + " "
        })

        var elasticUrl = "http://localhost:9200/paragraphs/_search"
        var query = {
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

    , filterWords: function (path, words) {

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
    , callElastic: function () {

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


    },


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
        obj.response.paths.forEach(function (path) {

            strResponse += "<tr><td>score</td><td>" + path.score + "</td></tr> ";

            path.paragraphs.forEach(function (paragraph) {
                strResponse += "<tr><td>"+paragraph.id+"</td><td>" + paragraph.text + "</td></tr> ";
            })

        })
        strResponse += "</table>"


        var strGlobal = "<table>" +
            "<tr><td>" + strQuestion + "</td>" +
            "<td>" + strResponse + "</td></tr>" +
            "</table>"

        return strGlobal;
    }


}
module.exports = ParagraphEntitiesGraphQuestions


if (true) {
    ParagraphEntitiesGraphQuestions.testQuestion("nounsFirst", 9, function (err, result) {
       var print= ParagraphEntitiesGraphQuestions.printQuestionAndResponse(result);
       console.log(print)
    });
}


if (false) {
    var questionIds = [4, 8, 9, 10, 11, 12, 13, 15, 16, 17, 22, 23, 26, 32, 33, 36, 37, 38, 39, 40, 41, 42, 44, 45, 46, 47, 48, 49, 53, 55, 56, 57, 58, 59, 60, 63, 65, 68, 71, 79, 84, 88, 94, 95, 98, 99, 100, 102, 104, 106, 109, 111, 112, 113, 114, 115, 116, 117, 118, 123, 133, 135];


    ParagraphEntitiesGraphQuestions.testQuestions("nounsFirst", questionIds, function (err, result) {

    });
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