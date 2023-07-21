import * as snmp from './snmp.mjs';

export async function table(session) {

  return await snmp.table(session, '1.3.6.1.2.1.2.2.1', {
    '1': 'index',
    '2': { name: 'description', type: 'string' },
    '13': 'inDiscards',
    '14': 'inErrors',
    '15': 'unknownProtos',
    '19': 'outDiscards',
    '20': 'outErrors'
  });

};