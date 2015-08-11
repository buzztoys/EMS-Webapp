'use strict';

angular.module('mms')
  .factory('GTTableService', ['$q', '$http', 'URLService', 'UtilsService', 'CacheService', '_', 'ElementService', GTTableService]);

function GTTableService($q, $http, URLService, UtilsService, CacheService, _, ElementService) {
   
    var toValidId = function(original) { 
        return original.replace(/[^a-zA-Z0-9]/gi, '');
    };
  
    var readTables = function(mmsEid, ws, version) {
      var deferred = $q.defer();  
      
      //make only a-zA-Z0-9 because id or class does not support special characters(ie., ())
     
        
      ElementService.getElement(mmsEid, false, ws, version)
      .then(function(data) {
        console.log("dddddddddddd");
        console.log(data);

        var tableContains = [];
        var tableNames = [];
        var tableColumnHeadersLabels=[];
        var tableColumnLastHeadersUniqueLabels = []; //empty if only 1 row header
        var columnHeaders = [];

        var datacolumnInEvery = 1;
        var isInterval = false;

        for ( var k = 0; k < data.specialization.contains.length; k++ ){
          if ( data.specialization.contains[k].type ==="Table"){
            if ( data.specialization.contains[k-1].sourceType ==="text"){
              if ( data.specialization.contains[k-1].text !== undefined)
                tableNames.push(toValidId(data.specialization.contains[k-1].text.replace("<p>","").replace("</p>","").replace(" ", ""))); //assume it is Paragraph
            }
            else
              tableNames.push("default");
            tableContains.push(data.specialization.contains[k]);

            //assume first column is empty and 1st row header is one to be plotted and last column header will be plotted
            for ( var kk = 1; kk < data.specialization.contains[k].header[0].length; kk++){
              if (data.specialization.contains[k].header[0][kk].content[0].sourceType === "text"){
                    columnHeaders[kk-1] = data.specialization.contains[k].header[0][kk].content[0].text.replace("<p>","").replace("</p>","");
              }
              //else  - if editable then sourceType = "reference"
            } 
            tableColumnHeadersLabels.push(columnHeaders); //xxx, yyy, mass,cost, power in string

            //mulitple row headers are found
            if ( data.specialization.contains[k].header.length != 1){
              //num of columns for last row headers
              var maxColumnHeaderLength = data.specialization.contains[k].header[data.specialization.contains[k].header.length-1].length - 1;
              datacolumnInEvery = maxColumnHeaderLength / columnHeaders.length;
              var lastRowHeaderIndex = data.specialization.contains[k].header.length-1;
              var h1 = data.specialization.contains[k].header[lastRowHeaderIndex][1].content[0];
              var h2 = data.specialization.contains[k].header[lastRowHeaderIndex][2].content[0];
             
              if ( h1.sourceType === "text" && h1.text !== undefined && h1.text.replace("<p>","").replace("</p>","").replace(" ", "").toLowerCase() === "min" && h2.sourceType === "text" && h2.text !== undefined && h2.text.replace("<p>","").replace("</p>","").replace(" ", "").toLowerCase() === "max"){
                isInterval = true;
                console.log(h1.text);
                console.log(h2.text);
              }
              if (isInterval === true)
                console.log("it is interval heading");
              
              

              /*for ( kk = 1; kk < datacolumnInEvery + 1; kk++){ //Min, Max, Value
                if (data.specialization.contains[k].header[lastRowHeaderIndex][kk].content[0].sourceType === "text"){
                  if (data.specialization.contains[k].header[lastRowHeaderIndex][kk].content[0].text !== undefined){
                    //tableColumnLastHeadersUniqueLabels.push(data.specialization.contains[k].header[lastRowHeaderIndex][kk].content[0].text.replace("<p>","").replace("</p>","").replace(" ", ""));
                    var xx = data.specialization.contains[k].header[lastRowHeaderIndex][kk].content[0].text.replace("<p>","").replace("</p>","").replace(" ", "");
                    console.log(kk + " " + xx);
                  }
                }
              }*/
            }

          }
        }
         var rowHeadersMmsEid = []; 
        var dataValuesMmmEid =[];
        var body;
        //
        var dataValuesSubMmmEids = [];
                
        //data rows
        for ( k = 0; k < tableContains.length; k++){
            body = tableContains[k].body;
            for (var i = 0; i < body.length; i++ ){
              //1st column is header
              rowHeadersMmsEid.push(body[i][0].content[0].source);
              //2nd column+ is content
              for ( var j = 1; j < body[i].length; j++){
                if (j%datacolumnInEvery === 0){ //if min, max, value then get only data for value column
                  dataValuesMmmEid.push(body[i][j].content[0].source);
                }
                else if (isInterval) {
                  dataValuesSubMmmEids.push(body[i][j].content[0].source);
                }
            }
          }
        }
        ElementService.getElements(rowHeadersMmsEid, false, ws, version)
        .then(function(rowHeaders) {
               
                ElementService.getElements(dataValuesMmmEid, false, ws, version)
                  .then(function(values) {
                    //getting min and max                   
                    var dataTableSubValues = [];
                    if ( dataValuesSubMmmEids.length !== 0){
                      ElementService.getElements(dataValuesSubMmmEids, false, ws, version)
                      .then(function(values) {
                        var counter = 0;
                        var datavalues = [];
                        for (k = 0; k < tableContains.length; k++){
                          datavalues = [];
                          var numOfRows = tableContains[k].body.length;
                          for (i = 0; i < numOfRows; i++){
                            var datarow1 = [];// new Array(tableColumnHeadersLabels[k].length);
                            var datarow2 = [];
                            for ( var j = 0; j < tableColumnHeadersLabels[k].length; j++){
                              datarow1.push(values[counter++]); 
                              datarow2.push(values[counter++]); 
                            }
                            datavalues.push({min: datarow1, max: datarow2});
                          }//end of i
                          dataTableSubValues.push(datavalues);
                        }//end of loop k
                      });
                    }//end of getting min and max
                    var dataIdFilters=[];
                    var dataTableValues = [];
                    var datavalues =[];
                    var startIndex = 0;
                    var counter = 0;
                    for (k = 0; k < tableContains.length; k++){
                      datavalues = [];
                      var numOfRowsPerTable = tableContains[k].body.length;
                      for (i = 0; i < numOfRowsPerTable; i++){  
                        var datarow =[];// new Array(tableColumnHeadersLabels[k].length);
                        for ( var j = 0; j < tableColumnHeadersLabels[k].length; j++){
                          datarow.push(values[counter++]); 
                        }
                        datavalues.push(datarow);
                      }
                      dataTableValues.push(datavalues);
                    } //end of loop k
                  
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
                      filters.push(filterRowHeaders); //filders[0]
                      filters.push(filterColumnHeaders); //filders[1]
                      dataIdFilters[toValidId(tableNames[k])]=filters;
                    }
                    var r =  {
                       dataNames: tableNames,//[]ss
                       tableColumnHeadersLabels: tableColumnHeadersLabels, //[]
                       tableRowHeaders: tableRowHeaders,
                       datavalues: dataTableValues, //[][] - array
                       dataIdFilters: dataIdFilters,
                       datasubvalues: dataTableSubValues
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