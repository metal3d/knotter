/**
 * Knotter HttpServer
 * 
 * @author Patrice FERLET
 * @license GPLv3
 * @module knotter/httpserver
 */

var http = require('http');
var path = require('path');
var mime = require('mime');
var util = require('util');
var fs   = require('fs');
var url  = require('url');
var _ = require('underscore');
var sessions = require('./sessions');
var handlerModule = require('./handler');
var qs = require('querystring');
var consolidate = require('consolidate');

/**
 * Server is HTTP Server. To be used, prepare some handlers then
 * call constructor with options as:
 *
 * - handlers: Array of handlers
 * - statics: Array or Object to map some directory as static container
 * - port: to listen
 * - address: ...
 *
 * @class Server
 * @constructor
 * @param {Object} options (port, handlers, statics...)
 * @todo manage https
 * @example
 *
 *      var s = new knotter.Server({
 *          handlers: [hdl1, hdl2],
 *          statics: {'styles': 'css/directory/'},
 *          address : '0.0.0.0',
 *          port    : 8080
 *      });
 */
var Server = function (options) {
    this.port = options.port || 8000;
    this.address = options.address || "127.0.0.1";
    this.handlers = [];
    this.sessionHandler = sessions;

    if (options.config !== undefined) {
        this.config = options.config;
    }

    this.engine = false;
    var i = 0;
    if (options.engine !== undefined) {
        this.template_root = options.templates;
        try {
            var opts = options.engineOptions || {};
            require(options.engine).init(opts);
        } catch (e) {
            console.warn(this.engine + " haven't init method. This may be normal...");
        }

        this.engine = consolidate[options.engine];
    }

    if (options.handlers !== undefined) {
        for (i = 0; i < options.handlers.length; i++) {
            this.addHandler(options.handlers[i]);
        }
    }
    if (options.statics !== undefined) {
        if (typeof(options.statics) === 'object') {
            for (i in options.statics) {
                this._serveStatic(options.statics[i], i);
            }

        } else {
            for (i in options.statics) {
                this._serveStatic(options.statics[i]);
            }
        }
    }
};

/**
 * Port to listen
 *
 * @property {int} port
 * @default 8000
 */
Server.prototype.port = 8000;


/**
 * Address to listen
 *
 * @property {String} address
 * @default 127.0.0.1
 */
Server.prototype.address = "127.0.0.1";

/**
 * Session Handler, from "sessions" module
 *
 * @property {sessions.Session} sessionHandler
 */
Server.prototype.sessionHandler = null;


/**
 * Handlers container, keep list of knotter.Handler.
 * To handler handlers, append them to constructor option and/or
 * use addHandler method.
 *
 * @see Server.addHandler
 * @property {Array} handlers structures
 *
 */
Server.prototype.handlers = [];


/**
 * Add handler to serve static files. 
 *
 *
 * @method _serveStatic
 * @private
 * @param {String} directory
 * @param {String} _route (optional, if not given, _route will match directory)
 */
Server.prototype._serveStatic = function (dir, _route) {
    var route;
    if (_route !== undefined) {
        route = _route;
    } else {
        dir = dir.replace(/^\/+/, '');
        dir = dir.replace(/\/+$/, '');
        route = dir;
    }

    function h() {
        handlerModule.Handler.call(this);
    }
    util.inherits(h, handlerModule.Handler);
    h.prototype.route = '^/' + route + '/(.*)';
    h.prototype.directory = dir;
    h.prototype.get = function () {
        var filename =  path.join(path.resolve(this.directory), this.params.args[1]);
        var self = this;
        try {
            fs.realpathSync(filename);
            var mimetype = mime.lookup(filename);
            fs.readFile(filename, function (err, data) {
                if (err) {
                    console.log(err);
                    self.writeHead(500);
                    self.end("Error 500" + err);
                    return;
                }

                self.writeHead(200, {
                    'Content-Type' : mimetype,
                    'Content-Length' : data.length
                });

                self.end(data);
            });
        }
        catch (e) {
            console.log(e);
            self.writeHead(404, "Not found");
            self.end("404 Not found");
            return;
        }
    };
    this.addHandler(h);
};

/**
 * Add Handler in server registry
 *
 * @method addHandler
 * @param {struct} handler that represent what will be used in Handler constructor
 */
Server.prototype.addHandler = function (handler) {
    handler.__reg = new RegExp(handler.route);
    this.handlers.push(handler);
};


/**
 * Called on each request to get handler mapped to
 * the called route
 *
 * @method handle
 * @protected
 * @param {http.Request} request
 * @param {http.Response} response
 */
Server.prototype.handle = function (req, res) {
    var query = url.parse(req.url);
    var method = req.method.toLowerCase();
    var params = null;
    for (var i in this.handlers) {
        if ((params = query.pathname.match(this.handlers[i].prototype.route))) {
            // create new handler and start to respond to client
            if (this.handlers[i].prototype[method]) {
                return this.launchHandler(new this.handlers[i](), req, res, method, params, query);
            }
        }
    }
    res.writeHead(404, "Not found");
    res.end();
    return;
};

/**
 * Launch handler with given method. Initialize correct paramas, etc...
 *
 * @method launchHandler
 * @param {knotter.Handler} handler
 * @param {http.request} req
 * @param {http.response} res
 * @param {string} method
 * @param {object} params
 * @param {object} query
 */
Server.prototype.launchHandler = function (handler, req, res, method, params, query) {
    handler.config = this.config;

    if (this.engine) {
        //define render method to use engine
        var self = this;
        handler.render = function (template, context) {

            if (context === undefined) {
                context = {};
            }

            if (!context.hasOwnProperty('config')) {
                context.config = self.config;
            }

            self.engine(self.template_root + '/' + template, context, function (err, html) {
                if (err) {
                    console.log(err);
                }
                handler.end(html);
            });
        };
    }

    // set defautl header
    res.setHeader('Content-type', 'text/html');

    handler.response = res;
    handler.request = req;
    handler.initCookies();
    handler.session = new this.sessionHandler(handler);
    handler.params.args = params || [];

    //append get if any
    if (query && "query" in query) {
        handler.params.get = qs.parse(query.query);
    }

    //should try to get post data
    var form = new require('formidable').IncomingForm();
    form.parse(req, function (err, fields, files) {
        handler.params.post = { fields: fields, files: files};

        // keep compatibility with knotter <= 0.1.1
        handler.postdata = handler.params.post.fields;

        // call the method
        handler[method]();
    });
    return;
};


/**
 * Start to serve http
 *
 * @method serve
 * @uses http.Server
 */
Server.prototype.serve = function () {
    var self = this;
    this.server = http.createServer(function (req, res) {
        self.handle(req, res);
    });
    this.server.listen(this.port, this.address);
    console.log("Server listening on " + this.address + ":" + this.port);
};


/**
 * Alias to `serve` method
 *
 * @method start
 * @alias serve
 */
Server.prototype.start = function () {
    return this.serve();
};


/**
 * Config object (from server constructor params)
 *
 * @property {Object} config
 */
Server.prototype.config = null;

module.exports = {
    Server: Server
};
