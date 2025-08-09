import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Rocket, 
  Server, 
  Settings, 
  History, 
  Terminal,
  CheckCircle,
  AlertCircle,
  Loader2,
  Download,
  Cloud,
  Key,
  Globe,
  Sparkles
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Checkbox } from './ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Textarea } from './ui/textarea'
import { Badge } from './ui/badge'
import { Progress } from './ui/progress'
import { Switch } from './ui/switch'
import { Alert, AlertDescription } from './ui/alert'
import { useRef } from 'react'

interface Provider {
  id: string
  name: string
  enabled: boolean
  apiKey: string
  url: string
  customUrl?: string
}

interface Installation {
  id: string
  type: 'local' | 'remote'
  status: 'success' | 'pending' | 'failed'
  timestamp: string
  message: string
  provider?: string
}

interface ConsoleLog {
  type: string
  message: string
  timestamp?: string
}

interface RemoteConfigUI {
  host: string
  port: string
  username: string
  usePassword: boolean
  password: string
  privateKey: string
  passphrase: string
  registry?: string
  skipConfig?: boolean
  userInstall?: boolean
}

export default function ClaudeDeploy() {
  const [activeTab, setActiveTab] = useState('local')
  const [isInstalling, setIsInstalling] = useState(false)
  const [installProgress, setInstallProgress] = useState(0)
  const [consoleOutput, setConsoleOutput] = useState<ConsoleLog[]>([])
  const [providers, setProviders] = useState<Record<string, Provider>>({
    openai: { id: 'openai', name: 'OpenAI', enabled: true, apiKey: '', url: 'https://api.openai.com' },
    ucloud: { id: 'ucloud', name: 'UCloud', enabled: false, apiKey: '', url: 'https://api.modelverse.cn' },
    custom: { id: 'custom', name: 'Custom', enabled: false, apiKey: '', url: '', customUrl: '' }
  })
  const [installations, setInstallations] = useState<Installation[]>([])
  const [wsConnected, setWsConnected] = useState(false)
  const consoleRef = useRef<HTMLDivElement>(null)
  const [remote, setRemote] = useState<RemoteConfigUI>({
    host: '',
    port: '22',
    username: '',
    usePassword: false,
    password: '',
    privateKey: '',
    passphrase: '',
    registry: '',
    skipConfig: false,
    userInstall: false,
  })

  // WebSocket connection
  useEffect(() => {
    const connectWebSocket = () => {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
      const ws = new WebSocket(`${protocol}//${window.location.host}/ws`)
      
      ws.onopen = () => {
        setWsConnected(true)
        addConsoleLog('success', '✅ Connected to ClaudeDeploy server', new Date().toISOString())
      }
      
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          if (data.type === 'log') {
            addConsoleLog(data.level || 'info', data.message, data.timestamp)
            // Fallback: if we see clear success markers, end installing state
            const msg: string = String(data.message || '')
            if (/installation completed/i.test(msg) || /安装成功/.test(msg)) {
              setIsInstalling(false)
            }
          } else if (data.type === 'installation-complete') {
            const { installation, status, error } = data
            setInstallations(prev => {
              const exists = prev.some(item => item.id === installation?.id)
              if (exists) {
                return prev.map(item => item.id === installation?.id ? {
                  ...item,
                  status: status || 'failed',
                  message: status === 'success' ? 'Installation completed' : (error || 'Installation failed'),
                } : item)
              }
              // Fallback: update the earliest pending if exists to avoid duplicates
              const pendingIndex = prev.findIndex(item => item.status === 'pending')
              if (pendingIndex >= 0) {
                const copy = [...prev]
                copy[pendingIndex] = {
                  ...copy[pendingIndex],
                  id: installation?.id || copy[pendingIndex].id,
                  type: installation?.type || copy[pendingIndex].type,
                  status: status || 'failed',
                  message: status === 'success' ? 'Installation completed' : (error || 'Installation failed'),
                }
                return copy
              }
              // Otherwise append a new record
              const record = {
                id: installation?.id || Date.now().toString(),
                type: installation?.type || 'local',
                status: status || 'failed',
                timestamp: new Date().toLocaleString(),
                message: status === 'success' ? 'Installation completed' : (error || 'Installation failed'),
                provider: undefined,
              } as Installation
              return [record, ...prev]
            })
            setIsInstalling(false)
            addConsoleLog(status === 'success' ? 'success' : 'error', status === 'success' ? '✅ Installation completed' : `❌ Installation failed: ${error}`, new Date().toISOString())
          }
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error)
        }
      }
      
      ws.onclose = () => {
        setWsConnected(false)
        addConsoleLog('warning', '⚠️ Disconnected from server, reconnecting...', new Date().toISOString())
        setTimeout(connectWebSocket, 3000)
      }
      
      return ws
    }
    
    const ws = connectWebSocket()
    // Load initial history from backend
    fetch('/api/installations').then(async (r) => {
      if (r.ok) {
        const data = await r.json().catch(() => [])
        if (Array.isArray(data)) setInstallations(data as Installation[])
      }
    }).catch(() => {})
    return () => ws.close()
  }, [])

  const addConsoleLog = (type: string, message: string, timestamp?: string) => {
    setConsoleOutput(prev => [...prev, { type, message, timestamp }].slice(-100))
  }

  // Auto scroll to bottom on new logs
  useEffect(() => {
    if (consoleRef.current) {
      consoleRef.current.scrollTop = consoleRef.current.scrollHeight
    }
  }, [consoleOutput])

  const handleLocalInstall = async () => {
    const selectedProviders = Object.entries(providers)
      .filter(([_, p]) => p.enabled && p.apiKey && (p.url || p.customUrl))
      .map(([key, p]) => ({
        name: key,
        apiKey: p.apiKey,
        apiUrl: key === 'custom' ? (p.customUrl || p.url) : p.url,
      }))

    if (selectedProviders.length === 0) {
      addConsoleLog('warning', '⚠️ 请至少启用一个 Provider 并填写 API Key/URL')
      return
    }

    try {
      setIsInstalling(true)
      addConsoleLog('info', '🚀 正在开始本地安装...', new Date().toISOString())
      const res = await fetch('/api/install/local', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ providers: selectedProviders }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || `Request failed: ${res.status}`)
      addConsoleLog('success', '✅ 本地安装已开始，详细日志见下方 Console Output', new Date().toISOString())
      setInstallations(prev => ([{
        id: Date.now().toString(),
        type: 'local',
        status: 'pending',
        timestamp: new Date().toLocaleString(),
        message: 'Local installation in progress',
        provider: Object.keys(providers).find(p => providers[p].enabled)
      }, ...prev]))
    } catch (e: any) {
      addConsoleLog('error', `❌ 本地安装请求失败: ${e.message || e}`, new Date().toISOString())
      setIsInstalling(false)
    }
  }

  const handleRemoteInstall = async () => {
    if (!remote.host || !remote.username) {
      addConsoleLog('error', '❌ Host and Username are required')
      return
    }
    if (remote.usePassword && !remote.password) {
      addConsoleLog('error', '❌ Password is required for password auth')
      return
    }
    if (!remote.usePassword && !remote.privateKey) {
      addConsoleLog('error', '❌ SSH Private Key is required for key auth')
      return
    }
    try {
      setIsInstalling(true)
      addConsoleLog('info', '☁️ Starting remote installation...', new Date().toISOString())
      const body: any = {
        host: remote.host,
        port: remote.port,
        username: remote.username,
        registry: remote.registry || undefined,
        skipConfig: remote.skipConfig || undefined,
        userInstall: remote.userInstall || undefined,
        providers: {
          openai: providers.openai,
          ucloud: providers.ucloud,
          custom: providers.custom,
        },
      }
      if (remote.usePassword) {
        body.password = remote.password
      } else {
        body.privateKey = remote.privateKey
        if (remote.passphrase) body.passphrase = remote.passphrase
      }
      const res = await fetch('/api/install/remote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || `Request failed: ${res.status}`)
      }
      addConsoleLog('success', '✅ Remote installation started', new Date().toISOString())
      setInstallations(prev => ([{
        id: Date.now().toString(),
        type: 'remote',
        status: 'pending',
        timestamp: new Date().toLocaleString(),
        message: 'Remote installation in progress',
        provider: Object.keys(providers).find(p => providers[p].enabled)
      }, ...prev]))
    } catch (e: any) {
      addConsoleLog('error', `❌ Remote install error: ${e.message || e}`, new Date().toISOString())
      setIsInstalling(false)
    }
  }

  const handleGenerateConfig = async () => {
    const selectedProviders = Object.entries(providers)
      .filter(([_, p]) => p.enabled && p.apiKey && (p.url || p.customUrl))
      .map(([key, p]) => ({
        name: key,
        apiKey: p.apiKey,
        apiUrl: key === 'custom' ? (p.customUrl || p.url) : p.url,
      }))

    if (selectedProviders.length === 0) {
      addConsoleLog('warning', '⚠️ No enabled providers with API key configured', new Date().toISOString())
      return
    }
    try {
      addConsoleLog('info', '🔧 Generating configuration...', new Date().toISOString())
      const res = await fetch('/api/generate-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ providers: selectedProviders }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || `Request failed: ${res.status}`)
      addConsoleLog('success', `✅ Configuration generated: ${data.path || '~/.claude-code-router/config.json'}`, new Date().toISOString())
    } catch (e: any) {
      addConsoleLog('error', `❌ Config generation failed: ${e.message || e}`, new Date().toISOString())
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -inset-[10px] opacity-50">
          <motion.div
            className="absolute top-0 -left-4 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl"
            animate={{
              x: [0, 100, 0],
              y: [0, -100, 0],
            }}
            transition={{ duration: 20, repeat: Infinity }}
          />
          <motion.div
            className="absolute top-0 -right-4 w-72 h-72 bg-yellow-500 rounded-full mix-blend-multiply filter blur-xl"
            animate={{
              x: [0, -100, 0],
              y: [0, 100, 0],
            }}
            transition={{ duration: 25, repeat: Infinity }}
          />
          <motion.div
            className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl"
            animate={{
              x: [0, 100, 0],
              y: [0, -100, 0],
            }}
            transition={{ duration: 30, repeat: Infinity }}
          />
        </div>
      </div>

      {/* Header */}
      <motion.header 
        className="relative z-10 p-8 text-center"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <motion.div 
          className="inline-flex items-center justify-center mb-4"
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ duration: 4, repeat: Infinity }}
        >
          <Rocket className="w-16 h-16 text-yellow-400" />
        </motion.div>
        <motion.h1 
          className="text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600 mb-2"
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          ClaudeDeploy
        </motion.h1>
        <motion.p 
          className="text-xl text-gray-300"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          Universal Claude Code Installer
        </motion.p>
        
        {/* Connection Status */}
        <motion.div 
          className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.5 }}
        >
          <div className={`w-3 h-3 rounded-full ${wsConnected ? 'bg-green-400' : 'bg-red-400'} animate-pulse`} />
          <span className="text-sm text-gray-300">
            {wsConnected ? 'Connected' : 'Disconnected'}
          </span>
        </motion.div>
      </motion.header>

      {/* Main Content */}
      <motion.div 
        className="relative z-10 max-w-7xl mx-auto px-4 pb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-4 bg-white/10 backdrop-blur-sm">
            <TabsTrigger value="local" className="data-[state=active]:bg-white/20">
              <Download className="w-4 h-4 mr-2" />
              Local Install
            </TabsTrigger>
            <TabsTrigger value="remote" className="data-[state=active]:bg-white/20">
              <Cloud className="w-4 h-4 mr-2" />
              Remote Install
            </TabsTrigger>
            <TabsTrigger value="config" className="data-[state=active]:bg-white/20">
              <Settings className="w-4 h-4 mr-2" />
              Config
            </TabsTrigger>
            <TabsTrigger value="history" className="data-[state=active]:bg-white/20">
              <History className="w-4 h-4 mr-2" />
              History
            </TabsTrigger>
          </TabsList>

          <AnimatePresence mode="wait">
            <TabsContent value="local" className="space-y-4">
              <motion.div
                key="local"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Terminal className="w-5 h-5" />
                      Local Installation
                    </CardTitle>
                    <CardDescription className="text-gray-300">
                      Install Claude AI locally on your development environment
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
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
                        </motion.div>
                      )
                    )}

                    {/* Installation Status */}
                    {isInstalling && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-sm text-gray-300"
                      >
                        Installing... Follow the console logs below for real-time progress.
                      </motion.div>
                    )}

                    <Button 
                      onClick={handleLocalInstall}
                      disabled={isInstalling || !Object.values(providers).some(p => p.enabled)}
                      className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                    >
                      {isInstalling ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Installing...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 mr-2" />
                          Start Local Installation
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>

            <TabsContent value="remote" className="space-y-4">
              <motion.div
                key="remote"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Server className="w-5 h-5" />
                      Remote Deployment
                    </CardTitle>
                    <CardDescription className="text-gray-300">
                      Deploy Claude AI to your remote servers
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="host" className="text-gray-300">Host Address</Label>
                        <Input 
                          id="host"
                          placeholder="server.example.com"
                          className="bg-white/10 border-white/20 text-white"
                          value={remote.host}
                          onChange={(e) => setRemote(prev => ({ ...prev, host: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="port" className="text-gray-300">Port</Label>
                        <Input 
                          id="port"
                          placeholder="22"
                          defaultValue="22"
                          className="bg-white/10 border-white/20 text-white"
                          value={remote.port}
                          onChange={(e) => setRemote(prev => ({ ...prev, port: e.target.value }))}
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="username" className="text-gray-300">Username</Label>
                      <Input 
                        id="username"
                        placeholder="root"
                        className="bg-white/10 border-white/20 text-white"
                        value={remote.username}
                        onChange={(e) => setRemote(prev => ({ ...prev, username: e.target.value }))}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                      <div>
                        <Label className="text-white">Use Password Authentication</Label>
                        <p className="text-sm text-gray-400">Toggle to switch between password and SSH private key</p>
                      </div>
                      <Switch checked={remote.usePassword} onCheckedChange={(v) => setRemote(prev => ({ ...prev, usePassword: v }))} />
                    </div>

                    {remote.usePassword ? (
                      <div>
                        <Label htmlFor="password" className="text-gray-300">Password</Label>
                        <Input 
                          id="password"
                          type="password"
                          placeholder="Enter SSH password"
                          className="bg-white/10 border-white/20 text-white"
                          value={remote.password}
                          onChange={(e) => setRemote(prev => ({ ...prev, password: e.target.value }))}
                        />
                      </div>
                    ) : (
                      <>
                        <div>
                          <Label htmlFor="ssh-key" className="text-gray-300">SSH Private Key</Label>
                          <Textarea 
                            id="ssh-key"
                            placeholder="Paste your SSH private key here..."
                            className="bg-white/10 border-white/20 text-white min-h-[100px]"
                            value={remote.privateKey}
                            onChange={(e) => setRemote(prev => ({ ...prev, privateKey: e.target.value }))}
                          />
                        </div>
                        <div>
                          <Label htmlFor="passphrase" className="text-gray-300">Passphrase (optional)</Label>
                          <Input 
                            id="passphrase"
                            type="password"
                            placeholder="SSH key passphrase"
                            className="bg-white/10 border-white/20 text-white"
                            value={remote.passphrase}
                            onChange={(e) => setRemote(prev => ({ ...prev, passphrase: e.target.value }))}
                          />
                        </div>
                      </>
                    )}
                    
                    <Button 
                      onClick={handleRemoteInstall}
                      disabled={isInstalling}
                      className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
                    >
                      {isInstalling ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Deploying...
                        </>
                      ) : (
                        <>
                          <Cloud className="w-4 h-4 mr-2" />
                          Deploy to Remote Server
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>

            <TabsContent value="config" className="space-y-4">
              <motion.div
                key="config"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Settings className="w-5 h-5" />
                      Configuration Settings
                    </CardTitle>
                    <CardDescription className="text-gray-300">
                      Configure your Claude deployment settings
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-6">
                      {/* Provider Selection - same as Local */}
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

                      {/* Provider Configurations - same as Local */}
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
                                <Label htmlFor={`${key}-key-config`} className="text-gray-300">API Key</Label>
                                <Input 
                                  id={`${key}-key-config`}
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
                                <Label htmlFor={`${key}-url-config`} className="text-gray-300">API URL</Label>
                                <Input 
                                  id={`${key}-url-config`}
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
                          </motion.div>
                        )
                      )}

                      <Button onClick={handleGenerateConfig} className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600">
                        <Settings className="w-4 h-4 mr-2" />
                        Generate Router Configuration
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>

            <TabsContent value="history" className="space-y-4">
              <motion.div
                key="history"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <History className="w-5 h-5" />
                      Installation History
                    </CardTitle>
                    <CardDescription className="text-gray-300">
                      View your recent deployment activities
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {installations.length === 0 ? (
                      <div className="text-center py-8 text-gray-400">
                        <History className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>No installations yet</p>
                        <p className="text-sm">Start by installing Claude locally or remotely</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {installations.map((installation, index) => (
                          <motion.div
                            key={installation.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="flex items-center justify-between p-4 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              {installation.status === 'success' ? (
                                <CheckCircle className="w-5 h-5 text-green-400" />
                              ) : installation.status === 'pending' ? (
                                <Loader2 className="w-5 h-5 text-yellow-400 animate-spin" />
                              ) : (
                                <AlertCircle className="w-5 h-5 text-red-400" />
                              )}
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="text-white font-medium">
                                    {installation.type === 'local' ? 'Local' : 'Remote'} Installation
                                  </span>
                                  <Badge 
                                    variant={installation.status === 'success' ? 'default' : 'destructive'}
                                    className={
                                      installation.status === 'success' 
                                        ? 'bg-green-500/20 text-green-400 border-green-400/20' 
                                        : installation.status === 'pending'
                                        ? 'bg-yellow-500/20 text-yellow-400 border-yellow-400/20'
                                        : 'bg-red-500/20 text-red-400 border-red-400/20'
                                    }
                                  >
                                    {installation.status}
                                  </Badge>
                                </div>
                                <p className="text-sm text-gray-400">
                                  {installation.message} • {installation.timestamp}
                                </p>
                              </div>
                            </div>
                            {installation.provider && (
                              <Badge className="bg-purple-500/20 text-purple-400 border-purple-400/20">
                                {installation.provider}
                              </Badge>
                            )}
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>
          </AnimatePresence>
        </Tabs>

        {/* Console Output */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-6"
        >
          <Card className="bg-black/50 backdrop-blur-sm border-white/10">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-sm flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Terminal className="w-4 h-4" />
                  Console Output
                </span>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={() => setConsoleOutput([])}
                  className="text-gray-400 hover:text-white"
                >
                  Clear
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div ref={consoleRef} className="bg-black/80 rounded-lg p-4 h-48 overflow-y-auto font-mono text-sm">
                {consoleOutput.length === 0 ? (
                  <div className="text-gray-500">Waiting for output...</div>
                ) : (
                  consoleOutput.map((log, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`mb-1 ${
                        log.type === 'success' ? 'text-green-400' :
                        log.type === 'error' ? 'text-red-400' :
                        log.type === 'warning' ? 'text-yellow-400' :
                        'text-gray-300'
                      }`}
                    >
                      <span className="text-gray-500">[{(log.timestamp ? new Date(log.timestamp) : new Date()).toLocaleTimeString()}]</span> {log.message}
                                        </motion.div>
                   ))
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  )
}
