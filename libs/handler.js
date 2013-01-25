var swig = require('swig');

var initSwig = function (options){
    if (options['templates']) {
        swig.init({
           root: options.templates 
        });
    }
};

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


Handler.prototype.render = function (tpl, ctx){
    var template = swig.compileFile(tpl);
    this.response.writeHead(200);
    this.response.end(template.render(ctx));
};


module.exports.Handler = Handler;
module.exports.init = initSwig;
