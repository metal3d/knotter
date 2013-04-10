/*
 * Knotter Handler
 *
 * @author Patrice FERLET
 * @licence GPLv3
 * @module knotter
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
    this.directory = options['directory'] || "";
};

/**
 * Property that handle arguments (GET and url parts)
 *
 * @property {Object} params
 * @default {args: [], get: {}}
 * @example
 *
 *      var h = new knotter.Handler({
 *          route: '/article/(.*?)/(\\d+)',
 *          get: function (){
 *
 *              // get params captured by (.*?)
 *              var param1 = this.params.args[1];
 *
 *              //get params captured by (\d+)
 *              var param2 = this.params.args[2];
 *
 *
 *              //if there is ?foo=bar:
 *              var gets = this.params['get']
 *              console.log(gets['foo']); //writes "bar" on console
 *              this.response.end("ok")
 *          };
 *      })
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
 * @example
 * 
 *      var h = new knotter.Handler({
 *          useSessions: true,
 *          route: '/user',
 *
 *          get: function () {
 *              try {
 *                  //fetch "user" from session
 *                  var user = this.sessions.get('username')
 *                  if (user) {
 *                      this.response.write("Hi "+ user + "<br />");
 *                  }
 *              } 
 *              catch (e) {
 *                  //useSessions was set to false ?
 *                  console.log(e);
 *              }
 *              //anyway, show a form to set username
 *              this.response.write('<form action="">'
 *                      + 'Type username: <input type="text" name="user" />'
 *                      + '<input type="submit" value="send" /></form>');
 *              this.response.end();
 *
 *          },
 *          
 *          post: function () {
 *              //if get username from form
 *              if (this.postdata['user']) {
 *                  this.sessions.set('username', this.postdata['user']);
 *              }
 *
 *              //redirect to /user
 *              this.response.writeHead(302, {
 *                  'Location': '/user'
 *              });
 *              this.response.end();
 *          }
 *      })
 */
Handler.prototype.useSessions = false;



/**
 * Handler sessions.session to get/set values
 *
 * @property {Function} sessions
 * @throws Exception if useSessions is set to false
 */
Handler.prototype.sessions = function (){
    throw new Exception('sessions not activated for this handler');    
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
Handler.prototype.render = function (template, context){
	throw "No configured engine";
};

/**
 * Alias to the "write" response method
 *
 * @params {string} content
 */
Handler.prototype.write = function (content) {
	return this.response.write(content)
}
/**
 * Alias to the "end" response method
 *
 * @params {string} content
 */
Handler.prototype.end = function (content) {
    this.sendCookies();
	return this.response.end(content)
}

/**
 * Cookies that will be sent
 */
Handler.prototype.cookies = {}


Handler.prototype.initCookies = function (){
    var self = this;
    try {
            self.request.headers.cookie.split(";").forEach(function (c) {
                var cookie = c.split("=", 2)
                self.cookies[cookie[0].trim()] = cookie[1].trim() || true;
            });
    } catch (e) {
        self.cookies = {}
    }
}


/**
 * Send cookies to the headers
 */
Handler.prototype.sendCookies = function (){

    if (this.response.headersSent) return
    try {
        var setcookies = [];
        for (var v in this.cookies) {
            setcookies.push(v+"="+this.cookies[v]+'; path=/');
        }
        this.response.setHeader('Set-Cookie', setcookies);
    } catch(e) {
    }
};

Handler.prototype.writeHead = function (code, headers) {
    var c = code;
    var h = null;
    if (arguments.length <2 ){
        h = {}
    } else {
        h = headers
    }

    this.sendCookies()
    this.response.writeHead(c, h);


};


module.exports.Handler = Handler;
