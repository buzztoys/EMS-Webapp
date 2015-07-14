'use strict';

angular.module('mms')
  .factory('TableService', ['$q', '$http', 'URLService', 'UtilsService', 'CacheService', '_', 'ElementService', TableService]);

function TableService($q, $http, URLService, UtilsService, CacheService, _, ElementService) {
   
    var toValidId = function(original) { 
        return original.replace(/[^a-zA-Z0-9]/gi, '');
    };
  
    var readTables = function(mmsEid, ws, version) {
      var deferred = $q.defer();  
      
      //make only a-zA-Z0-9 because id or class does not support special characters(ie., ())
     
        
      ElementService.getElement(mmsEid, false, ws, version)
      .then(function(data) {
        
        var tableContains = [];
        var tableNames = [];
        var tableColumnHeadersLabels=[];
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
            tableColumnHeadersLabels.push(rowHeaders); //xxx, yyy, mass,cost, power in string
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
                    var dataIdFilters=[];
                    var dataTableValues = [];
                    var datavalues = [];
                    var startIndex = 0;
                    var counter = 0;
                    for (k = 0; k < tableContains.length; k++){
                      datavalues = [];
                    var valueLength = tableColumnHeadersLabels[k].length* tableContains[k].body.length;
                    for (i = 0; i < valueLength; i= i + tableColumnHeadersLabels[k].length){
                      var datarow =[];// new Array(tableColumnHeadersLabels[k].length);
                      for ( var j = 0; j < tableColumnHeadersLabels[k].length; j++){
                        datarow.push(values[counter++]); 
                      }
                      datavalues.push(datarow);
                    }
                    dataTableValues.push(datavalues);
                  }
                  
                  var tableRowHeaders =[];
                  counter = 0;
                  var numOfRows, eachRowHeader;
                  for (i = 0; i < dataTableValues.length; i++){
                    numOfRows = dataTableValues[i].length;
                    eachRowHeader = [];
                    for (k = 0; k < numOfRows; k++){
                        eachRowHeader.push(rowHeaders[counter++]);
                    }  
                    tableRowHeaders.push(eachRowHeader);
                  }

                  for (k = 0; k < tableNames.length; k++){
                    var filters = [];
                    var filterRowHeaders = [];
                    var filterColumnHeaders=[];
                    for ( var i = 0; i < tableRowHeaders[k].length; i++){
                         filterRowHeaders[toValidId(tableRowHeaders[k][i].name)] = true;
                    }
                    for ( i = 0; i < tableColumnHeadersLabels[k].length; i++){
                       filterColumnHeaders[toValidId(tableColumnHeadersLabels[k][i])] = true;
                    }
                    filters.push(filterRowHeaders);
                    filters.push(filterColumnHeaders);
                    dataIdFilters[toValidId(tableNames[k])]=filters;
                  }
                  var r =  {
                     dataNames: tableNames,//[]ss
                     tableColumnHeadersLabels: tableColumnHeadersLabels, //[]
                     tableRowHeaders: tableRowHeaders,
                     datavalues: dataTableValues, //[][] - array
                     dataIdFilters: dataIdFilters
                  };

                deferred.resolve(r);

                  
            });//ElementService.getElements - dataValuesMmEid
        });//ElementService.getElements - rowHeadersMmsEid
        
      }); //end of ElementService
      return deferred.promise;
    }; //end of getTables


    return {
        readTables: readTables,
        toValidId: toValidId
    };

}