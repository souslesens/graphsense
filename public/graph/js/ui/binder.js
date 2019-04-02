var binder=(function(){

  self={}
  self.bindOnPageload=function() {

    var array=["circle","square"];
    common.fillSelectOptionsWithStringArray("graphParamsDialog_shapeSelect", array, true);


    $("#dbFilterCollapseMenu").load("htmlSnippets/query/queryFilter.html", function () {
        console.log("queryGraphFilter.html loaded");
        //loads for each label buttons to build a card for this label
        UI_query.initQueryLabels();

        //loads the modal dialog to apply filters to a card , customized with property of the label
        $("#dbQueryFilterLabelModal").load("htmlSnippets/query/queryFilterLabelModal.html", function () {

            $('#dbQueryFilterLabelModal').on('hidden.bs.modal', function (e) {

                $('#query_possibleValuesDiv').addClass('d-none');
                $("#query_valueInput").val("");
                $('#query_valueInput').focus();
                $("#query_validateQueryButton").unbind('click');
            })

        })

    })

      $("#GraphNodePopoverDiv").load("htmlSnippets/graph/nodePopover.html", function () {
          console.log("graphQueryExpand.html loaded")
      })

   /*   $("#graph_nodeInfosDiv").load("htmlSnippets/graph/nodeInfos.html", function () {

      })*/



      $("#GraphExpandModalMenu").load("htmlSnippets/graph/expand.html", function () {
          console.log("graphQueryExpand.html loaded")
      })

      $("#GraphHighlightModalMenu").load("htmlSnippets/graph/highlight.html", function () {
          console.log("graphQueryHighlight.html loaded")
      })

      $("#displayModalContent").load("htmlSnippets/graph/displayModal.html", function () {
          console.log("graphDisplayModal.html loaded")
          $("#myRange").on('input', function() {
              $("#myRangeTxt").html( $(this).val() )

          });
      })



 

  }

   return self;
})()