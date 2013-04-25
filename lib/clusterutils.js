/**
 * Module that ease session and cluster management. This add workers
 * to a stack that will handle session communication.
 *
 * TODO: Maybe send other elements to processes
 *
 */

/**
 * Remember that modules are statefull. So, this array will handler
 * every workers as long as the main process exists
 */
var workers = []

/**
 * Add a message event handler to send session
 * variable to the whole subprocesses
 *
 * @param {process.worker} worker that have to listen session messages
 */

function setMessageSender(worker) {
    workers.push(worker)
    worker.on('message', function (message){
        if (!message.hasOwnProperty('message')) return;
        if (message.message == "session:update") {
            for (var i in workers){
                workers[i].send({
                    message: 'session:sync',
                    session: message.session
                });
            }
            return;
        }
        if (message.message == "session:expires") {
            for (var i in workers){
                workers[i].send({
                    message: 'session:delexpires',
                    uid: message.uid
                });
            }
            return;
        }
    });
}

/**
 * Remove worker from stack, to do when process crashes for example
 *
 * @param {process.worker} worker to remove
 */
function removeWorker(worker) {
        //remove worker from workers
        var idx = workers.indexOf(worker);
        if (idx>-1) {
            workers.splice(idx, 1);
        }
}

/**
 * Append a worker to the stack
 *
 * @param {process.worker} worker to append
 */
function addWorker(worker) {
    setMessageSender(worker);
    workers.push(worker);
}


module.exports={
    handleSession : setMessageSender,
    removeWorker: removeWorker,
    addWorker: addWorker
};
