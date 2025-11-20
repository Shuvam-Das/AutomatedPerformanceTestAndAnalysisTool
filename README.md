# Agentic Performance Testing System (Production-Ready on AWS)

[![CodeQL](https://github.com/YOUR_USERNAME/YOUR_REPONAME/actions/workflows/codeql.yml/badge.svg)](https://github.com/YOUR_USERNAME/YOUR_REPONAME/actions/workflows/codeql.yml) [![Super-Linter](https://github.com/YOUR_USERNAME/YOUR_REPONAME/actions/workflows/linter.yml/badge.svg)](https://github.com/YOUR_USERNAME/YOUR_REPONAME/actions/workflows/linter.yml) [![Trivy Scan](https://github.com/YOUR_USERNAME/YOUR_REPONAME/actions/workflows/trivy.yml/badge.svg)](https://github.com/YOUR_USERNAME/YOUR_REPONAME/actions/workflows/trivy.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

This project is a sophisticated, multi-agent system designed to fully automate the performance testing lifecycle. It is architected to be **production-ready, cost-optimized, and fully automated on AWS**, requiring zero manual intervention.

The system is deployed via a CI/CD pipeline and runs on a serverless architecture.

---

## ✨ Production-Ready AWS Architecture

- **Automated CI/CD Pipeline**: A **GitHub Actions** workflow automatically builds, tests, and deploys the entire application to AWS on every push to the `main` branch.
- **Infrastructure as Code (IaC)**: The entire cloud infrastructure is defined using the **AWS CDK**, ensuring repeatable and version-controlled deployments.
- **Serverless & Cost-Optimized**: The application runs on a serverless stack (**Step Functions**, **Lambda**, **Fargate Spot**) to ensure you only pay for what you use, keeping costs extremely low.
- **Zero Manual Intervention**: An **Amazon EventBridge** rule automatically triggers the pipeline on a schedule (e.g., daily), making the system fully autonomous.
- **Live Observability**:
  - **Live Logs**: All application and agent logs are streamed in real-time to **Amazon CloudWatch**.
  - **Structured & Correlated Logging**: Logs are generated in JSON format and correlated with a unique ID per run, enabling deep analysis and tracing similar to platforms like Dynatrace.
  - **Live Status**: The **AWS Step Functions** console provides a live, visual graph of the pipeline's execution status.

---

## 🚀 Automated Deployment & Monitoring

This project is no longer deployed manually. The deployment is fully automated.

### 1. Deployment

Simply push a commit to the `main` branch of this repository. The GitHub Actions pipeline defined in `.github/workflows/deploy.yml` will handle the rest. It will:
1.  Build and push the necessary Docker images to Amazon ECR.
2.  Execute the AWS CDK script to provision or update all cloud resources.

### 2. Monitoring the Live Application

Once deployed, you can monitor the application in the AWS Management Console:

#### a) Live Process Status
1.  Navigate to the **AWS Step Functions** service.
2.  Click on the `PerformanceTestingStateMachine`.
3.  You will see a list of executions. Click on the latest one to view a real-time, visual graph of the pipeline. You can see which agent is running, what its inputs/outputs are, and diagnose any errors.

#### b) Live Application Logs
1.  Navigate to the **Amazon CloudWatch** service.
2.  In the left menu, click on **Log groups**.
3.  You will see log groups for each Lambda function (e.g., `/aws/lambda/LogAnalyzerAgent`) and for the Fargate task. Click on any log group to view and search the live log streams.
4.  **To trace a single pipeline run**, navigate to **Logs Insights** in CloudWatch. Select the log groups for all your agents and run a query like the following to see all logs for a specific execution:
    ```sql
    fields @timestamp, @message, service, correlationId
    | filter correlationId = "arn:aws:states:us-east-1:123456789012:execution:PerformanceTestingStateMachine:your-execution-id"
    | sort @timestamp asc
    ```

---

## 🤖 The Agents

The system is composed of specialized agents orchestrated by **AWS Step Functions**:

1.  **Log Analyzer (Lambda)**: Parses production logs from S3.
2.  **Workload Modeler (Lambda)**: Creates a test plan from the baseline analysis.
3.  **Script Generator (Lambda)**: Builds an advanced JMeter script.
4.  **Test Executor (Fargate Task)**: Executes the JMeter performance test at scale.
5.  **Report Synthesizer (Lambda)**: Generates an intelligent report from the test results.
6.  **Archivist (Lambda)**: Commits all run artifacts to a versioned archive in S3.