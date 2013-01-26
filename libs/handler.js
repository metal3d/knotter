/**
 * Knot Handler
 *
 * @author Patrice FERLET
 * @licence GPLv3
 *
 */

var swig = require('swig');


/**
 * Initialize template root
 *
 * @params options (from Server options)
 */
var initSwig = function (options){
    if (options['templates']) {
        swig.init({
           root: options.templates 
        });
    }
};

/**
 * Handler that will match route to method
 * This is the class to implement on project
 * Minimu required is "route" and one of HTTP method
 * as get, post, put, delete...
 *
 * @params options ({route:... , get: funtion(){}... }
 */
var Handler = function(options){
    this.params = {};
    this.route = options['route'];
    this.get = options['get'];
    this.post= options['post'];
    this.put= options['put'];
    this['delete']= options['delete'];
    this.__reg = null;
    this.response = null;
    this.request = null;
};

/**
 * Call swig to render response on a template
 *
 * @params template filename
 * @params context to set to template 
 */
Handler.prototype.render = function (tpl, ctx){
    var template = swig.compileFile(tpl);
    this.response.writeHead(200);
    this.response.end(template.render(ctx));
};


module.exports.Handler = Handler;
module.exports.init = initSwig;
