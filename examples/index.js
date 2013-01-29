/**
 * Example of knotter usage
 *
 */

// outside example, use require('knotter')
var knotter = require('../index');


/**
 * Handler that can respond to /page1
 *
 */
var h1 = new knotter.Handler({
    route : '^/page1',

    get: function(){
       console.log("on page1, ok");
       this.response.end("done");
    }
    
});

/**
 * Handler that respond to /page/anything.../number
 * and can handle sessions
 *
 */
var h2 = new knotter.Handler({
    route : '^/page/(.+?)/(\\d+)',
    useSessions: true,

    get: function (){
        var ctx = {params: this.params.args};
        if (!this.sessions.get('count')) {
            this.sessions.set('count', 0);
        }
        this.sessions.set('count', this.sessions.get('count')+1);
        ctx.counter = this.sessions.get('count');
        console.log("on page with context, ok");
        this.response.end(JSON.stringify(ctx));
    }
});


var server = new knotter.Server({
    handlers : [h1, h2],
    statics : ['bootstrap', 'images']
});
server.serve();
