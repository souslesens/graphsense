var binder=(function(){

    self={}
    self.bindOnPageload=function(){
        var array=["circle","square"];
        common.fillSelectOptionsWithStringArray("graphParamsDialog_shapeSelect",array,true);


var xxx=  $("#filterCollapseMenu");

        $("#filterCollapseMenu").load("htmlSnippets/queryFilters.html", function () {
           // alert("aa");
        })


    }

   return self;
})()