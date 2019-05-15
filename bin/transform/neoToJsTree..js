var neoProxy = require("../neoProxy.js");

var neoToJstree = {


    generateTreeFromChildToParentRelType: function (label, relType, rootNeoId, callback) {

        var match = "match(n:" + label + ")-[r:" + relType + "]-(m) where id(n)=" + rootNeoId + " return   n as parent ,m as child";
        neoProxy.match(match, function (err, result) {

            if (err)
                return callback(err);


            var nodes = []
            result.forEach(function (line, index) {
                var parentProps = line.parent.properties;
                parentProps._id = line.parent._id;
                if (index == 0)
                    nodes.push({text: parentProps.name, id: parentProps._id, parent: "#", data: parentProps})

                var childProps = line.child.properties;
                childProps._id = line.child._id;

                nodes.push({
                    text: childProps.name,
                    id: childProps._id,
                    parent: parentProps._id,
                    data: childProps,
                    children: []
                })


            })
            var x = nodes;

            return callback(null, nodes)


        })
    },


    generateTreeFromParentToChildrenRelType: function (label, relType, rootNeoId, callback) {

        //  var match = "match(n:" + label + ")<-[r:" + relType + "]-(m)<-[r2:" + relType + "*0..1]-(p:" + label + ") where id(n)=" + rootNeoId +" and ID(n)<>ID(m)  return   n as parent ,m as child,count(p) as  chidrenCount order by child ";
        var match;
        if (relType == "inverse")
            match = "match(n:" + label + ")-[r]->(m:" + label + ")-[r2*0..1]->(p:" + label + ") where id(n)=" + rootNeoId + " and ID(n)<>ID(m)  return   n as parent ,m as child,count(p) as  childrenCount order by child ";
        else
            match = "match(n:" + label + ")<-[r]-(m:" + label + ")<-[r2*0..1]-(p:" + label + ") where id(n)=" + rootNeoId + " and ID(n)<>ID(m)  return   n as parent ,m as child,count(p) as  childrenCount order by child ";


        neoProxy.match(match, function (err, result) {
         //   console.log(match);
            if (err)
                return callback(err);


            var data = [];
            result.forEach(function (line, index) {
                var parentProps = line.parent.properties;
                parentProps._id = line.parent._id
                /*  if (index == 0)
                      parent=({text: parentProps.name, id: parentProps._id, data: parentProps, children:[]})*/

                var childProps = line.child.properties;
                childProps.labelNeo = line.child.labels[0];
                childProps._id = line.child._id;
                var text=childProps.name;

               line.childrenCount-=1;// pas compris pourquoi !!


                if(line.childrenCount>0)
                    text+=" ("+line.childrenCount+")";
                if (childProps.name != "Root" && childProps._id != parentProps._id) {
                    data.push({
                        text: text,
                        id: childProps._id,
                        parent: parentProps._id,
                        data: childProps,
                        children: [],
                        childrenCount: line.childrenCount || -1
                    })
                }


            })


            return callback(null, data)


        })
    },

    generateAllDescendantsTreeFromChildToParentRelType: function (label, relType, rootNeoId, depth, callback) {

        if (!depth || depth == 0)
            depth = 5;
        var depthStr = "*1.." + depth;
        var match = "match(n:" + label + ")-[r:" + relType + depthStr + "]-(m) where id(n)=" + rootNeoId + " return   n as parent ,r,m as child";
        neoProxy.match(match, function (err, result) {

            if (err)
                return callback(err);


            var nodes = [];

            var nodesMap = {}
            //nodes
            result.forEach(function (line, index) {
                var parentProps = line.parent.properties;
                parentProps._id = line.parent._id
                if (!nodesMap[line.parent._id]) {
                    nodesMap[line.parent._id] = {
                        text: parentProps.name,
                        id: parentProps._id,
                        parent: "",
                        data: parentProps
                    }
                }

                var childProps = line.child.properties;
                childProps._id = line.child._id
                if (!nodesMap[line.child._id])
                    nodesMap[line.child._id] = {
                        text: childProps.name,
                        id: childProps._id,
                        parent: "",
                        data: childProps
                    }


            })
            //rels
            result.forEach(function (line, index) {
                line.r.forEach(function (rel) {
                    if (!nodesMap[rel._fromId])
                        return;
                    nodesMap[rel._fromId].parent = rel._toId;
                })
            })

            for (var key in nodesMap) {
                nodes.push(nodesMap[key])
            }


            return callback(null, nodes)


        })


    }


}

module.exports = neoToJstree;

/*neoToJstree.generateAllDescendantsTreeFromChildToParentRelType("physicalClass", "childOf", 25443, 3, function (err, result) {

})*/
/*neoToJstree.generateTreeFromChildToParentRelType("physicalClass","childOf",24789, function(err, result){

})*/
