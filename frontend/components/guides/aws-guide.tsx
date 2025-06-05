import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CodeBlock } from "../code-block"

interface AWSGuideProps {
  gitUrl: string
  repoName: string
}

export function AWSGuide({ gitUrl, repoName }: AWSGuideProps) {
  const buildspec = `# buildspec.yml
version: 0.2

phases:
  pre_build:
    commands:
      - echo Logging in to Amazon ECR...
      - aws ecr get-login-password --region $AWS_DEFAULT_REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com
  build:
    commands:
      - echo Build started on \`date\`
      - echo Building the Docker image...
      - docker build -t $IMAGE_REPO_NAME:$IMAGE_TAG .
      - docker tag $IMAGE_REPO_NAME:$IMAGE_TAG $AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com/$IMAGE_REPO_NAME:$IMAGE_TAG
  post_build:
    commands:
      - echo Build completed on \`date\`
      - echo Pushing the Docker image...
      - docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com/$IMAGE_REPO_NAME:$IMAGE_TAG`

  const taskDefinition = `{
  "family": "${repoName}-task",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "256",
  "memory": "512",
  "executionRoleArn": "arn:aws:iam::ACCOUNT_ID:role/ecsTaskExecutionRole",
  "containerDefinitions": [
    {
      "name": "${repoName}",
      "image": "ACCOUNT_ID.dkr.ecr.REGION.amazonaws.com/${repoName}:latest",
      "portMappings": [
        {
          "containerPort": 3000,
          "protocol": "tcp"
        }
      ],
      "essential": true,
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/${repoName}",
          "awslogs-region": "REGION",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}`

  const deployScript = `#!/bin/bash
# deploy-aws.sh

# Variables
REGION="us-east-1"
CLUSTER_NAME="${repoName}-cluster"
SERVICE_NAME="${repoName}-service"
TASK_DEFINITION="${repoName}-task"

echo "🚀 Git Deployer: Deploying to AWS ECS..."

# Create ECS Cluster
aws ecs create-cluster --cluster-name $CLUSTER_NAME --region $REGION

# Register Task Definition
aws ecs register-task-definition --cli-input-json file://task-definition.json --region $REGION

# Create ECS Service
aws ecs create-service \\
  --cluster $CLUSTER_NAME \\
  --service-name $SERVICE_NAME \\
  --task-definition $TASK_DEFINITION \\
  --desired-count 1 \\
  --launch-type FARGATE \\
  --network-configuration "awsvpcConfiguration={subnets=[subnet-12345],securityGroups=[sg-12345],assignPublicIp=ENABLED}" \\
  --region $REGION

echo "✅ Deployment completed!"`

  const terraform = `# main.tf
provider "aws" {
  region = var.aws_region
}

resource "aws_ecs_cluster" "${repoName.replace(/-/g, "_")}" {
  name = "${repoName}-cluster"
}

resource "aws_ecs_task_definition" "${repoName.replace(/-/g, "_")}" {
  family                   = "${repoName}-task"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = "256"
  memory                   = "512"
  execution_role_arn       = aws_iam_role.ecs_task_execution_role.arn

  container_definitions = jsonencode([
    {
      name  = "${repoName}"
      image = "\${var.aws_account_id}.dkr.ecr.\${var.aws_region}.amazonaws.com/${repoName}:latest"
      
      portMappings = [
        {
          containerPort = 3000
          protocol      = "tcp"
        }
      ]
      
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = "/ecs/${repoName}"
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = "ecs"
        }
      }
    }
  ])
}

variable "aws_region" {
  default = "us-east-1"
}

variable "aws_account_id" {
  description = "AWS Account ID"
}`

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>☁️ Git Deployer - AWS Deployment</CardTitle>
          <CardDescription>
            Deploy your Git repository on Amazon Web Services with ECS, ECR and CodeBuild
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Step 1: CodeBuild Buildspec</h3>
              <CodeBlock code={buildspec} language="yaml" filename="buildspec.yml" />
            </div>

            <div>
              <h3 className="font-semibold mb-2">Step 2: ECS Task Definition</h3>
              <CodeBlock code={taskDefinition} language="json" filename="task-definition.json" />
            </div>

            <div>
              <h3 className="font-semibold mb-2">Step 3: Deployment Script</h3>
              <CodeBlock code={deployScript} language="bash" filename="deploy-aws.sh" />
            </div>

            <div>
              <h3 className="font-semibold mb-2">Step 4: Terraform (Infrastructure as Code)</h3>
              <CodeBlock code={terraform} language="hcl" filename="main.tf" />
            </div>

            <div className="bg-orange-50 p-4 rounded-lg">
              <h4 className="font-semibold mb-2">📋 Prerequisites:</h4>
              <ul className="text-sm space-y-1">
                <li>• AWS CLI installed and configured</li>
                <li>• ECR Repository created</li>
                <li>• VPC and Subnets configured</li>
                <li>• IAM Roles for ECS Task Execution</li>
                <li>• Security Groups for Port 3000</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
