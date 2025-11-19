# Agentic Performance Testing System

This project is a sophisticated, multi-agent system designed to fully automate the performance testing lifecycle. It leverages production log analysis to generate and execute realistic performance tests against non-production environments, incorporating self-healing and self-training capabilities to create a resilient and intelligent pipeline.

The system is containerized using Docker, making it portable and easy to run.

---

## ✨ Key Features

- **Automated Production Log Analysis**: Ingests historical production logs to calculate baseline performance metrics like peak Transactions Per Second (TPS).
- **Dynamic Workload Modeling**: Translates production metrics and client requirements (e.g., "test at 50% above peak") into a mathematical workload model.
- **Advanced JMeter Script Generation**: Automatically creates complex JMeter (`.jmx`) test scripts with features that normally require manual effort:
  - **Correlation**: Handles dynamic values like session tokens.
  - **Parameterization**: Uses external CSV data for realistic inputs (e.g., usernames, passwords).
  - **Pacing**: Employs a `ConstantThroughputTimer` to precisely control the load.
  - **Think Time**: Simulates realistic user pauses.
- **Multi-Environment Targeting**: Analyzes logs from a production environment to safely execute tests against a configured **Staging**, **UAT**, or **local** environment.
- **Self-Healing Pipeline**: The central `Orchestrator` agent can detect failures in the pipeline (e.g., invalid logs, script errors) and attempt to recover or use fallback strategies.
- **Self-Training Capabilities**: Agents record their successes and failures to a shared **Knowledge Base**. This allows the system to learn from past mistakes, for example, by trying a different log parser if the default one fails.
- **Fully Containerized**: All agents are isolated in Docker containers and managed by Docker Compose for easy setup and execution.

---

## ⚙️ Prerequisites

Before you begin, ensure you have the following installed on your system:

- **Docker**: Download Docker Desktop (for Mac/Windows) or install Docker Engine for Linux.
- **Docker Compose**: Included with Docker Desktop. For Linux, install the `docker-compose-plugin`.

Verify your installation by running `docker --version` and `docker-compose --version`.

---

## 🚀 Getting Started

### 1. Configuration

**a. Place Production Logs:**
Place your historical application logs into the `shared-artifacts/production-logs/` directory. A `dummy-log.log` is included as an example. The `log-analyzer` agent will process all files in this directory.

**b. Define Target Environments:**
Open the `config.json` file in the root directory. This file defines the servers your tests will run against. Modify the `staging`, `uat`, or `local` environments to match your infrastructure.

```json
{
  "environments": {
    "staging": {
      "protocol": "https",
      "domain": "api.staging.yourapp.com",
      "port": 443
    },
    "local": {
      "protocol": "http",
      "domain": "host.docker.internal",
      "port": 8080
    }
  }
}
```

**c. Select the Target Environment:**
Open the `docker-compose.yml` file. Find the `orchestrator` service and set the `TARGET_ENVIRONMENT` variable to the environment you want to test (e.g., `staging`, `uat`, or `local`).

```yaml
services:
  orchestrator:
    environment:
      - TARGET_ENVIRONMENT=staging # <-- Change this value
      - WORKLOAD_INCREASE_PERCENTAGE=50 
```

### 2. Launch the Pipeline

Open a terminal in the root directory of the project and run the following command:

```bash
docker-compose up --build orchestrator
```

This command will build all the agent images and start the `Orchestrator`, which will then execute the entire pipeline step-by-step.

### 3. View the Results

Once the pipeline completes, all generated artifacts, including the final report, can be found in the `shared-artifacts/` directory.
- **Test Script**: `shared-artifacts/jmeter-scripts/generated_test.jmx`
- **Test Report**: `shared-artifacts/test-results/final_report.txt`
- **Knowledge Base**: `shared-artifacts/knowledge_base.json`
- **Permanent Archive**: `run_archive/<timestamp>/` (contains all artifacts for a specific run)

---

## 🤖 The Agents

The system is composed of six specialized agents that work in sequence:

1.  **Log Analyzer**: Parses production logs to establish a performance baseline.
2.  **Workload Modeler**: Creates a rich test plan based on the baseline and user requirements.
3.  **Script Generator**: Builds an advanced JMeter script tailored to the target environment.
4.  **Test Executor**: Performs a sanity check on the script and then executes the full performance test.
5.  **Report Synthesizer**: Generates a summary report from the raw test results.
6.  **Orchestrator & Healer**: The master agent that controls the pipeline, manages failures, and makes healing decisions based on the shared knowledge base.