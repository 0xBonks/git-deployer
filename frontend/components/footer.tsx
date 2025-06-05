import { Github, Heart } from "lucide-react"

export function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 mt-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <div className="flex items-center space-x-2 text-gray-600">
            <span>Erstellt mit</span>
            <Heart className="h-4 w-4 text-red-500" />
            <span>für die Developer-Community</span>
          </div>

          <div className="flex items-center space-x-6">
            <div className="text-sm text-gray-500">Git Deployer © 2024</div>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <Github className="h-4 w-4" />
              <span className="text-sm">GitHub</span>
            </a>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-sm">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Unterstützte Plattformen</h3>
              <ul className="space-y-1 text-gray-600">
                <li>Docker</li>
                <li>AWS ECS</li>
                <li>Azure Container Apps</li>
                <li>OpenShift</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Git-Provider</h3>
              <ul className="space-y-1 text-gray-600">
                <li>GitHub</li>
                <li>GitLab</li>
                <li>Bitbucket</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Features</h3>
              <ul className="space-y-1 text-gray-600">
                <li>Automatische Konfiguration</li>
                <li>Download & Copy</li>
                <li>Schritt-für-Schritt Guides</li>
                <li>Best Practices</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Technologien</h3>
              <ul className="space-y-1 text-gray-600">
                <li>Next.js</li>
                <li>TypeScript</li>
                <li>Tailwind CSS</li>
                <li>shadcn/ui</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
