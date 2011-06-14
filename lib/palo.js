/*
 * PALO for node.js by Arnold van der Meulen
 */
var fs = require('fs');

var options = {
  host: '127.0.0.1',
  port: 7777
};



/**
 * Send GET request to the palo server
 * @param url the full palo server url (@see palo server documentation)
 * @param callback is called with the result from the palo server
 */
exports.get = function(url, callback) {
  var http = require('http');
  var client = http.createClient(options.port, options.host);
  var request = client.request('GET', url, options);

  console.log(url);

  client.addListener('error', function(connectionException){
    console.log(connectionException);
  });

  request.addListener('response', function(response){
      var data = '';
      response.addListener('data', function(chunk){
          data += chunk;
      });
      response.addListener('end', function(){
        for (var h in request.res.headers) {
          if (h.substring(0, 6) == 'x-palo') console.log(h + ': ' + request.res.headers[h]);
        };
        console.log(data);
        if (typeof callback != 'undefined') {
          callback(data);
        }
      });
  });

  request.end();
}

// Auto-load getters so every server method gets its own function call.
exports.requests = {};
fs.readdirSync(__dirname + '/requests').forEach(function(filename){
  if (/\.js$/.test(filename)) {
    var name = filename.substr(0, filename.lastIndexOf('.'));
    exports.requests.__defineGetter__(name, function(){
      return require('./requests/' + name);
    });
  }
});

/**
 * This will parse a delimited string into an array of
 * arrays. The default delimiter is the comma, but this
 * can be overriden in the second argument.
 */
exports.CSVToArray = function( strData, strDelimiter ){
  // Check to see if the delimiter is defined. If not,
  // then default to comma.
  strDelimiter = (strDelimiter || ",");

  // Create a regular expression to parse the CSV values.
  var objPattern = new RegExp(
    (
      // Delimiters.
      "(\\" + strDelimiter + "|\\r?\\n|\\r|^)" +

      // Quoted fields.
      "(?:\"([^\"]*(?:\"\"[^\"]*)*)\"|" +

      // Standard fields.
      "([^\"\\" + strDelimiter + "\\r\\n]*))"
      ),
    "gi"
    );

  // Create an array to hold our data. Give the array
  // a default empty first row.
  var arrData = [[]];

  // Create an array to hold our individual pattern
  // matching groups.
  var arrMatches = null;

  // Keep looping over the regular expression matches
  // until we can no longer find a match.
  while (arrMatches = objPattern.exec( strData )){

    // Get the delimiter that was found.
    var strMatchedDelimiter = arrMatches[ 1 ];

    // Check to see if the given delimiter has a length
    // (is not the start of string) and if it matches
    // field delimiter. If id does not, then we know
    // that this delimiter is a row delimiter.
    if (
      strMatchedDelimiter.length &&
      (strMatchedDelimiter != strDelimiter)
      ){
      // Since we have reached a new row of data,
      // add an empty row to our data array.
      arrData.push( [] );
    }

    // Now that we have our delimiter out of the way,
    // let's check to see which kind of value we
    // captured (quoted or unquoted).
    if (arrMatches[ 2 ]){
      // We found a quoted value. When we capture
      // this value, unescape any double quotes.
      var strMatchedValue = arrMatches[ 2 ].replace(
        new RegExp( "\"\"", "g" ),
        "\""
        );
    } else {
      // We found a non-quoted value.
      var strMatchedValue = arrMatches[ 3 ];
    }

    // Now that we have our value string, let's add
    // it to the data array.
    if (strMatchedValue != '')
      arrData[ arrData.length - 1 ].push( strMatchedValue );
  }

  // Remove the last (empty) row
  arrData.pop();

  // Return the parsed data.
  return( arrData );
}

exports.toQueryString = function(obj) {
  var str = [];
  for(var p in obj)
     str.push(p + "=" + encodeURIComponent(obj[p]));
  return str.join("&");
}

exports.columns = {
  /**
   * Map palo result to object array with column names.
   * Find the used columns by method.
   */
  mapColumns: function(method, data) {
    var cols = this.columns[method.replace('\/','_')];
    var result = [];
    for (var i = 0; i < data.length; i++) {
      result[i] = {};
      for (var j = 0; j < cols.length; j++) {
        result[i][cols[j]] = data[i][j];
      }
    }
    return result;
  },
  /** The columns returned by the paloserver, see server API  */
  columns: {
    'server_databases': ['database','name_database','number_dimensions','number_cubes','status','type','database_token'],
    'server_info'     : ['major_version','minor_version','bugfix_version','build_number','encryption','https_port'],
    //
    'server_login'    : ['sid','ttl'],
    //
    'database_cubes' : ['cube','name_cube','number_dimensions','dimensions','number_cells','number_filled_cells','status','type','cube_token'],
    'database_dimensions' : ['dimension','name_dimension','number_elements','maximum_level','maximum_indent','maximium_depth','type','attributes_dimension','attributes_cube','rights_cube','dimension_token'],
    'database_info'  : ['database','name_database','number_dimensions','number_cubes','status','type','database_token'],
    //
    'dimension_info'  : ['dimension','name_dimension','number_elements','maximum_level','maximum_indent','maximum_depth','type','attributes_dimension','attributes_cube','rights_cube','dimension_token'],
    'dimension_elements': ['element','name_element','position','level','indent','depth','type','number_parents','parents','number_children','children','weights'],
    //
    'cube_info'       : ['cube','name_cube','number_dimensions','dimensions','number_cells','number_filled_cells','status','type','cube_token'],
  }
};