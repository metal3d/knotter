/**
 * Knotter Handler
 *
 * @author Patrice FERLET
 * @licence GPLv3
 *
 */


/**
 * Handler that will match route to method.
 * This is the class to implement on project.
 * Minimum required is "route" and one of HTTP method
 * as get, post, put, delete...
 *
 * Handler has this properties to work:
 *
 *  - params.args => that matches regexp on url
 *  - params.get => options given by ?argname=argvalue&...
 *  - postdata => object having post data
 *  - response => to write response
 *  - request => the current request
 *
 * @class Handler
 * @constructor
 * @param {Object} options ({route:... , get: funtion(){}... } 
 */
var Handler = function(options){
    this.params = {args: [], get: {}};
    this.postdata = null;
    this.route = options['route'];
    this.get = options['get'];
    this.post= options['post'];
    this.put= options['put'];
    this.useSessions = options['useSessions'] || false;
    this['delete']= options['delete'];
    this.__reg = null;
    this.response = null;
    this.request = null;
};

/**
 * Property that handle arguments (GET and url parts)
 *
 * @property {Object} params
 * @default {args: [], get: {}}
 */
Handler.prototype.params = {args: [], get: {}};


/**
 * Postdata object that map datas sent via POST method
 *
 * @property {Object} postdata
 */
Handler.prototype.postdata = null;

/**
 * Route to handle (regexp)
 * 
 * @property {String} route
 */
Handler.prototype.route = null;

/**
 * GET method handler, to be set if handler should respond
 * to GET
 *
 * @method get
 * @default null
 */
Handler.prototype.get = null;

/**
 * POST method handler, to be set if handler should respond
 * to POST
 *
 * @method post
 * @default null
 */
Handler.prototype.post = null;

/**
 * PUT method handler, to be set if handler should repond
 * to PUT
 *
 * @method put
 * @default null
 */
Handler.prototype.put = null;

/**
 * DELETE method handler, to be set if handler should repond
 * to DELETE
 *
 * @method delete
 * @default null
 */
Handler.prototype['delete'] = null;

/**
 * Boolean to enable session on handler. 
 *
 * @property {bool} useSessions
 * @default false
 */
Handler.prototype.useSessions = false;

/**
 * Response handler, object taken from http.Response
 *
 * @property {http.Response} response
 */
Handler.prototype.response = null;

/**
 * Request handler, object taken from http.Request
 *
 * @property {http.Request} request
 */
Handler.prototype.request = null;




module.exports.Handler = Handler;
