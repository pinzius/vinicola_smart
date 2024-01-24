let {SerialPort} = require("serialport");
const {ReadlineParser} = require('@serialport/parser-readline');
const wsClient = require('websocket').w3cwebsocket;
const config = require('./config');

const WS_URL = `http://${config.ip}:${config.ws_port}`;

class Arduino{
    constructor(){
        this.arduinoSerialPort = new SerialPort({
            path: 'COM5',
            baudRate:9600
        });
        this.socket = new wsClient(WS_URL, 'echo-protocol');

        console.log(this.socket.readyState);

        this.socket.onopen = () => {
            console.log('connected ws');
        };

        this.parser = this.arduinoSerialPort.pipe(new ReadlineParser({ delimiter: '\n' }));
        this.arduinoSerialPort.on('open',function() {
            console.log('Serial Port COM5 is opened.');
          });

        this.parser.on('data', data =>{
            console.log('got word from arduino:', data);
            if(this.socket.readyState == 1)
                this.socket.send(data);
          });  
    }

    sendColor(hex){
        console.log(`send to arduino: ${hex}`);
        this.arduinoSerialPort.write(hex,"hex");            
    }

}


module.exports = Arduino;