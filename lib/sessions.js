/**
 * Session memory storage, ease interprocess session management.
 * This module tries to be as efficient as possible to interconnect
 * several servers that runs with cluster module.
 *
 * Cluster parent *must* implement a main message getter to resend to child
 * processes.
 *
 * @example
 *      
 *      var cluster = require('cluster');
 *
 *      if (cluster.isParent) {
 *
 *          var workers = []
 *
 *          for (var i = 0; i < numCPUs; i++) {
 *              //launch a subprocess
 *              var n = cluster.fork();
 *              workers.push(n);
 *              //when a child process send message
 *              //then give message to others
 *              n.on('message', function (m) {
 *                  for(var i in workers) {
 *                      workers[i].send(m);
 *                  }
 *              });
 *           }
 *
 *      } else {
 *          //on child process, launch server
 *          require('./server');
 *      }
 *
 */


/**
 * Session class will be instanciated in knotter.httpserver constructor
 *
 */
function Session() {

    this.memory = {};
    var self = this;
    

    // other session connected to the process sent a message
    // that hold sessions_vars
    process.on('message', function (m){
        try { 
            m = JSON.parse(m);
            if (m.hasOwnProperty('m') && m.m=='session') {
                console.log("From child process, session sent ! :: " + JSON.stringify(m))
                for (var i in m.s) {
                    self.memory[i] = m.s[i]
                }
                console.log(self.memory);
            }
        } catch(e) {
        
        }
    });

}

Session.prototype.set = function (handler ,key, val){
    
    console.log(handler.request.headers.cookie);
    var cookies = this.getCookies(handler);
    var uid = cookies['SESSID'];

    this.save(uid, key, val)

}


/**
 * Save the value inside memory. Because the Session class
 * will have message, we can only send message to children
 * Then, this object will have the value
 */
Session.prototype.save = function (uid, key, val) {
    var obj = {m: 'session', s:{}};
    obj.s[uid] = {}
    obj.s[uid][key] = val;

    process.send(JSON.stringify(obj));
}

/**
 * Get the value for the good SESSID that is found
 * in cookies. If not, return null
 *
 */
Session.prototype.get = function (handler, key) {
    var cookies = this.getCookies(handler);
    if (cookies['SESSID']){
        try {
            return this.memory[cookies['SESSID']][key];
        }
        catch(e){}
    }
    return null;
}

/**
 * Internal function that parse cookies
 *
 */
Session.prototype.getCookies = function (handler){
    var cookies = {};
    try {
        handler.request.headers.cookie.split(";").forEach(function (c) {
            var cookie = c.split("=", 2)
            cookies[cookie[0].trim()] = cookie[1].trim() || true;
        });
    } catch (e) {}
    console.log(cookies)
    if (!cookies['SESSID']) {
        var uid = String(Math.random()).substr(2) + String(Math.random()).substr(2);
        cookies["SESSID"]=uid;
    }
    
    var setcookies = [];
    for (v in cookies) {
        setcookies.push(v+"="+cookies[v]);
    }
    handler.response.setHeader('Set-Cookie', setcookies.join('; '));
    
    return cookies;
}

module.exports = Session
