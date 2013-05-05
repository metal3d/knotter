/**
 * Knotter module. This is a simple module that use a pseudo WSGI
 * architechture. You only have to set some knotter.Handler given route and methods
 * (get: function (){...}) then append them to knotter.Server.
 *
 * After calling "start" method, each of your handlers will respond to url that match
 * route.
 *
 * Example:
 *
 *     var knotter = require('knotter');
 *
 *     var h = new knotter.Handler({
 *          route: '/my/page',
 *
 *          get: function (){
 *              this.response.end("This is my page");
 *          }
 *     });
 *
 *     var s = new knotter.Server({
 *          handlers: [h], //list of handlers
 *     });
 *
 *     s.start()
 *
 * @module knotter
 * @main knotter
 * @author Patrice FERLET
 * @licence GPLv3
 */

var http = require('./lib/httpserver');
var handler = require('./lib/handler');
var session = require('./lib/sessions');
var cluster = require('./lib/clusterutils');
var util    = require('util');

// Basic helpers

/**
 * Create an Handler that is ready to be prototyped. Keep in mind that you
 * *must* work with "prototype"
 *
 * @param {object} optionnal prototype
 * @return {Class} handler
 */
function createHandler(proto) {

    // a constructor
    function newHandler() {
        handler.Handler.call(this);
    }

    // inherits from knotter.Handler
    util.inherits(newHandler, handler.Handler);

    // append prototype if given    
    if (proto) {
        for (var i in proto) {
            newHandler.prototype[i] = proto[i];
        }
    }

    return newHandler;
}

/**
 * Returns a ready server
 *
 * @params {Object} params
 * @return {Server} server
 */
function createServer(opts) {
    return new http.Server(opts);
}


module.exports = {
    Server: http.Server,
    Handler: handler.Handler,
    Session: session,
    Cluster: cluster,
    createHandler: createHandler,
    createServer: createServer
};
