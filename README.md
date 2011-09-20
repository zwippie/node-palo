# PALO client for node.js

Node_palo is a database module that connects to a Jedox PALO OLAP (online
analytical processing) database server. Designed for use with [node.js](http://nodejs.org),
it's easy to implement in a project with middleware like [express](http://expressjs.com/) to create
(single page) webapplications aimed at data analysis, budgetting or reporting.

Jedox PALO is an in memory online analytical processing (MOLAP) database that is
available with both an open source and a commercial license. Node_palo is tested
with a default compile of the latest open source version of [PALO](http://sourceforge.net/projects/palo).


## Usage

Create the most basic palo server proxy application

    var palo = require('palo');
    paloUrl = 'http://localhost:7777/server/login?user=test&password=test';
    palo.get(paloUrl);

Result:

    0GTs;3600;

To get the result as an array:

    palo.get(paloUrl, function(paloResult) {
      console.log(palo.CSVToArray(paloResult, ";"));
    });

Result:

    [ [ '93bn', '3600' ] ]

TODO: Show usage with node htpp or express


## TODO

* Create parameter bindings for the server results
* Options for palo.get
* Find caveats in palo server results. For some server methods the nr of columns
returned seem to vary. Parsing of results must be adapted accordingly.

Eventually:

* Create a jQuery plugin (jquery.palo.js) for the client side with convenient
ajax method, csv to json conversion and more
* Create another project called palo\_explorer which offers a nice web UI for palo
server administration; build on express, node_palo, ?
* Redis cache (palo-server has a cache token mechanism)
* Custom authentication and ACL (palo-acl can be cumbersome) to hide palo sid
from user (and cache the sid)

## Documentation