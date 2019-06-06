var async = require("async")
var neoProxy = require("../neoProxy.js")

var ParagraphEntitiesGraph = require("./paragraphEntitiesGraph..js")

var ParagraphEntitiesGraphQuestions = {

    testQuestion: function (id) {
        var where = "";
        if (id)
            where = " and q.id=" + id + " "

        var cypher = "Match path=(q:Question)--(n) where q.subGraph='entitiesGraphQuestions' " + where + " return n";

        console.log(cypher);
        neoProxy.match(cypher, function (err, result) {


            var questionObj = {
                words: [],
                entities: {}
            }
            var xx = result;


            result.forEach(function (node) {
                var node = node.n;
                var label = node.labels[0];
                if (label == "Words") {
                    questionObj.words.push(node.properties.name)
                }
                else {
                    if (!questionObj.entities[label])
                        questionObj.entities[label] = [];
                    questionObj.entities[label].push(node.properties.name)

                }


            })
            var xx=questionObj;


var cards={}

            for( var key in questionObj.entities){



            }



        })


    }

}
module.exports = ParagraphEntitiesGraphQuestions

ParagraphEntitiesGraphQuestions.testQuestion(10);