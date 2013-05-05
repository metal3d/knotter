/*
 * Knotter Handler
 *
 * @author Patrice FERLET
 * @licence GPLv3
 * @module knotter/handler
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
 */
var Handler = function () {
    this.response = null;
    this.request = null;
    this.cookies = {};
};

/**
 * Property that handle arguments (GET and url parts)
 *
 * @property {Object} params
 * @default {args: [], get: {}}
 */
Handler.prototype.params = {args: [], get: {}, post: {fields: null, files: null}};


/**
 * Postdata object that map datas sent via POST method
 * Since "formidable" module integration, this is an alias to 
 * this.params.post.fields
 *
 * @deprecated
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
 * PUT method handler, to be set if handler should respond
 * to PUT
 *
 * @method put
 * @default null
 */
Handler.prototype.put = null;

/**
 * DELETE method handler, to be set if handler should respond
 * to DELETE
 *
 * @method delete
 * @default null
 */
Handler.prototype['delete'] = null;

/**
 * HEAD method handler, to be set if handler should respond
 * to HEAD
 *
 * @method head
 * @default null
 */
Handler.prototype.head = null;

/**
 * Handler sessions.session to get/set values
 *
 * @property {Function} sessions
 * @throws Exception if useSessions is set to false
 */
Handler.prototype.sessions = function () {
    throw 'sessions not activated for this handler';
};

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

/**
 * Try to render given template with context. If no engine is configure
 * this method throws an exception
 *
 * @property {Function} render
 * @throws Exception if no engine
 */
Handler.prototype.render = function (template, context) {
	throw "No configured engine";
};

/**
 * Alias to the "write" response method
 *
 * @method write
 * @param {string} content
 */
Handler.prototype.write = function (content) {
    this.sendCookies();
	return this.response.write(content);
};

/**
 * Alias to the "end" response method
 *
 * @method end
 * @param {string} content
 */
Handler.prototype.end = function (content) {
	return this.response.end(content);
};

/**
 * Cookies that will be sent
 *
 * @property cookies
 */
Handler.prototype.cookies = {};


/**
 * Initialize cookies property to be simplier to 
 * manage
 *
 * This is a critical security point there, cookies MUST be empty here
 *
 * @method initCookies
 */
Handler.prototype.initCookies = function () {
    var self = this;
    this.cookies = {};
    try {
        this.request.headers.cookie.split(";").forEach(function (c) {
            var cookie = c.split("=", 2);
            self.cookies[cookie[0].trim()] = cookie[1].trim() || true;
        });
    } catch (e) {
        this.cookies = {};
    }
};


/**
 * Send cookies to the headers
 *
 * @method sendCookies
 */
Handler.prototype.sendCookies = function () {

    if (this.response.headersSent) {
        return;
    }
    try {
        var setcookies = [];
        for (var v in this.cookies) {
            setcookies.push(v + "=" + this.cookies[v] + '; path=/');
        }
        this.response.setHeader('Set-Cookie', setcookies);
    } catch (e) {
    }
    this.cookies = null;

};

/**
 * Set header on response. This is an alias to http.response.setHeader
 *
 * @params {String} headername
 * @params {String} value
 */
Handler.prototype.setHeader = function (name, value) {
    this.response.setHeader(name, value);
};

/**
 * Write header 
 *
 * @method writeHead
 */
Handler.prototype.writeHead = function (code, headers) {
    var c = code;
    var h = null;
    if (arguments.length < 2) {
        h = {};
    } else {
        h = headers;
    }

    this.response.setHeader('Connection', 'close');
    if (this.cookies !== {}) {
        this.sendCookies();
    }
    this.response.writeHead(c, h);


};

module.exports.Handler = Handler;
