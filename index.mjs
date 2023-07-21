import chalk from 'chalk';

import { readFileSync } from 'fs';

import { args } from './args.mjs';

import * as netSnmp from 'net-snmp';

import ora from 'ora';
import * as stats from './stats.mjs';

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

let hosts = [];

if(args.host)
  hosts = args.host.split(',').map(s => s.trim());
else if(args.hostsfile) {
  try {
    hosts = readFileSync(args.hostsfile).toString().trim().split('\n').map(s => s.trim());
  } catch {
    console.error(chalk.red('ERROR: Failed to read hosts file.\n'));
    process.exit(-1);
  }
}

(async () => {

  // Info
  console.log(chalk.green('Configured hosts:'));
  for(var i in hosts) {
    console.log('  - ' + hosts[i]);
  }
  console.log('');
  
  // Gather starting stats
  const starting_stats_spinner = ora('Gathering initial stats...').start();

  const starting_stats = {};
  const sessions = {};
  let total_ports = 0;
  for(var i in hosts) {
    starting_stats_spinner.text = `Gathering initial stats... ${hosts[i]}`;
    sessions[i] = netSnmp.createSession(hosts[i], 'public');
    starting_stats[i] = await stats.table(sessions[i]);
    const num_ports = Object.keys(starting_stats[i]).length;
    if(num_ports == 0) {
      starting_stats_spinner.fail(`Gathering initial stats... failed on host ${hosts[i]}.`);
      return;
    }
    total_ports += num_ports;
  }

  const num_hosts = Object.keys(hosts).length;
  const detail = `${total_ports} ports found across ${num_hosts} host${num_hosts > 1 ? 's':'' }`;
  starting_stats_spinner.succeed(`Gathering initial stats... done (${detail}).`);

  // Delay
  const waiting_spinner = ora('Waiting to re-poll...').start();
  for(var i = args.delay ? parseInt(args.delay, 10) : 5; i > 0; i--) {
    waiting_spinner.text = `Waiting to re-poll... (${i}s)`;
    await delay(1000);
  }
  waiting_spinner.succeed('Waiting to re-poll... done.');
  
  // Gather final stats
  const ending_stats_spinner = ora('Gathering final stats...').start();

  const ending_stats = {};
  for(var i in hosts) {
    ending_stats[i] = await stats.table(sessions[i]);
    const num_starting_ports = Object.keys(starting_stats[i]).length;
    const num_ports_diff = num_starting_ports - Object.keys(ending_stats[i]).length;
    if(num_ports_diff != 0) {
      ending_stats_spinner.fail(`Gathering final stats... failed (missing ${num_ports_diff} ports on host ${hosts[i]}).`);
      return;
    }
  }

  ending_stats_spinner.succeed('Gathering final stats... done.');

  // Print stats diff
  let stats_diff = false;
  for(var i in hosts) {

    let host_header_printed = false;

    for(var port in ending_stats[i]) {

      let port_header_printed = false;

      for(var property in ending_stats[i][port]) {

        if(ending_stats[i][port][property] != starting_stats[i][port][property]) {

          if(!host_header_printed) {
            console.log(chalk.blue(`Host ${hosts[i]}:\n`));
            host_header_printed = true;
          }

          if(!port_header_printed) {
            console.log(chalk.cyan(`  Port ${ending_stats[i][port].description}:`));
            port_header_printed = true;
          }

          console.log(`    ${property}:`);
          console.log(chalk.yellow('      before: ')+`${starting_stats[i][port][property]}`);
          console.log(chalk.yellow('      after: ')+`${ending_stats[i][port][property]}`);

          stats_diff = true;

        }

      }

    }

  }

  if(!stats_diff) {
    console.log(chalk.green('\nNo differences were detected.\n'));
  }

})();