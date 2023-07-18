const { deviloca } = require('../models');
const { Op } = require('sequelize');
const axios = require('axios');
let positions = [];
const createLocation = async (payload) => {
  const valid = await deviloca.findOne({
    where: {
      devidelo: payload.devidelo,
      delotime: payload.delotime
    }
  });
  const lastRecord = await deviloca.findAll({
    where: {
      devidelo: payload.devidelo,
      delolati: payload.delolati,
      delolong: payload.delolong
    },
    order: [['delonuid', 'DESC']],
    limit: 2
  });
  let aux = positions.filter(x => x.delotime == payload.delotime && x.devidelo == payload.devidelo);
  if (valid || aux.length != 0) {
    console.log('Registro duplicado. No se realizará la inserción.');
    return;
  }
  const lastRecordRow = await deviloca.findOne({
    where: {
      devidelo: payload.devidelo
    },
    order: [['delotime', 'DESC']],
  });
  console.log(lastRecordRow);
  console.log("---------------------------------------");
  console.log(payload);
  if (lastRecordRow && lastRecordRow.delospee == 0 && payload.delospee == 0) {
    console.log("Si entró a evento de parqueo");
    const { delolati, delolong } = payload;
    const delolatiString = delolati.toString();
    const delolongString = delolong.toString();
    const parseLat = parseFloat(delolatiString.replace(/\./g, ''));
    const parseLon = parseFloat(delolongString.replace(/\./g, ''));
    const validate = calculateDifference(parseLat, lastRecordRow.delolati, parseLon, lastRecordRow.delolong, 100);
    console.log(validate);
    if (validate) {
      return await deviloca.update(
        {
          delotime: payload.delotime,
          delotinude: payload.delotinude,
          delotinu: payload.delotinu
        },
        {
          where: { delonuid: lastRecordRow.delonuid }
        }
      );
    }
  }

  if (lastRecord.length < 2) {
    if (aux.length == 0) {
      positions.push(payload);
      await new Promise((resolve) => {
        setTimeout(async () => {
          const getAdress = await getDirections(payload.delolati, payload.delolong);
          payload.delodire = getAdress[0];
          payload.delobarri = getAdress[1];
          payload.delomuni = getAdress[2];
          payload.delodepa = getAdress[3];
          payload.delopais = getAdress[4];
          await deviloca.create(payload);
          resolve();
        }, 1100);
      });
    } else {
      positions = [];
    }
  } else if (lastRecord.length >= 2) {
    return await deviloca.update(
      {
        delotime: payload.delotime,
        delotinude: payload.delotinude,
        delotinu: payload.delotinu
      },
      {
        where: { delonuid: lastRecord[0].delonuid }
      }
    );
  }
}

const calculateDifference = (lat1, lat2, lon1, lon2, rango) => {
  const latDiff = Math.abs(lat1 % 1000 - lat2 % 1000);
  const lonDiff = Math.abs(lon1 % 1000 - lon2 % 1000);
  if (latDiff <= rango || lonDiff <= rango) {
    return true;
  }
  return false;
};

const updateCalcKm = async (deviceId, init, fin) => {
  return await deviloca.update(
    { delocalcu: true },
    {
      where: {
        delonuid: {
          [Op.gte]: init,
          [Op.lte]: fin
        },
        devidelo: deviceId
      }
    }
  );
}

const getRowsUpdate = async (deviceId, init, fin) => {
  return await deviloca.findAll(
    {
      where: {
        delocalcu: true,
        delonuid: {
          [Op.gte]: init,
          [Op.lte]: fin
        },
        devidelo: deviceId
      }
    }
  );
}

const getDirections = async (latitude, longitude) => {
  try {
    const response = await axios.get(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`);
    const data = response.data;

    let address = data.display_name;
    let suburb = findFirstProperty(data.address, ['neighbourhood', 'village', 'suburb', 'residential', 'county', 'town']);
    let muni = findFirstProperty(data.address, ['city', 'town', 'county']);
    let dpto = data.address.state || '';
    let pais = data.address.country || '';

    return [address, suburb, muni, dpto, pais];
  } catch (error) {
    console.log('Error en la solicitud de geocodificación inversa:', error);
    return ['', '', '', '', ''];
  }
};

const findFirstProperty = (obj, properties) => {
  for (const property of properties) {
    if (obj[property]) {
      return obj[property];
    }
  }
  return '';
};

module.exports = {
  createLocation,
  updateCalcKm,
  getRowsUpdate
}