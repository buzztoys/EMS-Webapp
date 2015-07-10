//d3js grouped horizontal bar chart is created by referencing
//http://bl.ocks.org/erikvullings/51cc5332439939f1f292
'use strict';
 angular.module('mms.directives')
    .directive('mmsD3GroupedHorizontalBarChartIo', ['ElementService', 'UtilsService','$compile', 'growl','$window', mmsD3GroupedHorizontalBarChartIo]);
function mmsD3GroupedHorizontalBarChartIo(ElementService, UtilsService, $compile, growl, $window, mmsViewCtrl) {
      
    var mmsChartLink = function(scope, element, attrs, mmsViewCtrl) {
        var d3 = $window.d3;  
        var svgP = d3.select(element[0]).append('div');
        var chartdata;
        var dataIdFilters = [];

        element.click(function(e) {
          //stop Propogating event to parent(mms-transclude-doc) element.
          e.stopPropagation();
        });

        var udcolors = [];
        if (scope.color !== undefined){
          scope.color.split(";").forEach( function(d){
            var temp = d.split(':');
            udcolors[Number(temp[0])] = temp[1].split(",");
          });
         }
          // Color scale
          //var color = d3.scale.category20();
          var d3colorR = d3.scale.category10().range();
          function getColor(data, i){
            return data.colors !== undefined ? d3colorR[data.colors[i]] : d3colorR[i];
          }
           scope.tableColumnHeadersLabel=[];                   
           var processed = false;
            var ws = scope.mmsWs;
            var version = scope.mmsVersion;
            if (mmsViewCtrl) {
                var viewVersion = mmsViewCtrl.getWsAndVersion();
                if (!ws)
                    ws = viewVersion.workspace;
                if (!version)
                    version = viewVersion.version;
            }
            var opacitydefault = 1,//0.7,
                   opacityselected = 1.0,
                    opacitynotselected = 0.3;
            function mouseout(){
              d3.selectAll(".ghbbar")
                .transition(200)
                .style("fill-opacity", opacitydefault); 

              d3.selectAll(".legendRect")
                .transition(200)
                .style("fill-opacity", opacitydefault); 

              d3.selectAll(".legentFilter")
                .transition(200)
                .style("opacity", opacitydefault);

            }
            //make only a-zA-Z0-9
            function toValidId( original){
                //return original.replace(/\s+/g,''); //toValidId
                return original.replace(/[^a-zA-Z0-9]/gi, '');
            }
            function mouseover(mouseoverClassId){
                d3.selectAll(".ghbbar")
                .transition(200)
                .style("fill-opacity", opacitynotselected); 

                 d3.selectAll(".legendRect")
                .transition(200)
                .style("fill-opacity", opacitynotselected); 

                d3.selectAll(".legentFilter")
                .transition(200)
                .style("opacity", opacitynotselected);
                
                d3.selectAll(mouseoverClassId)
                .transition(200)
                .style("fill-opacity", opacityselected);
               
                d3.selectAll(mouseoverClassId)
                .transition(200)
                .style("opacity", opacityselected);
            }

            function createFilters(data){
              //create only one filter display
              d3.selectAll('.graphFilter.'+data.id).remove();
              var graphFilter = d3.select('div.'+data.id).append('div')
                .attr("class", 'graphFilter '+ data.id)
                .style('margin-left', '10px');
              var filterLegendsDiv = graphFilter.append('div')
                .append('label').style('border', '1px solid #ddd')
                .text ("Filter by Legends");
               
                filterLegendsDiv//.append('div')
                  .selectAll("div")
                  .data(data.legends)
                  .enter()  
                  .append("div")
                  .attr("class", function(d,i){return "legentFilter "+ data.id + " " + toValidId(d);} )
                  .attr("style", function(d,i){return "opacity: " + opacitydefault + ";background-color:" + getColor(data,i) + ";";})
                  .on('mouseover', function (d, i) {
                      mouseover("."+data.id+"." + toValidId(d));
                  })
                  .on('mouseout', function (d, i) {
                      mouseout();
                  })
                  .append("label")
                  .each(function (d, i) {
                        // create checkbox for each data
                        d3.select(this).append("input")
                          .attr("type", "checkbox")
                          .attr("checked",function(d,i){
                            if (dataIdFilters[data.id][0][toValidId(d)] === true)
                              return true;
                            else 
                              return null;
                          })
                          .attr("style", function(d,i){var color = getColor(data,i); return "color: " +color + ";background-color:" + color + ";";})
                          .on("click", function (d) {
                              // filter by legends
                              dataIdFilters[data.id][0][toValidId(d)] = this.checked;
                              createGroupedHorizontalBarChart(chartdata, null); //2nd argument is not used
                              //handle by visibility
                              //d3.selectAll(".ghbbar."+ data.id + "." + toValidId(d) ).style("visibility", this.checked ? "visible": "hidden");
                           });
                        d3.select(this).append("span")
                            .text(function (d) {
                                return d;
                            });
                });
                var filterColoumnsDiv = graphFilter.append('div')
                  .append('label').style('border', '1px solid #ddd')
                  .text ("Filter by Columns");

                filterColoumnsDiv
                  .selectAll("div")
                  .data(data.labels)
                  .enter()  
                  .append("div")
                  .on('mouseover', function (d, i){
                        mouseover("."+data.id+"." + toValidId(d));
                  })
                  .on('mouseout', function (d, i){
                        mouseout();
                  })
                  .append("label")
                  .each(function (d, i) {
                      // create checkbox for each data
                      d3.select(this).append("input")
                        .attr("type", "checkbox")
                        .attr("checked", function(d,i){
                            if (dataIdFilters[data.id][1][toValidId(d)] === true)
                              return true;
                            else 
                              return null;
                        })
                        .on("click", function (d) {
                            //filter by columns(labels)
                            dataIdFilters[data.id][1][toValidId(d)] = this.checked;     
                            createGroupedHorizontalBarChart(chartdata, null); //2nd argument is not used
                            //visibility 
                            //d3.selectAll("." + data.id + "."+ toValidId(d) ).style("visibility", this.checked ? "visible": "hidden");
                         });
                      d3.select(this).append("span")
                          .text(function (d) {
                              return d;
                      });
                });
            }

          
            function createGroupedHorizontalBarChart(data, dataIdDiv){
                d3.select(".ghbchart." + data.id).selectAll('*').remove();
                var svg = d3.select(".ghbchart." + data.id);
                if ( svg[0][0] === null) //first time
                  svg = dataIdDiv.append("svg").attr("class", "ghbchart " + data.id);
                if ( data.id !== "default")
                  dataIdDiv.append("h3").text(data.id);
                
                var filteredDataValues = [];
                var filteredDataSysmlids=[];
                var filteredDataColors=[];
                var filteredDataLegends=[];//table row headers
                var filteredDataLabels=[];//table column headers
                var datalegendsfilter = dataIdFilters[data.id][0];  
                var datalabelsfilter = dataIdFilters[data.id][1];              
                var counter = -1;
                for (var i=0; i<data.labels.length; i++) {
                  if ( datalabelsfilter[toValidId(data.labels[i])]){
                    filteredDataLabels.push(data.labels[i]);
                    for (var j=0; j<data.values.length; j++) { //data.values.length == data.legends.length
                      counter++;
                      if (datalegendsfilter[toValidId(data.legends[j])]){
                        filteredDataValues.push(Number(data.values[j][i]));
                        filteredDataSysmlids.push(data.valuesysmlids[j][i]);
                        filteredDataColors.push(getColor(data ,counter % data.legends.length));
                        filteredDataLegends.push(toValidId(data.legends[j]));
                      }
                    }
                  }
                }
                var filteredLegendsLength = filteredDataLegends.length/filteredDataLabels.length;
                 
                var chartWidth       = 700,
                    barHeight        = 20,
                    groupHeight      = barHeight * filteredLegendsLength,
                    gapBetweenGroups = 10,
                    spaceForLabels   = 150,
                    spaceForLegend   = 200,
                    marginbottom = 50;

                //var chartHeight = barHeight * zippedData.length + gapBetweenGroups * data.labels.length;
                var chartHeight = barHeight * filteredDataValues.length + gapBetweenGroups * filteredDataLabels.length;

                var x = d3.scale.linear()
                    //.domain([0, d3.max(zippedData)])
                    .domain([0, d3.max(filteredDataValues)])
                    .range([0, chartWidth]);

                var y = d3.scale.linear()
                    .range([chartHeight + gapBetweenGroups, 0]);

                var yAxis = d3.svg.axis()
                    .scale(y)
                    .tickFormat('')
                    .tickSize(0)
                    .orient("left");
                                
                // Specify the chart area and dimensions
                var chart = svg//d3.select("#" + data.series[zz].label)
                    //.attr("width", spaceForLabels + chartWidth + spaceForLegend)
                    .attr("width", "100%")
                    .attr("height", chartHeight + marginbottom);
                
                // Create bars
                var bar = chart.selectAll("g")
                    .data(filteredDataValues)
                    //.data(data.values)
                    .enter().append("g")
                    //.style("visibility", this.checked ? "visible": "hidden");
                    //.style("visibility", "hidden")
                    .attr("transform", function(d, i) {
                      return "translate(" + spaceForLabels + "," + (i * barHeight + gapBetweenGroups * (0.5 + Math.floor(i/filteredLegendsLength))) + ")";
                    });
                    
                // Create rectangles of the correct width
                bar.append("rect")
                    .attr('id', function(d,i){ return filteredDataSysmlids[i];})
                    .attr("fill", function(d,i) { return filteredDataColors[i]; })
                    .style("fill-opacity", opacitydefault)
                    .attr("class", function(d,i){ 
                      return "ghbbar "+ data.id + " " + filteredDataLegends[i] + " " + toValidId(filteredDataLabels[Math.floor(i/filteredDataLegends.length)]);
                      })
                    .attr("width", x)
                    .attr("height", barHeight - 1)
                    .on('click', function(d, i) {
                      if (mmsViewCtrl)
                          mmsViewCtrl.transcludeClicked(this.id); 
                          //1) mmsView.js's mmsView.transcludeClicked
                          //2) build/app/partials/mms/part-center.html mms-cf-clicked="tscClicked(elementId)"
                          //3) ........./js/mms/controllers/view.controller.js  $scope.tscClicked
                          //4) that do below
                          //$rootScope.$broadcast('elementSelected', elementId, 'element');//d3.select(this).
                    })
                    .on('mouseover', function (d, i){
                       mouseover("."+ data.id+"." + filteredDataLegends[i]);
                    })
                    .on('mouseout', function (d, i){
                      mouseout();
                    });

                // Add text label in bar
                bar.append("text")
                    //.attr("class", function(d,i){ return "ghbbar"+data.id + "-" +(i % data.series.length);})
                    .attr("class", function(d,i){ return "ghbbar "+data.id + " " + filteredDataLegends[i];})
                    .attr("x", function(d) { return x(d) - 3; })
                    .attr("y", barHeight / 2)
                    .attr("dy", ".35em")
                    .text(function(d) { return d; });

                //left side label      
                bar.each(function(d, i){
                    if (i % filteredLegendsLength === 0){
                       d3.select(this).append("text")
                      .attr("class", "label")
                      .attr("x", function(d) { return - 10; })
                      .attr("y", groupHeight / 2)
                      .attr("dy", ".35em")
                      .text(filteredDataLabels[Math.floor(i/filteredLegendsLength)]);
                    }

                });
                chart.append("g")
                      .attr("class", "y axis")
                      .attr("id", "ghbaxis")
                      .attr("transform", "translate(" + spaceForLabels + ", " + -gapBetweenGroups/2 + ")")
                      .call(yAxis);

                // Draw legend
                var legendRectSize = 18,
                    legendSpacing  = 4;
                var mouseoverId;
                var legend = chart.selectAll('.legend')
                    //.data(data.series)
                    .data(data.legends)
                    .enter()
                    .append('g')
                    .attr('transform', function (d, i) {
                        var height = legendRectSize + legendSpacing;
                        var offset = -gapBetweenGroups/2;
                        var horz = spaceForLabels + chartWidth + 60 + legendRectSize;
                        var vert = i * height - offset;
                        return 'translate(' + horz + ',' + vert + ')';
                    })
                    //.attr("class", function(d,i){ return "ghbbar"+(i % data.series.length);})
                    .on('mouseover', function (d, i){
                       mouseover("."+ data.id+"."+ toValidId(d));
                    })
                    .on('mouseout', function (d, i){
                      mouseout();
                    });

               
                legend.append('rect')
                    //.attr('class', function(d,i){ return 'legendRect' + data.id+ "-" + (i % data.series.length);})
                    .attr('class', function(d,i){ return 'legendRect ' + data.id+ " " + toValidId(d);})
                    .attr('width', legendRectSize)
                    .attr('height', legendRectSize)
                    .style("fill-opacity", opacitydefault)
                    .style('fill', function (d, i) { return getColor(data,i); /*return color(i);*/ })
                    .style('stroke', function (d, i) {return getColor(data,i); /*return color(i);*/ });

                legend.append('text')
                    .attr('class', 'legend')
                    .attr('x', legendRectSize + legendSpacing)
                    .attr('y', legendRectSize - legendSpacing)
                    .text(function (d, i) {return d; });
                    //.text(function (d, i) { return data.legends[i]; });
            }
            
            scope.render = function() {
              if (scope.tableColumnHeadersLabel.length === 0) return;
              var dataValuesPerTable;
              //dataValuesPerTable.length = legends.length
              for ( var k = 0; k < scope.datavalues.length; k++){
                dataValuesPerTable = scope.datavalues[k];
                var legends = scope.tableRowHeadersLabel[k];
                //var dataseries= [];
                var rowvalues=[];
                var rowsysmlids=[];
                //var datavalues=[];
                //var datasysmlids=[];
                for ( var i = 0; i < dataValuesPerTable.length; i++){
                    var tvalues = [];
                    var sysmlids = [];

                    for ( var j = 0; j < dataValuesPerTable[i].length; j++){
                      sysmlids[j] =  dataValuesPerTable[i][j].sysmlid;
                      //datasysmlids.push(dataValuesPerTable[i][j].sysmlid);
                      if (dataValuesPerTable[i][j].specialization.value[0].type === "LiteralString")
                        //datavalues.push(Number(dataValuesPerTable[i][j].specialization.value[0].string));
                        tvalues[j] = dataValuesPerTable[i][j].specialization.value[0].string;
                      else if (dataValuesPerTable[i][j].specialization.value[0].type === "LiteralReal")
                        //datavalues.push(Number(dataValuesPerTable[i][j].specialization.value[0].double));
                        tvalues[j] = dataValuesPerTable[i][j].specialization.value[0].double;
                      else if (dataValuesPerTable[i][j].specialization.value[0].type === "LiteralInteger")
                        //datavalues.push(Number(dataValuesPerTable[i][j].specialization.value[0].integer));
                        tvalues[j] = dataValuesPerTable[i][j].specialization.value[0].integer;
                    }
                    rowvalues[i] = tvalues;
                    rowsysmlids[i] =sysmlids;
                    //dataseries[i] = tvalues;
                 }
                chartdata = {
                  id: scope.dataNames[k],//(scope.dataNames[k] !== undefined ? toValidId(scope.dataNames[k]) : "default"),
                  labels: scope.tableColumnHeadersLabel[k],
                  legends: scope.tableRowHeadersLabel[k],
                  colors: udcolors[k],
                  values:rowvalues,//2D array [i][j] where i = rowIndex, j = columnIndex
                  valuesysmlids: rowsysmlids
                 };
                 
              /* original datavar data = {
                  id: "id123",
                  labels: [
                    'resilience', 'maintainability', 'accessibility',
                    'uptime', 'functionality', 'impact'
                  ]
                  series: [
                    {
                      label: '2012',
                      values: [4, 8, 15, 16, 23, 42]
                    },
                    {

                      label: '2013',
                      values: [12, 43, 22, 11, 73, 25]
                    },
                    {
                      label: '2014',
                      values: [31, 28, 14, 8, 15, 21]
                    },]
                };*/
                d3.select("."+ chartdata.id).remove();
                var dataIdDiv = svgP.append('div').attr("class", chartdata.id)
                                    .attr("style", 'border:1px solid #ddd');
                createGroupedHorizontalBarChart(chartdata, dataIdDiv);
                createFilters(chartdata);
              }//end of k
            }; //end of render
      scope.$watch('datavalues', function(newValue, oldValue) {
        return scope.render();
      },true); 
      //element is clicked to highlight selected
      scope.$on('elementSelected', function(event, eid, type) {
          d3.selectAll("rect").transition(200).style("fill-opacity", opacitynotselected);
          d3.selectAll("#"+eid).transition(200).style("fill-opacity", opacityselected);
      });
      ElementService.getElement(scope.mmsEid, false, ws, version)
      .then(function(data) {
        var tableContains = [];
        var tableNames = [];
        var tableColumnHeadersLabel=[];
        var rowHeaders = [];

        for ( var k = 0; k < data.specialization.contains.length; k++ ){
          if ( data.specialization.contains[k].type ==="Table"){
            if ( data.specialization.contains[k-1].sourceType==="text")
              tableNames.push(toValidId(data.specialization.contains[k-1].text.replace("<p>","").replace("</p>","").replace(" ", ""))); //assume it is Paragraph
            else
              tableNames.push("default");
            tableContains.push(data.specialization.contains[k]);
            rowHeaders = [];
            //assume first column is empty
            for ( var kk = 1; kk < data.specialization.contains[k].header[0].length; kk++){
              rowHeaders[kk-1] = data.specialization.contains[k].header[0][kk].content[0].text.replace("<p>","").replace("</p>","");
            }  
            tableColumnHeadersLabel.push(rowHeaders); //xxx, yyy, mass,cost, power in string
          }
        }
        var rowHeadersMmsEid = []; 
        var dataValuesMmmEid =[];
        var body;
        
        for ( k = 0; k < tableContains.length; k++){
            body = tableContains[k].body;
            for (var i = 0; i < body.length; i++ ){
              rowHeadersMmsEid.push(body[i][0].content[0].source);
              
              for ( var j = 1; j < body[i].length; j++){
                dataValuesMmmEid.push(body[i][j].content[0].source);
            }
          }
        }
        
        ElementService.getElements(rowHeadersMmsEid, false, ws, version)
        .then(function(rowHeaders) {
                ElementService.getElements(dataValuesMmmEid, false, ws, version)
                  .then(function(values) {
                  var dataTableValues = [];
                  var datavalues = [];
                  var startIndex = 0;
                  var counter = 0;
                  for (k = 0; k < tableContains.length; k++){
                    datavalues = [];
                    var valueLength = tableColumnHeadersLabel[k].length* tableContains[k].body.length;
                    for (i = 0; i < valueLength; i= i + tableColumnHeadersLabel[k].length){
                      var datarow =[];// new Array(tableColumnHeadersLabel[k].length);
                      for ( var j = 0; j < tableColumnHeadersLabel[k].length; j++){
                        datarow.push(values[counter++]); 
                      }
                      datavalues.push(datarow);
                    }
                    dataTableValues.push(datavalues);
                  }
                  var tableRowHeaders=[];
                  counter = 0;
                  var numOfRows, eachRowHeader;
                  for (i = 0; i < dataTableValues.length; i++){
                    numOfRows = dataTableValues[i].length;
                    eachRowHeader = [];
                    for (k = 0; k < numOfRows; k++){
                        //eachRowHeader.push({'name': rowHeaders[counter++].name, 'checked': true});
                        eachRowHeader.push(rowHeaders[counter++].name);
                    }  
                    tableRowHeaders.push(eachRowHeader);
                  }
                  scope.dataNames = tableNames; //[]ss
                  scope.tableColumnHeadersLabel = tableColumnHeadersLabel; //[]
                  scope.datavalues = dataTableValues; //[][] - array
                  scope.tableRowHeadersLabel = tableRowHeaders;

                  //initialize filter
                  for ( k = 0; k < scope.datavalues.length; k++){
                    //, legends: scope.tableRowHeadersLabel[k], columns: scope.tableColumnHeadersLabel[k]});   
                    var filters = [];
                    var filterlegends = [];
                    var filterlabels=[];
                    for ( var i = 0; i < scope.tableRowHeadersLabel[k].length; i++){
                       filterlegends[toValidId(scope.tableRowHeadersLabel[k][i])] = true;
                    }
                    for ( i = 0; i < scope.tableColumnHeadersLabel[k].length; i++){
                       filterlabels[toValidId(scope.tableColumnHeadersLabel[k][i])] = true;
                    }
                   
                    filters.push(filterlegends);
                    filters.push(filterlabels);
                    dataIdFilters[toValidId(tableNames[k])]=filters;
                  }
                  
            });//ElementService.getElements - dataValuesMmEid
        });//ElementService.getElements - rowHeadersMmsEid
      }); //end of ElementService
    }; //end of link

    return {
      restrict: 'EA',
      require: '?^mmsView',
       scope: {
        mmsEid: '@',
        color: '@',
      },
      link: mmsChartLink
    }; //return
}



