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


    self.initDialog = function () {
        $("#GraphFilterModalMenu").modal("show");
        $(".graphFilter_propertyDiv").addClass("d-none");
        if (visjsGraph.legendLabels.length == 1) {
            common.fillSelectOptionsWithStringArray("graphFilter_labelSelect", visjsGraph.legendLabels);
            self.setLabelPropertiesSelect(visjsGraph.legendLabels[0])

        }
        else
            common.fillSelectOptionsWithStringArray("graphFilter_labelSelect", visjsGraph.legendLabels, true);
    }

    self.setLabelPropertiesSelect = function (label) {
        if (label == "")
            return;
        var properties = Schema.getLabelProperties(label)
        common.fillSelectOptionsWithStringArray("graphFilter_propertySelect", properties,true);
    }



    self.validateDialog = function (booleanOption) {

        var label=$("#graphFilter_labelSelect").val();
        if(label=="" && booleanOption!="none")
           return common.alert("#graphFilter_alertDiv"," select a label first");
        else
            common.clearAlert("#graphFilter_alertDiv");

        $("#GraphFilterModalMenu").modal("hide");
        context.queryObject={}
        var queryObj=UI_query.setContextQueryObjectParams("graphFilter");
        visjsGraph.filterGraph(booleanOption,queryObj.label, queryObj.property, queryObj.operator, queryObj.value);
    }





    return self;


})


()
