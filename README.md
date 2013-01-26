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

//handler should serve get, post, put, delete requests
//you only have to implement route (as regexp) with right name
var Page1Handler = new knotter.handler({
  route: '/page1',
  get: function (){
    // there you can get: this.sessions, this.response, this.request
    // and this.params (ordered from captured regexp if any)
    // you can write response with this.end("Text to send to client");
    // or render a template: this.render('path to template', context_object)
    
    this.response.end("Welcome on page 1 !");
  }
});


var server = knotter.Server({
  handlers : [Page1Handler], //list of handlers,
  statics : ['css', 'js'], // directory names to be served statically
  templatess: './content/templates' // directory where templates can be found
  // you can pass "address" option to set listening address
  //address : "0.0.0.0" to listen on every interfaces
});

server.serve(); //default listen on 127.0.0.1:8000 (open 127.0.0.1:8000/page1 to check result)
```
