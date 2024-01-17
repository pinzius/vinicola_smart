const Arduino = require('./Arduino');
const Store = require('./Store');
const config = require('./config');

const WebSocketServer = require('websocket').server;
const http = require('http');
const path = require('path');
const bodyParser = require('body-parser');
const express = require('express');
const cors = require('cors');
const app = express();

const arduino = new Arduino();
const store = new Store();

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.set('view engine', 'ejs');
app.use(express.static('files'));
app.use(express.static('js'));
app.use(express.static('lib'));

//--------------WS SERVER--------------------------------

const server = http.createServer(function(request, response) {
    console.log((new Date()) + ' Received request for ' + request.url);
    response.writeHead(404);
    response.end();
});
server.listen(config.ws_port, function() {
    console.log((new Date()) + ` WS listening on ${config.ws_port}`);
});
wsServer = new WebSocketServer({
    httpServer: server,
    // You should not use autoAcceptConnections for production
    // applications, as it defeats all standard cross-origin protection
    // facilities built into the protocol and the browser.  You should
    // *always* verify the connection's origin and decide whether or not
    // to accept it.
    autoAcceptConnections: false
});

function originIsAllowed(origin) {
  // put logic here to detect whether the specified origin is allowed.
  return true;
}

const clients = [];
wsServer.on('request', function(request) {
    if (!originIsAllowed(request.origin)) {
      // Make sure we only accept requests from an allowed origin
      request.reject();
      console.log((new Date()) + ' Connection from origin ' + request.origin + ' rejected.');
      return;
    }
    
    const connection = request.accept('echo-protocol', request.origin);
    clients.push(connection);
    console.log((new Date()) + ' Connection accepted.');
    connection.on('message', function(message) {
        if (message.type === 'utf8') {
            console.log('Received Message: ' + message.utf8Data);
            clients.forEach(client => {
              client.send(message.utf8Data);
            });
        }
        else if (message.type === 'binary') {
            console.log('Received Binary Message of ' + message.binaryData.length + ' bytes');
            connection.sendBytes(message.binaryData);
        }
    });
    connection.on('close', function(reasonCode, description) {
        console.log((new Date()) + ' Peer ' + connection.remoteAddress + ' disconnected.');
    });
});


//-------------------NODE SERVER----------------------------



app.listen(config.node_port, config.ip, function () {
    console.log(`Node vinicola listening on ${config.node_port}`);
});