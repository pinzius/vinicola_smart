//const Arduino = require('./Arduino');
const Store = require('./Store');
const config = require('./config');

const WebSocketServer = require('websocket').server;
const http = require('http');
const path = require('path');
const bodyParser = require('body-parser');
const express = require('express');
const cors = require('cors');
const hbs = require('hbs');
const fs = require('fs');
const datatable = require('datatables.net');

const app = express();

//const arduino = new Arduino();
const store = new Store();


app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use(express.static(__dirname + '/views/css'));
app.use(express.static(__dirname + '/views/js'));
app.use(express.static(__dirname + '/lib'));
app.use(express.static(__dirname + '/node_modules'));

hbs.registerPartials(path.join(__dirname, 'views', 'partials'));
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'))

hbs.registerHelper("parseDate", function(ts) {
    let date = new Date(ts);
    return `${date.getDate()}/${date.getMonth()+1}/${date.getFullYear()} ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`
});
hbs.registerHelper("orderDate", function(ts) {
    let date = new Date(ts);
    return `"${date.getFullYear()}/${date.getMonth()}/${date.getDate()}"`;
});
hbs.registerHelper("log", function(something) {
    console.log(something);
});

//-------------------NODE SERVER----------------------------

app.get('/', async(req,res)=>{
    res.render('index');
});

app.get('/getDataGroupHour', async(req,res)=>{
    const sensor = await store.getDataGroupHour();

    res.send({info: JSON.stringify(sensor), success:true});
});

app.get('/tab_sensors', async (req,res)=>{
    const data = await store.getAllSensor();

    res.locals = data;
    res.render('tab_sensors');
});

app.get('/tab_values', async(req,res)=>{
    const data = await store.getAllValue();

    res.locals = data;
    res.render('tab_values');
});

app.get('/tab_wines', async(req,res)=>{
    const data = await store.getAllWine();

    res.locals = data;
    res.render('tab_wines');
});

app.listen(config.node_port, config.ip, function () {
    console.log(`Node vinicola listening on ${config.node_port}`);
});


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
            let infos = (message.utf8Data).split('-');
            store.addValue(parseInt(infos[0]),parseFloat(infos[1]),parseFloat(infos[2]),parseFloat(infos[3]))
            clients.forEach(client => {
              client.send('New data');
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
