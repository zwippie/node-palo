/* All PALO server requests that start with /server
 */
var palo = require('palo');

/** Shows the list of databases and return result as JSON. */
exports.databases = function(params, callback) {
  // TODO: check params for requirements/missing params

  // make request on palo server
  palo.get('/server/databases?sid=' + params.sid, function(paloResult) {
    var keys = ['database','name_database','number_dimensions','number_cubes','status','type','database_token'];
    var result = palo.CSVToArray(paloResult, ";");

    callback(result);
  });
}



/** Shows information about the server. */
exports.info = function(params, callback) {

}

/** Login to server by user name and password and return result as JSON. */
exports.login = function(params, callback) {
  // TODO: check params for requirements/missing params

  // do login request on palo server
  palo.get('/server/login?user=' + params.user + '&password=' + params.password, function(paloResult) {
    splitResult = paloResult.split('\n', 1)[0].split(';', 2);
    var result = {
      sid: splitResult[0],
      ttl: splitResult[1]
    };

    // Emit the result
    callback(result);
  });
}


