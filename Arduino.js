let {SerialPort} = require("serialport");
const {ReadlineParser} = require('@serialport/parser-readline');
const wsClient = require('websocket').w3cwebsocket;
const config = require('./config');

const WS_URL = `http://${config.ip}:${config.ws_port}`;

class Arduino{
    constructor(){
        this.arduinoSerialPort = new SerialPort({
            path: 'COM8',
            baudRate:9600
        });
        this.cb = ()=>{};

        this.socket = new wsClient(WS_URL, 'echo-protocol');

        console.log(this.socket.readyState);

        this.socket.onopen = () => {
            console.log('connected ws');
        };

        this.parser = this.arduinoSerialPort.pipe(new ReadlineParser({ delimiter: '\n' }));
        this.arduinoSerialPort.on('open',function() {
            console.log('Serial Port COM8 is opened.');
          });

        this.parser.on('data', data =>{
            console.log('got word from arduino:', data);
            this.cb(data);
            if(this.socket.readyState == 1)
                this.socket.send(data);
          });  
    }

    sendData(mode,colore){
        console.log(`send to arduino: ${mode} ${colore}`);
        this.arduinoSerialPort.write(mode, "ascii");
        if(colore) this.arduinoSerialPort.write(colore,"hex");            
    }

    onData(cb){
        this.cb = cb;
    }
}


module.exports = Arduino;