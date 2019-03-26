var binder=(function(){

    self={}
    self.bindOnPageload=function(){
        var array=["circle","square"];
        common.fillSelectOptionsWithStringArray("graphParamsDialog_shapeSelect",array,true);

        $("#filterCollapseMenu").load("htmlSnippets/queryFilters.html", function () {
          console.log("queryFilters.html loaded")
        })

        $("#expandCollapseMenu").load("htmlSnippets/queryExpand.html", function () {
          console.log("queryExpand.html loaded")
        })

        $("#highlightCollapseMenu").load("htmlSnippets/queryHighlight.html", function () {
          console.log("queryHighlight.html loaded")
        })

      /*  var cypher = " match(n)-[]-(m) return n limit 100";
        Cypher.executeCypher(cypher, function (err, result) {
            if( err)
                var xx=2
        })*/



    }

   return self;
})()