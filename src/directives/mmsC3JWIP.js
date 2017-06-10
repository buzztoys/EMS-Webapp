'use strict';
 angular.module('mms.directives')
    .directive('mmsC3JWIP', ['$q', 'ElementService', 'UtilsService', 'TableService', '$compile', 'growl','$window', mmsC3JWIP]);
function mmsC3JWIP($q, ElementService, UtilsService, TableService, $compile, growl, $window) {
      
  var mmsChartLink = function(scope, element, attrs, mmsViewCtrl) {

    var c3 = $window.c3;
    scope.rowHeaders=[]; //not null when render is called 1st time.      
    var d3 = $window.d3;  
    var svg = d3.select(element[0])
      .append('div');
    
    var processed = false;
    var ws = scope.mmsWs;
    var version = scope.mmsVersion;
 
  var projectId;
  var refId;
  var commitId;
        
  if (mmsViewCtrl) {
      var viewVersion = mmsViewCtrl.getElementOrigin();
      if (!projectId)
          projectId = viewVersion.projectId;
      if (!refId)
          refId = viewVersion.refId;
      if (!commitId)
          commitId = viewVersion.commitId;
  }


    function vf_pplot(_columns, _is_x_value_number, _has_column_header) {

      svg.append('div').attr("id", 'c3chart' + scope.$id);
      var c3json = JSON.parse(scope.options.replace(/'/g, '"'));
      c3json.bindto = '#c3chart' + scope.$id;
      
      c3json.data.columns = _columns;
      if ( scope.functions !== undefined){
        var c3jfunc = JSON.parse(scope.functions.replace(/'/g, '"'));
        for (var key in c3jfunc) {
        if (c3jfunc.hasOwnProperty(key)) {
            console.log(key + " = " + c3jfunc[key]);
            var evalString = ['c3json.'+key, '=', '(' + c3jfunc[key] + ')'].join(' ');
            console.log(evalString);
            eval(evalString);
          }
        }    
        
            
            
      

     }
    var json = JSON.stringify(c3json);
    console.log(json);
    var chart = c3.generate(c3json);
    
    /*var zz2 = {bindto:'#c3chart' + scope.$id + _index,
    data: {
        type: 'line',
        types: {
            data3: 'bar',
            data4: 'bar',
            data6: 'area',
        },
        groups: [
            ['data3','data4']
        ],
        columns: [
            ['data1', 30, 20, 50, 40, 60, 50],
            ['data2', 200, 130, 90, 240, 130, 220],
            ['data3', 300, 200, 160, 400, 250, 250],
            ['data4', 200, 130, 90, 240, 130, 220],
            ['data5', 130, 120, 150, 140, 160, 150],
            ['data6', 90, 70, 20, 50, 60, 120],
        ]
        
    }
  };
    var json2 = JSON.stringify(zz2);
    console.log(json2);
    var chart = c3.generate(zz2);
    */

	}//end of vf_pplot()
  scope.render = function() {

  
    if (scope.table === undefined) { //data is not from table
      return;
    }
    svg.selectAll('*').remove();
      
	
	var is_x_value_number = true;  //column headings are number (not check 1st column)
  var has_column_header;
  var start_index; //0 if column header is included as data, -1 if column header is not included as data
  var c3_data=[];

    if (scope.tableColumnHeadersLabel === undefined) {//no column header 
        has_column_header = false;
        start_index = -1;    
    }
    else if ( scope.c3dataxs === undefined) {
      c3_data[0] = ['x'].concat(scope.tableColumnHeadersLabel);
      start_index = 0;
      has_column_header = true;
    }
    //TODO: support for xs
    else {//Assume if xs is defined, column header is ignored even exist
      has_column_header = false;
      start_index = -1;
    }

    if (scope.tableColumnHeadersLabel !== undefined && isNaN(scope.tableColumnHeadersLabel[0]))
      is_x_value_number = false;

     for ( var i = 0; i < scope.datavalues.length; i++){
	     var c3_data_row=[];
       
      for ( var j = 0; j < scope.datavalues[i].length; j++){
        var datavalue = null;

        if (scope.datavalues[i][j].vatype === "Property" || scope.datavalues[i][j].type === "Port")
          datavalue = scope.datavalues[i][j].defaultValue;
        else if (scope.datavalues[i][j].type === "Slot")
          datavalue = scope.datavalues[i][j].value[0];
        if (datavalue && datavalue.type === "LiteralString")
          c3_data_row[j] = Number(datavalue.value);
        else if (datavalue && (datavalue.type === "LiteralReal" || datavalue.type === "LiteralInteger"))
          c3_data_row[j] = datavalue.value;
      } //end of j
     	c3_data[1+start_index++] = [scope.tableRowHeaders[i].name].concat(c3_data_row);
    } //end of i
    //////////////////////////////////
    vf_pplot(c3_data, is_x_value_number, has_column_header); //c3_columns
   
  };//end of render

    scope.$watch('datavalues', function(newVals, oldVals) {
        return scope.render();
    }, true);

   

   
    var td = JSON.parse(scope.table.replace(/'/g, '"'));
    console.log(td);
    //console.log(scope.options);
    //console.log(scope.functions);

    var reqOb = {tableData: td, projectId: projectId, refId: refId, commitId: commitId};

    TableService.readTable (reqOb, ws, version)
      .then(function(value) {
        console.log("====mmsc3jwip.value=====");
        console.log(value);
        //scopeTableTitles = value.tableTitles;
        //scopeTableIds = value.tableIds;
        scope.tableColumnHeadersLabel = value.tableColumnHeadersLabels;
        scope.tableRowHeaders = value.tableRowHeaders;
        scope.datavalues = value.datavalues; //[][] - array
        
      });
    
/*
   
    var i, j;
    //assuming td.type = "Table";
    if ( td.header !== undefined){
      for (i = 1; i < td.header[0].length; i++ ){
        scopetableColumnHeadersLabel.push(td.header[0][i].content[0].text.replace("<p>","").replace("</p>","").replace(" ", ""));    
      }
     }
    var rowHeadersMmsEid = [];
    rowHeadersMmsEid.elementIds =[];
    rowHeadersMmsEid.projectId = reqOb.projectId;
    rowHeadersMmsEid.refId = reqOb.refId;
    rowHeadersMmsEid.commitId = reqOb.commitId;
    var dataValuesMmmEid = [];
    dataValuesMmmEid.elementIds = [];
    dataValuesMmmEid.projectId = reqOb.projectId;
    dataValuesMmmEid.refId = reqOb.refId;
    dataValuesMmmEid.commitId = reqOb.commitId;

    var numOfDataColumn; 
    
    for ( i = 0; i < td.body.length; i++){ 
      rowHeadersMmsEid.elementIds.push(td.body[i][0].content[0].source);
      for ( j = 1; j < td.body[i].length; j++ ){
        dataValuesMmmEid.elementIds.push(td.body[i][j].content[0].source);
      }
      if (i === 0)
        numOfDataColumn = td.body[i].length - 1; //-1 to remove row header
      }
      

      console.log("rowHeadersMmsEid");
      console.log(rowHeadersMmsEid);

      ElementService.getElements(rowHeadersMmsEid, 1, false)
          .then(function(rowHeaders) {
              ElementService.getElements(dataValuesMmmEid, 1, false)
                .then(function(values) {
                  var dataIdFilters=[];
                  var dataTableValues = [];
                  var datavalues = [];
                  var startIndex = 0;
                  var counter = 0;
                  var numOfRowHeadersPerTable = td.body.length;
                    datavalues = [];
                    var valueLength = numOfDataColumn*numOfRowHeadersPerTable;//rowHeadersMmsEid.length;
                    for (i = 0; i < valueLength; i= i + numOfDataColumn){
                      var datarow =[];// new Array(tableColumnHeadersLabels[k].length);
                      for ( var j = 0; j < numOfDataColumn; j++){
                        datarow.push(values[counter++]); 
                      }
                      datavalues.push(datarow);
                    }
                    dataTableValues.push(datavalues);
                  
                  var tableRowHeaders =[];
                  var eachRowHeader;
                  counter = 0;
                  
                    eachRowHeader = [];
                    for ( i = 0; i < numOfRowHeadersPerTable; i++){
                      eachRowHeader.push(rowHeaders[counter++]);
                    }
                    tableRowHeaders.push(eachRowHeader);
                  
                  
                   
                  var r =  {
                     tableColumnHeadersLabels: scopetableColumnHeadersLabel, //[]
                     tableRowHeaders: tableRowHeaders,
                     datavalues: dataTableValues, //[][] - array
                     
                  };
                var deferred = $q.defer();
                deferred.resolve(r);
                  console.log("=========================");
                  console.log(scope.datavalues);
                  //console.log(r);
                  console.log("=========================");
                
            });//ElementService.getElements - dataValuesMmEid
          });//ElementService.getElements - rowHeadersMmsEid
*/

    //TableService.readTables (scope.mmsEid, ws, version)
    /*TableService.readTables (reqOb, ws, version
      )
      .then(function(value) {
        console.log("====mmsC3JWIP.value=====");
        console.log(value);
        scopetableColumnHeadersLabel = value.tableColumnHeadersLabels;
        scope.tableRowHeaders = value.tableRowHeaders;
        scope.datavalues = value.datavalues; //[][] - array
        dataIdFilters = value.dataIdFilters;
      });
    */
  }; //end of link

    return {
      restrict: 'EA',
      require: '?^mmsView',
       scope: {
        table: '@',
        options: '@',
        functions: '@',
      },
      link: mmsChartLink
    }; //return
}



