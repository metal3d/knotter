/**
 * Session memory storage, ease interprocess session management.
 * This module tries to be as efficient as possible to interconnect
 * several servers that runs with cluster module.
 *
 * Cluster parent *must* implement a main message getter to resend to child
 * processes.
 *
 * @licence GPLv3
 * @module knotter/sessions
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

var TTL = 60 * 30;

/**
 * When process send a message to synchronize session
 * object, we should update memory var
 */

process.on('message', function (message) {
    if (!message.hasOwnProperty('message')) { return; }

    // synchronize memory
    if (message.message === 'session:sync') {
        for (var uid in message.session) {
            var val = message.session[uid].session;
            if (!memory.hasOwnProperty(uid)) {
                memory[uid] = {
                    ttl: new Date().getTime() + (TTL * 1000),
                    session: val
                };
            } else {
                for (var key in val) {
                    memory[uid].session[key] = val[key];
                }
            }
        }
        return;
    }

    // session expired
    if (message.message === 'session:delexpires') {
        delete(memory[message.uid]);
        return;
    }
});

function checkTTL() {
    var d = new Date().getTime();
    for (var s in memory) {
        var sess = memory[s];
        if (sess.ttl < d) {
            try {
                process.send({
                    message: 'session:expires',
                    uid: s
                });
            } catch (e) {
                console.log("process.send in session: 109 => " + e.message);
            }
        }
    }
}
setInterval(checkTTL, 1000);



/**
 * Session class will be instanciated in knotter.httpserver constructor
 *
 * @class Session
 * @constructor
 */
function Session(handler, sessionname) {
    this.handler = handler;
    this.SSID = sessionname || "NODE_SSID";
}

/**
 * Set a session value for given key
 *
 * @method set
 * @param {String} key
 * @param {any} val
 */
Session.prototype.set = function (key, val) {

    var cookies = this.getCookies(true);
    var uid = cookies[this.SSID].split(';')[0];

    //memory should have uid key, getCookies initialized this
    memory[uid].session[key] = val;
    memory[uid].ttl = new Date().getTime() + (TTL * 1000);

    //synchronize with cluster
    this.save();

    // force send cookies to the client
    this.handler.sendCookies();

};


/**
 * Save the value inside memory. Because the Session class
 * will have message, we can only send message to children
 * Then, this object will have the value
 *
 * @method save
 * @scope private
 */
Session.prototype.save = function () {
    try {
        process.send({
            message: 'session:update',
            session: memory
        });
    } catch (e) {}
};

/**
 * Get the value for the good SESSID that is found
 * in cookies. If not, return null
 *
 * @method get
 * @param {String} key
 * @return {any} value  (null if not set)
 */
Session.prototype.get = function (key) {

    var cookies = this.getCookies();
    try {
        if (!cookies.hasOwnProperty(this.SSID)) {
            // user has not session activated yet
            return null;
        }
        memory[cookies[this.SSID]].ttl = new Date().getTime() + (TTL * 1000);
        return memory[cookies[this.SSID]].session[key];
    } catch (e) {
        return null;
    }
};

/**
 * Internal function that parse cookies, set handler cookies and returns cookies object
 *
 * @method getCookies
 * @param {Bool} init or not cookie
 * @scope private
 */
Session.prototype.getCookies = function (init) {
    init = init || false;
    var uid = null;

    if (!this.handler.cookies[this.SSID]) {
        // if no initialization needed, break
        if (!init) {
            return null;
        }

        // "set" method call getCookies with "init" to true
        // so we initialize uuid
        do {
            uid = require('uuid').v4();

        } while (memory.hasOwnProperty(uid));

        this.handler.cookies[this.SSID] = uid;
    }
    else {
        uid = this.handler.cookies[this.SSID];
    }

    if (!memory.hasOwnProperty(uid)) {
        memory[uid] = {ttl: 0, session: {}};
    }
    return this.handler.cookies;
};

module.exports = Session;
