var graphDisplay=(function(){

    var self={};



    self.applyDisplaySettings=function(){

       var size=parseInt( $("#graphDisplay_sizeInput").val());
        var shape= $("#graphDisplay_shapeSelect").val();
        var relationNames=$("#graphDisplay_relationsNamesCheck").val();
        var hideNodesWR=$("#graphDisplay_hideNodesWithNoRelationsCheck").val();


        Config.defaultNodeShape=shape;
        Config.defaultNodeSize=size;

        var nodes=visjsGraph.nodes._data;
        var newNodes=[];
        for(var id in nodes){
            newNodes.push({id:id,shape:shape,size:size});
        }
        visjsGraph.nodes.update(newNodes)


    }






    return self;




})()