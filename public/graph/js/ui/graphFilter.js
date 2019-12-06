/*******************************************************************************
 * TOUTLESENS LICENCE************************
 *
 * The MIT License (MIT)
 *
 * Copyright (c) 2016-2018 Claude Fauconnet claude.fauconnet@neuf.fr
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
var GraphFilter = (function () {
    var self = {};


    /**
     *
     * initialize filterDialog.html with result from neo4j
     *
     * @param data neo4j DataSet
     */


    self.initDialog = function (labels) {
        if(!labels)
            labels=visjsGraph.legendLabels
        $("#GraphFilterModalMenu").modal("show");
        $(".graphFilter_propertyDiv").addClass("d-none");
        if (labels == 1) {
            common.fillSelectOptionsWithStringArray("graphFilter_labelSelect", labels);
            self.setLabelPropertiesSelect(labels[0])

        } else
            common.fillSelectOptionsWithStringArray("graphFilter_labelSelect", labels, true);
    }

    self.setLabelPropertiesSelect = function (label) {
        if (label == "")
            return;
        var properties = Schema.getLabelProperties(label)
        common.fillSelectOptionsWithStringArray("graphFilter_propertySelect", properties, true);
    }


    self.validateDialog = function (booleanOption) {

        var label = $("#graphFilter_labelSelect").val();
        if (label == "" && booleanOption != "none")
            return common.alert("#graphFilter_alertDiv", " select a label first");
        else
            common.clearAlert("#graphFilter_alertDiv");

        $("#GraphFilterModalMenu").modal("hide");
        context.queryObject = {}
        var queryObj = UI_query.getQueryObjectFromUI("graphFilter");
        self.filterGraph(booleanOption, queryObj.label, queryObj.property, queryObj.operator, queryObj.value);
    }


    self.filterGraph = function (booleanOption, label, property, operator, value) {
        var objectType = "node";

        if (objectType == "node") {
            var selectedNodes = [];
            var selectedEdges = [];
            var nodes = visjsGraph.data.nodes.get();
            nodes.forEach(function (node) {
                var hidden = false;

                if (context.currentNode && context.currentNode.id && context.currentNode.id == node.id)
                    ;

                else if (booleanOption == "none") {
                    ;
                } else {

                    var nodeOk = visJsDataProcessor.isLabelNodeOk(node, label, property, operator, value);
                    if (booleanOption == "not")
                        hidden = nodeOk;
                    else
                        hidden = !nodeOk;
                }
                var color = node.initialColor;
                var vijsLabel = node.hiddenLabel;

                if (hidden) {
                    color = hexToRgba(node.initialColor, 0.1);
                    vijsLabel = null;
                }

                node.color = color;
                node.ishidden = hidden;
                node.label = vijsLabel;

                var connectedEdgesIds = visjsGraph.network.getConnectedEdges(node.id);
                connectedEdgesIds.forEach(function (edgeId) {
                    var edgeColor = "#333"
                    if (hidden)
                        edgeColor = "#ddd"
                    else
                        edgeColor = "#ddd"

                    selectedEdges.push({id: edgeId, color: edgeColor})
                })


            })
            visjsGraph.data.nodes.update(nodes);
            visjsGraph.data.edges.update(selectedEdges);


        } else if (objectType == "relation") {

            //    TO DO   !!!!
        }
    }


    return self;


})


()
