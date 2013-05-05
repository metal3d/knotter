# knotter

knotter module is a nodejs middleware/microframework to create websites.

## Why not using connect ? express ?

I really love ExpressJS and Connect. But what I wanted to do was to implement a pseudo WSGI-like system. 
The main goal is to bundle some of my prefered modules in one place:

 - sessions - simple session management
 - swig for template engine
 - use mimetype, underscore, etc...

## How to use ?

At this time, you need to do some operation manually:
  
    cd /path/to/yor/working/directory
    npm install knotter

Then, you can implement your first appliction, create a "site.js" file:
```javascript    

var knotter = require('knotter');

/**
* Create your class that inherits from knotter.Handler
* createHandler helper does the work
*/
var Page1Handler = knotter.createHandler();

// define the route to respond (regexp)
// It is important that "route" is declared in prototype
Page1Handler.prototype.route = '/page1';

// Respond to "GET" requests
Page1Handler.prorotype.get = function (){
    // there you can get: this.sessions, this.response, this.request
    // and this.params.args (ordered from captured regexp if any)
    // and this.params.get (given by ?arg=value&arg2=value2...)
    // 
    // you can write response with this.end("Text to send to client");
    // or render a template: this.render('path to template', context_object)
    
    this.end("Welcome on page 1 !");
};


var server = knotter.createServer({
  handlers : [Page1Handler], //list of handlers classes,
  statics : {
    statics : 'staticdir',
    images  : 'imgdir'
  }, // directories to be served statically, eg. /images/test.png serves imgdir/test.png
  // you can pass "address" option to set listening address
  // address : "0.0.0.0" to listen on every interfaces
});

server.serve(); //default listen on 127.0.0.1:8000 (open 127.0.0.1:8000/page1 to check result)
```

Since 1.0.0 you can implement the whole prototype in createHandler() options:

```javascript

/**
* Create your class that inherits from knotter.Handler
* createHandler helper does the work
*/
var Page1Handler = knotter.createHandler({
    route : '/page1',
    get : function (){
        this.end("Welcome on page 1 !");
    }
});

```


## Methods in handlers

### GET parameters

You can access GET parameters with `this.params.get`

```javascript

// hit url /page/example?foo=bar&baz=1
this.params.get.foo // => "bar"
this.params.get.baz // => "1"

```

### url parameters

You can create parts of url to set parameters and get them in `this.params.args`:

```javascript
// handler route is: "^/user/\\d+/edit", hitting "/user/99/edit":

this.params.args[1] // => 99

```

### POST and Files

Knotter requires "formidable" since 1.0.0, you can use it to get POST vars and Files:

```javascript
// is your form send file in input named "myfile1", and another input type "text"
// named "myentry"

this.params.post.fields.myentry // => entry value
this.params.post.files.myfile1 // => that is an object containing:
{ 
    domain: null,
    _events: {},
    _maxListeners: 10,
    size: 655118,
    path: '/tmp/cfabc74d742ff63c890f7dfa8e348d93', // => file sent
    name: 'chess.png', // => real file name
    type: 'image/png', // => file type
    hash: null,
    lastModifiedDate: Sun May 05 2013 14:37:12 GMT+0200 (CEST),
    _writeStream: [Object]
}  

```

### other methods you can use

- this.setHeader(name, value): force an header to be set: this.setHeader('Content-Type', 'text/plain');
- this.writeHead(code [, reason], header): Append header, with code:
    this.writeHead(200, 'OK')
    or
    this.writeHead(200, {'Content-lenght': 1024, 'Foo':'Bar'})
- this.write([string]): write string, doen't close response, so you can continue to use write
- this.end([string]): write "string" if given, and close response => you must call this method to end you handler and let the client get response
- this.session.get(key): return session value or null
- this.session.set(key, value): write session key with given value (you must use this methode *before* sending something to client)
- and many more...

## Note on Template Engine

in 0.0.2, knotter could implement swig template engine. But we removed this options to let user using its own prefered template engine. Knotter goals is not to be a "full framework" and should stay "lightwave"

Now template engines are managed by the "consolidate" module. We only tested "swig" as engine and it works as expected. To use swig:

```javascript

var server = knotter.Server({
    //...
    engine: 'swig',
    templates: __dirname+"/templates",
    engineOptions: {
        root: __dirname+'/templates',
        allowErrors: true,
        autoescape: false,
        tzOffset: new Date().getTimezoneOffset(),
        cache: false
    }
});

```

Afterward, in handler, you can use:

```javascript

//...
// test.html should be in __dirname/templates directory
// ctx is an object that handle some vars you can
// use in template
this.render('test.html', ctx);

```


We will prepare a framework based on knotter that will implement some module as:
- blog
- cms
- comments


## Changelog

1.0.0
- New helpers: createHandler and createServer
- Fixed GET parameters that were not parsed

0.1.1
- Sessions are now fixed
- handlers are classes, see example

0.1.0
- Add session management and remove "sessions" external module
- Sessions are shared in cluster implementation, you should use knotter.Cluster.addWorker(...)
- Use consolidate module to implement several template engines
- Remove "new knotter.Handler" notion, you should only set handlers as structure (this may change or be improved later)
- new dependecy = uuid (to set cookie SESSID)
- todo: set session TTL and SESSID name editable
- Pleas use "this.write, this.end" and not "this.response.xxx" method now !

0.0.4
- documentation is better
- static files can now be mapped on other routes (see example)

0.0.3
-  remove swig template engine, to let developper use its prefered engine.

## About File upload, forms...

At this time, I didn't found any "nice" way to setup a file uploader. "Nice" means:
- having a simple interface to save file to a "upload" directory
- having a method to give upload progress
- no soucy with rights, mimetype, form encoding...

I guess I will implement "formidable" module to manage forms... One more time, I'm open to discuss about.
