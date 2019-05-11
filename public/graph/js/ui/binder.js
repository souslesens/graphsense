var binder=(function(){





  self={}
  self.bindOnPageload=function() {

    var array=["circle","square"];
    common.fillSelectOptionsWithStringArray("graphParamsDialog_shapeSelect", array, true);

      $(document).mousedown(function(event){
          var x = event.pageX;
          var y=event.pageY ;
          context.mousePosition={x:x,y:y}
      });
    $("#dbFilterCollapseMenu").load("htmlSnippets/query/queryFilter.html", function () {
        console.log("queryGraphFilter.html loaded");
        //loads for each label buttons to build a card for this label


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

      //collapse navbar javascript
      $('#sidebarCollapse').on('click', function () {
          $('#sidebar').toggleClass('active');
      });


      /*   $("#sidebar").mCustomScrollbar({
             theme: "minimal"
         });*/

      $("#tree_searchNodeValue").on("keyup",function(event) {
         if(event.keyCode==13)
             Tree.searchNodes($(this).val(),'search_treeContainerDiv');
      });
      $("#query_valueInput").on("keyup",function(event) {
          if(event.keyCode==13)
              $("#query_validateQueryButton").trigger();
      });



      $("#query_newQueryButton").bind("click",function(){
          UI_query.newQuery();

      })
      $('#sidebarCollapse').on('click', function () {
          $('#sidebar, #content').toggleClass('active');
          $('.collapse.in').toggleClass('in');
          $('a[aria-expanded=true]').attr('aria-expanded', 'false');
      });

      //toggle to show the left menu
      $('#showTreeButton').on('click', function () {
      
          $('#sidebar, #content').toggleClass('active');
          $('.collapse.in').toggleClass('in');
          $('a[aria-expanded=true]').attr('aria-expanded', 'false');
      });


      $("#GraphNodePopoverDiv").load("htmlSnippets/graph/nodePopover.html" , function () {

      })

      $("#GraphRelationPopoverDiv").load("htmlSnippets/graph/relationPopover.html" , function () {

      })

      $("#GraphNodeInfoWrapperDiv").load("htmlSnippets/graph/nodeInfos.html" , function () {

      })
      $("#nodeInfosPopoverWrapperDiv").load("htmlSnippets/graph/nodeInfosPopover.html" , function () {

      })



      $("#GraphExpandModalMenu").load("htmlSnippets/graph/expand.html", function () {
          console.log("graphExpand.html loaded")
      })

      $("#GraphHighlightModalMenu").load("htmlSnippets/graph/highlight.html", function () {
          console.log("graphHighlight.html loaded")
      })
      $("#GraphFilterModalMenu").load("htmlSnippets/graph/filter.html", function () {
          console.log("graphfilter.html loaded")
      })

      $("#ExportDataModalMenu").load("htmlSnippets/exportDataModal.html", function () {
          console.log("exportDataModal.html loaded")
      })

      $("#adminModalMenu").load("htmlSnippets/admin.html", function () {
          console.log("exportDataModal.html loaded")
      })








      $("#displayModalContent").load("htmlSnippets/graph/displayModal.html", function () {
          console.log("graphDisplayModal.html loaded")
          $("#graphDisplay_sizeRange").on('input', function() {
              $("#graphDisplay_sizeInput").html( $(this).val() );


          });
          $("#graphDisplay_sizeInput").html(Config.defaultNodeSize);
          $("#graphDisplay_shapeSelect").val(Config.defaultNodeShape);
      })



 

  }

   return self;
})()