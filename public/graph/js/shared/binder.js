var binder=(function(){

    self={}
    self.bindOnPageload=function(){
        var array=["circle","square"];
        common.fillSelectOptionsWithStringArray("graphParamsDialog_shapeSelect",array,true);



        $("#filterCollapseMenu").load("htmlSnippets/queryFilters.html", function () {
          console.log("queryFilters.html loaded")
        })

        var cypher = " match(n)-[]-(m) return n limit 100";


        Cypher.executeCypher(cypher, function (err, result) {
            if( err)
                var xx=2
        })



    }

   return self;
})()