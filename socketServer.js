var socketServer = function() {
    var data = null,
    timerID = null,
    sockets =[],
    socketServer = null, 
    /* Add module imports here */
    ws = require('websocket.io'), 
    http = require('http'),
    fs = require('fs'),
    url = require('url'),
    domain = require('domain'),
    reqDomain = domain.create(),
    socketDomain = domain.create(),
    httpDomain = domain.create(),

    httpListen = function(port) {
        httpDomain.on('error', function(err) {
            console.log('Error caught in http domain:' + err);
        });

        httpDomain.run(function() {
            http.createServer(function(req,res) {
                var pathname = url.parse(req.url).pathname;
                console.log(pathname);
                if (pathname == '/' || pathname == '/index.html') {
                    readFile(res, 'index.html');
                }
                else {
                    readFile(res, '.' + pathname);
                }
            }).listen(port, "0.0.0.0");
        });
    },

    readFile = function(res, pathname) {
        fs.readFile(pathname, function (err, data) {
            if (err) {
                console.log(err.message);
                res.writeHead(404, {'content-type': 'text/html'});
                res.write('File not found: ' + pathname);
                res.end();
            }
            else {
              res.write(data);
              res.end();
            }
        });       
    },

    socketListen = function(port) {
        socketDomain.on('error', function(err) {
            console.log('Error caught in socket domain:' + err);
        });

        socketDomain.run(function() { 
            socketServer = ws.listen(port);

            socketServer.on('listening',function(){
                console.log('SocketServer is running');
            });

            socketServer.on('connection', function (socket) {

                console.log('Connected to client');
                sockets.push(socket);
                if (data == null) getPixData();

                socket.on('message', function (data) { 
                    console.log('Message received:', data);
                });

                socket.on('close', function () {


                    try {
                        socket.close();
                        socket.destroy();
                        console.log('Socket closed!');                       
                        for (var i = 0; i < sockets.length; i++) {
                            if (sockets[i] == socket) {
                                sockets.splice(i, 1);
                                console.log('Removing socket from collection. Collection length: ' + sockets.length);
                                break;
                            }
                        }
                        
                        if (sockets.length == 0) {
                            clearInterval(timerID);
                            data = null;
                        }
                    }
                    catch (e) {
                        console.log(e);
                    }
                });

            });  
        });      
    },

    init = function(httpPort, socketPort) {
        httpListen(httpPort);
        socketListen(socketPort);
    };

    return {
        init: init
    };
}();

module.exports = socketServer;


