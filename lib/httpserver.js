/*
 * Knotter HttpServer
 * 
 * @author Patrice FERLET
 * @license GPLv3
 * @module knotter
 */

var http = require('http');
var path = require('path');
var mime = require('mime');
var fs   = require('fs');
var url  = require('url');
var _ = require('underscore');
var sessions = require('sessions');
var handler = require('./handler');
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
    this.port = options['port'] || 8000;
    this.address = options['address'] || "127.0.0.1";
    this.handlers = [];
    this.sessionHandler = new sessions();

    if (options['config'] != undefined) {
        this.config = options['config'];
    }

    this.engine = false;
    if (options['engine'] != undefined) {
        this.template_root = options['templates'];

        try {
            require(options['engine']).init({
                root: this.template_root,
                allowErrors: true,
                autoescape: false
            });
        } catch (e) {
            console.warn(this.engine + " haven't init method. This may be normal...");
        }

        this.engine = consolidate[options['engine']];
    }

    if (options['handlers'] != undefined) {
        for (var i = 0; i < options.handlers.length; i++) {
            this.addHandler(options.handlers[i]);
        }
    }
    if (options['statics'] != undefined) {
        if (typeof(options["statics"]) == 'object' ){
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
 * @property {Array} handlers
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
Server.prototype._serveStatic = function (dir, _route){
    var route;
    if ( _route != undefined ) {
       route = _route;
    } else {
        dir = dir.replace(/^\/+/,'');
        dir = dir.replace(/\/+$/,'');
        route = dir;
    }

    var h = new handler.Handler({
        route: '^/'+route+'/(.*)',
        get: function (){
            var filename =  path.join(path.resolve(this.directory),
                this.params.args[1]);

            try {
                fs.realpathSync(filename);   
                var mimetype = mime.lookup(filename);
                var self = this;
                fs.readFile(filename, function (err, data){
                    if (err) {
                        console.log(err);
                        self.response.writeHead(500);
                        self.response.end("Error 500" + err);
                        return;
                    }

                    self.response.writeHead(200, {
                        'Content-Type' : mimetype,
                        'Content-Length' : data.length
                    });

                    self.response.end(data);
                });
            }
            catch(e){
                console.log(e);
                this.response.writeHead(404, "Not found");
                this.response.end("404 Not found");
                return;
            }


        }
    });
    h.directory = dir;
    this.addHandler(h);
};

/**
 * Add Handler in server registry
 *
 * @method addHandler
 * @param {knotter.Handler} handler
 */
Server.prototype.addHandler = function (handler){
    handler.__reg = new RegExp(handler.route);
    handler.config = this.config;
    if (this.engine) {
        //define render method to use engine
        var self = this;
        handler.render = function (template, context){
            var h = this;
            self.engine(self.template_root+'/'+template, context, function (err, html){
                if(err) console.log(err);
                h.response.end(html);
            });
        }
    }
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
    for (i in this.handlers) {
        var params = null;
        if ((params = query.pathname.match(this.handlers[i].__reg))) {
            var method = req.method.toLowerCase();
            // to not interact on same request/result while
            // working on simulatneous connections
            var handler = _.clone(this.handlers[i]);
            if (handler[method]) {
                handler.response = res;
                handler.request = req;
                handler.params.args = params || [];
                handler.params.get  = query.query || {};

                if (method != "get") {
                    //should try to get post data
                    var body = "";
                    var self = this;
                    req.on('data', function (data){
                       body += data;
                    });
                    req.on('end', function (){
                        handler.postdata = qs.parse(body);
                        if (handler.useSessions) {
                            this.sessionHandler.httpRequest(req, res, function (err, session){
                                handler.sessions = session;
                                handler[method]();
                            });
                        }
                        else {
                            handler[method]();
                        }
                    });
                } else {
                    // GET cannot have some postdata, direct response
                    if (handler.useSessions) {
                        this.sessionHandler.httpRequest(req, res, function (err, session){
                            handler.sessions = session;
                            handler[method]();
                        });
                    }
                    else {
                        handler[method]();
                    }
                }
                return;
            }
        }
    }
    res.writeHead(404, "Not found");
    res.end();
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
    this.server = http.createServer(function (req, res){
        self.handle(req, res);
    });
    this.server.listen(this.port, this.address);
    console.log("Server listening on "+this.address+":"+this.port);
};


/**
 * Alias to `serve` method
 *
 * @method start
 * @alias serve
 */
Server.prototype.start = function (){
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
