/*******************************************************************************
 * SOUSLESENS LICENSE************************
 *
 * The MIT License (MIT)
 *
 * Copyright (c) 2016-2019 Claude Fauconnet claude.fauconnet@neuf.fr
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 *
 ******************************************************************************/






var entitiesPathsVisjsGraph = (function () {
    self = {};

    /**
     * draws suggested entities in the graph
     *
     * @param graphDiv : div id(string) of the graph
     * @param data :  array of entities objects  retrieved by service getAssociatedEntitiesInsidePaths (select entities property in retreived object : data.entities
     * @param _options : object that contains callback methods corresponding to each gaph event (by now only click) exemple
        * options={click: myMethodOnClick} : myMethodOnClick is a function pointer . when click event on a graph node myMethodOnClick(myNodeObject) is called with myNodeObject as parameter
     *
     *
     *
     */

    self.drawProposedEntitiesGraph = function (graphDiv, data, _options) {
        if (!_options)
            _options = {};
        var xx = data;
        var labels = {};
        var visjsData = {nodes: [], edges: []};


        if (!Array.isArray(data) && data.question_entities)
            data = data.question_entities;

        data.forEach(function (entity) {
            if (entity.concept_name) {//entities grouped by concept
                if (!labelsMap[entity.concept_name])
                    labelsMap[entity.concept_name] = 0;
                var labelNode = {
                    id: entity.concept_name,
                    label: entity.concept_name
                }
                visjsData.nodes.push(labelNode)

                entity.entities.forEach(function (entity2) {
                    var entityNode = {
                        id: entity2.entity_neoId,
                        label: entity2.entity_normalized_value,
                        value: entity2.entity_paragraphsCount,
                        entity: entity2,
                        neoLabel: entity.concept_name,
                        color: entitiesLabelColors[entity2.entity_label],
                    }
                    labelsMap[entity.concept_name] += entity2.entity_paragraphsCount;
                    proposedEntities[entityNode.id] = entity2;
                    visjsData.nodes.push(entityNode)
                    visjsData.edges.push({from: labelNode.id, to: entityNode.id})
                })
            } else {// sentence analysis : no group


                var entityNode = {
                    id: entity.entity_neoId,
                    label: entity.entity_normalized_value,
                    value: entity.entity_paragraphsCount,
                    entity: entity,
                    color: entitiesLabelColors[entity.entity_label],
                }
                proposedEntities[entityNode.id] = entity;
                visjsData.nodes.push(entityNode)

            }

        })
        var nodes = new vis.DataSet(visjsData.nodes);
        var edges = new vis.DataSet(visjsData.edges);

        // create a network
        var container = document.getElementById(graphDiv);
        var data = {
            nodes: nodes,
            edges: edges
        };
        var options = {
            height: '100%',
            width: '100%',
            nodes: {

                shape: 'dot',


                scaling: {
                    customScalingFunction: function (min, max, total, value) {
                        return value / total;
                    },
                    min: 10,
                    max: 20
                },
            },
        };
        var network = new vis.Network(container, data, options);


        var allLabels = Object.keys(labelsMap);
        if (allLabels.length > 0) {// if many entities with conceptName

            allLabels.forEach(function (label) {
                totalParagraphs += labelsMap[label]
            })
            allLabels.forEach(function (label) {

                network.cluster({
                    joinCondition: function (item) {
                        if (item.label == label)
                            return true;
                        return item.neoLabel == label;

                    },
                    clusterNodeProperties: {
                        label: label + "(" + labelsMap[label] + ")",
                        color: entitiesLabelColors[label],
                        shape: "hexagon",
                        //   size: (labelsMap[label]/allLabels)*20
                    }
                });
            })
        }

        network.on("click", function (params) {
            if (params.nodes.length == 1) {
                var nodeId = params.nodes[0];
                if (typeof nodeId === "string" && nodeId.indexOf("cluster") == 0)
                    return network.clustering.openCluster(nodeId)
                if (_options.click) {
                    var nodeObj = network.body.nodes[nodeId];
                    return _options.click(nodeObj);
                }
            }
        })


    }




    /**
     * draws documents, chapters andaragraphs paths (excerpts) and all their related entities (optional: see WARNING) in the graph
     * by now the selected entities are not drawn because they often overload the graph (too many adges)
     *
     * @param graphDiv : div id(string) of the graph
     * @param data :  array  retrieved by service getParagraphsMatchingEntitiesAndWords (select  data.response property in retreived object : data.response)
     *   WARNING !! : if service options  "withParagraphEntities" is set to true or 1 all entites related to the paragraphs will be drawn , if not only doc chapters and , paths will be drawn
     * @param _options : object that contains callback methods corresponding to each gaph event (by now only click) exemple
     * options={click: myMethodOnClick} : myMethodOnClick is a function pointer . when click event on a graph node myMethodOnClick(myNodeObject) is called with myNodeObject as parameter
     *
     *
     */

    self.drawParagraphsGraph = function (graphDiv, responseTree, _options) {
        if (!_options)
            _options = {}

        var maxPathCountForPathNodes = 10;
        var visjsData = {nodes: [], edges: []}

        var totalPathsCount = responseTree[0].pathsCount;
        var inputEntitiesIds = []
        responseTree[0].entities.forEach(function (entity) {
            inputEntitiesIds.push(entity.entity_neoId)
        })


        var entitiesMap = {}
        var allLabels = [];
        var allDocuments = [];
        if(! responseTree[0].allAssociatedEntities)
            responseTree[0].allAssociatedEntities=[];
        responseTree[0].allAssociatedEntities.forEach(function (entity) {

            // on ne dessine que les entités associées hors entités de la question
            if (inputEntitiesIds.indexOf(entity.entity_neoId) < 0) {

                var entityNode = {
                    id: "E_" + entity.entity_neoId,
                    neoId: +entity.entity_neoId,
                    label: entity.entity_normalized_value,
                    color: entitiesLabelColors[entity.entity_label],
                    neoLabel: entity.entity_label,
                    isEntity: true

                }
                if (!entitiesMap[entityNode.id]) {
                    entitiesMap[entityNode.id] = entityNode;
                    visjsData.nodes.push(entityNode);
                }
                if (allLabels.indexOf(entity.entity_label) < 0)
                    allLabels.push(entity.entity_label)
            }
        })


        allLabels.forEach(function (label) {
            if (!entitiesLabelColors[label])
                var xxx = 1
            var color = hexToRgba(entitiesLabelColors[label], 0.4);
            var labelNode = {
                shape: "circle",
                id: label,
                label: label,
                neoLabel: "label",
                color: color
            }

        })

        responseTree[0].documents.forEach(function (document) {

            var documentNode = {
                shape: "square",
                id: document.reference,
                label: document.reference,
                neoLabel: "Document",
                color: entitiesLabelColors["Document"],
                data: {title: document.title, reference: document.reference, chaptersCount: document.chapters.length}
            }
            allDocuments.push(documentNode.id)
            visjsData.nodes.push(documentNode);
            // visjsData.edges.push({from: rootNode.id, to: documentNode.id});
            document.chapters.forEach(function (chapter) {

                var chapterNode = {
                    shape: "square",
                    id: chapter.reference,
                    label: chapter.title,
                    neoLabel: "Chapter",
                    color: hexToRgba(entitiesLabelColors["Document"], 0.7),
                    data: {title: chapter.title, reference: chapter.reference, pathsCount: chapter.paths.length, documentReference: documentNode.id}
                }
                if (true || totalPathsCount > maxPathCountForPathNodes) {
                    chapterNode.data.paths = chapter.paths;
                }
                visjsData.nodes.push(chapterNode);
                visjsData.edges.push({from: documentNode.id, to: chapterNode.id});


                chapter.paths.forEach(function (path, pathIndex) {
                    var chapterEntitiesMap = {};
                    if (totalPathsCount <= maxPathCountForPathNodes) {
                        var pathId = chapterNode.id + "_" + pathIndex;
                        var pathNode = {
                            shape: "square",
                            id: pathId,
                            label: "Excerpt " + pathIndex,
                            neoLabel: "Path",
                            color: hexToRgba(entitiesLabelColors["Document"], 0.5),
                            data: path

                        }

                        visjsData.nodes.push(pathNode);
                        visjsData.edges.push({from: chapterNode.id, to: pathNode.id});
                    }
                    path.forEach(function (paragraph) {
                        if (paragraph.paragraphEntities)
                            paragraph.paragraphEntities.forEach(function (entity) {
                                if (entitiesMap[entity.entity_neoId])
                                    var entity = entitiesMap[entity.entity_neoId];
                                if (totalPathsCount <= maxPathCountForPathNodes) {
                                    visjsData.edges.push({from: pathId, to: "E_" + entity.entity_neoId});
                                } else {
                                    if (!chapterEntitiesMap[entity.entity_neoId])
                                        chapterEntitiesMap[entity.entity_neoId] = 0
                                    chapterEntitiesMap[entity.entity_neoId] += 1
                                }
                            })

                    })

                    // edges beetween entites and chapters if totalPathsCount>maxPathCountForPathNodes
                    if (totalPathsCount > maxPathCountForPathNodes) {
                        for (var key in chapterEntitiesMap) {
                            if (entitiesMap["E_" + key])
                                var entityId = entitiesMap["E_" + key].id;
                            visjsData.edges.push({from: chapterNode.id, to: entityId, width: chapterEntitiesMap[key]});
                        }

                    }

                })

            })
        })

        var nodes = new vis.DataSet(visjsData.nodes);
        var edges = new vis.DataSet(visjsData.edges);

        // create a network
        var container = document.getElementById(graphDiv);
        var data = {
            nodes: nodes,
            edges: edges
        };
        var options = {
            height: '100%',
            width: '100%',
            nodes: {
                shape: 'dot',
                size: 12,

            },
            edges: {
                smooth: {
                    type: 'cubicBezier',
                    forceDirection: 'vertical',
                    roundness: 0.4
                }
            },
            physics: true
        };
        var network = new vis.Network(container, data, options);

        if (totalPathsCount > maxPathCountForPathNodes) {
            allLabels.forEach(function (label) {

                network.cluster({
                    joinCondition: function (item) {
                        return item.neoLabel == label;
                    },
                    clusterNodeProperties: {
                        label: label,
                        color: entitiesLabelColors[label],
                        shape: "hexagon",
                    }
                });
            })
        }

        if (totalPathsCount > maxPathCountForPathNodes) {
            allDocuments.forEach(function (documentReference) {

                network.cluster({
                    joinCondition: function (item) {
                        if (item.neoLabel == "Chapter")
                            return item.data.documentReference == documentReference;
                        if (item.neoLabel == "Document")
                            return item.data.reference == documentReference;
                        else
                            return false;
                    },
                    clusterNodeProperties: {
                        label: documentReference,
                        color: entitiesLabelColors["Document"],
                        shape: "hexagon",
                        size: 20

                    }
                });
            })

        }
        network.on("click", function (params) {
                if (params.nodes.length == 1) {
                    var nodeId = params.nodes[0];

                    if (typeof nodeId === "string" && nodeId.indexOf("cluster") == 0)
                        network.clustering.openCluster(nodeId)
                    else {
                        var nodeObj = network.body.nodes[nodeId];
                        if (_options.click)
                            return _options.click(nodeObj);
                    }


                }

            }
        )
        window.setTimeout(function () {
            network.physics.enabled = false;
        }, 10000)


    }


    /*
    self.drawEntitiesGraph = function (graphDiv, entityLabels, options) {
        if (!options)
            options = {};
        var visjsData = {nodes: [], edges: []}

        var rootNode = {
            id: "0000",
            label: "Question",
            value: "10",
        }
        visjsData.nodes.push(rootNode);

        for (var key in entityLabels) {
            var labelParagraphsCount = 0;

            var labelNode = {
                id: key,
                label: key
            }
            entityLabels[key].forEach(function (entity) {

                var entityNode = {
                    id: entity.entity_neoId,
                    label: entity.entity_normalized_value,
                    value: entity.entity_paragraphsCount,
                }
                labelParagraphsCount += entity.entity_paragraphsCount;
                visjsData.nodes.push(entityNode);
                visjsData.edges.push({from: labelNode.id, to: entityNode.id});
            })
            labelNode.value = labelParagraphsCount;
            visjsData.nodes.push(labelNode);
            visjsData.edges.push({from: rootNode.id, to: labelNode.id});


        }
        var nodes = new vis.DataSet(visjsData.nodes);
        var edges = new vis.DataSet(visjsData.edges);

        // create a network
        var container = document.getElementById(graphDiv);
        var data = {
            nodes: nodes,
            edges: edges
        };
        var options = {
            height: '100%',
            width: '100%',
            nodes: {

                shape: 'dot',
                scaling: {
                    customScalingFunction: function (min, max, total, value) {
                        return value / total;
                    },
                    min: 5,
                    max: 150
                }
            }
        };
        var network = new vis.Network(container, data, options);


    }*/


    return self;


})
()
