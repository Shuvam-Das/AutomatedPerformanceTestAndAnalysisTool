const fs = require('fs');
const { parse } = require('csv-parse');

const productionLogsPath = '../shared/production-logs.csv';

const timestamps = [];

fs.createReadStream(productionLogsPath)
  .pipe(parse({ columns: true }))
  .on('data', (row) => {
    timestamps.push(new Date(row.timestamp));
  })
  .on('end', () => {
    if (timestamps.length === 0) {
      console.log('No data found in logs.');
      return;
    }

    timestamps.sort((a, b) => a - b);

    const firstTimestamp = timestamps[0];
    const lastTimestamp = timestamps[timestamps.length - 1];

    const durationInSeconds = (lastTimestamp - firstTimestamp) / 1000;
    const durationInMinutes = durationInSeconds / 60;

    const totalTransactions = timestamps.length;

    const tps = durationInSeconds > 0 ? totalTransactions / durationInSeconds : 0;
    const tpm = durationInMinutes > 0 ? totalTransactions / durationInMinutes : 0;

    const results = {
      totalTransactions,
      durationInSeconds: durationInSeconds.toFixed(2),
      tps: tps.toFixed(2),
      tpm: tpm.toFixed(2),
    };

    fs.writeFileSync('../shared/log-analysis.json', JSON.stringify(results, null, 2));

    console.log('Log Analysis Results:');
    console.log('=====================');
    console.log(`Total Transactions: ${totalTransactions}`);
    console.log(`Duration: ${durationInSeconds.toFixed(2)} seconds`);
    console.log(`Average TPS: ${tps.toFixed(2)}`);
    console.log(`Average TPM: ${tpm.toFixed(2)}`);
    console.log('\nResults saved to ../shared/log-analysis.json');
  });