const fs = require('fs');
const path = require('path');
const autocannon = require('autocannon');

console.log('Test Execution Agent: Starting...');

const sharedDir = path.join(__dirname, '..', 'shared');
const configFilePath = path.join(sharedDir, 'test-config.json');
const outputFilePath = path.join(sharedDir, 'test-results.json');

try {
  if (!fs.existsSync(configFilePath)) {
    throw new Error('Test configuration file not found.');
  }

  const config = JSON.parse(fs.readFileSync(configFilePath));
  const { url, duration, connections, testType } = config;

  if (!url || !duration || !connections || !testType) {
    throw new Error('Invalid test configuration. URL, duration, connections, and testType are required.');
  }

  console.log('Test Execution Agent: Starting performance test with the following configuration:');
  console.log(`- URL: ${url}`);
  console.log(`- Test Type: ${testType}`);
  console.log(`- Duration: ${duration}s`);
  console.log(`- Initial Connections: ${connections}`);
  console.log('\nNOTE: A JMeter script has been generated, but this agent will use Autocannon for execution.\n');


  let cannon;

  if (testType === 'stress') {
    console.log('Test Execution Agent: Running STRESS test. Ramping up connections...');
    // Simplified stress test: ramp up connections every 10 seconds
    const rampUpInterval = 10;
    const steps = duration / rampUpInterval;
    const connectionStep = Math.ceil(connections / steps);
    let currentConnections = connectionStep;

    cannon = autocannon({
      url,
      duration,
      connections: 1, // Start with 1
    });

    setInterval(() => {
      if (currentConnections <= connections) {
        console.log(`- Ramping connections to: ${currentConnections}`);
        cannon.connections = currentConnections;
        currentConnections += connectionStep;
      }
    }, rampUpInterval * 1000);

  } else {
    // For 'load' and 'endurance' tests
    cannon = autocannon({
      url,
      duration,
      connections,
    });
  }


  autocannon.track(cannon, { renderProgressBar: true });

  cannon.on('done', (result) => {
    fs.writeFileSync(outputFilePath, JSON.stringify(result, null, 2));
    console.log('\nTest Execution Agent: Test complete. Results saved to', outputFilePath);
  });

  cannon.on('error', (err) => {
    console.error('Test Execution Agent: Error during test execution:', err);
    process.exit(1);
  });

} catch (error) {
  console.error('Test Execution Agent: Error:', error.message);
  process.exit(1);
}
