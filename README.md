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
var Page1Handler = new knotter.Handler({
  route: '/page1',
  useSessions: false, //if true, this.sessions can be used to get values
  get: function (){
    // there you can get: this.sessions, this.response, this.request
    // and this.params.args (ordered from captured regexp if any)
    // and this.params.get (given by ?arg=value&arg2=value2...)
    // 
    // you can write response with this.end("Text to send to client");
    // or render a template: this.render('path to template', context_object)
    
    this.response.end("Welcome on page 1 !");
  },
  
  post: function() {
   // handler POST, you can access this.XXX like on GET method
   // and this.postdata !
   console.log(this.postdata);
   this.response.end("post data ok");
   
  }
});


var server = knotter.Server({
  handlers : [Page1Handler], //list of handlers,
  statics : ['css', 'js'], // directory names to be served statically
  // you can pass "address" option to set listening address
  // address : "0.0.0.0" to listen on every interfaces
});

server.serve(); //default listen on 127.0.0.1:8000 (open 127.0.0.1:8000/page1 to check result)
```


## Note on Template Engine

I love swig because it's very close to Jinja, it's fast, simple and very intuitive. If you want to use other template engine, don't set "templates" option on Server. This way, knotter will not initialize swig and you are free to use your prefered template engine as Jade.

## Changelog

0.0.3
-  remove swig template engine, to let developper use its prefered engine.

## About File upload, forms...

At this time, I didn't found any "nice" way to setup a file uploader. "Nice" means:
- having a simple interface to save file to a "upload" directory
- having a method to give upload progress
- no soucy with rights, mimetype, form encoding...

I guess I will implement "formidable" module to manage forms... One more time, I'm open to discuss about.
