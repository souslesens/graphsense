var Nlp = (function () {

    var self = {};


    self.executeQuery = function () {


        var queryObject = UI_query.setContextQueryObjectParams();
        var label = GraphSimpleQuery.currentLabel;
        queryObject.label = label;

        context.cardsMap[label]=queryObject;


        var cypher = "";
        var index=0;
        var withStr=""
        for( var key in context.cardsMap){
            index++;
            var where=buildPaths.getWhereClauseFromQueryObject(context.cardsMap[key],"x"+index);
            if(where==null || where=="")
                where="";
            else
                where=" WHERE "+where
            withStr+="x"+index+",";

                cypher+=" MATCH  (x"+index+":"+key+")<--(p1:Paragraph) "+where;

                cypher+=" WITH "+withStr+"p1";



        }

        cypher+= " MATCH (p1)-->(p2:Paragraph) return "+withStr+"p1,p2"






      //  var cypher = "MATCH (x1:Phenomenon)<--(p1:Paragraph) where x1.name=\"Surge\" with x1,p1 MATCH (p1)-->(x2:Time) with x1,x2,p1 MATCH (p1)<--(p2:Paragraph) return x1,x2,p1,p2"


        Cypher.executeCypher(cypher, function (err, result) {
var html="<div>";
var title="";
            var content=[];
            result.forEach(function (line,index) {

                for(var key in line){
                    if(key.indexOf("x")>-1  && index==0 ){
                        title+=line[key].labels[0]+" : "+line[key].properties.name+"<br>";
                    }
                    else  if(key.indexOf("p")>-1){
                        content.push({index:line[key].properties.TextOffset,text:line[key].properties.ParagraphText })

                    }
                }

                content.sort(function(a,b){
                    if( a.index>b.index)
                        return 1;
                    if( a.index<b.index)
                        return -1;
                    return 0;
                })


                content.forEach(function(line2){
                    html+=line2.index+"--"+line2.text+"<br>"
                })


            })

            html=title+"<br>"+html;
            $("#graphDiv").html(html);

        })
    }


    return self;

})();