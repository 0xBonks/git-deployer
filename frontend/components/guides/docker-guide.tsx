import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CodeBlock } from "../code-block"

interface DockerGuideProps {
  gitUrl: string
  repoName: string
}

export function DockerGuide({ gitUrl, repoName }: DockerGuideProps) {
  const dockerfile = `# Dockerfile
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* ./
RUN \\
  if [ -f yarn.lock ]; then yarn --frozen-lockfile; \\
  elif [ -f package-lock.json ]; then npm ci; \\
  elif [ -f pnpm-lock.yaml ]; then yarn global add pnpm && pnpm i --frozen-lockfile; \\
  else echo "Lockfile not found." && exit 1; \\
  fi

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN yarn build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]`

  const dockerCompose = `# docker-compose.yml
version: '3.8'

services:
  ${repoName}:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    restart: unless-stopped
    
  # Optional: Add database service
  # postgres:
  #   image: postgres:15
  #   environment:
  #     POSTGRES_DB: ${repoName}
  #     POSTGRES_USER: user
  #     POSTGRES_PASSWORD: password
  #   volumes:
  #     - postgres_data:/var/lib/postgresql/data
  #   ports:
  #     - "5432:5432"

# volumes:
#   postgres_data:`

  const dockerIgnore = `# .dockerignore
Dockerfile
.dockerignore
node_modules
npm-debug.log
README.md
.env
.git
.gitignore
.next
.nyc_output
.coverage
.cache`

  const buildScript = `#!/bin/bash
# build.sh

echo "🐳 Git Deployer: Building Docker image for ${repoName}..."

# Clone repository
git clone ${gitUrl} ${repoName}
cd ${repoName}

# Build Docker image
docker build -t ${repoName}:latest .

# Run container
docker run -d -p 3000:3000 --name ${repoName}-container ${repoName}:latest

echo "✅ Application is running on http://localhost:3000"`

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>🐳 Git Deployer - Docker Deployment</CardTitle>
          <CardDescription>Containerize your Git repository with Docker for consistent deployments</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Step 1: Create Dockerfile</h3>
              <CodeBlock code={dockerfile} language="dockerfile" filename="Dockerfile" />
            </div>

            <div>
              <h3 className="font-semibold mb-2">Step 2: Docker Compose (Optional)</h3>
              <CodeBlock code={dockerCompose} language="yaml" filename="docker-compose.yml" />
            </div>

            <div>
              <h3 className="font-semibold mb-2">Step 3: Create .dockerignore</h3>
              <CodeBlock code={dockerIgnore} language="text" filename=".dockerignore" />
            </div>

            <div>
              <h3 className="font-semibold mb-2">Step 4: Build Script</h3>
              <CodeBlock code={buildScript} language="bash" filename="build.sh" />
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-semibold mb-2">🚀 Deployment Commands:</h4>
              <div className="space-y-2 text-sm font-mono">
                <div>
                  1. <code>docker build -t {repoName}:latest .</code>
                </div>
                <div>
                  2.{" "}
                  <code>
                    docker run -d -p 3000:3000 --name {repoName}-container {repoName}:latest
                  </code>
                </div>
                <div>
                  3. Or with Docker Compose: <code>docker-compose up -d</code>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
