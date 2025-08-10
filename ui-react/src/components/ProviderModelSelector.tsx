import { motion } from 'framer-motion'
import { CheckCircle, Key, Loader2, RefreshCw, ChevronDown } from 'lucide-react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'

interface Provider {
  id: string
  name: string
  enabled: boolean
  apiKey: string
  url: string
  customUrl?: string
  models?: string[]
  fetchingModels?: boolean
}

interface ProviderModelSelectorProps {
  providers: Record<string, Provider>
  setProviders: React.Dispatch<React.SetStateAction<Record<string, Provider>>>
  routerConfigs: Record<string, Record<string, string>>
  setRouterConfigs: React.Dispatch<React.SetStateAction<Record<string, Record<string, string>>>>
  modelsExpanded: Record<string, boolean>
  setModelsExpanded: React.Dispatch<React.SetStateAction<Record<string, boolean>>>
  handleFetchModels: (provider: Provider) => Promise<void>
}

export default function ProviderModelSelector({
  providers,
  setProviders,
  routerConfigs,
  setRouterConfigs,
  modelsExpanded,
  setModelsExpanded,
  handleFetchModels
}: ProviderModelSelectorProps) {
  return (
    <>
      {/* Provider Selection */}
      <div className="space-y-4">
        <Label className="text-white">Select Providers</Label>
        <div className="grid grid-cols-3 gap-4">
          {Object.entries(providers).map(([key, provider]) => (
            <motion.div
              key={key}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                provider.enabled 
                  ? 'bg-purple-500/20 border-purple-400' 
                  : 'bg-white/5 border-white/10'
              }`}
              onClick={() => setProviders(prev => ({
                ...prev,
                [key]: { ...prev[key], enabled: !prev[key].enabled }
              }))}
            >
              <div className="flex items-center justify-between">
                <span className="text-white font-medium">{provider.name}</span>
                <div className={`w-5 h-5 rounded-full ${
                  provider.enabled ? 'bg-purple-400' : 'bg-gray-600'
                }`}>
                  {provider.enabled && (
                    <CheckCircle className="w-5 h-5 text-white" />
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Provider Configurations */}
      {Object.entries(providers).map(([key, provider]) => 
        provider.enabled && (
          <motion.div
            key={key}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-4 p-4 bg-white/5 rounded-lg"
          >
            <h3 className="text-white font-medium flex items-center gap-2">
              <Key className="w-4 h-4" />
              {provider.name} Configuration
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor={`${key}-key`} className="text-gray-300">API Key</Label>
                <Input 
                  id={`${key}-key`}
                  type="password"
                  placeholder="Enter your API key"
                  className="bg-white/10 border-white/20 text-white"
                  value={provider.apiKey}
                  onChange={(e) => setProviders(prev => ({
                    ...prev,
                    [key]: { ...prev[key], apiKey: e.target.value }
                  }))}
                />
              </div>
              <div>
                <Label htmlFor={`${key}-url`} className="text-gray-300">API URL</Label>
                <Input 
                  id={`${key}-url`}
                  placeholder="API endpoint URL"
                  className="bg-white/10 border-white/20 text-white"
                  value={provider.url}
                  onChange={(e) => setProviders(prev => ({
                    ...prev,
                    [key]: { ...prev[key], url: e.target.value }
                  }))}
                />
              </div>
            </div>
            
            {/* Fetch Models Button */}
            <div className="mt-4 space-y-3">
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleFetchModels(provider)}
                  disabled={!provider.apiKey || !provider.url || provider.fetchingModels}
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
                {(!provider.apiKey || !provider.url) && (
                  <span className="text-xs text-gray-400">Fill API Key and URL first</span>
                )}
              </div>
              
              {/* Display fetched models */}
              {provider.models && provider.models.length > 0 && (
                <>
                  <div className="p-3 bg-black/30 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <Label className="text-gray-300 text-sm">Available Models ({provider.models.length})</Label>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          const newExpanded = { ...modelsExpanded };
                          newExpanded[key] = !newExpanded[key];
                          setModelsExpanded(newExpanded);
                        }}
                        className="text-gray-400 hover:text-white p-1"
                      >
                        <ChevronDown className={`w-4 h-4 transition-transform ${modelsExpanded[key] ? 'rotate-180' : ''}`} />
                      </Button>
                    </div>
                    <div className={`space-y-1 ${modelsExpanded[key] ? 'max-h-48' : 'max-h-20'} overflow-y-auto transition-all`}>
                      {(modelsExpanded[key] ? provider.models : provider.models.slice(0, 5)).map(model => (
                        <div key={model} className="text-xs text-gray-400 font-mono hover:text-gray-300 cursor-default">
                          {model}
                        </div>
                      ))}
                      {!modelsExpanded[key] && provider.models.length > 5 && (
                        <div className="text-xs text-gray-500">... and {provider.models.length - 5} more</div>
                      )}
                    </div>
                  </div>
                  
                  {/* Router Model Selection */}
                  <div className="p-3 bg-white/5 rounded-lg space-y-3">
                    <Label className="text-white text-sm font-medium">Router Model Configuration</Label>
                    <div className="text-xs text-gray-400 mb-2">
                      Select models for each Router field:
                    </div>
                    
                    {/* Quick apply to all */}
                    <div className="mb-3 pb-3 border-b border-white/10">
                      <div className="flex items-center gap-2">
                        <select
                          value="" // Always reset to empty after selection
                          className="flex-1 bg-black/30 border border-white/20 text-white text-xs rounded px-2 py-1.5"
                          onChange={(e) => {
                            const model = e.target.value;
                            if (model) {
                              setRouterConfigs(prev => ({
                                ...prev,
                                [key]: {
                                  default: model,
                                  background: model,
                                  think: model,
                                  longContext: model,
                                  webSearch: model
                                }
                              }));
                              // Reset the select value by forcing a re-render
                              e.target.value = "";
                            }
                          }}
                        >
                          <option value="">Apply same model to all...</option>
                          {provider.models.map(model => (
                            <option key={model} value={model}>{model}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    
                    {/* Individual selections */}
                    <div className="space-y-2">
                      {[
                        { field: 'default', label: 'Default', desc: 'Main model for general use' },
                        { field: 'background', label: 'Background', desc: 'For background tasks' },
                        { field: 'think', label: 'Think', desc: 'For reasoning tasks' },
                        { field: 'longContext', label: 'Long Context', desc: 'For long documents' },
                        { field: 'webSearch', label: 'Web Search', desc: 'For web search tasks' }
                      ].map(({ field, label, desc }) => (
                        <div key={field} className="grid grid-cols-3 gap-2 items-center">
                          <div>
                            <Label className="text-gray-300 text-xs">{label}</Label>
                            <p className="text-gray-500 text-[10px]">{desc}</p>
                          </div>
                          <select
                            className="col-span-2 bg-black/30 border border-white/20 text-white text-xs rounded px-2 py-1.5"
                            value={routerConfigs[key][field] || ''}
                            onChange={(e) => {
                              const model = e.target.value;
                              setRouterConfigs(prev => ({
                                ...prev,
                                [key]: {
                                  ...prev[key],
                                  [field]: model
                                }
                              }));
                            }}
                          >
                            <option value="">Select model...</option>
                            {provider.models.map(model => (
                              <option key={model} value={model}>{model}</option>
                            ))}
                          </select>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        )
      )}
    </>
  )
}
