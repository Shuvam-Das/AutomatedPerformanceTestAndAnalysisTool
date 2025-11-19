const fs = require('fs');
const path = require('path');
const markdownpdf = require('markdown-pdf');

console.log('Reporting Agent: Starting...');

const sharedDir = path.join(__dirname, '..', 'shared');
const resultsFilePath = path.join(sharedDir, 'test-results.json');
const configFilePath = path.join(sharedDir, 'test-config.json');
const reportMdPath = path.join(sharedDir, 'performance-report.md');
const reportPdfPath = path.join(sharedDir, 'performance-report.pdf');

try {
  if (!fs.existsSync(resultsFilePath) || !fs.existsSync(configFilePath)) {
    throw new Error('Test results or configuration file not found.');
  }

  const results = JSON.parse(fs.readFileSync(resultsFilePath));
  const config = JSON.parse(fs.readFileSync(configFilePath));

  // --- Build Markdown Report ---
  let report = `# Performance Test Report\n\n`;

  // Summary
  report += `## 1. Summary\n\n`;
  report += `The test execution for **${config.url}** has completed. The test was conducted as a **'${config.testType}'** test.\n\n`;
  report += `The system handled an average of **${results.requests.average.toFixed(2)} requests/second** over a duration of **${results.duration}s**.\n\n`;

  // Initial Observations
  const highLatency = results.latency.p99 > 1000; // Example threshold: 1s
  const highErrors = results.errors > 0;

  if (highLatency || highErrors) {
    report += `**Initial Observations:**\n`;
    if (highLatency) {
      report += `- **High Latency Detected:** The 99th percentile latency is over 1000ms, which may indicate performance bottlenecks under load.\n`;
    }
    if (highErrors) {
      report += `- **Errors Encountered:** The test recorded ${results.errors} errors, which needs investigation.\n`;
    }
    report += `\n`;
  } else {
    report += `**Initial Observations:** The system performed within expected parameters for this test.\n\n`;
  }


  // Test Configuration
  report += `## 2. Test Configuration\n\n`;
  report += `| Parameter | Value |\n`;
  report += `|---|---|\n`;
  report += `| Target URL | ${config.url} |\n`;
  report += `| Test Type | ${config.testType} |\n`;
  report += `| Intended Duration | ${config.duration}s |\n`;
  report += `| Connections | ${config.connections} |\n`;
  report += `| Target TPS | ${config.targetTps} |\n\n`;

  // Detailed Results
  report += `## 3. Detailed Results\n\n`;

  // Throughput
  report += `### Throughput\n`;
  report += `| Metric | Value |\n`;
  report += `|---|---|\n`;
  report += `| Total Requests | ${results.requests.total} |\n`;
  report += `| Average RPS | ${results.requests.average.toFixed(2)} |\n`;
  report += `| Total Data | ${(results.throughput.total / 1024 / 1024).toFixed(2)} MB |\n\n`;

  // Latency
  report += `### Latency (ms)\n`;
  report += `| Metric | Value |\n`;
  report += `|---|---|\n`;
  report += `| Average | ${results.latency.average.toFixed(2)} |\n`;
  report += `| Min | ${results.latency.min.toFixed(2)} |\n`;
  report += `| Max | ${results.latency.max.toFixed(2)} |\n`;
  report += `| p50 | ${results.latency.p50.toFixed(2)} |\n`;
  report += `| p90 | ${results.latency.p90.toFixed(2)} |\n`;
  report += `| p99 | ${results.latency.p99.toFixed(2)} |\n\n`;

  // Errors
  report += `### Errors\n`;
  report += `| Type | Count |\n`;
  report += `|---|---|\n`;
  report += `| Total Errors | ${results.errors} |\n`;
  report += `| Timeouts | ${results.timeouts} |\n`;
  report += `| Non-2xx Responses | ${results['non2xx']} |\n\n`;

  // Recommendations
  report += `## 4. Recommendations\n\n`;
  if (highErrors) {
    report += `- **Investigate Errors:** Analyze server-side logs at the time of the test to identify the root cause of the ${results.errors} errors.\n`;
  }
  if (highLatency) {
    report += `- **Analyze High Latency:** Profile the application to understand the cause of the high p99 latency. Look for slow database queries, inefficient code, or resource contention.\n`;
  }
  if (!highErrors && !highLatency) {
    report += `- **All Good:** Performance appears stable based on this test. Consider increasing the load or running a longer endurance test to check for stability over time.\n`;
  }

  // --- Save Markdown and Convert to PDF ---
  fs.writeFileSync(reportMdPath, report);
  console.log(`Reporting Agent: Markdown report saved to ${reportMdPath}`);

  markdownpdf().from(reportMdPath).to(reportPdfPath, () => {
    console.log(`Reporting Agent: PDF report saved to ${reportPdfPath}`);
    console.log('--- Performance Test Report Generation Complete ---');
  });

} catch (error) {
  console.error('Reporting Agent: Error:', error.message);
  process.exit(1);
}
