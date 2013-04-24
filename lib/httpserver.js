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
    this.port = options['port'] || 8000;
    this.address = options['address'] || "127.0.0.1";
    this.handlers = [];
    this.sessionHandler = sessions;

    if (options['config'] != undefined) {
        this.config = options['config'];
    }

    this.engine = false;
    if (options['engine'] != undefined) {
        this.template_root = options['templates'];
        try {
            var opts = options['engineOptions'] || {};
            require(options['engine']).init(opts);
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
Server.prototype._serveStatic = function (dir, _route){
    var route;
    if ( _route != undefined ) {
       route = _route;
    } else {
        dir = dir.replace(/^\/+/,'');
        dir = dir.replace(/\/+$/,'');
        route = dir;
    }

    var h = {
        route: '^/'+route+'/(.*)',
        directory : dir,
        get: function (){
            var filename =  path.join(path.resolve(this.directory),
                this.params.args[1]);

            var self = this;
            try {
                fs.realpathSync(filename);   
                var mimetype = mime.lookup(filename);
                fs.readFile(filename, function (err, data){
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
            catch(e){
                console.log(e);
                self.writeHead(404, "Not found");
                self.end("404 Not found");
                return;
            }


        }
    }
    this.addHandler(h);
};

/**
 * Add Handler in server registry
 *
 * @method addHandler
 * @param {struct} handler that represent what will be used in Handler constructor
 */
Server.prototype.addHandler = function (handler){
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
    for (i in this.handlers) {
        if ((params = query.pathname.match(this.handlers[i].__reg))) {
            // to not interact on same request/result while
            // working on simulatneous connections
            if (this.handlers[i][method]) {
                var handler = new handlerModule.Handler(this.handlers[i]); 
                handler.config = this.config;

                if (this.engine) {
                    //define render method to use engine
                    var self = this;
                    handler.render = function (template, context){

                        if(context === undefined) {
                            context = {};
                        }

                        if (!context.hasOwnProperty('config')){
                            context.config = self.config;
                        }

                        self.engine(self.template_root+'/'+template, context, function (err, html){
                            if(err) console.log(err);
                            handler.end(html);
                        });
                    }
                }

                handler.response = res;
                handler.request = req;
                handler.initCookies();
                handler.session = new this.sessionHandler(handler);
                handler.params.args = params || [];
                handler.params.get  = query.query || {};

                //should try to get post data
                var body = "";
                req.on('data', function (data){
                   body += data;
                });
                req.on('end', function (){
                    handler.postdata = qs.parse(body);
                    handler[method]();
                });
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
