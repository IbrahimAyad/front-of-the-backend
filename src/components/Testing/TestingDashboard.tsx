import React, { useState, useEffect } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Activity,
  Database,
  HardDrive,
  Server,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Download,
  Play,
} from 'lucide-react'
import axios from 'axios'

interface SystemMetrics {
  timestamp: Date
  performance: PerformanceStats[]
  memory: MemoryStats
  database: DatabaseMetrics
  cache: CacheMetrics
  errors: ErrorMetrics[]
}

interface PerformanceStats {
  name: string
  count: number
  min: number
  max: number
  avg: number
  p50: number
  p95: number
  p99: number
}

interface MemoryStats {
  heapUsed: number
  heapTotal: number
  external: number
  rss: number
  timestamp: Date
}

interface DatabaseMetrics {
  activeConnections: number
  queryCount: number
  slowQueries: number
  avgQueryTime: number
}

interface CacheMetrics {
  hitRate: number
  missRate: number
  evictionRate: number
  memoryUsage: number
  keyCount: number
}

interface ErrorMetrics {
  timestamp: Date
  type: string
  message: string
  endpoint?: string
}

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1']

export function TestingDashboard() {
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [autoRefresh, setAutoRefresh] = useState(false)
  const [memoryHistory, setMemoryHistory] = useState<MemoryStats[]>([])

  const fetchMetrics = async () => {
    try {
      const response = await axios.get('/api/monitoring/metrics')
      const data = response.data
      
      // Convert timestamps
      data.timestamp = new Date(data.timestamp)
      data.memory.timestamp = new Date(data.memory.timestamp)
      data.errors = data.errors.map((e: any) => ({
        ...e,
        timestamp: new Date(e.timestamp),
      }))

      setMetrics(data)
      
      // Update memory history
      setMemoryHistory(prev => {
        const newHistory = [...prev, data.memory]
        // Keep only last 20 data points
        return newHistory.slice(-20)
      })
      
      setError(null)
    } catch (err) {
      setError('Failed to fetch metrics')
      console.error('Metrics fetch error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMetrics()
  }, [])

  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(fetchMetrics, 5000)
    return () => clearInterval(interval)
  }, [autoRefresh])

  const downloadReport = async () => {
    try {
      const response = await axios.get('/api/monitoring/report', {
        responseType: 'text',
      })
      
      const blob = new Blob([response.data], { type: 'text/plain' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `metrics-report-${new Date().toISOString()}.txt`
      a.click()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Failed to download report:', err)
    }
  }

  const runApiComparison = async () => {
    try {
      const response = await axios.post('/api/testing/compare')
      console.log('API comparison started:', response.data)
    } catch (err) {
      console.error('Failed to run API comparison:', err)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (error || !metrics) {
    return (
      <Alert className="m-4">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>{error || 'No metrics available'}</AlertDescription>
      </Alert>
    )
  }

  const performanceData = metrics.performance.map(stat => ({
    name: stat.name.replace(/^(HTTP|DB|Cache)\./, ''),
    avg: parseFloat(stat.avg.toFixed(2)),
    p95: parseFloat(stat.p95.toFixed(2)),
    p99: parseFloat(stat.p99.toFixed(2)),
  }))

  const memoryData = memoryHistory.map((mem, index) => ({
    time: index,
    heapUsed: mem.heapUsed / 1024 / 1024,
    heapTotal: mem.heapTotal / 1024 / 1024,
    rss: mem.rss / 1024 / 1024,
  }))

  const cacheData = [
    { name: 'Hit Rate', value: metrics.cache.hitRate * 100 },
    { name: 'Miss Rate', value: metrics.cache.missRate * 100 },
  ]

  const errorsByType = metrics.errors.reduce((acc, error) => {
    acc[error.type] = (acc[error.type] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const errorData = Object.entries(errorsByType).map(([type, count]) => ({
    name: type,
    value: count,
  }))

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Testing & Monitoring Dashboard</h1>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${autoRefresh ? 'animate-spin' : ''}`} />
            {autoRefresh ? 'Stop' : 'Auto'} Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={fetchMetrics}>
            <RefreshCw className="h-4 w-4 mr-1" />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={downloadReport}>
            <Download className="h-4 w-4 mr-1" />
            Download Report
          </Button>
          <Button variant="outline" size="sm" onClick={runApiComparison}>
            <Play className="h-4 w-4 mr-1" />
            Run API Comparison
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Memory Usage</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(metrics.memory.heapUsed / 1024 / 1024).toFixed(0)} MB
            </div>
            <p className="text-xs text-muted-foreground">
              of {(metrics.memory.heapTotal / 1024 / 1024).toFixed(0)} MB heap
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Database</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.database.queryCount}</div>
            <p className="text-xs text-muted-foreground">
              queries ({metrics.database.slowQueries} slow)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cache Hit Rate</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(metrics.cache.hitRate * 100).toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              {metrics.cache.keyCount} keys
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Errors</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.errors.length}</div>
            <p className="text-xs text-muted-foreground">
              in last monitoring period
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="performance" className="space-y-4">
        <TabsList>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="memory">Memory</TabsTrigger>
          <TabsTrigger value="database">Database</TabsTrigger>
          <TabsTrigger value="cache">Cache</TabsTrigger>
          <TabsTrigger value="errors">Errors</TabsTrigger>
        </TabsList>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>API Performance Metrics</CardTitle>
              <CardDescription>
                Response times by endpoint (milliseconds)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="avg" fill="#8884d8" name="Average" />
                  <Bar dataKey="p95" fill="#82ca9d" name="P95" />
                  <Bar dataKey="p99" fill="#ffc658" name="P99" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="memory" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Memory Usage Over Time</CardTitle>
              <CardDescription>Heap and RSS memory usage in MB</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={memoryData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="heapUsed"
                    stroke="#8884d8"
                    name="Heap Used"
                  />
                  <Line
                    type="monotone"
                    dataKey="heapTotal"
                    stroke="#82ca9d"
                    name="Heap Total"
                  />
                  <Line
                    type="monotone"
                    dataKey="rss"
                    stroke="#ffc658"
                    name="RSS"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="database" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Database Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="space-y-2">
                  <div className="flex justify-between">
                    <dt>Active Connections:</dt>
                    <dd className="font-medium">{metrics.database.activeConnections}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt>Total Queries:</dt>
                    <dd className="font-medium">{metrics.database.queryCount}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt>Slow Queries:</dt>
                    <dd className="font-medium text-orange-600">
                      {metrics.database.slowQueries}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt>Avg Query Time:</dt>
                    <dd className="font-medium">
                      {metrics.database.avgQueryTime.toFixed(2)}ms
                    </dd>
                  </div>
                </dl>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Query Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {metrics.database.slowQueries > 0 && (
                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        {metrics.database.slowQueries} slow queries detected
                      </AlertDescription>
                    </Alert>
                  )}
                  {metrics.database.avgQueryTime > 50 && (
                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        Average query time is high ({metrics.database.avgQueryTime.toFixed(2)}ms)
                      </AlertDescription>
                    </Alert>
                  )}
                  {metrics.database.slowQueries === 0 && metrics.database.avgQueryTime <= 50 && (
                    <Alert className="border-green-200 bg-green-50">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <AlertDescription className="text-green-800">
                        Database performance is optimal
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="cache" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Cache Hit/Miss Ratio</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={cacheData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value.toFixed(1)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {cacheData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Cache Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="space-y-2">
                  <div className="flex justify-between">
                    <dt>Memory Usage:</dt>
                    <dd className="font-medium">
                      {(metrics.cache.memoryUsage / 1024 / 1024).toFixed(2)} MB
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt>Key Count:</dt>
                    <dd className="font-medium">{metrics.cache.keyCount}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt>Hit Rate:</dt>
                    <dd className="font-medium text-green-600">
                      {(metrics.cache.hitRate * 100).toFixed(2)}%
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt>Eviction Rate:</dt>
                    <dd className="font-medium">
                      {(metrics.cache.evictionRate * 100).toFixed(2)}%
                    </dd>
                  </div>
                </dl>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="errors" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Errors</CardTitle>
              <CardDescription>Last {metrics.errors.length} errors</CardDescription>
            </CardHeader>
            <CardContent>
              {metrics.errors.length === 0 ? (
                <Alert className="border-green-200 bg-green-50">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    No recent errors
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-2">
                  {errorData.length > 0 && (
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie
                          data={errorData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, value }) => `${name}: ${value}`}
                          outerRadius={60}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {errorData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                  
                  <div className="mt-4 max-h-64 overflow-y-auto">
                    {metrics.errors.slice(-10).reverse().map((error, index) => (
                      <div key={index} className="border-b py-2">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <Badge variant="destructive" className="mb-1">
                              {error.type}
                            </Badge>
                            <p className="text-sm text-gray-600">{error.message}</p>
                            {error.endpoint && (
                              <p className="text-xs text-gray-500">
                                Endpoint: {error.endpoint}
                              </p>
                            )}
                          </div>
                          <span className="text-xs text-gray-400">
                            {new Date(error.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}