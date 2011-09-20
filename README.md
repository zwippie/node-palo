# palo client for node.js

_Note: this document is just a draft, actual coding is still in an early stage._

Node_palo is a database module for [node.js](http://nodejs.org) that connects to a Palo database server.
It's easy to implement in a project with middleware like [express](http://expressjs.com/) to create
(single page) webapplications aimed at data analysis, budgetting or reporting.

Features include:

* Act as a proxy to a palo server, allowing access on any http port
* Conversion of CSV server results to JSON objects, with optional column mapping
* Custom authentication and authorization (ACL)
* Create custom methods to build complex datastructures serverside, then send to client


## What is Palo?

[Jedox Palo](http://www.jedox.com) is an in memory online analytical processing (MOLAP) database that is
available with both an open source and a commercial license. Node_palo is tested
with a default compile of the latest open source version of [Palo](http://sourceforge.net/projects/palo).


## Usage

Test from a node console:

    var palo = require('palo');
    var paloUrl = 'http://localhost:7777/server/login?user=test&password=test';
    palo.call(paloUrl, console.log);
    
Result:
    { success: true,
        data: [ [ 'HJvn', '3600' ] ],
        statusCode: 200,
        headers: { 'x-palo-sv': '1977569839' }
    }

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