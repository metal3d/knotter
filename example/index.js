/**
 * Example of knotter usage
 *
 */

// outside example, use require('knotter')
var knotter = require('../index');
var util    = require('util');

/**
 * A test handler, example to use "prototype" argument to 
 * createHandler()
 */
var TestHandler = knotter.createHandler({
    route : "^/page/test",
    get : function () {
        this.write("hello on page 1");
        this.end();
    }
});
console.log(util.inspect(TestHandler));


// use "formidable" integration
// example with "prototype" set after getting
// class from createHandler()
var FormHandler = knotter.createHandler();
FormHandler.prototype.route = "^/page/form";
FormHandler.prototype.get = function () {
    this.write(util.inspect(this.postdata));
    this.end(
      '<form method="post" action="/page/form" enctype="multipart/form-data">' +
      '<input type="text" name="testfield1" /> ' +
      '<input type="file" name="filefield1" /> ' +
      '<input type="submit" value="Send" />'     +
      '</form>'
    );
};

FormHandler.prototype.post = function () {
    this.setHeader('Content-Type', 'text/plain');
    this.end(
        util.inspect(this.postdata) + util.inspect(this.params.post)
    );
};


// the server
var server = knotter.createServer({
    handlers : [TestHandler, FormHandler],
    statics : {"styles": "example/css"}
});

server.serve();
