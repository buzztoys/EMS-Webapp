
//d3js grouped horizontal bar chart is created by referencing
//http://bl.ocks.org/erikvullings/51cc5332439939f1f292
'use strict';
 angular.module('mms.directives')
    .directive('mmsC3LineChart', ['ElementService', 'UtilsService', 'GTTableService','$compile', 'growl','$window', mmsC3LineChart]);
function mmsC3LineChart(ElementService, UtilsService, GTTableService, $compile, growl, $window, mmsViewCtrl) {
      
    var mmsChartLink = function(scope, element, attrs, mmsViewCtrl) {
      console.log("mms-c3-line-chart, mmsChartLink");
      var d3 = $window.d3;  
      var divchart = d3.select(element[0]).append('div');

      var chartdata = [];
      var dataIdFilters = [];
      var scopedataNames = [];
      var scopetableColumnHeadersLabel= [];
      var dataSubValues = [];
           
      element.click(function(e) {
        //stop Propogating event to parent(mms-transclude-doc) element.
        e.stopPropagation();
      });

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
      
       
    function createChart(data, dataIdDiv){
            console.log("createChart");
            if ( data.id !== "default" && dataIdDiv !== null)
              dataIdDiv.append("h3").text(data.id);

            d3.select(".ghbchart." + data.id).selectAll('*').remove();
            var svg = d3.select(".ghbchart." + data.id);
            if ( svg[0][0] === null) //first time
              svg = dataIdDiv.append("svg").attr("class", "ghbchart " + data.id);
            
           
    }
          
      scope.render = function() {
          console.log("scope.render");
          if (scopetableColumnHeadersLabel.length === 0) return;
          var dataValuesPerTable;
          var dataSubValuesPerTable;
          //dataValuesPerTable.length = legends.length
          for ( var k = 0; k < scope.datavalues.length; k++){
            dataValuesPerTable = scope.datavalues[k];
            dataSubValuesPerTable = dataSubValues[k];
            var legends = [];
            for ( i = 0; i < scope.tableRowHeaders[k].length; i++){
              legends.push(scope.tableRowHeaders[k][i].name);
            }
            //var dataseries= [];
            
            //var datavalues=[];
            //var datasysmlids=[];
            console.log("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
            console.log(dataSubValuesPerTable);
            var rowmaxvalues=[];
            var rowminvalues=[];
            var minvalues = [];
            var maxvalues = [];
            for ( var i1 = 0; i1 < dataSubValuesPerTable.length; i1++){
               console.log("==========max============");
               var max = dataSubValuesPerTable[i1].max;
               var min = dataSubValuesPerTable[i1].min;


               for ( var j1 = 0; j1 < max.length; j1++){
                
                  if (max[j1].specialization.value[0].type === "LiteralString")
                    //datavalues.push(Number(dataValuesPerTable[i][j].specialization.value[0].string));
                    maxvalues[j] = max[j1].specialization.value[0].string;
                  else if (max[j1].specialization.value[0].type === "LiteralReal")
                    //datavalues.push(Number(dataValuesPerTable[i][j].specialization.value[0].double));
                    maxvalues[j] = max[j1].specialization.value[0].double;
                  else if (max[j1].specialization.value[0].type === "LiteralInteger")
                    //datavalues.push(Number(dataValuesPerTable[i][j].specialization.value[0].integer));
                    maxvalues[j] = max[j1].specialization.value[0].integer;
               }
               rowmaxvalues[i1] = maxvalues;
            }
            console.log("================rowmaxvalues=============================");
            console.log(rowmaxvalues);
            var rowvalues=[];
            var rowsysmlids=[];
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
             console.log("================rowvalues===================");
             console.log(rowvalues);
            var achartdata = {
              id: scopedataNames[k],//(scopedataNames[k] !== undefined ? GTTableService.toValidId(scopedataNames[k]) : "default"),
             };
             chartdata[achartdata.id] = achartdata;
             
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
            d3.select("."+ achartdata.id).remove();
            var dataIdDiv = divchart.append('div').attr("class", achartdata.id)
                                .attr("style", 'border:1px solid #ddd');
            createChart(achartdata, dataIdDiv);
          }//end of k
      }; //end of render
      scope.$watch('datavalues', function(newValue, oldValue) {
        console.log("scope.watch - datavalues");
        return scope.render();
      },true); 

      
      scope.$watch('tableRowHeaders', function(newRowHeaders, oldRowHeaders) {
        console.log("scope.watch - tableRowHeaders");
        //When a rowHeader is changed, it rquires to change dataIdFilters, too.
        if ( oldRowHeaders !== undefined){
          for ( var i = 0; i < newRowHeaders.length; i++ ){
            for ( var j = 0; j < newRowHeaders[i].length; j++){
              if ( newRowHeaders[i][j].name !== oldRowHeaders[i][j].name){
                 //add new one.
                 dataIdFilters[scopedataNames[i]][0][newRowHeaders[i][j].name] = dataIdFilters[scopedataNames[i]][0][oldRowHeaders[i][j].name];
                 //delete old one
                 delete dataIdFilters[scopedataNames[i]][0][oldRowHeaders[i][j].name];
              }
            }
          }
        }
        return scope.render();
      },true); 
      
      GTTableService.readTables (scope.mmsEid,ws, version)
         .then(function(value) {
          console.log("=============Table Service =========");
          console.log(value);
            scopedataNames = value.dataNames;
            scopetableColumnHeadersLabel= value.tableColumnHeadersLabels;
            scope.tableRowHeaders = value.tableRowHeaders;
            scope.datavalues = value.datavalues; //[][] - array
            dataIdFilters = value.dataIdFilters;
            dataSubValues = value.datasubvalues;
      });
      
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
