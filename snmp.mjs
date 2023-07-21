import * as snmp from 'net-snmp';

export function subtree(session, oid) {

  return new Promise((resolve, reject) => {

    const results = {};

    session.subtree(oid, varbinds => {
      varbinds.forEach(element => {
        if(snmp.isVarbindError(element)) {
          reject(snmp.varbindError(element));
        } else {
          results[element.oid.toString().slice(oid.length+1)] = element.value;
        }
      });
    }, () => {
      resolve(results);
    });


  })

};

export async function table(session, oidRoot, mapping) {

  const results = {};

  for(var subOid in mapping) {
    const data = await subtree(session, oidRoot + '.' + subOid);
    if(Object.keys(data).length == 0)
      throw new Error('Failed to get data.');
    for(var i in data) {

      if(i.includes('.'))
        throw new Error('Table is not 1-dimensional.');
      if(!results[i])
        results[i] = {};

      let property = mapping[subOid];
      if(typeof property == 'object') {
        if(property.type == 'string') {
          data[i] = data[i].toString();
          property = property.name;
        }
      }

      results[i][property] = data[i];

    }
  }

  return results;

}