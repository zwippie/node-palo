/* 
 */

var palo = require('palo');
var async = require('async');

/** Shows information about the server. */
exports.buildTree = function(params, callback) {
  // The root of the tree
  var treeData = this.treeData = {
    data: "Local Database",
    attr: {id: "db_0", rel: "server/databases"},
    state: "open",
    children: []
  };

  // Get all databases
  palo.get('/server/databases?sid=' + params.sid, function(data) {
    // Populate tree with databases
    data = palo.CSVToArray(data, ";");

    // This function will create a database tree for a given database
    // and return it by its callback function
    var buildDatabaseTree = function(item, callback) {
      // create database element
      var dbEl = {
        'data': item[1],
        attr: {id: 'db_' + item[0], rel: "database/info"},
        children: [
          {
            'data': 'Dimensions',
            attr: {id: 'db_' + item[0] + '_dm_0', rel: "database/dimensions"},
            children: []
          },
          {
            'data': 'Cubes',
            attr: {id: 'db_' + item[0] + '_dm_0', rel: "database/cubes"},
            children: []
          },
        ]
      };

      // Load database dimensions and cubes in serie
      async.series([
        // Load the dimensions
        function(callback) {
          params.database = item[0];
          palo.get('/database/dimensions?' + palo.toQueryString({database: params.database, sid: params.sid}), function(data) {
            data = palo.CSVToArray(data, ";");
            // Create dimension elements
            for (var i = 0; i < data.length; i++) {
              dbEl.children[0].children.push({
                'data': data[i][1],
                attr: {id: 'db_' + item[0] + '_dm_' + data[i][0], rel: "dimension/info", 'class': 'dimension'},
                children: []
              });
            }
            // Wait for loading of dimensions before adding to tree
            callback(null, null);
          });
        },
        // Load the cubes
        function(callback) {
          params.database = item[0];
          palo.get('/database/cubes?' + palo.toQueryString({database: params.database, sid: params.sid}), function(data) {
            data = palo.CSVToArray(data, ";");
            for (var i = 0; i < data.length; i++) {
              dbEl.children[1].children.push({
                'data': data[i][1],
                attr: {id: 'db_' + item[0] + '_cb_' + data[i][0], rel: "cube/info"},
                children: []
              });
            }
            // All data loaded, return the new database element
            callback(null, dbEl);
          });
        }
      ],
      function(err, results) {
        callback(null, results);
      });
    }

    // Load all database data and wait for completion
    async.map(data, buildDatabaseTree, function(err, results) {
      this.treeData.children = results;
      callback(this.treeData);
    });
  });
  
} // end buildTree

