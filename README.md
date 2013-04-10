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


//handler should serve get, post, put, delete requests
//you only have to implement route (as regexp) with right name
var Page1Handler = {
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
};


var server = knotter.Server({
  handlers : [Page1Handler], //list of handlers structures,
  statics : ['css', 'js'], // directory names to be served statically
  // you can pass "address" option to set listening address
  // address : "0.0.0.0" to listen on every interfaces
});

server.serve(); //default listen on 127.0.0.1:8000 (open 127.0.0.1:8000/page1 to check result)
```


## Note on Template Engine

in 0.0.2, knotter could implement swig template engine. But we removed this options to let user using its own prefered template engine. Knotter goals is not to be a "full framework" and should stay "lightwave"

Now template engines are managed by the "consolidate" module. We only tested "swig" as engine and it works as expected. To use swig:

```javascript

var server = knotter.Server({
    //...
    engine: 'swig',
    templates: __dirname+"/templates"
    //...
});

```

Afterward, in handler, you can use:

```javascript

{ 
    get: function (){
        //...
        // test.html should be in __dirname/templates directory
        // ctx is an object that handle some vars you can
        // use in template
        this.render('test.html', ctx);
    }
}

```


We will prepare a framework based on knotter that will implement some module as:
- blog
- cms
- comments


## Changelog

0.1.0
- Add session management and remove "sessions" external module
- Sessions are shared in cluster implementation, you should use knotter.Cluster.addWorker(...)
- Use consolidate module to implement several template engines
- Remove "new knotter.Handler" notion, you should only set handlers as structure (this may change or be improved later)
- new dependecy = uuid (to set cookie SESSID)
- todo: set session TTL and SESSID name editable

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
