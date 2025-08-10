import { useState } from 'react'
import { Button } from './ui/button'
import { Label } from './ui/label'
import { RefreshCw, Loader2, ChevronDown } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface ModelSelectorProps {
  provider: {
    id: string
    name: string
    apiKey: string
    url: string
    customUrl?: string
    models?: string[]
    fetchingModels?: boolean
  }
  onFetchModels: (provider: any) => void
  routerConfig: {
    default: string
    background: string
    think: string
    longContext: string
    webSearch: string
  }
  onRouterConfigChange: (config: any) => void
}

export default function ModelSelector({ provider, onFetchModels, routerConfig, onRouterConfigChange }: ModelSelectorProps) {
  const [expanded, setExpanded] = useState(false)
  const [selectedModel, setSelectedModel] = useState('')
  
  const apiUrl = provider.id === 'custom' ? (provider.customUrl || provider.url) : provider.url
  const canFetch = provider.apiKey && apiUrl
  
  const handleSelectModel = (model: string) => {
    setSelectedModel(model)
    // Apply to all router configs
    const newConfig = {
      default: `${provider.id},${model}`,
      background: `${provider.id},${model}`,
      think: `${provider.id},${model}`,
      longContext: `${provider.id},${model}`,
      webSearch: `${provider.id},${model}`
    }
    onRouterConfigChange(newConfig)
  }
  
  const handleRouterFieldChange = (field: string, model: string) => {
    onRouterConfigChange({
      ...routerConfig,
      [field]: `${provider.id},${model}`
    })
  }

  return (
    <div className="space-y-4">
      {/* Fetch Models Button */}
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => onFetchModels(provider)}
          disabled={!canFetch || provider.fetchingModels}
          className="bg-white/10 border-white/20 text-white hover:bg-white/20"
        >
          {provider.fetchingModels ? (
            <>
              <Loader2 className="w-4 h-4 mr-1 animate-spin" />
              Fetching...
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4 mr-1" />
              Fetch Models
            </>
          )}
        </Button>
        {!canFetch && (
          <span className="text-xs text-gray-400">Fill API Key and URL first</span>
        )}
      </div>

      {/* Models List */}
      {provider.models && provider.models.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-gray-300">Available Models ({provider.models.length})</Label>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setExpanded(!expanded)}
              className="text-gray-400 hover:text-white"
            >
              <ChevronDown className={`w-4 h-4 transition-transform ${expanded ? 'rotate-180' : ''}`} />
            </Button>
          </div>
          
          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="max-h-48 overflow-y-auto bg-black/30 rounded-lg p-3 space-y-2">
                  {provider.models.map(model => (
                    <div
                      key={model}
                      className={`px-3 py-2 rounded cursor-pointer transition-colors ${
                        selectedModel === model 
                          ? 'bg-purple-500/30 text-white' 
                          : 'hover:bg-white/10 text-gray-300'
                      }`}
                      onClick={() => handleSelectModel(model)}
                    >
                      <span className="text-sm font-mono">{model}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Router Configuration */}
          <div className="space-y-3 p-4 bg-white/5 rounded-lg">
            <h4 className="text-white text-sm font-medium">Router Configuration</h4>
            <div className="text-xs text-gray-400 mb-3">
              Select a model above to apply to all, or customize each:
            </div>
            
            {['default', 'background', 'think', 'longContext', 'webSearch'].map(field => (
              <div key={field} className="grid grid-cols-3 gap-2 items-center">
                <Label className="text-gray-400 text-xs capitalize">{field}:</Label>
                <select
                  className="col-span-2 bg-black/30 border border-white/20 text-white text-xs rounded px-2 py-1"
                  value={routerConfig[field as keyof typeof routerConfig]?.split(',')[1] || ''}
                  onChange={(e) => handleRouterFieldChange(field, e.target.value)}
                >
                  <option value="">Select model...</option>
                  {provider.models?.map(model => (
                    <option key={model} value={model}>{model}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
