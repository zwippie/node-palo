# PALO client for node.js

Node_palo is a database module that connects to a Jedox PALO OLAP (online
analytical processing) database server. Designed for use with [node.js](http://nodejs.org),
it's easy to implement in a project with middleware like [express](http://expressjs.com/) to create
(complex ajax driven) webapplications aimed at data analysis or reporting.

Jedox PALO is an in memory online analytical processing (MOLAP) database that is
available with both an open source or a commercial license. Node_palo is tested
with a default compile of the latest open source version of [PALO](http://sourceforge.net/projects/palo).


## Usage

Node_palo is pretty straightforward. In it's basic form you only supply a URL
for the palo server:

    var palo = require('palo');
    paloUrl = 'http://localhost:7777/server/login?user=test&password=test';
    palo.get(paloUrl);

Output:

    0GTs;3600;

To get the result as an array:

    palo.get(paloUrl, function(paloResult) {
      console.log(palo.CSVToArray(paloResult, ";"));
    });

Output:

    [ [ '93bn', '3600' ] ]

TODO: Show usage with node htpp or express


## TODO

* Create parameter bindings for the server results
* Options for palo.get

Eventually:

* Create another project called palo\_explorer which offers a nice web UI for palo
server administration; build on express, node_palo, ?


## Documentation