import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CodeBlock } from "../code-block"

interface AzureGuideProps {
  gitUrl: string
  repoName: string
}

export function AzureGuide({ gitUrl, repoName }: AzureGuideProps) {
  const azurePipeline = `# azure-pipelines.yml
trigger:
- main

resources:
- repo: self

variables:
  dockerRegistryServiceConnection: 'your-acr-connection'
  imageRepository: '${repoName}'
  containerRegistry: 'yourregistry.azurecr.io'
  dockerfilePath: '$(Build.SourcesDirectory)/Dockerfile'
  tag: '$(Build.BuildId)'
  vmImageName: 'ubuntu-latest'

stages:
- stage: Build
  displayName: Build and push stage
  jobs:
  - job: Build
    displayName: Build
    pool:
      vmImage: $(vmImageName)
    steps:
    - task: Docker@2
      displayName: Build and push an image to container registry
      inputs:
        command: buildAndPush
        repository: $(imageRepository)
        dockerfile: $(dockerfilePath)
        containerRegistry: $(dockerRegistryServiceConnection)
        tags: |
          $(tag)
          latest

- stage: Deploy
  displayName: Deploy stage
  dependsOn: Build
  jobs:
  - deployment: Deploy
    displayName: Deploy
    pool:
      vmImage: $(vmImageName)
    environment: 'production'
    strategy:
      runOnce:
        deploy:
          steps:
          - task: AzureWebAppContainer@1
            displayName: 'Azure Web App on Container Deploy'
            inputs:
              azureSubscription: 'your-subscription'
              appName: '${repoName}-app'
              containers: $(containerRegistry)/$(imageRepository):$(tag)`

  const bicepTemplate = `// main.bicep
@description('Name of the application')
param appName string = '${repoName}'

@description('Location for all resources')
param location string = resourceGroup().location

@description('Container image name')
param containerImage string = 'yourregistry.azurecr.io/${repoName}:latest'

// App Service Plan
resource appServicePlan 'Microsoft.Web/serverfarms@2022-03-01' = {
  name: '\${appName}-plan'
  location: location
  sku: {
    name: 'B1'
    tier: 'Basic'
  }
  kind: 'linux'
  properties: {
    reserved: true
  }
}

// Web App
resource webApp 'Microsoft.Web/sites@2022-03-01' = {
  name: '\${appName}-app'
  location: location
  properties: {
    serverFarmId: appServicePlan.id
    siteConfig: {
      linuxFxVersion: 'DOCKER|\${containerImage}'
      appSettings: [
        {
          name: 'WEBSITES_ENABLE_APP_SERVICE_STORAGE'
          value: 'false'
        }
        {
          name: 'DOCKER_REGISTRY_SERVER_URL'
          value: 'https://yourregistry.azurecr.io'
        }
      ]
    }
  }
}

output webAppUrl string = 'https://\${webApp.properties.defaultHostName}'`

  const deployScript = `#!/bin/bash
# deploy-azure.sh

# Variables
RESOURCE_GROUP="${repoName}-rg"
LOCATION="East US"
ACR_NAME="${repoName}acr"
APP_NAME="${repoName}-app"

echo "🚀 Git Deployer: Deploying to Azure..."

# Create Resource Group
az group create --name $RESOURCE_GROUP --location "$LOCATION"

# Create Azure Container Registry
az acr create --resource-group $RESOURCE_GROUP --name $ACR_NAME --sku Basic --admin-enabled true

# Build and push image to ACR
az acr build --registry $ACR_NAME --image ${repoName}:latest .

# Deploy using Bicep template
az deployment group create \\
  --resource-group $RESOURCE_GROUP \\
  --template-file main.bicep \\
  --parameters appName=$APP_NAME containerImage="$ACR_NAME.azurecr.io/${repoName}:latest"

echo "✅ Deployment completed!"
echo "🌐 Your app is available at: https://$APP_NAME.azurewebsites.net"`

  const dockerCompose = `# docker-compose.azure.yml
version: '3.8'

services:
  ${repoName}:
    build: .
    ports:
      - "80:3000"
    environment:
      - NODE_ENV=production
      - PORT=3000
    restart: unless-stopped
    
  # Azure Application Insights (optional)
  # app-insights:
  #   image: microsoft/applicationinsights
  #   environment:
  #     - APPINSIGHTS_INSTRUMENTATIONKEY=your-key`

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>☁️ Git Deployer - Azure Deployment</CardTitle>
          <CardDescription>
            Deploy your Git repository on Microsoft Azure with Container Registry and App Service
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Step 1: Azure DevOps Pipeline</h3>
              <CodeBlock code={azurePipeline} language="yaml" filename="azure-pipelines.yml" />
            </div>

            <div>
              <h3 className="font-semibold mb-2">Step 2: Bicep Template (Infrastructure)</h3>
              <CodeBlock code={bicepTemplate} language="bicep" filename="main.bicep" />
            </div>

            <div>
              <h3 className="font-semibold mb-2">Step 3: Deployment Script</h3>
              <CodeBlock code={deployScript} language="bash" filename="deploy-azure.sh" />
            </div>

            <div>
              <h3 className="font-semibold mb-2">Step 4: Docker Compose for Azure</h3>
              <CodeBlock code={dockerCompose} language="yaml" filename="docker-compose.azure.yml" />
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-semibold mb-2">📋 Prerequisites:</h4>
              <ul className="text-sm space-y-1">
                <li>• Azure CLI installed and logged in</li>
                <li>• Active Azure Subscription</li>
                <li>• Azure DevOps Project (for pipeline)</li>
                <li>• Service Connection to Azure Container Registry</li>
              </ul>
            </div>

            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="font-semibold mb-2">🚀 Quick Deployment:</h4>
              <div className="text-sm font-mono space-y-1">
                <div>
                  1. <code>az login</code>
                </div>
                <div>
                  2. <code>chmod +x deploy-azure.sh</code>
                </div>
                <div>
                  3. <code>./deploy-azure.sh</code>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
