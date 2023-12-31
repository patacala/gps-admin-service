const Redis = require('ioredis');
const config = require('../config/environment');
const REDIS_HOST = config.REDIS.host;
const REDIS_PORT = config.REDIS.port;

const redisConfig = {
    host: REDIS_HOST,
    port: REDIS_PORT
};

const client = new Redis(redisConfig);
client.on('connect', () => {
    console.log('Conectado a Redis');
});
client.on('ready', () => {
    console.log('Cliente listo para recibir comandos Redis');
});
client.on('end', () => {
    console.log('Conexión con Redis cerrada');
});
client.on('error', err => console.log('Redis Client Error', err));

async function pushToList(arr, listName) {
    try {
        await new Promise((resolve, reject) => {
            client.rpush(listName, JSON.stringify(arr), (error, result) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(result);
                }
            });
        });
    } catch (error) {
        console.error('Error:', error);
        throw error;
    }
}

async function replaceList(arr, listName) {
    try {
   // Elimina todos los elementos de la lista en Redis
   await client.del(listName);

   // Agrega los elementos filtrados nuevamente a la lista en Redis
   const promises = arr.map((element) =>
     client.rpush(listName, JSON.stringify(element))
   );

   await Promise.all(promises);

    console.log(`Lista "${listName}" actualizada correctamente.`);
        
    } catch (error) {
        console.error('Error:', error);
        throw error;
    }
}
async function deleteList(listName) {
    try {
        await new Promise((resolve, reject) => {
            client.del(listName, (error, result) => {
                if (error) {
                    console.error('Error trimming Redis list:', error);
                    reject(error);
                } else {
                    resolve(result);
                }
            });
        });
    } catch (error) {
        console.error('Error:', error);
        throw error;
    }
}

function getList(listName) {
    return new Promise(async (resolve, reject) => {
        const value = await client.lrange(listName, 0, -1);
        resolve(value);
    });
}

module.exports = {
    pushToList,
    getList,
    replaceList,
    deleteList
};
