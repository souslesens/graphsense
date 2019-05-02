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

      //collapse navbar javascript
      $('#sidebarCollapse').on('click', function () {
          $('#sidebar').toggleClass('active');
      });


      /*   $("#sidebar").mCustomScrollbar({
             theme: "minimal"
         });*/

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
          $("#myRange").on('input', function() {
              $("#myRangeTxt").html( $(this).val() )

          });
      })



 

  }

   return self;
})()