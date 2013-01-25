/**
 * Knot module
 *
 * @author Patrice FERLET
 * @licence GPLv3
 *
 */

var http = require('./libs/httpserver.js');
var handler = require('./libs/handler.js');

module.exports = {
    Server: http.Server,
    Handler: handler.Handler
};
