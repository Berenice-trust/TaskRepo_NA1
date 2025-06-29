
function convertBigIntToNumber(data) {
  if (!data) return data;
  
  if (Array.isArray(data)) {
    return data.map(item => convertBigIntToNumber(item));
  }
  
  if (typeof data === 'bigint') {
    return Number(data);
  }
  
  if (typeof data === 'object') {
    const result = {};
    for (const key in data) {
      if (typeof data[key] === 'bigint') {
        result[key] = Number(data[key]);
      } else if (typeof data[key] === 'object' && data[key] !== null) {
        result[key] = convertBigIntToNumber(data[key]);
      } else {
        result[key] = data[key];
      }
    }
    return result;
  }
  
  return data;
}

module.exports = {
  convertBigIntToNumber
};