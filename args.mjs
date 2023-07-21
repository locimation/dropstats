import chalk from 'chalk';

console.log(chalk.green(`
     _                                           
    | |                      _         _         
  _ | | ____ ___  ____   ___| |_  ____| |_   ___ 
 / || |/ ___) _ \\|  _ \\ /___)  _)/ _  |  _) /___)
( (_| | |  | |_| | | | |___ | |_( ( | | |__|___ |
 \\____|_|   \\___/| ||_/(___/ \\___)_||_|\\___|___/ 
                 |_|                             
`));

import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

const demandOneOfOption = (...options) => (argv) => {
  const count = options.filter(option => argv[option]).length;
  const lastOption = options.pop();

  if (count === 0) {
    throw new Error(`Exactly one of the arguments ${options.join(', ')} and ${lastOption} is required`);
  }
  else if (count > 1) {
    throw new Error(`Arguments ${options.join(', ')} and ${lastOption} are mutually exclusive`);
  }

  return true;
};

export const args = yargs(hideBin(process.argv))
  .option('delay', {
    alias: 'd',
    describe: 'Delay between polls (seconds)'
  })
  .option('host', {
    alias: 'h',
    describe: 'IP address or hostname of switch'
  })
  .option('hostsfile', {
    alias: 'f',
    describe: 'File containing list of hostnames'
  })
  .check(demandOneOfOption('host', 'hostsfile'))
  .check(argv => { if(argv.delay && !parseInt(argv.delay, 10)) throw new Error('Delay must be a valid number.'); return true; })
  .parse();