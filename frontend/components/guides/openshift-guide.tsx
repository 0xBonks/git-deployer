import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CodeBlock } from "../code-block"

interface OpenShiftGuideProps {
  gitUrl: string
  repoName: string
}

export function OpenShiftGuide({ gitUrl, repoName }: OpenShiftGuideProps) {
  const deploymentConfig = `# deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ${repoName}
  labels:
    app: ${repoName}
spec:
  replicas: 2
  selector:
    matchLabels:
      app: ${repoName}
  template:
    metadata:
      labels:
        app: ${repoName}
    spec:
      containers:
      - name: ${repoName}
        image: ${repoName}:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
---
apiVersion: v1
kind: Service
metadata:
  name: ${repoName}-service
spec:
  selector:
    app: ${repoName}
  ports:
  - protocol: TCP
    port: 80
    targetPort: 3000
  type: ClusterIP
---
apiVersion: route.openshift.io/v1
kind: Route
metadata:
  name: ${repoName}-route
spec:
  to:
    kind: Service
    name: ${repoName}-service
  port:
    targetPort: 3000`

  const buildConfig = `# buildconfig.yaml
apiVersion: build.openshift.io/v1
kind: BuildConfig
metadata:
  name: ${repoName}
  labels:
    app: ${repoName}
spec:
  source:
    type: Git
    git:
      uri: ${gitUrl}
      ref: main
  strategy:
    type: Docker
    dockerStrategy:
      dockerfilePath: Dockerfile
  output:
    to:
      kind: ImageStreamTag
      name: ${repoName}:latest
  triggers:
  - type: ConfigChange
  - type: GitHub
    github:
      secret: github-webhook-secret
---
apiVersion: image.openshift.io/v1
kind: ImageStream
metadata:
  name: ${repoName}
  labels:
    app: ${repoName}`

  const openshiftTemplate = `# template.yaml
apiVersion: template.openshift.io/v1
kind: Template
metadata:
  name: ${repoName}-template
  annotations:
    description: "Git Deployer template for deploying ${repoName}"
    tags: "nodejs,react,nextjs"
objects:
- apiVersion: apps/v1
  kind: Deployment
  metadata:
    name: \${APP_NAME}
    labels:
      app: \${APP_NAME}
  spec:
    replicas: \${REPLICA_COUNT}
    selector:
      matchLabels:
        app: \${APP_NAME}
    template:
      metadata:
        labels:
          app: \${APP_NAME}
      spec:
        containers:
        - name: \${APP_NAME}
          image: \${IMAGE_NAME}
          ports:
          - containerPort: 3000
          env:
          - name: NODE_ENV
            value: \${NODE_ENV}
          resources:
            requests:
              memory: \${MEMORY_REQUEST}
              cpu: \${CPU_REQUEST}
            limits:
              memory: \${MEMORY_LIMIT}
              cpu: \${CPU_LIMIT}
parameters:
- name: APP_NAME
  displayName: Application Name
  value: ${repoName}
  required: true
- name: IMAGE_NAME
  displayName: Container Image
  value: ${repoName}:latest
  required: true
- name: REPLICA_COUNT
  displayName: Number of Replicas
  value: "2"
- name: NODE_ENV
  displayName: Node Environment
  value: production
- name: MEMORY_REQUEST
  displayName: Memory Request
  value: 256Mi
- name: MEMORY_LIMIT
  displayName: Memory Limit
  value: 512Mi
- name: CPU_REQUEST
  displayName: CPU Request
  value: 250m
- name: CPU_LIMIT
  displayName: CPU Limit
  value: 500m`

  const deployScript = `#!/bin/bash
# deploy-openshift.sh

# Variables
PROJECT_NAME="${repoName}"
APP_NAME="${repoName}"

echo "🚀 Git Deployer: Deploying to OpenShift..."

# Login to OpenShift (replace with your cluster URL)
# oc login https://your-openshift-cluster.com

# Create new project
oc new-project $PROJECT_NAME || oc project $PROJECT_NAME

# Create ImageStream and BuildConfig
oc apply -f buildconfig.yaml

# Start build from Git repository
oc start-build $APP_NAME --from-repo=${gitUrl} --follow

# Deploy the application
oc apply -f deployment.yaml

# Process template (alternative deployment method)
# oc process -f template.yaml | oc apply -f -

# Get route URL
ROUTE_URL=$(oc get route $APP_NAME-route -o jsonpath='{.spec.host}')

echo "✅ Deployment completed!"
echo "🌐 Your app is available at: https://$ROUTE_URL"

# Show deployment status
oc get pods -l app=$APP_NAME
oc get svc $APP_NAME-service
oc get route $APP_NAME-route`

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>🔴 Git Deployer - OpenShift Deployment</CardTitle>
          <CardDescription>Deploy your Git repository on Red Hat OpenShift Container Platform</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Step 1: Deployment Configuration</h3>
              <CodeBlock code={deploymentConfig} language="yaml" filename="deployment.yaml" />
            </div>

            <div>
              <h3 className="font-semibold mb-2">Step 2: Build Configuration</h3>
              <CodeBlock code={buildConfig} language="yaml" filename="buildconfig.yaml" />
            </div>

            <div>
              <h3 className="font-semibold mb-2">Step 3: OpenShift Template</h3>
              <CodeBlock code={openshiftTemplate} language="yaml" filename="template.yaml" />
            </div>

            <div>
              <h3 className="font-semibold mb-2">Step 4: Deployment Script</h3>
              <CodeBlock code={deployScript} language="bash" filename="deploy-openshift.sh" />
            </div>

            <div className="bg-red-50 p-4 rounded-lg">
              <h4 className="font-semibold mb-2">📋 Prerequisites:</h4>
              <ul className="text-sm space-y-1">
                <li>• OpenShift CLI (oc) installed</li>
                <li>• Access to OpenShift Cluster</li>
                <li>• Logged in to OpenShift Cluster</li>
                <li>• Permission to create projects</li>
              </ul>
            </div>

            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="font-semibold mb-2">🚀 Quick Deployment:</h4>
              <div className="text-sm font-mono space-y-1">
                <div>
                  1. <code>oc login https://your-cluster.com</code>
                </div>
                <div>
                  2. <code>chmod +x deploy-openshift.sh</code>
                </div>
                <div>
                  3. <code>./deploy-openshift.sh</code>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-semibold mb-2">🔧 OpenShift Features:</h4>
              <ul className="text-sm space-y-1">
                <li>• Source-to-Image (S2I) Builds</li>
                <li>• Automatic SSL Certificates</li>
                <li>• Rolling Updates</li>
                <li>• Health Checks and Monitoring</li>
                <li>• Horizontal Pod Autoscaling</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
