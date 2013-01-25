var knot = require('knot');

var h1 = new knot.Handler({
    route : '/page1',

    get: function(){
       console.log("on page1, ok");
       this.response.end("done");
    }
    
});

var h2 = new knot.Handler({
    route : '/page/(.+?)/(\\d+)',

    get: function (){
        var ctx = {params: this.params};
        if (!this.sessions.get('count')) {
            this.sessions.set('count', 0);
        }
        this.sessions.set('count', this.sessions.get('count')+1);
        ctx.counter = this.sessions.get('count');
        this.render("page.html", ctx);
    },

    'delete': function () {
        console.log("delete...");
        this.response.end();
    }
});


var server = new knot.Server({
    handlers : [h1, h2],
    templates: 'templates',
    statics : ['bootstrap', 'images']
});
server.serve();
