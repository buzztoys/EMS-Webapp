'use strict';
 angular.module('mms.directives')
    .directive('mmsD3ObservationProfileChartIo', ['ElementService', 'UtilsService','$compile', 'growl','$window', mmsD3ObservationProfileChartIo]);
function mmsD3ObservationProfileChartIo(ElementService, UtilsService, $compile, growl, $window, mmsViewCtrl) {
      
  var mmsChartLink = function(scope, element, attrs) {
      
      /*console.log("mmsChartLink=============");
      console.log(scope);
      console.log(element);
      console.log(attrs);
      */
    var reversed = false;
    if (scope.reversed !== undefined)
      reversed = Boolean(scope.reversed);

    var userdefinedColor = [];
    if (scope.color !== undefined)
      userdefinedColor = scope.color.split(",");
   
    scope.rowHeaders=[]; //not null when render is called 1st time.      
    var d3 = $window.d3;  
    var svg = d3.select(element[0])
      .append('div')
      .append("svg:svg")
      .attr("class", "obpchart");
        
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
    function transpose(a) {
      return Object.keys(a[0]).map(
          function (c) { return a.map(function (r) { return r[c]; }); }
          );
      }
    function obpchartPlot(zData) {

      var margin = {
          axisTop: 50,
          top: 100,
          right: 100,
          bottom: 10,
          left: 100
      },
      width = 1200 - margin.left - margin.right,
      lineHeight = 10;

      var columnHeaderLabels = []; //IP, IPR, Mag...
      for (var i = 0; i < zData.dataseries.length; i++) {
          var opt = zData.dataseries[i];
          for (var j = 0; j < opt.value.length; j++) {
              var inst = opt.value[j];
              if (columnHeaderLabels.indexOf(inst.name) < 0) {
                  columnHeaderLabels.push(inst.name);
              }
          }
      }
 
      var gap = 15; //10/15 is width of line = actual gap is 5
      var gapG =15; //gap between Group
      //var height = (lineHeight + gap + (columnHeaderLabels.length * gapG)) * zData.dataseries.length;

      var height = gap*zData.dataseries.length* columnHeaderLabels.length + gapG * (columnHeaderLabels.length -1 );

      //based on right or left labels
      var bottomLabelHeight = (lineHeight + gap )*Math.max(zData.dataseries.length, 3);
      
      var d3colorR = d3.scale.category10().range();

      function getColor(d, i){
          return d.color !== undefined ? d3colorR[d.color] : d3colorR[i % zData.dataseries.length];
      }
      //for 4 On and 4 StandBy colors
      //var colorS = ["#67001f", "#d6604d", "#4393c3", "#053061"];
      //var colorO = ["#f4a582", "#fddbc7", "#d1e5f0", "#92c5de"];
      
      //Support 8 On colors and 2 Standby Colors
      //var colorS = ["#67001f", "#b2182b", "#d6604d", "#f4a582", "#053061", "#2166ac", "#4393c3", "#92c5de"];
      //var colorO = ["#fddbc7", "#fddbc7", "#fddbc7", "#fddbc7", "#d1e5f0", "#d1e5f0", "#d1e5f0", "#d1e5f0"];
      //var colorW = "#f7f7f7";
 
      var svg = d3.select(".obpchart")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + bottomLabelHeight + 1 * gapG + margin.bottom); //gapG for label

      var xIndex = [];
      xIndex.push(0);
      var xtotal = 0;
      for (i = 0; i < zData.axisZoneLength.length; i++) {
         xtotal += zData.axisZoneLength[i];
         xIndex.push(xtotal);
      }
      var x = d3.scale.linear()
        .domain([0, xtotal])
        .range([0, width]);
      var start = 0, end, linecolor, linecolorOn, lineopacity;

      var gx = d3.select(".obpchart").selectAll("g")
      .data(columnHeaderLabels)
      .enter().append("g")
      .attr("transform", function(d, i) {
        //return "translate(" + margin.left + "," + (i * gapG * zData.dataseries.length + margin.top) + ")"; // alter for better y coord
        return "translate(" + margin.left + "," + (i * gapG + i* gap * zData.dataseries.length + margin.top) + ")"; // alter for better y coord
      })
      .each(function(d, i) {
          this.setAttribute("class", d);
          
          d3.select(this).append("text")
              .attr("class", "leftLabel")
              .attr("x", -10)
              .attr("y", ((zData.dataseries.length - 1) * gap) / 2)
              .attr("dy", ".35em")
              .text(d);
          d3.select(this).selectAll("g")
          .data(zData.dataseries)
          .enter().append("g")
          .attr("transform", function(d, i) {
              return "translate(0," + i*gap + ")";
          })
          .each(function (d, i) {
              this.setAttribute("class",d.name);
              //linecolorOn=d3color(i % zData.dataseries.length);
              linecolorOn=getColor(d,i);
             
              //for (dict of d.value) {
              for ( var k = 0; k < d.value.length; k++){    
                  var dict = d.value[k];
                  if (dict.name === this.parentNode.getAttribute("class")) {
                      for (var j = 0; j < dict.states.length; j++) {
                          end = start + zData.axisZoneLength[j];
                          if ( dict.states[j] == 1){
                              linecolor = "White";
                              //linecolor = colorW;
                              lineopacity = 1;
                          }
                          else if ( dict.states[j] == 2){
                            linecolor = linecolorOn;
                            lineopacity = 0.3;
                            //linecolor = colorO[i];
                            //lineopacity = 1;
                            
                          }
                          else { //on
                            lineopacity = 1;
                            linecolor = linecolorOn;  
                            //linecolor = colorS[i];
                          }
                          d3.select(this).append("line")
                            .attr("x1", x(start))
                            .attr("y1", 0)
                            .attr("x2", x(end))
                            .attr("y2", 0)
                            .attr("stroke-width", lineHeight)
                            .attr("opacity", lineopacity)
                            .attr("stroke", linecolor);
                            start = end;
                        }
                      start = 0;
                      }
                  }
              });
          });
   
      var y = d3.scale.linear().range([height + gapG, 0]); //length of y-axis
      var yAxis = d3.svg.axis()
        .scale(y)
        .tickFormat('')
        .tickSize(0)
        .orient("left");
      svg.append("g")
        .attr("class", "y axis")
        .attr("transform", "translate(" + margin.left + "," +  (margin.top  - gap/2)  + ")")
        .attr("stroke-dasharray", "10,5")
        .call(yAxis);

      var dsum = 0;
      var xticks = [];
      var yaxiss = svg.selectAll(".y axis")
      .data(zData.axisZoneLength)
      .enter().append("g")
      .attr("class", "y axis")
      .attr("id", function (d){ return d.name;})
      .attr("transform", function(d,i){
        dsum = dsum + d;
        xticks[i] = x(dsum -d/2);
        return  "translate(" + (margin.left + x(dsum)) + "," + (margin.top  - gap/2)  + ")";
      })
      .attr("stroke-dasharray", "10,5")
      .call(yAxis);

      //label on top of axis for each zone = 1,2,3,4,5... 
      svg.selectAll(".label")
      .data(zData.axisTopLabels.values)
      .enter().append("g")
      .attr("transform", function(d,i){ 
        return  "translate(" + (margin.left +xticks[i]) + "," + (margin.axisTop-5) + ")"; //top
        //return  "translate(" + (margin.left + xticks[i]) + "," + ((zData.rowValue.length + 1.5)* gap  + margin.top)   + ")";
      })
      .attr("class", "axis")
      .append("text")
      .text(function(d,i) {
          return d;
      });
   
       //label on bottom of axis for each zone = 66k, 40k, ... AltitudeMax values 
       svg.selectAll(".label2")
      .data(zData.axisBottomLabels.values)
      .enter().append("g")
      .attr("transform", function(d,i){ 
        return  "translate(" + (margin.left +xticks[i]-5) + "," + (margin.axisTop+15) + ")"; //top
        //return  "translate(" + (margin.left + xticks[i]) + "," + ((zData.rowValue.length + 1.5)* gap  + margin.top)   + ")";
      })
      .attr("class", "axis")
      .append("text")
      .text(function(d,i) {
          return d;
      });
     var xAxis = d3.svg.axis().scale(x).tickValues(xIndex).tickFormat('');
     svg.append("g")
        .attr("class", "x axis")
        .call(xAxis)
        //.attr("transform", "translate(" + margin.left + "," + (zData.rowValue.length * gap  + margin.top)  + ")"); //bottom
        .attr("transform", "translate(" + margin.left + "," + margin.axisTop + ")");//top
  
      //label to top axis
     svg.append("g").append("text")
     .attr("transform", "translate(" + margin.left + "," + (margin.axisTop +10) +")")//top
     .attr("class", "topLeftLabel")
     .text(zData.axisBottomLabels.name)
     .attr("x", -10)
     .attr("dy", ".35em");
   
      //label to top axis
      svg.append("g")
      .append("text")
      .attr("transform", "translate(" + margin.left + "," + (margin.axisTop -10) +")")//top
      .attr("class", "topLeftLabel")
      .text(zData.axisTopLabels.name)
      .attr("x", -10)
      .attr("dy", ".35em");

        
      //label for bottom label = tablename
      svg.selectAll(".bottomLabelText")
        .data(zData.dataseries)
        .enter().append("g")
        .attr("transform", function(d,i){ 
          return   "translate(" + (margin.left/3*7+5) + "," + (margin.top + height + 2* gapG + 2*lineHeight + i*gap) + ")";
        })
      .attr("class", "bottomLabel")
      .append("text")
      .text(function(d,i) {
          return d.name;
      });

      //label for solid, opacity, white
      svg.selectAll(".bottomShadingLabelText")
      .data(["On", "Standby", "Off"])
      .enter().append("g")
      .attr("transform", function(d,i){ 
        if ( i === 2)
          return "translate(" + (margin.left + margin.left/3*3) + "," + (margin.top + height + 2* gapG + lineHeight/2) + ")";
        else  
          return "translate(" + (margin.left + margin.left/3*i) + "," + (margin.top + height + 2* gapG + lineHeight/2) + ")";
      })
      //.attr("class", "bottomLabel")
      .append("text")
      .attr("class", "bottomShadingLabelText")
      .text(function(d){return d;});

        //bottom label left 
        svg.selectAll(".bottomLabelColoredLine")
          .data(zData.dataseries)
          .enter().append("g")
          .attr("transform", function(d,i){ 
           return   "translate(" + margin.left + "," + (margin.top + height + 2* gapG + (i *gap) + lineHeight) + ")";
          })
          .append("rect")
          .attr("width",margin.left/3)
          .attr("height", lineHeight)
          .attr("fill", function(d,i) {return getColor(d,i);});
          //.attr("fill", function(d,i){ return d3color(i % zData.dataseries.length);});
          //.attr("fill", function(d,i){ return colorS[i];});

           svg.selectAll(".bottomLabelColoredLine")
          .data(zData.dataseries)
          .enter().append("g")
          .attr("transform", function(d,i){ 
           return   "translate(" + (margin.left + margin.left/3)+ "," + (margin.top + height + 2* gapG + (i *gap) + lineHeight) + ")";
          })
          .append("rect")
          .attr("width",margin.left/3*2)
          .attr("height", lineHeight)
          .attr("fill", function(d,i) {return getColor(d,i);})
          //.attr("fill", function(d,i){ return d3color(i % zData.dataseries.length);})
          .attr("opacity", 0.3);
          //.attr("fill", function(d,i){ return colorO[i];});



          svg.selectAll(".bottomLabelColoredLine")
          .data(zData.dataseries)
          .enter().append("g")
          .attr("transform", function(d,i){ 
           return   "translate(" + (margin.left + margin.left/3*3 )+ "," + (margin.top + height + 2* gapG + (i *gap) + lineHeight) + ")";
          })
          .append("rect")
          .attr("width",margin.left/3)
          .attr("height", lineHeight)
          .attr("stroke", "LightGray")
          .attr("fill", "White");
          //.attr("fill", colorW);
    }//end of obpchartPlot()

    scope.render = function() {
      if (scope.rowHeaders.length === 0) return;
      svg.selectAll('*').remove();
      var groupedDataSeries = [];
      var dataValuesPerTable;
      var states;
      var dataseries;
      var axisBottomLabels = [];
      var axisBottomLabelTitle = "";
      var axisTopLabels = [];
      var axisZoneLength =[];

      
      for ( var k = 0; k < scope.datavalues.length; k++){
        dataValuesPerTable = scope.datavalues[k];
        states = [];
        for ( var i = 0; i < dataValuesPerTable.length; i++){
            var tvalues = []; //table value for each row
            for ( var j = 0; j < dataValuesPerTable[i].length; j++){
              if (dataValuesPerTable[i][j].specialization.value[0].type === "LiteralString")
                tvalues[scope.rowHeaders[j]] = Number(dataValuesPerTable[i][j].specialization.value[0].string);
              else if (dataValuesPerTable[i][j].specialization.value[0].type === "LiteralReal")
                tvalues[scope.rowHeaders[j]] = dataValuesPerTable[i][j].specialization.value[0].double;
              else if (dataValuesPerTable[i][j].specialization.value[0].type === "LiteralInteger")
                tvalues[scope.rowHeaders[j]] = dataValuesPerTable[i][j].specialization.value[0].integer;
            } //end of for loop j
            var eachStates = [];
            for (var key in tvalues){
              eachStates.push(tvalues[key]);
            }
            states.push(eachStates);
        }//end of for loop i
        dataseries= [];
        if ( reversed){     
          states = transpose(states);
          for (i = 1; i < scope.rowHeaders.length; i++){
            dataseries.push({name: scope.rowHeaders[i], states: states[i]});
          }
          if ( k === 0){
            axisBottomLabels = states[0];
            axisBottomLabelTitle = scope.rowHeaders[0];
            for( i = 0; i < scope.columnHeaders.length; i++){
              axisTopLabels[i] = scope.columnHeaders[i].name.substring(4);
            }
          }
        }
        else { 
          for (i = 1; i < dataValuesPerTable.length; i++){
            dataseries.push({name: scope.columnHeaders[i].name, states: states[i]});
          }
          if ( k === 0){
            axisBottomLabels = states[0];
            axisBottomLabelTitle = scope.columnHeaders[0].name;//.substring(2); //removing ** from front of "**AltitudeMax"
            //remove "Zone" from the label for axisTopLabel
            for( i = 0; i < scope.rowHeaders.length; i++){
              axisTopLabels[i] = scope.rowHeaders[i].substring(4);
            }
          }
        }
        if (userdefinedColor.length !== 0 && userdefinedColor[k] !== undefined)
          groupedDataSeries.push({name: scope.dataNames[k], color: userdefinedColor[k].trim(), value: dataseries});
        else  
          groupedDataSeries.push({name: scope.dataNames[k], value: dataseries});

        //axisBottomLabels must be Number
        if ( k === 0 ){
          var xmin = Math.min.apply(Math, axisBottomLabels);
          
          var diff = [];
          var middleIndex = Math.floor(axisBottomLabels.length/2);
          for( i = 0; i < axisBottomLabels.length; i++){
            if ( i < middleIndex){
               diff.push(axisBottomLabels[i] - axisBottomLabels[i+1]);
            }
            else if ( i == middleIndex){
              diff.push( axisBottomLabels[middleIndex]);
            }
            else {//i > middleIndex  
              diff.push(axisBottomLabels[i] - axisBottomLabels[i-1]);
            }
          }
          
          var diffMin = Math.min.apply(Math, diff);
          for ( i = 0; i < diff.length; i++){
              //temp.push(Math.log(diff[i]/diffMin) + 0.5);
              axisZoneLength.push(Math.log(diff[i]/diffMin) + 0.5);
          }
          //use fommat("s") for axisBottomLabel
          for( i = 0; i < axisBottomLabels.length; i++){
            axisBottomLabels[i] = d3.format("s")(axisBottomLabels[i]);
          }
        }

      } //end of for loop k
      
      var modelData = {
         "axisTopLabels": {"name": "Zone", "values":axisTopLabels},
         "axisBottomLabels": {"name": axisBottomLabelTitle, "values": axisBottomLabels},
         "axisZoneLength" :axisZoneLength,
         "dataseries" : groupedDataSeries
      };
      /*var dummyData = {
        
        "axisTopLabels":{ "name": "zZones", "values":[
                    "1a",
                    "2",
                    "3",
                    "4",
                    "5",
                    "5",
              ]},
        "axisBottomLabels":{"name":"zAltitudeMax", "values":[
              "a66k",
              "40k",
              "11k",
              "5k",
              "11k",
              "40k"
         ]},
        "axisZoneLength": [10,4,1,1,4,10],
        "dataseries": [
        {
            "name": "BaseLine",
            "value": [
                {
                    "name": "IPR",
                    "states": [3,3,3,3,3,1]
                },
                {
                    "name": "SWIRS",
                    "states": [2,3,2,3,1,1]
                },
                {
                    "name": "NMS",
                    "states": [2,3,3,1,2,3]
                },
                {
                    "name": "TI",
                    "states": [1,1,1,2,3,1]
                },
                {
                    "name": "Mag",
                    "states": [2,3,3,3,3,3]
                }
            ]
        },
        {
            "name": "Option1",
            "value": [
                {
                    "name": "IPR",
                    "states": [3,1,2,3,1,2]
                },
                {
                    "name": "SWIRS",
                    "states": [2,3,2,3,1,1]
                },
                {
                    "name": "NMS",
                    "states": [2,3,3,1,2,3]
                },
                {
                    "name": "TI",
                    "states": [1,1,1,2,3,1]
                },
                {
                    "name": "Mag",
                    "states": [2,3,3,3,3,3]
                }
            ]
        }
        ]
      };*/
      //console.log( modelData);
      obpchartPlot(modelData);
    };//end of render
 
    scope.$watch('datavalues', function(newVals, oldVals) {
        return scope.render();
    }, true);
    
   
      ElementService.getElement(scope.mmsEid, false, ws, version)
      .then(function(data) {
            var tableContains = [];
            var tableNames = [];
            for ( var k = 0; k < data.specialization.contains.length; k++ ){
              if ( data.specialization.contains[k].type ==="Table"){
                if ( data.specialization.contains[k-1].sourceType==="text")
                  tableNames.push(data.specialization.contains[k-1].text.replace("<p>","").replace("</p>","")); //assume it is Paragraph
                tableContains.push(data.specialization.contains[k]);
              }
            }
            var rowHeaders = tableContains[0].header[0];
            scope.rowHeaders = [];
            //assume first column is empty
            for ( var i = 1; i < rowHeaders.length; i++){
                scope.rowHeaders[i-1] = rowHeaders[i].content[0].text.replace("<p>","").replace("</p>","");
            }
            var columnHeadersMmsEid = [];
            var dataValuesMmmEid =[];
            var body;
            var counter = 0;
            for ( k = 0; k < tableContains.length; k++){
              body = tableContains[k].body;
              for (i = 0; i < body.length; i++ ){
                if ( k === 0)
                  columnHeadersMmsEid[i] = body[i][0].content[0].source;
                for ( var j = 1; j < body[i].length; j++){
                  dataValuesMmmEid[counter++] = body[i][j].content[0].source;
                }
              }
            }
          
            ElementService.getElements(columnHeadersMmsEid, false, ws, version)
              .then(function(columnHeaders) {
                      ElementService.getElements(dataValuesMmmEid, false, ws, version)
                        .then(function(values) {
                        var dataTableValues = [];
                        var datavalues = [];
                        var rowCounter = 0;
                        var eachTableValueLength = values.length/tableContains.length;
                        var startIndex;
                        for (k = 0; k < tableContains.length; k++){
                          datavalues = [];
                          rowCounter = 0;
                          startIndex = k* eachTableValueLength;
                          for (i = 0; i < values.length/tableContains.length; i= i + scope.rowHeaders.length){
                            var datarow = new Array(scope.rowHeaders.length);
                            for ( var j = 0; j < scope.rowHeaders.length; j++){
                              datarow[j] = values[startIndex + i+j]; 
                            }
                            datavalues[rowCounter++]=datarow;
                          }
                          dataTableValues.push(datavalues);
                        }
                        scope.dataNames = tableNames;
                        scope.datavalues = dataTableValues; //[][] - array
                        scope.columnHeaders = columnHeaders;
                        scope.render();
                  });
            });
      }); //end of ElementService
      
    }; //end of link

    return {
      restrict: 'EA',
      require: '?^mmsView',
       scope: {
        mmsEid: '@',
        reversed: '@',
        color: '@',
      },
      link: mmsChartLink
    }; //return
}
