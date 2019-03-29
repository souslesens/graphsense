var binder=(function(){

  self={}
  self.bindOnPageload=function() {

    var array=["circle","square"];
    common.fillSelectOptionsWithStringArray("graphParamsDialog_shapeSelect", array, true);


    $("#dbFilterCollapseMenu").load("htmlSnippets/query/queryFilter.html", function () {
        console.log("queryFilters.html loaded");
        //loads for each label buttons to build a card for this label
        UI_query.initQueryLabels();

        //loads the modal dialog to apply filters to a card , customized with property of the label
        $("#dbQueryFilterLabelModal").load("htmlSnippets/query/queryFilterLabelModal.html", function () {

        })

    })

      $("#graphExpandModalMenu").load("htmlSnippets/graph/graphExpand.html", function () {
          console.log("graphQueryExpand.html loaded")
      })

      $("#graphHighlightModalMenu").load("htmlSnippets/graph/graphHighlight.html", function () {
          console.log("graphQueryHighlight.html loaded")
      })

      $("#displayModalContent").load("htmlSnippets/graph/graphDisplayModal.html", function () {
          console.log("graphDisplayModal.html loaded")
          $("#myRange").on('input', function() {
              $("#myRangeTxt").html( $(this).val() )

          });
      })



 

  }

   return self;
})()