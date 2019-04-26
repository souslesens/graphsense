var Cache=(function(){



    var self={}
    self.visjsGraphCache=[]
    self.visjsGraphCache.index=0;




    self.addCurrentGraphToCache=function(){
        if( self.visjsGraphCache.index==self.visjsGraphCache.length) {
            var graphObj = visjsGraph.exportGraph();
            self.visjsGraphCache.push(graphObj);
            self.visjsGraphCache.index += 1
        }

        self.setNextPreviousButtonVisibility()
    }

    self.restorePreviousGraph=function(){
        self.visjsGraphCache.index-=1;
        self.setNextPreviousButtonVisibility()
        if( self.visjsGraphCache.index<0)
            return;
        visjsGraph.importGraph(self.visjsGraphCache[self.visjsGraphCache.index]);
    }

    self.restoreNextGraph=function(){
        self.visjsGraphCache.index+=1;
        self.setNextPreviousButtonVisibility()
        if( self.visjsGraphCache.index>=self.visjsGraphCache.length)
            return;
        visjsGraph.importGraph(self.visjsGraphCache[self.visjsGraphCache.index]);
    }

    self.setNextPreviousButtonVisibility=function(){

        if(self.visjsGraphCache.length>0 &&  self.visjsGraphCache.index>0)
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