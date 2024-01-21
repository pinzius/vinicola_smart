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
ORDER BY ${config.table_sensor}.id`;
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

    getAllWine(key){
        const query = `SELECT * FROM ${config.table_wine}`;
        return this.execQuery(query,key);
    }

    getValue(key){
        const query = `SELECT * FROM ${config.table_sensor} INNER JOIN ${config.table_value} ON ${config.table_sensor}.id = ${config.table_value}.id_sensor WHERE ${config.table_sensor}.id = ?`;
        return this.execQuery(query,key);
    }

    getAllValue(key){
        const query = `SELECT * FROM ${config.table_value} ORDER BY ${config.table_value}.id`;
        return this.execQuery(query,key);
    }

    addValue(sensor, lux, temperature, humidity){
        const query = `INSERT INTO ${config.table_value}(id_sensor,lux,humidity,temperature) VALUES (?,?,?,?)`;
        return this.execQuery(query,[sensor,lux,humidity,temperature]);
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