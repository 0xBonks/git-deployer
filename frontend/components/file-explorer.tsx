"use client"

import { useState, useEffect } from "react"
import { 
  Folder, 
  FileText, 
  Download, 
  Trash2, 
  RefreshCw, 
  AlertCircle 
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { 
  Table, 
  TableHeader, 
  TableRow, 
  TableHead, 
  TableBody, 
  TableCell 
} from "@/components/ui/table"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface OutputFile {
  filename: string
  platform: string
  created_at: string
  file_path: string
}

interface FileExplorerProps {
  apiUrl: string
  onSelectFile?: (file: OutputFile) => void
  selectedFile?: OutputFile | null
}

export function FileExplorer({ apiUrl, onSelectFile, selectedFile }: FileExplorerProps) {
  const [files, setFiles] = useState<OutputFile[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string>("")
  const [isDeleting, setIsDeleting] = useState(false)

  const loadFiles = async () => {
    setIsLoading(true)
    setError("")
    
    try {
      const response = await fetch(`${apiUrl}/output_files`)
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`)
      }
      
      const data = await response.json()
      setFiles(data)
    } catch (err) {
      console.error("Error loading files:", err)
      setError("Could not load files. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadFiles()
  }, [apiUrl])

  const handleDownload = (file: OutputFile) => {
    // Create a link to download the file
    const link = document.createElement("a")
    link.href = `${apiUrl}${file.file_path}`
    link.download = file.filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleDelete = async (filename: string) => {
    try {
      setIsDeleting(true)
      const response = await fetch(`${apiUrl}/output_files/${filename}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`)
      }
      
      // Refresh the file list
      loadFiles()
    } catch (err) {
      console.error("Error deleting file:", err)
      setError("Could not delete file. Please try again.")
    } finally {
      setIsDeleting(false)
    }
  }

  const handleClearAll = async () => {
    if (!confirm("Are you sure you want to delete all files?")) {
      return
    }
    
    try {
      setIsDeleting(true)
      const response = await fetch(`${apiUrl}/output_files`, {
        method: 'DELETE'
      })
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`)
      }
      
      // Refresh the file list
      loadFiles()
      
      // Clear selected file if any
      if (onSelectFile) {
        onSelectFile(null)
      }
    } catch (err) {
      console.error("Error clearing files:", err)
      setError("Could not clear files. Please try again.")
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Card className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-white">
            <Folder className="h-5 w-5" />
            Generated Files
          </CardTitle>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={loadFiles} 
              disabled={isLoading}
              className="h-8"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
            {files.length > 0 && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleClearAll} 
                disabled={isDeleting}
                className="h-8 text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Clear All
              </Button>
            )}
          </div>
        </div>
        <CardDescription>
          Files stored in the output directory
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {files.length === 0 ? (
          <div className="text-center py-8 text-slate-500 dark:text-slate-400">
            {isLoading ? "Loading files..." : "No files generated yet."}
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Platform</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {files.map((file) => (
                  <TableRow 
                    key={file.filename}
                    className={selectedFile?.filename === file.filename 
                      ? "bg-blue-50 dark:bg-blue-950/20" 
                      : undefined
                    }
                  >
                    <TableCell 
                      className="font-medium cursor-pointer" 
                      onClick={() => onSelectFile && onSelectFile(file)}
                    >
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-slate-500" />
                        {file.platform}
                      </div>
                    </TableCell>
                    <TableCell>
                      {new Date(file.created_at).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleDownload(file)}
                          className="h-8 w-8"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleDelete(file.filename)}
                          disabled={isDeleting}
                          className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 