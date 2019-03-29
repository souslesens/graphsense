var binder=(function(){

  self={}
  self.bindOnPageload=function() {

    var array=["circle","square"];
    common.fillSelectOptionsWithStringArray("graphParamsDialog_shapeSelect", array, true);


    $("#dbFilterCollapseMenu").load("htmlSnippets/dbQueryFilter.html", function () {
        console.log("queryFilters.html loaded");
        UI_query.initDbQueryFilter()

        $("#dbQueryFilterLabelModal").load("htmlSnippets/dbQueryFilterLabelModal.html", function () {

        })


      
    })

    $("#expandCollapseMenu").load("htmlSnippets/queryExpand.html", function () {
      console.log("queryExpand.html loaded")
    })

    $("#highlightCollapseMenu").load("htmlSnippets/queryHighlight.html", function () {
      console.log("queryHighlight.html loaded")
    })

    $("#displayModalContent").load("htmlSnippets/graphDisplayModal.html", function () {
      console.log("graphDisplayModal.html loaded")
      $("#myRange").on('input', function() {
        $("#myRangeTxt").html( $(this).val() )

      });
    })


  /*  var cypher = " match(n)-[]-(m) return n limit 100";
    Cypher.executeCypher(cypher, function (err, result) {
        if( err)
            var xx=2
    })*/


 

  }

   return self;
})()