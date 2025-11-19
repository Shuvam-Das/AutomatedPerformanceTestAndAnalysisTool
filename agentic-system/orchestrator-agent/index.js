const fs = require('fs');
const path = require('path');
const prompts = require('prompts');
const { spawn } = require('child_process');

const agenticSystemDir = path.join(__dirname, '..');
const sharedDir = path.join(agenticSystemDir, 'shared');

// Helper function to run an agent
function runAgent(agentName) {
  return new Promise((resolve, reject) => {
    console.log(`\n--- Running ${agentName} ---`);
    const agentPath = path.join(agenticSystemDir, `${agentName}`, 'index.js');
    const agentProcess = spawn('node', [agentPath], { stdio: 'inherit' });

    agentProcess.on('close', (code) => {
      if (code === 0) {
        console.log(`--- ${agentName} finished successfully ---\n`);
        resolve();
      } else {
        console.error(`--- ${agentName} failed with exit code ${code} ---\n`);
        reject(new Error(`Agent ${agentName} failed.`));
      }
    });

    agentProcess.on('error', (err) => {
      console.error(`Failed to start ${agentName}:`, err);
      reject(err);
  }
}function generateJMeterScript(config) {
  const url = new URL(config.url);
  const tps = Math.ceil(config.targetTps);
  const duration = config.duration;
  // For JMeter, we can calculate the number of threads.
  // A simple approach: if a request takes 1s, we need 'tps' threads.
  // This is a simplification.
  const numThreads = tps;
  const rampTime = Math.ceil(numThreads / 10); // Ramp up over 10% of threads count

  const jmxTemplate = `<?xml version="1.0" encoding="UTF-8"?>
<jmeterTestPlan version="1.2" properties="5.0" jmeter="5.4.1">
  <hashTree>
    <TestPlan guiclass="TestPlanGui" testclass="TestPlan" testname="Generated Test Plan" enabled="true">
      <stringProp name="TestPlan.comments"></stringProp>
      <boolProp name="TestPlan.functional_mode">false</boolProp>
      <boolProp name="TestPlan.tearDown_on_shutdown">true</boolProp>
      <boolProp name="TestPlan.serialize_threadgroups">false</boolProp>
      <elementProp name="TestPlan.user_defined_variables" elementType="Arguments" guiclass="ArgumentsPanel" testclass="Arguments" testname="User Defined Variables" enabled="true">
        <collectionProp name="Arguments.arguments"/>
      </elementProp>
      <stringProp name="TestPlan.user_define_classpath"></stringProp>
    </TestPlan>
    <hashTree>
      <ThreadGroup guiclass="ThreadGroupGui" testclass="ThreadGroup" testname="Thread Group" enabled="true">
        <stringProp name="ThreadGroup.on_sample_error">continue</stringProp>
        <elementProp name="ThreadGroup.main_controller" elementType="LoopController" guiclass="LoopControlPanel" testclass="LoopController" testname="Loop Controller" enabled="true">
          <boolProp name="LoopController.continue_forever">false</boolProp>
          <intProp name="LoopController.loops">-1</intProp>
        </elementProp>
        <stringProp name="ThreadGroup.num_threads">${numThreads}</stringProp>
        <stringProp name="ThreadGroup.ramp_time">${rampTime}</stringProp>
        <boolProp name="ThreadGroup.scheduler">true</boolProp>
        <stringProp name="ThreadGroup.duration">${duration}</stringProp>
        <stringProp name="ThreadGroup.delay"></stringProp>
        <boolProp name="ThreadGroup.same_user_on_next_iteration">true</boolProp>
      </ThreadGroup>
      <hashTree>
        <HTTPSamplerProxy guiclass="HttpTestSampleGui" testclass="HTTPSamplerProxy" testname="HTTP Request" enabled="true">
          <elementProp name="HTTPsampler.Arguments" elementType="Arguments" guiclass="HTTPArgumentsPanel" testclass="Arguments" testname="User Defined Variables" enabled="true">
            <collectionProp name="Arguments.arguments"/>
          </elementProp>
          <stringProp name="HTTPSampler.domain">${url.hostname}</stringProp>
          <stringProp name="HTTPSampler.port">${url.port || (url.protocol === 'https:' ? 443 : 80)}</stringProp>
          <stringProp name="HTTPSampler.protocol">${url.protocol.replace(':', '')}</stringProp>
          <stringProp name="HTTPSampler.contentEncoding"></stringProp>
          <stringProp name="HTTPSampler.path">${url.pathname}</stringProp>
          <stringProp name="HTTPSampler.method">GET</stringProp>
          <boolProp name="HTTPSampler.follow_redirects">true</boolProp>
          <boolProp name="HTTPSampler.auto_redirects">false</boolProp>
          <boolProp name="HTTPSampler.use_keepalive">true</boolProp>
          <boolProp name="HTTPSampler.DO_MULTIPART_POST">false</boolProp>
          <stringProp name="HTTPSampler.embedded_url_re"></stringProp>
          <stringProp name="HTTPSampler.connect_timeout"></stringProp>
          <stringProp name="HTTPSampler.response_timeout"></stringProp>
        </HTTPSamplerProxy>
        <hashTree/>
        <ConstantThroughputTimer guiclass="TestBeanGUI" testclass="ConstantThroughputTimer" testname="Constant Throughput Timer" enabled="true">
          <doubleProp>
            <name>throughput</name>
            <value>${tps * 60}</value>
            <savedValue>0.0</savedValue>
          </doubleProp>
          <intProp name="calcMode">1</intProp>
        </ConstantThroughputTimer>
        <hashTree/>
      </hashTree>
    </hashTree>
  </hashTree>
</jmeterTestPlan>
`;

  const jmxFilePath = path.join(sharedDir, 'generated-test.jmx');
  fs.writeFileSync(jmxFilePath, jmxTemplate);
  console.log(`--- Orchestrator: JMeter script generated at ${jmxFilePath} ---`);
}

// Main orchestration logic
async function main() {
  try {
    // 1. Run Log Analysis Agent
    await runAgent('log-analysis-agent');

    // 2. Read analysis results and prompt user
    const analysisResultsPath = path.join(sharedDir, 'log-analysis.json');
    const analysisResults = JSON.parse(fs.readFileSync(analysisResultsPath));
    const baselineTps = parseFloat(analysisResults.tps);

    console.log('--- Orchestrator: User Input Required ---');
    const response = await prompts([
      {
        type: 'text',
        name: 'url',
        message: 'Enter the target URL for the test',
        initial: 'http://localhost:5173'
      },
      {
        type: 'number',
        name: 'percentage',
        message: `Baseline TPS is ${baselineTps.toFixed(2)}. What percentage of this workload do you want to test?`,
        initial: 100,
        validate: value => value > 0 ? true : 'Percentage must be greater than 0'
      },
      {
        type: 'select',
        name: 'testType',
        message: 'Select the test type',
        choices: [
          { title: 'Load Test (1 hour)', value: 'load' },
          { title: 'Stress Test (find breakpoint)', value: 'stress' },
          { title: 'Endurance Test (6 hours)', value: 'endurance' },
        ],
        initial: 0
      }
    ]);

    // 3. Calculate workload and write test config
    const targetTps = baselineTps * (response.percentage / 100);
    const connections = Math.ceil(targetTps);
    let duration;

    switch (response.testType) {
      case 'load':
        duration = 3600; // 1 hour
        break;
      case 'endurance':
        duration = 21600; // 6 hours
        break;
      case 'stress':
        // For stress tests, we'll ramp up connections.
        // This is a simplified model. A real stress test is more complex.
        // We'll set a shorter duration for each step of the ramp-up.
        duration = 600; // 10 minutes for this example
        break;
      default:
        duration = 60; // Default to 1 minute
    }


    const testConfig = {
      url: response.url,
      testType: response.testType,
      duration: duration,
      connections: connections,
      targetTps: targetTps.toFixed(2)
    };

    const testConfigPath = path.join(sharedDir, 'test-config.json');
    fs.writeFileSync(testConfigPath, JSON.stringify(testConfig, null, 2));
    console.log('--- Orchestrator: Test configuration saved ---');
    console.log(`- Target URL: ${testConfig.url}`);
    console.log(`- Test Type: ${testConfig.testType}`);
    console.log(`- Duration: ${testConfig.duration}s`);
    console.log(`- Target Connections (derived from TPS): ${testConfig.connections}`);

    // Generate JMeter script
    generateJMeterScript(testConfig);


    // 4. Run Test Execution Agent
    await runAgent('test-execution-agent');

    // 5. Run Reporting Agent
    await runAgent('reporting-agent');

    console.log('--- Orchestration Complete ---');

  } catch (error) {
    console.error('\n--- Orchestration Failed ---');
    console.error(error.message);
    process.exit(1);
  }
}

main();
