"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { GitBranch, Download, Loader2, AlertCircle, CheckCircle2, Rocket, Code2, Eye } from "lucide-react"
import { MarkdownPreview } from "@/components/markdown-preview"

// API URL - adjust to your backend location
const API_URL = "http://localhost:8000";

interface Platform {
  id: string
  name: string
}

interface GeneratedContent {
  content: string
  filename: string
  file_path?: string
}

export default function GitDeployer() {
  const [gitLink, setGitLink] = useState("")
  const [availablePlatforms, setAvailablePlatforms] = useState<Platform[]>([])
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([])
  const [generatedContentMap, setGeneratedContentMap] = useState<Record<string, GeneratedContent>>({})
  const [selectedPreviewPlatform, setSelectedPreviewPlatform] = useState<string>("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string>("")
  const [success, setSuccess] = useState(false)
  const [isLoadingPlatforms, setIsLoadingPlatforms] = useState(true)
  const [hasGenerated, setHasGenerated] = useState(false)

  // Load available platforms on component mount
  useEffect(() => {
    const loadPlatforms = async () => {
      try {
        // Actual API call to /platforms endpoint
        const response = await fetch(`${API_URL}/platforms`);
        
        if (!response.ok) {
          throw new Error(`Error: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Transform backend platform data to match frontend format
        // Ensure unique IDs by using lowercase and removing spaces/special chars
        const platforms = data.platforms.map((platform: string) => ({
          id: platform.toLowerCase().replace(/[^a-z0-9]/g, '_'),
          name: platform
        }));

        setAvailablePlatforms(platforms);
      } catch (err) {
        console.error("Error loading platforms:", err);
        setError("Error loading platforms. Please refresh the page.");
      } finally {
        setIsLoadingPlatforms(false);
      }
    }

    loadPlatforms()
  }, [])

  const handlePlatformChange = (platformId: string, checked: boolean) => {
    // Don't allow changing selections after generation unless selecting new platforms
    if (hasGenerated && !checked && generatedContentMap[platformId]) {
      return;
    }
    
    if (checked) {
      setSelectedPlatforms((prev) => [...prev, platformId])
      if (selectedPlatforms.length === 0) {
        setSelectedPreviewPlatform(platformId)
      }
    } else {
      setSelectedPlatforms((prev) => prev.filter((p) => p !== platformId))
      if (selectedPreviewPlatform === platformId) {
        const remaining = selectedPlatforms.filter((p) => p !== platformId)
        setSelectedPreviewPlatform(remaining[0] || "")
      }
    }
  }

  const generateDeployment = async () => {
    setError("")
    setSuccess(false)
    setIsGenerating(true)

    try {
      const newContentMap: Record<string, GeneratedContent> = {...generatedContentMap}

      for (const platform of selectedPlatforms) {
        // Skip platforms that already have generated content
        if (newContentMap[platform]) {
          continue;
        }
        
        const platformName = availablePlatforms.find((p) => p.id === platform)?.name || platform
        
        // Make actual API call to /generate_deployment endpoint
        const response = await fetch(`${API_URL}/generate_deployment`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            git_link: gitLink,
            platform: platformName,
          }),
        });
        
        if (!response.ok) {
          throw new Error(`Error generating for ${platformName}: ${response.status}`);
        }
        
        const deploymentData = await response.json();
        
        // Use actual response from backend
        newContentMap[platform] = {
          content: deploymentData.content,
          filename: deploymentData.filename,
          file_path: deploymentData.file_path,
        };
      }

      setGeneratedContentMap(newContentMap)
      if (!selectedPreviewPlatform && selectedPlatforms.length > 0) {
        setSelectedPreviewPlatform(selectedPlatforms[0])
      }
      setSuccess(true)
      setHasGenerated(true)
      
      // Deaktiviere Formular-Eingaben nach erfolgreicher Generierung
      setGitLink((prev) => prev); // Behalte den Wert, aber deaktiviere das Feld
    } catch (err) {
      console.error("Error generating deployment:", err);
      setError("Error generating deployment instructions. Please try again.");
    } finally {
      setIsGenerating(false)
    }
  }

  const downloadDeployment = () => {
    if (!selectedPreviewPlatform || !generatedContentMap[selectedPreviewPlatform]) {
      return
    }

    // Directly download from the backend server if file_path is available
    if (generatedContentMap[selectedPreviewPlatform].file_path) {
      const link = document.createElement("a")
      link.href = `${API_URL}${generatedContentMap[selectedPreviewPlatform].file_path}`
      link.download = generatedContentMap[selectedPreviewPlatform].filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      return
    }
    
    // Fallback to the old method
    const content = generatedContentMap[selectedPreviewPlatform].content
    const filename = generatedContentMap[selectedPreviewPlatform].filename

    const blob = new Blob([content], { type: "text/markdown" })
    const link = document.createElement("a")
    link.href = window.URL.createObjectURL(blob)
    link.download = filename
    link.click()
  }

  // Verbesserte Funktion für das Herunterladen aller generierten Deployments
  const downloadAllDeployments = () => {
    // Nur die Plattformen herunterladen, für die wir Inhalte generiert haben
    Object.entries(generatedContentMap).forEach(([platformId, data]) => {
      const content = data.content;
      const filename = data.filename;

      // Download from server if file_path is available
      if (data.file_path) {
        const link = document.createElement("a")
        link.href = `${API_URL}${data.file_path}`
        link.download = filename
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        return
      }

      // Fallback to the old method
      const blob = new Blob([content], { type: "text/markdown" })
      const link = document.createElement("a")
      link.href = window.URL.createObjectURL(blob)
      link.download = filename
      link.click()
      
      // Kleine Verzögerung zwischen Downloads, um Browser-Überlastung zu vermeiden
      setTimeout(() => window.URL.revokeObjectURL(link.href), 100);
    });
  }

  const isFormValid = gitLink.trim() !== "" && selectedPlatforms.length > 0
  const hasGeneratedContent = Object.keys(generatedContentMap).length > 0

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-8">Git Deployment Generator</h1>
        </div>

        {/* Main Layout - Dynamic Columns */}
        <div
          className={`grid gap-8 ${hasGeneratedContent ? "grid-cols-1 xl:grid-cols-2" : "grid-cols-1 max-w-2xl mx-auto"}`}
        >
          {/* Left Column - Main Form */}
          <div className="space-y-6">
            {/* Repository Input */}
            <Card className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-white">
                  <GitBranch className="h-5 w-5" />
                  Repository Configuration
                </CardTitle>
                <CardDescription>Enter your Git repository URL to get started</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label htmlFor="gitLink" className="text-sm font-medium">
                    Git Repository URL
                  </Label>
                  <Input
                    id="gitLink"
                    type="url"
                    placeholder="https://github.com/username/repository.git"
                    value={gitLink}
                    onChange={(e) => setGitLink(e.target.value)}
                    className="h-11 bg-white dark:bg-slate-900"
                    disabled={isGenerating}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Platform Selection */}
            <Card className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-white">
                  <Code2 className="h-5 w-5" />
                  Deployment Platforms
                </CardTitle>
                <CardDescription>Select one or more platforms for deployment</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingPlatforms ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin mr-2" />
                    <span>Loading platforms...</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {availablePlatforms.map((platform) => {
                      const isGenerated = Boolean(generatedContentMap[platform.id]);
                      // Disable all platforms after generation
                      const isDisabled = isGenerating || hasGenerated;
                      
                      return (
                        <div
                          key={platform.id}
                          className={`flex items-center space-x-3 p-3 rounded-lg border transition-all ${
                            isDisabled ? "opacity-70" : "cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800" 
                          } ${
                            selectedPlatforms.includes(platform.id)
                              ? "border-blue-300 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-700"
                              : "border-slate-200 dark:border-slate-700"
                          }`}
                          onClick={() => !isDisabled && handlePlatformChange(platform.id, !selectedPlatforms.includes(platform.id))}
                        >
                          <Checkbox
                            id={platform.id}
                            checked={selectedPlatforms.includes(platform.id)}
                            onCheckedChange={(checked) => !isDisabled && handlePlatformChange(platform.id, checked as boolean)}
                            disabled={isDisabled}
                          />
                          <Label 
                            htmlFor={platform.id} 
                            className={`${isDisabled ? "" : "cursor-pointer"} font-medium flex-1`}
                          >
                            {platform.name}
                            {isGenerated && " ✓"}
                          </Label>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <Card className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <CardContent className="pt-6">
                <div className="flex flex-col gap-3">
                  <Button
                    onClick={generateDeployment}
                    disabled={!isFormValid || isGenerating}
                    className="w-full h-11"
                    size="lg"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating Instructions...
                      </>
                    ) : (
                      <>
                        <Rocket className="mr-2 h-4 w-4" />
                        Generate Deployment Instructions
                      </>
                    )}
                  </Button>

                  {hasGeneratedContent && (
                    <div className="flex gap-3">
                      <Button
                        onClick={downloadDeployment}
                        disabled={!selectedPreviewPlatform}
                        variant="outline"
                        className="flex-1 h-11"
                        size="lg"
                      >
                        <Download className="mr-2 h-4 w-4" />
                        Download Current
                      </Button>

                      {/* Nur anzeigen, wenn es mehr als eine generierte Konfiguration gibt */}
                      {Object.keys(generatedContentMap).length > 1 && (
                        <Button onClick={downloadAllDeployments} variant="outline" className="flex-1 h-11" size="lg">
                          <Download className="mr-2 h-4 w-4" />
                          Download All ({Object.keys(generatedContentMap).length})
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Success Message */}
            {success && (
              <Alert className="border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-800">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800 dark:text-green-200">
                  Deployment instructions generated successfully!
                </AlertDescription>
              </Alert>
            )}

            {/* Error Message */}
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </div>

          {/* Right Column - Preview (only shown when content exists) */}
          {hasGeneratedContent && (
            <div className="space-y-6">
              <Card className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 sticky top-8">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-white">
                    <Eye className="h-5 w-5" />
                    Preview
                  </CardTitle>
                  {Object.keys(generatedContentMap).length > 1 && (
                    <div className="pt-2">
                      <Select value={selectedPreviewPlatform} onValueChange={setSelectedPreviewPlatform}>
                        <SelectTrigger className="w-full bg-white dark:bg-slate-900">
                          <SelectValue placeholder="Select platform to preview" />
                        </SelectTrigger>
                        <SelectContent>
                          {/* Verwende Object.keys, um sicherzustellen, dass jede Plattform nur einmal angezeigt wird */}
                          {Object.keys(generatedContentMap).map((platformId) => {
                            const platform = availablePlatforms.find((p) => p.id === platformId);
                            return platform ? (
                              <SelectItem key={`select-${platformId}`} value={platformId}>
                                {platform.name}
                              </SelectItem>
                            ) : null;
                          })}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </CardHeader>
                <CardContent>
                  {selectedPreviewPlatform && generatedContentMap[selectedPreviewPlatform] && (
                    <MarkdownPreview
                      content={generatedContentMap[selectedPreviewPlatform].content}
                      filename={generatedContentMap[selectedPreviewPlatform].filename}
                    />
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
