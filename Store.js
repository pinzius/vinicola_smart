const fs = require('fs');
const mysql = require('mysql');
const config = require('./config');

class Store{
    constructor(){
        this.connection = mysql.createConnection({
            host: config.host,
            user: config.user,
            password: config.pass,
            database: config.db
        });
        this.connection.connect((err) => {
            if (err) throw err;
            console.log('Connected to the remote database!');
        });
    }

    execQuery(query,params=[]){
        if(!(params instanceof Array))
            params = [params];
        return new Promise((resolve, reject) => {
            this.connection.query(query, params, (err, results) => {
                if (err)
                    reject(err);
                else{
                    resolve(results);
                }
            });
        });
        
    }
    
    getAllData(){
        const query = `SELECT * FROM ${config.table_sensor} 
INNER JOIN ${config.table_wine} ON ${config.table_sensor}.id_wine = ${config.table_wine}.id 
INNER JOIN ${config.table_value} ON ${config.table_sensor}.id = ${config.table_value}.id_sensor
ORDER BY ${config.table_sensor}.id, ${config.table_sensor}.timestamp`;
        return this.execQuery(query);
    }

    getDataGroupHour(){
        const query = `SELECT dht.id_sensor, dht.timestamp, AVG(dht.temperature) as AVG_TEMP, AVG(dht.humidity) as AVG_HUM, AVG(dht.lux) as AVG_LUX, w.name as W_NAME, w.t_humidity as W_HUM, w.t_temperature as W_TEMP, w.t_lux as W_LUX
from ${config.table_value} as dht
inner join ${config.table_sensor} as s on s.id = dht.id_sensor
inner join ${config.table_wine} as w on w.id = s.id_wine
group by dht.id_sensor, HOUR(dht.timestamp)
order by dht.id_sensor`;
        return this.execQuery(query);
    }

    getLastData(){
        const query=`select dht.timestamp, dht.id_sensor, dht.humidity, dht.temperature, dht.lux, w.name, w.t_humidity,w.t_temperature,w.t_lux
from ${config.table_value} as dht 
inner join ${config.table_sensor} as s on s.id = dht.id_sensor
inner join ${config.table_wine} as w on w.id = s.id_wine
where dht.timestamp = (select timestamp from ${config.table_value} order by ${config.table_value}.timestamp DESC limit 1);`;
        return this.execQuery(query);
    }

    getSensor(key){
        const query = `SELECT ${config.table_sensor}.id,${config.table_wine}.id,${config.table_wine}.name FROM ${config.table_sensor} 
INNER JOIN ${config.table_wine} ON ${config.table_sensor}.id_wine = ${config.table_wine}.id 
WHERE name = ?`;
        return this.execQuery(query,key);
    }

    getAllSensor(){
        const query = `SELECT ${config.table_sensor}.id, ${config.table_sensor}.id_wine, ${config.table_wine}.name FROM ${config.table_sensor}
INNER JOIN ${config.table_wine} ON ${config.table_sensor}.id_wine = ${config.table_wine}.id`;
        return this.execQuery(query);
    }

    getWine(key){
        const query = `SELECT * FROM ${config.table_wine} WHERE name = ?`;
        return this.execQuery(query,key);
    }

    getAllWine(){
        const query = `SELECT * FROM ${config.table_wine}`;
        return this.execQuery(query);
    }

    getValue(key){
        const query = `SELECT * 
FROM ${config.table_sensor} 
INNER JOIN ${config.table_value} ON ${config.table_sensor}.id = ${config.table_value}.id_sensor 
INNER JOIN ${config.table_wine} ON ${config.table_wine}.id = ${config.table_sensor}.id_wine
WHERE ${config.table_sensor}.id = ?`;
        return this.execQuery(query,key);
    }

    getAllValue(){
        const query = `SELECT * 
FROM ${config.table_sensor} 
INNER JOIN ${config.table_value} ON ${config.table_sensor}.id = ${config.table_value}.id_sensor 
INNER JOIN ${config.table_wine} ON ${config.table_wine}.id = ${config.table_sensor}.id_wine
ORDER BY ${config.table_value}.timestamp ASC`;
        return this.execQuery(query);
    }

    addValue(sensor, lux, temperature, humidity){
        const query = `INSERT INTO ${config.table_value}(id_sensor,lux,humidity,temperature) VALUES (?,?,?,?)`;
        return this.execQuery(query,[sensor,lux,humidity,temperature]);
    }

    addSensor(wine){
        const query = `INSERT INTO ${config.table_sensor}(id_wine) VALUES(?)`;
        return this.execQuery(query, wine);
    }

    updateSensor(sensor,wine){
        const query = `UPDATE ${config.table_sensor} SET id_wine=? WHERE id=?`
        return this.execQuery(query,[wine,sensor]);
    }

    addWine(params){
        const query = `INSERT INTO ${config.table_wine}(name, t_humidity, t_temperature, t_lux) VALUES (?,?,?,?)`;
        return this.execQuery(query,params);
    }

    updateWine(params){
        const query = `UPDATE ${config.table_wine} SET name=?, t_humidity=?, t_temperature=?, t_lux=? WHERE id=?`;
        return this.execQuery(query,params)
    }

    /*

    updateData(key,value){
        let date = new Date()
        const query = `UPDATE data SET path=?, date=? WHERE name = ?`;
        return this.execQuery(query, [value,date, key]);
    }

    deleteData(key){
        const query = `DELETE FROM data WHERE name = ?`;
        return this.execQuery(query,key);
    }

    incCounter(key){
        const query = `UPDATE data SET counter=counter+1 WHERE name = ?`;
        return this.execQuery(query,key);
    }*/

}

module.exports = Store;