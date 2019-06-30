var Tree = (function () {
        var self = {};
        self.tree;
        self.currentType;
        self.cardIndexes = {};
        self.trees = [];
        self.checkboxChangeTimeStamp = 0;
        self.openingNode = null;
        self.previousSelectedNodes = [];
        var treedivId = "treeDiv";


        self.resetTrees = function () {
            return;
            self.trees.forEach(function (treeDivId) {
                //   if ($('#' + treedivId).jstree()) {
                $('#' + treedivId).jstree().settings.core.data = [];
                $('#' + treedivId).jstree().refresh();


                //}
            })


        }

        self.setJsTree = function (jsTreeData, onSelectFn, expandAll) {
            self.previousSelectedNodes = [];
            $('#' + treedivId).html('<div id="' + treedivId + '_tree" style="width:100%;height: 100%">zzzz</div>')


            var plugins = [];

            plugins.push("checkbox");
            plugins.push("types");


            $('#' + treedivId + '_tree').jstree({
                'check_callback' : true,
                'core': {
                    'check_callback': true,
                    'data': jsTreeData,


                }
                , 'contextmenu': {
                    'items': []
                },

                "checkbox": {
                    "whole_node": false
                },
                'plugins': plugins,
            }).on("select_node.jstree",
                function (evt, obj) {

                    if (self.previousSelectedNodes && self.previousSelectedNodes.length > 0) {// unckek nodes from the previous addSelectionToQuery
                        $('#' + treedivId + "_tree").jstree("deselect_node", self.previousSelectedNodes);
                        self.previousSelectedNodes.forEach(function (id) {


                        })


                    }


                    if (Config.plugins.paragraphEntitiesGraph) {
                      $("#plugin-paragraphEntitiesAddSelectionBtn").removeClass("d-none");
                        $("#plugin-paragraphEntitiesGraphDiv").removeClass("d-none");
                    }
                    $("#tree-searchAddCardButton").removeClass("d-none");
                    $("#tree-hierarchyAddCardButton").removeClass("d-none");

                })

                .on("open_node.jstree",

                    function (evt, obj) {

                    if(  obj.data &&Config.trees[obj.data._treeKey]) {// only hierarchical tree

                        self.openingNode = obj.node;
                        if (obj.node.children.length == 1) {
                            obj.node.children.forEach(function (child) {
                                if (child.indexOf("shadow") == 0)
                                    $('#' + treedivId + "_tree").jstree('delete_node', child);

                            })

                            self.addChildrenNodes(obj.node);
                            $('#' + treedivId + "_tree").jstree().uncheck_all()
                        }
                    }
                    })
                .on('loaded.jstree', function (e, data) {
                    if (expandAll)
                        $('#' + treedivId + "_tree").jstree("open_all")
                  //  $('#' + treedivId + "_tree").jstree("open_all");
                    // invoked after jstree has loaded
                    //   $(this).jstree("open_node", "" + quantum.currentRootNeoId);
                })

            $('#' + treedivId + "_tree").jstree().hide_icons();



        }


        self.getChildren = function (id) {
            var children = [];
            data.forEach(function (line) {
                if (line.parentID == id)
                    children.push({
                        id: line.iD,
                        //  parent: id,
                        text: line.nom
                    })
            })
            return children;

        }

        self.addChildrenNodes = function (obj) {
            var treeParams = Config.trees[obj.data._treeKey];
            var position = 'last';
            //  var parent = $('#' + treedivId).jstree('get_selected');
            var parentId = "" + obj.id;
            self.getNodes(obj.data._treeKey, treeParams.label, treeParams.relType, obj.id, function (err, data) {
                    //  console.log(obj.text, data.length)
                    data.forEach(function (childNode, index) {
                        if (obj.parents.indexOf("" + childNode.id) < 0) {// eviter la recursivite
                            childNode.id = "" + childNode.id;
                            if (!childNode.childrenCount || childNode.childrenCount > 0) {
                                // if (!childNode.children || childNode.children.length == 0)
                                childNode.children.push({id: "shadow" + childNode.id, text: "aa", parent: "" + childNode.id})
                            }
                            childNode.parent = "" + childNode.parent;
                            $('#' + treedivId + "_tree").jstree('create_node', childNode.parent, childNode, 'last', function (www) {
                                //
                            });


                        }
                        else
                            var x = 1;

                    })
                    if (data.length > 0)
                        $('#' + treedivId + "_tree").jstree('open_node', parentId);

                }
            );
        }


        self.iniTrees = function () {

            var recursiveRels = Schema.getRecursiveRelsLabels();

            var treekeys = [];
            for (var key in Config.trees) {
                if (recursiveRels.indexOf(key) > -1)
                    treekeys.push(key);
            }
            common.fillSelectOptionsWithStringArray("tree_labelSelect", treekeys, true);
            Tree.resetTrees();

          //  MainController.openAccordion('hierarchySubMenu')
            /*  Config.simpleSearchTree=new Tree("search_treeContainerDiv");
              Config.hierarchyTree=new Tree("hierarchy_treeContainerDiv");*/


        }


        /****************************************************************************************************************************************************/


        self.init = function () {
            var treekeys = Object.keys(Config.trees)
            common.fillSelectOptionsWithStringArray("tree_labelSelect", treekeys, true);


        }


        self.setTree = function (treeJson, onSelectFn, expandAll) {
            $(".tree_addToselectionButton").addClass("d-none");

            if (self.tree) {
                self.tree.destroy()
                self.tree.disableAll()

            }

            self.tree = $('#' + treedivId).tree(
                {
                    uiLibrary: 'bootstrap4',
                    dataSource: treeJson,
                    primaryKey: 'id',
                    checkboxes: true
                }
            );
            self.tree.on('select', function (e, node, id) {


            });

            self.tree.on('checkboxChange', function (e, $node, record, state) {
                //   if((e.timeStamp-self.checkboxChangeTimeStamp)>500)//avoid repetition intempestive
                Tree.addSelectionToQuery(state)
                self.checkboxChangeTimeStamp = e.timeStamp;
                /*   $("#treePopoverWrapperDiv").css("top", context.mousePosition.y).css("left", context.mousePosition.x);
                   $("#treePopoverWrapperDiv").removeClass("d-none")
                   $(".alert").addClass("d-none");*/

            })

            self.tree.on('expand', function (e, node, id) {
                if (onSelectFn)
                    onSelectFn(id);
            });


            self.tree.reload()
            if (expandAll)
                self.tree.expandAll();


        }


        self.drawNodeHierarchyTree = function (key, _treedivId) {
            treedivId = _treedivId;
            if (self.trees.indexOf(treedivId) < 0)
                self.trees.push(treedivId)
            self.currentType = key;

            var treeParams = Config.trees[key];
            if (!treeParams)
                return;


            self.getJsTreeFromRoot(key, treeParams.label, treeParams.relType, treeParams.rootSelector, function (err, children) {
                if (err)
                    return console.log(err);

                var onSelectFn = function (id) {

                    self.getNodes(key, treeParams.label, treeParams.relType, id, function (err, result) {

                        //remove factive node used for expand image
                        var children = self.tree.getChildren(self.tree.getNodeById("" + id));
                        if (children) {
                            children.forEach(function (child) {
                                if (child < 0)
                                    self.tree.removeNode(self.tree.getNodeById("" + child));
                            })
                        }

                        var parent = self.tree.getNodeById("" + id);
                        var children = result;
                        // var level = self.tree.parents(id).length;
                        //   var colors=["#E0E0E0","#D8D8D8","#D0D0D0","#C8C8C8","#C0C0C0","#B8B8B8"]
                        children.forEach(function (childNode, index) {

                            self.tree.addNode(childNode, parent);

                        })
                    })
                }
                var shadowNodes = []
                children.forEach(function (childNode, index) {
                    // if more than one children add a false child to each child to see the expand image+
                    if (!childNode.childrenCount || childNode.childrenCount > 0) {
                        shadowNodes.push({id: "shadow" + childNode.id, text: "aa", parent: "" + childNode.id})
                    }
                })
                children = children.concat(shadowNodes);
                self.setJsTree(children, onSelectFn);
            });


        }


        self.getNodes = function (treeKey, type, relType, rootNeoId, callback) {


            var payload = {
                generateTreeFromParentToChildrenRelType: 1,
                label: type,
                relType: relType,
                rootNeoId: rootNeoId
            }


            $.ajax({
                type: "POST",
                url: Cypher.neo4jProxyUrl,
                dataType: "json",
                data: payload,
                success: function (result, textStatus, jqXHR) {
                    var parents = null;
                    if (self.openingNode) {
                        parents = self.openingNode.parents;
                        parents.push(self.openingNode.id)
                    }


                    var children = []
                    result.forEach(function (child, index) {

                        if (!parents || parents.indexOf("" + child.id) < 0) {
                            child.data._treeKey = treeKey;
                            children.push(child)
                        }
                        else {


                        }


                    })

                    children.sort(function (a, b) {
                        if (a.text < b.text)
                            return 1;
                        if (a.text < b.text)
                            return -1;

                        return 0;

                    })
                    return callback(null, children)

                },
                error: function (error) {
                    return callback(error)
                }
            })
        }


        self.getJsTreeFromRoot = function (treeKey, label, relType, rootSelector, callback) {

            var relType = relType;
            $(".alert").addClass("d-none");

            var cypher = "Match (n:" + label + ") where n." + rootSelector + " and n.subGraph='" + context.subGraph + "'  return id(n) as id";
            Cypher.executeCypher(cypher, function (err, result) {
                if (err)
                    return console.log(err);
                var currentRootNeoId = result[0].id;
                self.getNodes(treeKey, label, relType, currentRootNeoId, function (err, result) {
                    if (err)
                        return callback(err);
                    result.forEach(function (child, index) {

                        if (child.parent == currentRootNeoId)
                            result[index].parent = "#";
                        /*    if (!parentNode.children[index].children || parentNode.children[index].children.length==0)
                                parentNode.children[index].children.push({id: -Math.round(Math.random() * 10000), text: "", parent: child.id})*/
                    })
                    //   console.log(JSON.stringify(result, null, 2))
                    return callback(err, result)


                })

            })

        }

        self.addSelectionToQuery = function (type) {

            var selectedNodes = $('#' + treedivId + "_tree").jstree('get_selected');
            var labelsMap = {};
            var checkedIds = [];
            selectedNodes.forEach(function (id) {
                // if more than one children add a false child to each child to see the expand image+
                if (id.indexOf("shadow") < 0 && id > -1) {
                    checkedIds.push(id);
                    var node = $('#' + treedivId + "_tree").jstree(true).get_node(id);
                    if (true || type == "search") {
                        if (!labelsMap[node.parent])
                            labelsMap[node.parent] = {ids:[],texts:[]};
                      //  labelsMap[node.parent].push(id)
                        labelsMap[node.parent].ids.push(id);
                        labelsMap[node.parent].texts.push(node.parent+"-"+node.text)

                    }
                    else {
                        if (!labelsMap[self.currentType])
                            labelsMap[self.currentType] = []
                        labelsMap[self.currentType].push(id);
                    }

                }

            })
            self.previousSelectedNodes = checkedIds;

            if (checkedIds.length > Config.maxInIdsArrayLength)
                return MainController.alert("too many nodes selected : max " + Config.maxInIdsArrayLength);


            for (var key in labelsMap) {

                if (!self.cardIndexes[key])
                    self.cardIndexes[key] = 0;
                self.cardIndexes[key] += 1

                var checkedIds = labelsMap[key].ids;
                var checkedTexts = labelsMap[key].texts;
                var queryObject = {};
                var clauseText = " set (" + checkedIds.length + " nodes)";
                queryObject.label = null;
                if (context.nodeColors[key])
                    queryObject.label = key;


                queryObject.text = clauseText;
                queryObject.cardTitle = key + "-" + self.cardIndexes[key];

                queryObject.type = "nodeSet" + key;
                queryObject.where = buildPaths.getWhereClauseFromArray("_id", checkedIds, "n");
                queryObject.nodeSetIds = checkedIds;
                queryObject.nodeSetTexts = checkedTexts;
                queryObject.inResult = true;
                queryObject.origin = "tree";

                $("#simpleQuery_erase").removeClass("d-none")
                if (type == "plugin-paragraphEntitiesGraph") {
                    ParagraphEntitiesGraph.addQueryObject(queryObject)
                }
                else {

                    self.drawTreeSelection(queryObject)
                    //UI_query.addCardToQueryDeck(queryObject);
                }

                UI_query.showQueryMenu()

            }
        }

        self.drawTreeSelection = function (queryObject) {

            var label = queryObject.label;

            function execQuery(label, addToGraph, callback) {
                var options = {
                    addToGraph: addToGraph,
                }
                buildPaths.executeQuery("graph", options, callback);
            }


            var addToGraph = false;


            if (visjsGraph.legendLabels.length == 0 || visjsGraph.legendLabels[0] == "labels") {
                self.labelIndex = 1
                queryObject.index = 1;
                var cardId = label;
                context.cardsMap[cardId] = queryObject;

            }

            else {
                context.cardsMap = {};

                context.cardsMap[label] = queryObject;
                var idsQueryObject = {}
                idsQueryObject.label = null;

                //   idsQueryObject.type = "nodeSet" + key;

                idsQueryObject.nodeSetIds = Object.keys(visjsGraph.nodes._data);
                idsQueryObject.inResult = true;
                idsQueryObject.origin = "simpleQueryTree";


                context.cardsMap["*"] = idsQueryObject;
                addToGraph = true;


            }


            execQuery(label, addToGraph, function (err, result) {
                if (err)
                    return console.log(err);


                $("#navbar_graph_Graph_ul").removeClass("d-none");
                $("#simpleQuery_erase").removeClass("d-none")
                var withOrphans = true;
                if (withOrphans && context.cardsMap["*"]) {
                    delete  context.cardsMap["*"];

                    execQuery(label, addToGraph, function (err, result) {

                    })
                }


            })


        }


        self.searchNodes = function (value, _treedivId) {
            context.currentQueryCardId = -1;// on creera une nouvelle card avec la selection de cette recherche
            treedivId = _treedivId;
            if (self.trees.indexOf(treedivId) < 0)
                self.trees.push(treedivId)
            if (value.length < 2)
                return;
            var cypher
            if (value.indexOf("match") == 0)
                cypher = value;
            else {
                var whereSubGraph = "";
                if (context.subGraph && context.subGraph != "")
                    whereSubGraph = " and n.subGraph='" + context.subGraph + "' "
                cypher = "match(n) where n.name=~'(?i).*" + value + ".*' " + whereSubGraph + " return labels(n)[0] as label , collect(id(n)) as ids, collect(n." + Config.defaultNodeNameProperty + ") as names limit " + Config.maxListDisplayLimit;

            }
            Cypher.executeCypher(cypher, function (err, result) {
                if (err)
                    return console.log(err);
                var totalLength = 0;
                result.forEach(function (line) {
                    totalLength += line.ids.length;
                })
                if (totalLength > Config.maxInIdsArrayLength)
                    return MainController.alert("too many results : " + totalLength + "  maximum allowed " + Config.maxInIdsArrayLength);

                var treeData = []
                result.forEach(function (line, indexLine) {
                    var children = [];
                    line.ids.forEach(function (id, indexValue) {
                        children.push({
                            id: id,
                            text: result[indexLine].names[indexValue],

                        })
                    })
                    //var text = "<span style='margin :2px; border-radius: 5px;border:1px solid black; padding:5px; background-color: " + context.nodeColors[line.label] + "'>" + line.label + " (" + line.ids.length + ")" + "</span>"
                    var text = "<span style='margin :2px; border-radius: 5px;border:1px solid black;padding: 2px; background-color: " + context.nodeColors[line.label] + "'>" + line.label + " <span class='badge badge-light'>" + line.ids.length + "</span>";
                    var node = {
                        id: line.label,
                        text: text,
                        children: children,
                        data: {_treeKey: "search"}
                    }
                    treeData.push(node)


                })
                //  self.tree = "";


                /*  children.forEach(function (child) {
                      //  child.text="<span style='background-color: "+colors[level]+"'>"+child.text+"</span>"
                      self.tree.addNode(child, parent);
                  })*/


                self.setJsTree(treeData, null,true);
                UI_query.showQueryMenu();
            })


        }
        self.searchNodesDialog = function (value, _treedivId) {
            treedivId = _treedivId;
            if (self.trees.indexOf(treedivId) < 0)
                self.trees.push(treedivId)
            var allProperties = Schema.getAllProperties();


            common.fillSelectOptionsWithStringArray("query_propertySelect", allProperties, true);


            $('#dbQueryFilterLabelModal').modal('show');
            $(".alert").addClass("d-none");

            $("#query_validateQueryButton").bind('click', function (target) {
                $('#dbQueryFilterLabelModal').modal('hide');
                var queryObj = UI_query.setContextQueryObjectParams();
                var whereStr = buildPaths.getWhereClauseFromQueryObject(queryObj, "n");
                var cypher = "match(n) where " + whereStr + "  return labels(n)[0] as label , collect(id(n)) as ids, collect(n." + Config.defaultNodeNameProperty + ") as names limit " + Config.maxListDisplayLimit;
                self.searchNodes(cypher);

            })


        }


        return self;


    }
)()