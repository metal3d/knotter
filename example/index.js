/**
 * Example of knotter usage
 *
 */

// outside example, use require('knotter')
var knotter = require('../index');
var util    = require('util')

/**
 * A test handler
 */
function TestHandler(){
    knotter.Handler.call(this);
}


util.inherits(TestHandler, knotter.Handler);


TestHandler.prototype.route = "^/page/test";

TestHandler.prototype.get = function (){
    this.write("hello on page 1");
    this.end();
};



var server = new knotter.Server({
    handlers : [TestHandler],
    statics : {"styles": "example/css"}
});

server.serve();
