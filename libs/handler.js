/**
 * Knot Handler
 *
 * @author Patrice FERLET
 * @licence GPLv3
 *
 */


/**
 * Handler that will match route to method
 * This is the class to implement on project
 * Minimu required is "route" and one of HTTP method
 * as get, post, put, delete...
 *
 * Handler has this properties to work:
 *  - params.args => that matches regexp on url
 *  - params.get => options given by ?argname=argvalue&...
 *  - postdata => object having post data
 *  - response => to write response
 *  - request => the current request
 *
 * @params options ({route:... , get: funtion(){}... }
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


module.exports.Handler = Handler;
