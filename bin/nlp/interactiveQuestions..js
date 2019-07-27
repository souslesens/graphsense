var async = require("async")
var neoProxy = require("../neoProxy.js")
var httpProxy = require("../httpProxy.js");
var request = require("request");

var ParagraphEntitiesGraphQuestions=require("./paragraphEntitiesQuestions2.")
var fs = require("fs");

var logger = require("../logger..js");
var elasticUrl = "http://localhost:9200/thesaurus_ctg/_search";

var InteractiveQuestions = {



    getSentenceEntityProposals: function (sentence, callback) {

        ParagraphEntitiesGraphQuestions.extractEntitiesFromPlainTextQuestion(sentence,function(err,resultPJ){
            if(err)
                return callback(err);

            var entitiesByLabel={};
            resultPJ.question_entities.forEach(function(entity){
                if (!entitiesByLabel[entity.entity_label])
                    entitiesByLabel[entity.entity_label] = {entities: [], concepts: []};
                entitiesByLabel[entity.entity_label].entities.push(entity);
                entitiesByLabel[entity.entity_label].concepts.push(entity.entity_normalized_value);

                })


            var entityLabels = Object.keys(entitiesByLabel);
            var entitiesMatchingParagrahs = {};
            var entitiesMatchingParagrahsArray=[]
            async.eachSeries(entityLabels, function (label, callbackEach2) {
                    var concepts = JSON.stringify(entitiesByLabel[label].concepts);
                    var cypher = "Match (n:" + label + ")--(p:Paragraph) where n.name in " + concepts + " and n.subGraph=\"entitiesGraph3\"  return n, count(p) as paragraphsCount order by paragraphsCount desc limit 1000"
                    //   console.log(cypher);
                    neoProxy.match(cypher, function (err, resultGraph) {

                        resultGraph.forEach(function (line) {
                            if(!entitiesMatchingParagrahs[label])
                                entitiesMatchingParagrahs[label]=[]
                            entitiesByLabel[label].entities.forEach(function (obj, index) {
                                if (obj.entity_normalized_value == line.n.properties.name) {
                                    obj.entity_neoId = line.n._id;
                                    obj.entity_paragraphsCount = line.paragraphsCount;
                                    //  entitiesByLabel[label].entities[index] = obj;
                                    entitiesMatchingParagrahsArray.push(obj)
                                    entitiesMatchingParagrahs[label].push(obj)


                                }else{

                                }
                                // delete entitiesByLabel[label].concepts
                            })


                        })
                        callbackEach2()
                    })
                },function(err){
                    // console.log(JSON.stringify(entitiesMatchingParagrahs, null, 2));
                if(true)//en tableau
                    resultPJ.question_entities=entitiesMatchingParagrahsArray;
                else// groupés par label
                resultPJ.question_entities=entitiesMatchingParagrahs;
                    callback(err, resultPJ)
                }
            )






        })
    },

    getSentenceEntityProposalsCF: function (sentence, callback) {
        sentence = sentence.toLowerCase()
        var words = sentence.split(" ");
        var entitiesByLabel = {};
        var proposals = {entities: [], words: []};
        async.eachSeries(words, function (word, callbackEach) {

                var payload = {
                    "size": 100,
                    "query": {
                        "bool": {
                            "must": {
                                "match": {
                                    "content": word
                                }
                            }
                        }
                    }
                }

                //     logger.info(JSON.stringify(payload, null, 2))


                request({
                        url: elasticUrl,
                        json: payload,
                        method: 'POST',
                        headers: {'Content-Type': 'application/json'}
                    },
                    function (err, res) {

                        if (err)
                            return callbackEach(err)
                        else if (res.body && res.body.errors && res.body.errors.length > 0) {
                            logger.error(JSON.stringify(res.body.errors))
                            return callback(res.body.errors)
                        }
                        else {
                            if (res.body.hits.hits.length > 0) {
                                var xx = res.body
                                res.body.hits.hits.forEach(function (hit) {
                                    var obj = {elasticId: hit._id, score: hit._score, data: hit._source, word: word};
                                    proposals.entities.push(obj)
                                })
                            } else {
                                if (InteractiveQuestions.englishStopWords.indexOf(word) < 0)
                                    proposals.words.push(word)
                            }
                            callbackEach()
                        }
                    })


            },

            function (err) {
                if (true) {


                    proposals.entities.forEach(function (entity) {
                        if (entity.data && entity.data.ancestors) {
                            var ancestors = entity.data.ancestors.split(";")
                            ancestors.push(entity.data.concept)
                            var label = ancestors[0]
                            var name = entity.data.concept;
                            var word = entity.word;
                            var id = entity.data.iD;
                            if (!entitiesByLabel[label])
                                entitiesByLabel[label] = {entities: [], concepts: []};
                            entitiesByLabel[label].entities.push({
                                entity_label: label,
                                entity_normalized_value: name,
                                entity_value: word,
                                entity_ancestors:entity.data.ancestors,
                                entity_synonyms:entity.data.synonyms

                            })
                            entitiesByLabel[label].concepts.push(name);
                        }
                    })

                    var entityLabels = Object.keys(entitiesByLabel);
                    var entitiesMatchingParagrahs = {}
                    async.eachSeries(entityLabels, function (label, callbackEach2) {
                            var concepts = JSON.stringify(entitiesByLabel[label].concepts);
                            var cypher = "Match (n:" + label + ")--(p:Paragraph) where n.name in " + concepts + " and n.subGraph=\"entitiesGraph3\"  return n, count(p) as paragraphsCount order by paragraphsCount desc limit 1000"
                         //   console.log(cypher);
                            neoProxy.match(cypher, function (err, result) {
                                var x = result;

                                result.forEach(function (line) {
                                    if(!entitiesMatchingParagrahs[label])
                                        entitiesMatchingParagrahs[label]=[]
                                    entitiesByLabel[label].entities.forEach(function (obj, index) {
                                        if (obj.entity_normalized_value == line.n.properties.name) {
                                            obj.neoId = line.n._id;
                                            obj.paragraphsCount = line.paragraphsCount;
                                          //  entitiesByLabel[label].entities[index] = obj;
                                            entitiesMatchingParagrahs[label].push(obj)


                                        }else{

                                        }
                                       // delete entitiesByLabel[label].concepts
                                    })


                                }).
                                callbackEach2()
                            })
                        },function(err){
                     // console.log(JSON.stringify(entitiesMatchingParagrahs, null, 2));
                        callback(err, entitiesMatchingParagrahs)
                        }
                    )


                }


              //  console.log(JSON.stringify(proposals, null, 2));
             //   callback(err, proposals)

            })

    },

    englishStopWords: ["i",
        "me",
        "my",
        "myself",
        "we",
        "our",
        "ours",
        "ourselves",
        "you",
        "your",
        "yours",
        "yourself",
        "yourselves",
        "he",
        "him",
        "his",
        "himself",
        "she",
        "her",
        "hers",
        "herself",
        "it",
        "its",
        "itself",
        "they",
        "them",
        "their",
        "theirs",
        "themselves",
        "what",
        "which",
        "who",
        "whom",
        "this",
        "that",
        "these",
        "those",
        "am",
        "is",
        "are",
        "was",
        "were",
        "be",
        "been",
        "being",
        "have",
        "has",
        "had",
        "having",
        "do",
        "does",
        "did",
        "doing",
        "a",
        "an",
        "the",
        "and",
        "but",
        "if",
        "or",
        "because",
        "as",
        "until",
        "while",
        "of",
        "at",
        "by",
        "for",
        "with",
        "about",
        "against",
        "between",
        "into",
        "through",
        "during",
        "before",
        "after",
        "above",
        "below",
        "to",
        "from",
        "up",
        "down",
        "in",
        "out",
        "on",
        "off",
        "over",
        "under",
        "again",
        "further",
        "then",
        "once",
        "here",
        "there",
        "when",
        "where",
        "why",
        "how",
        "all",
        "any",
        "both",
        "each",
        "few",
        "more",
        "most",
        "other",
        "some",
        "such",
        "no",
        "nor",
        "not",
        "only",
        "own",
        "same",
        "so",
        "than",
        "too",
        "very",
        "s",
        "t",
        "can",
        "will",
        "just",
        "don",
        "should",
        "now"]


}
module.exports = InteractiveQuestions;