var Binder=(function(){

    var self={};

   self.initBinds=function(){

       $("#subGraphDropdownMenuButton").bind("click",function(){

           context.subGraph=$(this).val();


       })

   }



    return self;


})()