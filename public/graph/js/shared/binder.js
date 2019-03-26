var binder=(function(){

  self={}
  self.bindOnPageload=function() {

    var array=["circle","square"];
    common.fillSelectOptionsWithStringArray("graphParamsDialog_shapeSelect", array, true);


    $("#dbFilterCollapseMenu").load("htmlSnippets/dbQueryFilter.html", function () {
      console.log("queryFilters.html loaded");
      var dbLabelToFilter = ["Label 1", "Label 2", "Label 3", "Label 4"];
      var dbColorClassToFilter = ["primary", "secondary", "success", "danger", "warning","info","light","dark"];
      var dbBadgeToFilter = [10,55,30,44,8,32];
      
      for(i=0;i<dbLabelToFilter.length;i++)
      {
        var buttonLabelToAdd = "<button type='button' class='btn btn-" + dbColorClassToFilter[i] + "' data-toggle='modal' data-target='#dbQueryFilterLabelModal'>" + dbLabelToFilter[i] + " <span class='badge badge-pill badge-light'>" + dbBadgeToFilter[i] + "</span></button>";
        $("#dbFilterLabelButtonGroup").append( buttonLabelToAdd );
      }

      
      $("#dbQueryFilterLabelModal").load("htmlSnippets/dbQueryFilterLabelModal.html", function () {
        console.log("queryExpand.html loaded")
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