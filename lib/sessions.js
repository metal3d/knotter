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
 *
 *              //when a child process send message
 *              //then give message to others
 *              n.on('message', function (message){
 *                  // if message is not for session, exit function
 *                  if (!message.hasOwnProperty('message')) return;
 *
 *                  //child give a session update event, resend to 
 *                  //the all subprocesses
 *                  if (message.message == "session:update") {
 *                      for (var i in workers){
 *                          workers[i].send({
 *                              message: 'session:sync',
 *                              session: message.session
 *                          });
 *                      }
 *                  }
 *              });
 *          }
 *
 *      } else {
 *          //on child process, launch server
 *          require('./server');
 *      }
 *
 */


/**
 * Internal memory handler. Keep in mind that
 * module are statefull, so the session "memory" handler
 * will be the same for all Session instances
 */

var memory = {};

/**
 * TTL for session
 */

var TTL = 60*60;

/**
 * When process send a message to synchronize session
 * object, we should update memory var
 */

process.on('message', function (message){
    if (!message.hasOwnProperty('message')) return;

    // synchronize memory
    if (message.message == 'session:sync') {
        for (var uid in message.session) {
            var val = message.session[uid].session;
            if (!memory.hasOwnProperty(uid)) {
                memory[uid]= {
                    ttl: new Date().getTime() + (TTL*1000),
                    session: val
                }
            } else {
                for (var key in val) {
                    memory[uid].session[key] = val[key]
                }
            }
        }
        return;
    }

    // session expired
    if (message.message == 'session:delexpires') {
        delete(memory[message.uid]);
        return;
    }
});

function checkTTL(){
    ttlcheckerstarted = true;
    var d = new Date().getTime();
    for (var s in memory) {
        var sess = memory[s];
        if (sess.ttl < d) {
            try {
                process.send({
                    message: 'session:expires',
                    uid: s
                });
            } catch(e) {
                console.log("process.send in session: 109 => "+e.message)
            }
        }
    }
}
setInterval(checkTTL, 1000);



/**
 * Session class will be instanciated in knotter.httpserver constructor
 *
 */
function Session(handler) {
    this.handler = handler;
}

/**
 * Set a session value for given key
 *
 * @param {String} key
 * @param {any} val
 */
Session.prototype.set = function (key, val){
    
    var cookies = this.getCookies();
    var uid = cookies['SESSID'].split(';')[0];

    //memory should have uid key, getCookies initialized this
    memory[uid].session[key] = val;
    memory[uid].ttl = new Date().getTime() + (TTL*1000);

    //synchronize with cluster
    this.save()
    this.handler.sendCookies()

}


/**
 * Save the value inside memory. Because the Session class
 * will have message, we can only send message to children
 * Then, this object will have the value
 *
 * @scope private
 */
Session.prototype.save = function () {
    try {
        process.send({
            message:'session:update', 
            session: memory
        });
    } catch(e) {
    
    }
}

/**
 * Get the value for the good SESSID that is found
 * in cookies. If not, return null
 *
 * @param {String} key
 * @returns {any} value  (null if not set)
 */
Session.prototype.get = function (key) {

    var cookies = this.getCookies();
    try {
        memory[cookies['SESSID']].ttl = new Date().getTime() + (TTL*1000);
        return memory[cookies['SESSID']].session[key]
    } catch (e) {
        return null;
    }
}

/**
 * Internal function that parse cookies
 *
 * @scope private
 */
Session.prototype.getCookies = function (){


    var uid = require('uuid').v4();
    if (!this.handler.cookies['SESSID']) {
        this.handler.cookies["SESSID"]=uid;
    }
    else {
        uid = this.handler.cookies['SESSID']; 
    }

    if (!memory.hasOwnProperty(uid)) {
        memory[uid] = {ttl: 0, session: {}}
    }
    return this.handler.cookies;
}

module.exports = Session
