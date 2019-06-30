var async = require("async")
var neoProxy = require("../neoProxy.js")
var httpProxy = require("../httpProxy.js");
var request = require("request");
var fs = require("fs");

var logger = require("../logger..js");
var elasticUrl = "http://localhost:9200/thesaurus_ctg/_search";

var InteractiveQuestions={

    getSentenceEntityProposals:function(sentence,callback){
        sentence=sentence.toLowerCase()
        var words=sentence.split(" ");

        var proposals={entities:[],words:[]};
        async.eachSeries(words,function(word,callbackEach){

            var  payload = {
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
                                var obj = {id: hit._iD, score: hit._score,data:hit._source};
                                proposals.entities.push(obj)
                            })
                        }else{
                            if(InteractiveQuestions.englishStopWords.indexOf(word)<0)
                            proposals.words.push(word)
                        }
                        callbackEach()
                    }
                })





        },

            function(err){
                callback(err,proposals)

            })

    },

    englishStopWords:["i",
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
module.exports=InteractiveQuestions;