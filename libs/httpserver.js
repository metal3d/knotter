/**
 * Knot HttpServer
 *
 * @author Patrice FERLET
 * @licence GPLv3
 *
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

/**
 * Server is HTTP Server
 *
 * @params options (port, handlers, statics...)
 * @todo manage https
 */
var Server = function (options) {
    this.port = options['port'] || 8000;
    this.address = options['address'] || "127.0.0.1";
    this.handlers = [];
    this.sessionHandler = new sessions();

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
 * Add handler to serve static files
 *
 * @params directory
 * @params _route (optional)
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
 */
Server.prototype.addHandler = function (handler){
    handler.__reg = new RegExp(handler.route);
    this.handlers.push(handler);
};


/**
 * Called on each request to get handler mapped to
 * the called route
 *
 * @params request
 * @params result
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
 */
Server.prototype.serve = function () {
    var self = this;
    this.server = http.createServer(function (req, res){
        self.handle(req, res);
    });
    this.server.listen(this.port, this.address);
    console.log("Server listening on "+this.address+":"+this.port);
};


module.exports = {
        Server: Server
};
