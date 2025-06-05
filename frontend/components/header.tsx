import { GitBranch, Rocket } from "lucide-react"

export function Header() {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <GitBranch className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Git Deployer</h1>
              <p className="text-sm text-gray-500">Automatic Deployment Guides</p>
            </div>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Rocket className="h-4 w-4" />
            <span>v1.0.0</span>
          </div>
        </div>
      </div>
    </header>
  )
}
