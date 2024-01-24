const Arduino = require('./Arduino');
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

const app = express();

const arduino = new Arduino();
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
    return `${date.getFullYear()}/${date.getMonth()}/${date.getDate()}/${date.getHours()}/${date.getMinutes()<10?('0'+date.getMinutes()):date.getMinutes()}/${date.getSeconds()}`;
});
hbs.registerHelper("confTemp", function(temp,t_temp) {
    if(temp<t_temp+1&&temp>t_temp-1)
        return true;
    return false;
});
hbs.registerHelper("confHum", function(hum,t_hum) {
    if(hum<t_hum+3&&hum>t_hum-3)
        return true;
    return false;
});
hbs.registerHelper("confLux", function(lux,t_lux) {
    if(lux<t_lux)
        return true;
    return false;
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

app.get('/getWines', async(req,res)=>{
    const data = await store.getAllWine();

    res.send({info: JSON.stringify(data), success:true});
});

app.get('/lastValue', async(req,res)=>{
    const data = await store.getLastData();

    res.send({info: JSON.stringify(data), success:true});
});

app.post('/updateSensor', async(req,res)=>{
    try{
        await store.updateSensor(req.body.sensor,req.body.wine);
        res.send({success: true});
    }catch(e){
        res.send({success: false});
    }
});

app.post('/addSensor', async(req,res)=>{
    try{
        await store.addSensor(req.body.wine);
        res.send({success: true});
    }catch(e){
        res.send({success: false});
    }
});

app.post('/updateWine', async(req,res)=>{
    try{
        await store.updateWine([req.body.name, req.body.t_hum, req.body.t_temp, req.body.t_lux,req.body.id]);
        res.send({success: true});
    }catch(e){
        res.send({success: false});
    }
});

app.post('/addWine', async(req,res)=>{
    try{
        await store.addWine([req.body.name, req.body.t_hum, req.body.t_temp, req.body.t_lux]);
        res.send({success: true});
    }catch(e){
        res.send({success: false});
    }
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


app.post('/ledColor',(req,res)=>{
    const color = req.body.color;
    //const sensor = req.body.sensor;

    arduino.sendColor(color);
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
