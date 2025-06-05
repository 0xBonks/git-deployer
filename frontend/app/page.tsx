"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { GitBranch, Rocket, Settings, FileText } from "lucide-react"
import { DeploymentGuide } from "@/components/deployment-guide"
import { Header } from "@/components/header"

type Platform = "docker" | "aws" | "azure" | "openshift"

interface FormData {
  gitUrl: string
  platforms: Platform[]
}

export default function Home() {
  const [formData, setFormData] = useState<FormData>({
    gitUrl: "",
    platforms: [],
  })
  const [showGuides, setShowGuides] = useState(false)
  const [errors, setErrors] = useState<string[]>([])

  const platforms = [
    { id: "docker" as Platform, name: "Docker", description: "Containerization with Docker" },
    { id: "aws" as Platform, name: "AWS", description: "Amazon Web Services Deployment" },
    { id: "azure" as Platform, name: "Azure", description: "Microsoft Azure Cloud Platform" },
    { id: "openshift" as Platform, name: "OpenShift", description: "Red Hat OpenShift Container Platform" },
  ]

  const validateGitUrl = (url: string): boolean => {
    const gitUrlPattern = /^https?:\/\/(github\.com|gitlab\.com|bitbucket\.org)\/[\w\-.]+\/[\w\-.]+(?:\.git)?$/
    return gitUrlPattern.test(url)
  }

  const handlePlatformChange = (platformId: Platform, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      platforms: checked ? [...prev.platforms, platformId] : prev.platforms.filter((p) => p !== platformId),
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const newErrors: string[] = []

    if (!formData.gitUrl.trim()) {
      newErrors.push("Git repository URL is required")
    } else if (!validateGitUrl(formData.gitUrl)) {
      newErrors.push("Invalid Git repository URL. Supported are GitHub, GitLab and Bitbucket URLs.")
    }

    if (formData.platforms.length === 0) {
      newErrors.push("At least one deployment platform must be selected")
    }

    setErrors(newErrors)

    if (newErrors.length === 0) {
      setShowGuides(true)
    }
  }

  const handleReset = () => {
    setFormData({ gitUrl: "", platforms: [] })
    setShowGuides(false)
    setErrors([])
  }

  if (showGuides) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <Header />
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Deployment Guides</h1>
              <p className="text-gray-600 mt-2">Repository: {formData.gitUrl}</p>
            </div>
            <Button onClick={handleReset} variant="outline">
              New Configuration
            </Button>
          </div>

          <DeploymentGuide gitUrl={formData.gitUrl} platforms={formData.platforms} />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col">
      <Header />
      <div className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-blue-100 rounded-full">
                <Rocket className="h-8 w-8 text-blue-600" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold">Git Deployer</CardTitle>
            <CardDescription>
              Generate automatic deployment guides and configurations for your Git repositories
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {errors.length > 0 && (
                <Alert variant="destructive">
                  <AlertDescription>
                    <ul className="list-disc list-inside space-y-1">
                      {errors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="gitUrl" className="flex items-center gap-2">
                  <GitBranch className="h-4 w-4" />
                  Git Repository URL
                </Label>
                <Input
                  id="gitUrl"
                  type="url"
                  placeholder="https://github.com/username/repository.git"
                  value={formData.gitUrl}
                  onChange={(e) => setFormData((prev) => ({ ...prev, gitUrl: e.target.value }))}
                  className="w-full"
                />
                <p className="text-sm text-gray-500">Supported are GitHub, GitLab and Bitbucket repositories</p>
              </div>

              <div className="space-y-4">
                <Label className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Select Deployment Platforms
                </Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {platforms.map((platform) => (
                    <div
                      key={platform.id}
                      className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-gray-50"
                    >
                      <Checkbox
                        id={platform.id}
                        checked={formData.platforms.includes(platform.id)}
                        onCheckedChange={(checked) => handlePlatformChange(platform.id, checked as boolean)}
                      />
                      <div className="flex-1">
                        <Label htmlFor={platform.id} className="font-medium cursor-pointer">
                          {platform.name}
                        </Label>
                        <p className="text-sm text-gray-500 mt-1">{platform.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <Button type="submit" className="w-full" size="lg">
                <FileText className="h-4 w-4 mr-2" />
                Generate Deployment Guides
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
