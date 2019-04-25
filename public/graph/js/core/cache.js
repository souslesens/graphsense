var Cache=(function(){



    var self={}
    self.visjsGraphCache=[];
    self.visjsGraphHashKeys=[];
    self.visjsGraphCache.index=0;




    self.addCurrentGraphToCache=function(queryObjs){


            var graphObj = visjsGraph.exportGraph();
        graphObj.queryObjs=queryObjs
            self.visjsGraphHashKeys
            self.visjsGraphCache.push(graphObj);
            self.visjsGraphCache.index= self.visjsGraphCache.length

        self.setNextPreviousButtonVisibility()



    }

    self.restorePreviousGraph=function(){
        self.visjsGraphCache.index-=1;

        if( self.visjsGraphCache.index<0)
            return self.visjsGraphCache.index=0;
        self.setNextPreviousButtonVisibility()
        var graph=self.visjsGraphCache[self.visjsGraphCache.index-1];
        visjsGraph.importGraph(graph);
        UI_query.restoreQueryObjs(graph.queryObjs)
    }

    self.restoreNextGraph=function(){
        self.visjsGraphCache.index+=1;

        if( self.visjsGraphCache.index>self.visjsGraphCache.length)
            return  self.visjsGraphCache.index=self.visjsGraphCache.length-1
        self.setNextPreviousButtonVisibility()
        var graph=self.visjsGraphCache[self.visjsGraphCache.index-1];
        visjsGraph.importGraph(graph);
        UI_query.restoreQueryObjs(graph.queryObjs)
    }

    self.setNextPreviousButtonVisibility=function(){

        if(self.visjsGraphCache.length>0 &&  self.visjsGraphCache.index>1)
            $("#graphCache_previousGraphButton").removeClass("d-none");
        else
            $("#graphCache_previousGraphButton").addClass("d-none");

        if(self.visjsGraphCache.length>=0 &&  self.visjsGraphCache.index<(self.visjsGraphCache.length))
            $("#graphCache_nextGraphButton").removeClass("d-none");
        else
            $("#graphCache_nextGraphButton").addClass("d-none");


    }

    return self;

})()