/*!
 * node_palo
 * Copyright(c) Arnold van der Meulen.
 * MIT Licensed
 */

var fs = require('fs')
  , http = require('http')
  , redis = require('redis')
  , utils = require('./utils.js');

var defaults = {
  host: '127.0.0.1',
  port: '7777',
  urlPrefix: '',
  format: 'json',
  useCache: false
}

/**
 * Perform palo server query with provided url minus routePrefix
 *
 *
 */

exports = module.exports = function palo(options) {
  defaults = utils.merge(defaults, options);

//  if (options.host) defaults.host = options.host;
//  if (options.port) defaults.port = options.port;
//  if (options.urlPrefix) defaults.urlPrefix = options.urlPrefix;
//  if (options.format) defaults.format = options.format;

  // Connect middleware entry point
  return function palo(req, res, next) {
    // mount safety
    if (req._palo) return next();

    // only intercept requests with the urlPrefix
    if (req.originalUrl.substring(0, defaults.urlPrefix.length + 1) != defaults.urlPrefix + '/') {
      return next();
    }

    // flag as palo
    req._palo = true;

    // make get request to palo server
    return get(req, res, next, defaults);
  };
};

var setDefault = exports.setDefault = function(option, value) {
  defaults[option] = value;
}

// Create redis db for caching of palo results

if (defaults.useCache) {
  var cache = exports.cache = redis.createClient();
  cache.on("ready", function () {
    console.log('Cache is ready');
    cache.get('sid', console.log);
  })
  cache.on("error", function (err) {
    console.log("Cache error: " + err);
  });
} else {
  var cache = exports.cache = {
    get: function(key) { return undefined; },
    set: function(key, val) { return undefined; }
  }
}


// Auto-load getters so every palo server method gets its own function call.
// This exposes the files and functions in the '/requests' directory.
var requests = exports.requests = {};
fs.readdirSync(__dirname + '/requests').forEach(function(filename){
  if (/\.js$/.test(filename)) {
    var name = filename.substr(0, filename.lastIndexOf('.'));
    exports.requests.__defineGetter__(name, function(){
      return require('./requests/' + name);
    });
  }
});

/**
 * Perform result from the palo server
 */
var get = exports.get = function(req, res, next, options){
  // mark as palo (needed?)
  if (req) {
    req._palo = true;
  }

  if ('object' == typeof options) {
    options = options || {};
  } else if (options) {
    options = { url: options };
  } else {
    options = {};
  }
//cache.get('sid', console.log);
  var host = options.host || defaults.host
    , port = options.port || defaults.port
    , server = { host: host, port: port }
    , urlPrefix = options.urlPrefix || defaults.urlPrefix
    , format = options.format || defaults.format
    , doCallback = options.doCallback || (req ? false : true)
    , url = options.url || req.originalUrl.substring(urlPrefix.length);

  //var url = req.originalUrl.substring(urlPrefix.length);
  //console.log('callback: %s', require('url').parse(url, true).query.callback);
  var jsonpCallback = doCallback ? false : require('url').parse(url, true).query.callback;

  //console.log(host, port, server, urlPrefix, format, doCallback, url, jsonpCallback);

  // create request for palo server
  var client = http.createClient(port, host);
  var request = client.request('GET', url, server);

  console.log('palo.get(%s)', url);

  client.addListener('error', function(connectionException) {
    console.log(connectionException);
  });

  request.addListener('response', function(response) {
    var data = '';
    response.addListener('data', function(chunk) {
        data += chunk;
    });
    response.addListener('end', function() {
      // Palo data complete, send or return the results
      if ('json' == format) {
        data = csvToArray(data);
      }
      //console.log(data);
      var statusCode = request.res.statusCode;

      if ('200' != statusCode) {
        console.log("Palo server ERROR: " + data);
        if (doCallback) {
          return next({
            success: false,
            data: data,
            statusCode: statusCode
          });
        }
      }

      // check headers for palo cache tokens
      var paloHeaders = {};
      for (var h in request.res.headers) {
        if (h.substring(0, 6) == 'x-palo') {
          paloHeaders[h] = request.res.headers[h];
          // save cache token if changed
          if (cache.get(h) != request.res.headers[h]) {
            cache.set(h, request.res.headers[h]);
          }
          //console.log(h + ': ' + request.res.headers[h]);
        }
      };

      // Should the callback be called?
      if (doCallback) {
        return next({
          success: true,
          data: data,
          statusCode: statusCode,
          headers: paloHeaders
        });
      }

      // No, it's a http request, set headers and send the results
      res.statusCode = request.res.statusCode;
      for (h in paloHeaders) {
        res.setHeader(h, request.res.headers[h]);
      }

      if ('json' == format) {
        if (jsonpCallback) {
          res.contentType('js');
          res.send(jsonpCallback + '(' + JSON.stringify(data) + ')');
        } else {
          res.contentType('json');
          res.send(data);
        }
      } else {  // csv
        res.contentType('text');
        res.send(data);
      }

    });
  });

  request.end();
};

/**
 * Call palo server with the url in options and a callback function
 */
var call = exports.call = function(options, callback) {
  if ('object' == typeof options) {
    options = options || {};
  } else if (options) {
    options = { url: options };
  } else {
    options = {};
  }

  var host = options.host || defaults.host
    , port = options.port || defaults.port
    , server = { host: host, port: port }
    , urlPrefix = options.urlPrefix || defaults.urlPrefix
    , format = options.format || defaults.format
    , url = options.url;

  //  options.doCallback = options.doCallback || true;
  //options.format = options.format || 'json';
  //  options.useCache = options.useCache || defaults.useCache;
  
  get(null, null, callback, options);
}



/**
 * This will parse a delimited string into an array of
 * arrays. The default delimiter is the comma, but this
 * can be overriden in the second argument.
 */
var csvToArray = exports.csvToArray = function csvToArray( strData, strDelimiter ){
  // Check to see if the delimiter is defined. If not,
  // then default to semicolon.
  strDelimiter = (strDelimiter || ";");

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