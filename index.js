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
 * @author Patrice FERLET
 * @licence GPLv3
 */

var http = require('./lib/httpserver.js');
var handler = require('./lib/handler.js');

module.exports = {
    Server: http.Server,
    Handler: handler.Handler
};
