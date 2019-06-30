var async = require("async")
var neoProxy = require("../neoProxy.js")
var httpProxy = require("../httpProxy.js");
var request = require("request");
var fs = require("fs");

var logger = require("../logger..js");
var elasticUrl = "http://localhost:9200/thesaurus_ctg/_search";

var InteractiveQuestions={

    getSentenceEntityProposals:function(sentence,callback){

        var words=sentence.split(" ");

        var proposals=[];
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
                                proposals.push(obj)
                            })
                        }
                        callbackEach()
                    }
                })





        },

            function(err){
                callback(err,proposals)

            })

    }



}
module.exports=InteractiveQuestions;