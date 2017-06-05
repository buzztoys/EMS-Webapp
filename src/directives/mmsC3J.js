'use strict';
 angular.module('mms.directives')
    .directive('mmsC3J', ['ElementService', 'UtilsService', 'TableService', '$compile', 'growl','$window', mmsC3J]);
function mmsC3J(ElementService, UtilsService, TableService, $compile, growl, $window) {
      
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


    function vf_pplot(_columns, _index, _is_x_value_number, _has_column_header) {

      svg.append('div').attr("id", 'c3chart' + scope.$id + _index);
     
      var c3json = JSON.parse(scope.c3j.replace(/'/g, '"'));
      c3json.bindto = '#c3chart' + scope.$id + _index;
      
      console.log(c3json);       
      if ( c3json.data === undefined)
        c3json.data = {};
      
      if (scope.c3dataurl){
        c3json.data.url = scope.c3dataurl;
      }
      else if (scope.c3datajson){
        c3json.data.json = JSON.parse( scope.c3datajson.replace(/'/g, '"'));
      }
      else if (scope.c3datarows){
        c3json.data.rows = eval("(" + scope.c3datarows + ")");
      }
      else if (scope.c3datacolumns){
        c3json.data.columns = eval("(" + scope.c3datacolumns + ")");
      }
      else {
         if (scope.c3tablereverse){
          c3json.data.rows = _columns;
        }
        else { //data from table
          c3json.data.columns = _columns;
        }
        //if(_has_column_header === true && scope.c3dataxs === undefined && scope.c3axisxcategories === undefined)
          //c3json.data.x = 'x'; 
      }
      /*
      c3jf="[ {'n': 'axis.x.tick.format', 'v':'function(x){ return x.getFullYear() + \'-\' + (x.getMonth()+1)+ \'-\' + x.getDate() + \' \'+ x.getHours() +\':\' + x.getMinutes() + \':\' + x.getSeconds();}'
      }]"
      */
      if ( scope.c3jf !== undefined){
        console.log('c3jf');
        console.log(scope.c3jf);

        var c3jfunc = JSON.parse(scope.c3jf.replace(/'/g, '"'));
        //var c3jfunc = JSON.parse();
        for ( var k = 0; k < c3jfunc.length; k++){
            console.log(c3jfunc[k].v);
            console.log(c3jfunc[k].n);
            
            var evalString = ['c3json.'+c3jfunc[k].n, '=', '(' + c3jfunc[k].v + ')'].join(' ');
            console.log(evalString);
            eval(evalString);

         
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

    if (scope.mmsEid === undefined) { //data is not from table
      if ( scope.c3datarows !== undefined || scope.c3datacolumns !== undefined || scope.c3dataurl !== undefined || scope.c3datajson !== undefined)
        vf_pplot([], 0, false, false);
      return;
    }
    svg.selectAll('*').remove();
      
	
	var is_x_value_number = true;  //column headings are number (not check 1st column)
  var has_column_header;
  var start_index; //0 if column header is included as data, -1 if column header is not included as data
  for ( var k = 0; k < scopeTableIds.length; k++){
		var c3_data=[];

    if (scopetableColumnHeadersLabel[k] === undefined) {//no column header 
        has_column_header = false;
        start_index = -1;    
    }
    else if ( scope.c3dataxs === undefined) {
      c3_data[0] = ['x'].concat(scopetableColumnHeadersLabel[k]);
      start_index = 0;
      has_column_header = true;
    }
    else {//Assume if xs is defined, column header is ignored even exist
      has_column_header = false;
      start_index = -1;
    }
    if (scopetableColumnHeadersLabel[k] !== undefined && isNaN(scopetableColumnHeadersLabel[k][0]))
      is_x_value_number = false;

    for ( var i = 0; i < scope.datavalues[k].length; i++){
	     var c3_data_row=[];
       
      for ( var j = 0; j < scope.datavalues[k][i].length; j++){
        var datavalue = null;
        if (scope.datavalues[k][i][j].type === "Property" || scope.datavalues[k][i][j].type === "Port")
          datavalue = scope.datavalues[k][i][j].defaultValue;
        else if (scope.datavalues[k][i][j].type === "Slot")
          datavalue = scope.datavalues[k][i][j].value[0];
        if (datavalue && datavalue.type === "LiteralString")
          c3_data_row[j] = Number(datavalue.value);
        else if (datavalue && (datavalue.type === "LiteralReal" || datavalue.type === "LiteralInteger"))
          c3_data_row[j] = datavalue.value;
      } //end of j
     	c3_data[1+start_index++] = [scope.tableRowHeaders[k][i].name].concat(c3_data_row);
    } //end of i
    
    //////////////////////////////////
    vf_pplot(c3_data, k, is_x_value_number, has_column_header); //c3_columns
   }//end of k (each table)
  };//end of render

    scope.$watch('datavalues', function(newVals, oldVals) {
        return scope.render();
    }, true);
      
    var scopeTableTitles=[];
    var scopeTableIds = [];
    var scopetableColumnHeadersLabel= [];
    var dataIdFilters = [];

    var reqOb = {elementId: scope.mmsEid, projectId: projectId, refId: refId, commitId: commitId};

    //TableService.readTables (scope.mmsEid, ws, version)
    TableService.readTables (reqOb, ws, version)
      .then(function(value) {
        console.log("====mmsc3j.value=====");
        console.log(value);
        scopeTableTitles = value.tableTitles;
        scopeTableIds = value.tableIds;
        scopetableColumnHeadersLabel = value.tableColumnHeadersLabels;
        scope.tableRowHeaders = value.tableRowHeaders;
        scope.datavalues = value.datavalues; //[][] - array
        dataIdFilters = value.dataIdFilters;
      });
    
  }; //end of link

    return {
      restrict: 'EA',
      require: '?^mmsView',
       scope: {
        mmsEid: '@',
        c3tablereverse: '@',
        
        c3dataurl: '@',
        c3datajson: '@',
        c3datarows: '@',
        c3datacolumns: '@',
        c3j: '@',
        c3jf: '@',
      },
      link: mmsChartLink
    }; //return
}



