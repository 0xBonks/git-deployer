import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DockerGuide } from "./guides/docker-guide"
import { AWSGuide } from "./guides/aws-guide"
import { AzureGuide } from "./guides/azure-guide"
import { OpenShiftGuide } from "./guides/openshift-guide"

type Platform = "docker" | "aws" | "azure" | "openshift"

interface DeploymentGuideProps {
  gitUrl: string
  platforms: Platform[]
}

export function DeploymentGuide({ gitUrl, platforms }: DeploymentGuideProps) {
  const repoName = gitUrl.split("/").pop()?.replace(".git", "") || "my-app"

  const platformComponents = {
    docker: DockerGuide,
    aws: AWSGuide,
    azure: AzureGuide,
    openshift: OpenShiftGuide,
  }

  const platformNames = {
    docker: "Docker",
    aws: "AWS",
    azure: "Azure",
    openshift: "OpenShift",
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Git Deployer - Deployment Overview
            <div className="flex gap-2">
              {platforms.map((platform) => (
                <Badge key={platform} variant="secondary">
                  {platformNames[platform]}
                </Badge>
              ))}
            </div>
          </CardTitle>
          <CardDescription>Automatically generated deployment guides with Git Deployer for {repoName}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <strong>Repository:</strong>
              <p className="text-gray-600 break-all">{gitUrl}</p>
            </div>
            <div>
              <strong>Project Name:</strong>
              <p className="text-gray-600">{repoName}</p>
            </div>
            <div>
              <strong>Platforms:</strong>
              <p className="text-gray-600">{platforms.length} selected</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue={platforms[0]} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          {platforms.map((platform) => (
            <TabsTrigger key={platform} value={platform}>
              {platformNames[platform]}
            </TabsTrigger>
          ))}
        </TabsList>

        {platforms.map((platform) => {
          const GuideComponent = platformComponents[platform]
          return (
            <TabsContent key={platform} value={platform}>
              <GuideComponent gitUrl={gitUrl} repoName={repoName} />
            </TabsContent>
          )
        })}
      </Tabs>
    </div>
  )
}
