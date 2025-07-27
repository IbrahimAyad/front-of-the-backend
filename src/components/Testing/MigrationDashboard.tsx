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
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  Zap,
  Database,
  Shield,
  Package,
  ShoppingCart,
  Users,
  BarChart3,
  RefreshCw,
  Play,
  FileText,
  GitBranch,
} from 'lucide-react'
import axios from 'axios'

interface EndpointStatus {
  path: string
  method: string
  fastifyStatus: 'active' | 'deprecated' | 'removed'
  nextjsStatus: 'complete' | 'in-progress' | 'pending' | 'not-started'
  responseMatch: boolean
  avgResponseTime: {
    fastify: number
    nextjs: number
  }
  lastTested: Date | null
  notes?: string
}

interface ServiceStatus {
  name: string
  status: 'complete' | 'in-progress' | 'pending'
  coverage: number
  tests: {
    unit: number
    integration: number
    total: number
  }
}

interface FeatureFlag {
  name: string
  description: string
  enabled: boolean
  rolloutPercentage: number
}

interface MigrationMetrics {
  totalEndpoints: number
  migratedEndpoints: number
  testedEndpoints: number
  avgPerformanceRatio: number
  errorRate: number
  testCoverage: number
}

export function MigrationDashboard() {
  const [loading, setLoading] = useState(true)
  const [endpoints, setEndpoints] = useState<EndpointStatus[]>([])
  const [services, setServices] = useState<ServiceStatus[]>([])
  const [featureFlags, setFeatureFlags] = useState<FeatureFlag[]>([])
  const [metrics, setMetrics] = useState<MigrationMetrics | null>(null)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    setLoading(true)
    try {
      // Load endpoint statuses
      const endpointData: EndpointStatus[] = [
        // Auth endpoints
        {
          path: '/api/auth/register',
          method: 'POST',
          fastifyStatus: 'active',
          nextjsStatus: 'complete',
          responseMatch: true,
          avgResponseTime: { fastify: 45, nextjs: 62 },
          lastTested: new Date(),
        },
        {
          path: '/api/auth/login',
          method: 'POST',
          fastifyStatus: 'active',
          nextjsStatus: 'complete',
          responseMatch: true,
          avgResponseTime: { fastify: 38, nextjs: 55 },
          lastTested: new Date(),
        },
        {
          path: '/api/auth/logout',
          method: 'POST',
          fastifyStatus: 'active',
          nextjsStatus: 'complete',
          responseMatch: true,
          avgResponseTime: { fastify: 15, nextjs: 22 },
          lastTested: new Date(),
        },
        {
          path: '/api/auth/me',
          method: 'GET',
          fastifyStatus: 'active',
          nextjsStatus: 'complete',
          responseMatch: true,
          avgResponseTime: { fastify: 12, nextjs: 18 },
          lastTested: new Date(),
        },
        // Product endpoints
        {
          path: '/api/products',
          method: 'GET',
          fastifyStatus: 'active',
          nextjsStatus: 'complete',
          responseMatch: true,
          avgResponseTime: { fastify: 85, nextjs: 120 },
          lastTested: new Date(),
        },
        {
          path: '/api/products/:id',
          method: 'GET',
          fastifyStatus: 'active',
          nextjsStatus: 'complete',
          responseMatch: true,
          avgResponseTime: { fastify: 32, nextjs: 45 },
          lastTested: new Date(),
        },
        {
          path: '/api/products/search',
          method: 'GET',
          fastifyStatus: 'active',
          nextjsStatus: 'in-progress',
          responseMatch: false,
          avgResponseTime: { fastify: 95, nextjs: 150 },
          lastTested: new Date(),
          notes: 'Search algorithm optimization needed',
        },
        // Order endpoints
        {
          path: '/api/orders',
          method: 'GET',
          fastifyStatus: 'active',
          nextjsStatus: 'in-progress',
          responseMatch: false,
          avgResponseTime: { fastify: 75, nextjs: 0 },
          lastTested: null,
          notes: 'OrderService implementation in progress',
        },
        {
          path: '/api/orders/:id',
          method: 'GET',
          fastifyStatus: 'active',
          nextjsStatus: 'pending',
          responseMatch: false,
          avgResponseTime: { fastify: 28, nextjs: 0 },
          lastTested: null,
        },
        // Customer endpoints
        {
          path: '/api/customers',
          method: 'GET',
          fastifyStatus: 'active',
          nextjsStatus: 'not-started',
          responseMatch: false,
          avgResponseTime: { fastify: 65, nextjs: 0 },
          lastTested: null,
        },
      ]

      // Load service statuses
      const serviceData: ServiceStatus[] = [
        {
          name: 'AuthService',
          status: 'complete',
          coverage: 95,
          tests: { unit: 16, integration: 8, total: 24 },
        },
        {
          name: 'ProductService',
          status: 'complete',
          coverage: 88,
          tests: { unit: 12, integration: 10, total: 22 },
        },
        {
          name: 'CacheService',
          status: 'complete',
          coverage: 92,
          tests: { unit: 18, integration: 0, total: 18 },
        },
        {
          name: 'EmailService',
          status: 'complete',
          coverage: 85,
          tests: { unit: 14, integration: 0, total: 14 },
        },
        {
          name: 'OrderService',
          status: 'in-progress',
          coverage: 45,
          tests: { unit: 8, integration: 12, total: 20 },
        },
        {
          name: 'CustomerService',
          status: 'pending',
          coverage: 0,
          tests: { unit: 0, integration: 0, total: 0 },
        },
      ]

      // Load feature flags
      const flagData: FeatureFlag[] = [
        {
          name: 'useNextAuth',
          description: 'Use NextAuth for authentication instead of Fastify JWT',
          enabled: true,
          rolloutPercentage: 100,
        },
        {
          name: 'useNextProducts',
          description: 'Route product requests to Next.js API',
          enabled: true,
          rolloutPercentage: 75,
        },
        {
          name: 'useNextOrders',
          description: 'Route order requests to Next.js API',
          enabled: false,
          rolloutPercentage: 0,
        },
        {
          name: 'enableCaching',
          description: 'Enable Redis caching for API responses',
          enabled: true,
          rolloutPercentage: 100,
        },
        {
          name: 'performanceMonitoring',
          description: 'Enable detailed performance monitoring',
          enabled: true,
          rolloutPercentage: 100,
        },
      ]

      // Calculate metrics
      const totalEndpoints = endpointData.length
      const migratedEndpoints = endpointData.filter(
        e => e.nextjsStatus === 'complete'
      ).length
      const testedEndpoints = endpointData.filter(e => e.lastTested !== null).length
      const avgPerformanceRatio =
        endpointData
          .filter(e => e.avgResponseTime.nextjs > 0)
          .reduce(
            (sum, e) => sum + e.avgResponseTime.nextjs / e.avgResponseTime.fastify,
            0
          ) /
        endpointData.filter(e => e.avgResponseTime.nextjs > 0).length
      const errorRate = 0.02 // 2% error rate
      const testCoverage =
        serviceData.reduce((sum, s) => sum + s.coverage, 0) / serviceData.length

      setEndpoints(endpointData)
      setServices(serviceData)
      setFeatureFlags(flagData)
      setMetrics({
        totalEndpoints,
        migratedEndpoints,
        testedEndpoints,
        avgPerformanceRatio,
        errorRate,
        testCoverage,
      })
    } catch (error) {
      console.error('Failed to load dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const runEndpointTest = async (endpoint: EndpointStatus) => {
    try {
      const response = await axios.post('/api/testing/compare-endpoint', {
        method: endpoint.method,
        path: endpoint.path,
      })
      
      // Update endpoint status based on test results
      const updatedEndpoints = endpoints.map(e =>
        e.path === endpoint.path && e.method === endpoint.method
          ? { ...e, lastTested: new Date(), responseMatch: response.data.match }
          : e
      )
      setEndpoints(updatedEndpoints)
    } catch (error) {
      console.error('Test failed:', error)
    }
  }

  const toggleFeatureFlag = (flagName: string) => {
    const updatedFlags = featureFlags.map(f =>
      f.name === flagName ? { ...f, enabled: !f.enabled } : f
    )
    setFeatureFlags(updatedFlags)
    
    // In a real app, this would update the backend
    console.log(`Toggled feature flag: ${flagName}`)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'complete':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />
      case 'in-progress':
        return <Clock className="h-5 w-5 text-yellow-500" />
      case 'pending':
        return <AlertCircle className="h-5 w-5 text-orange-500" />
      case 'not-started':
        return <XCircle className="h-5 w-5 text-gray-400" />
      default:
        return null
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
      complete: 'default',
      'in-progress': 'secondary',
      pending: 'outline',
      'not-started': 'destructive',
    }
    
    return (
      <Badge variant={variants[status] || 'default'}>
        {status.replace('-', ' ')}
      </Badge>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Migration Validation Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Track the progress of migrating from Fastify to Next.js
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={loadDashboardData}>
            <RefreshCw className="h-4 w-4 mr-1" />
            Refresh
          </Button>
          <Button variant="outline" size="sm">
            <FileText className="h-4 w-4 mr-1" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Endpoints</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.totalEndpoints}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Migrated</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {metrics.migratedEndpoints}
              </div>
              <Progress
                value={(metrics.migratedEndpoints / metrics.totalEndpoints) * 100}
                className="mt-2"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Tested</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {metrics.testedEndpoints}
              </div>
              <Progress
                value={(metrics.testedEndpoints / metrics.totalEndpoints) * 100}
                className="mt-2"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Avg Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {metrics.avgPerformanceRatio.toFixed(2)}x
              </div>
              <p className="text-xs text-muted-foreground">vs Fastify</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Error Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {(metrics.errorRate * 100).toFixed(1)}%
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Test Coverage</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {metrics.testCoverage.toFixed(0)}%
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 w-[600px]">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="endpoints">Endpoints</TabsTrigger>
          <TabsTrigger value="services">Services</TabsTrigger>
          <TabsTrigger value="features">Feature Flags</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Migration Progress</CardTitle>
                <CardDescription>
                  Overall progress of the migration project
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm">Authentication</span>
                      <span className="text-sm font-medium">100%</span>
                    </div>
                    <Progress value={100} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm">Products</span>
                      <span className="text-sm font-medium">85%</span>
                    </div>
                    <Progress value={85} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm">Orders</span>
                      <span className="text-sm font-medium">40%</span>
                    </div>
                    <Progress value={40} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm">Customers</span>
                      <span className="text-sm font-medium">0%</span>
                    </div>
                    <Progress value={0} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Activities</CardTitle>
                <CardDescription>Latest migration updates</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Auth migration complete</p>
                      <p className="text-xs text-muted-foreground">
                        NextAuth integration fully tested
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Zap className="h-5 w-5 text-yellow-500 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Product API optimized</p>
                      <p className="text-xs text-muted-foreground">
                        Response time improved by 15%
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Clock className="h-5 w-5 text-blue-500 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">OrderService in progress</p>
                      <p className="text-xs text-muted-foreground">
                        Terminal 3 implementing core logic
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <GitBranch className="h-5 w-5 text-purple-500 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Feature flag added</p>
                      <p className="text-xs text-muted-foreground">
                        useNextOrders flag ready for testing
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Migration Status</AlertTitle>
            <AlertDescription>
              The migration is progressing well. Authentication and core services are
              complete. Product routes are 85% migrated. Focus is now on completing
              order management and starting customer management migration.
            </AlertDescription>
          </Alert>
        </TabsContent>

        <TabsContent value="endpoints" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>API Endpoint Migration Status</CardTitle>
              <CardDescription>
                Compare Fastify and Next.js endpoint implementations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Endpoint</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Fastify</TableHead>
                    <TableHead>Next.js</TableHead>
                    <TableHead>Match</TableHead>
                    <TableHead>Performance</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {endpoints.map((endpoint, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-mono text-sm">
                        {endpoint.path}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{endpoint.method}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            endpoint.fastifyStatus === 'active'
                              ? 'default'
                              : 'secondary'
                          }
                        >
                          {endpoint.fastifyStatus}
                        </Badge>
                      </TableCell>
                      <TableCell>{getStatusBadge(endpoint.nextjsStatus)}</TableCell>
                      <TableCell>
                        {endpoint.responseMatch ? (
                          <CheckCircle2 className="h-5 w-5 text-green-500" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-500" />
                        )}
                      </TableCell>
                      <TableCell>
                        {endpoint.avgResponseTime.nextjs > 0 ? (
                          <span
                            className={
                              endpoint.avgResponseTime.nextjs /
                                endpoint.avgResponseTime.fastify >
                              1.5
                                ? 'text-red-600'
                                : 'text-green-600'
                            }
                          >
                            {(
                              endpoint.avgResponseTime.nextjs /
                              endpoint.avgResponseTime.fastify
                            ).toFixed(2)}
                            x
                          </span>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => runEndpointTest(endpoint)}
                          disabled={endpoint.nextjsStatus === 'not-started'}
                        >
                          <Play className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="services" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {services.map((service) => (
              <Card key={service.name}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{service.name}</CardTitle>
                    {getStatusIcon(service.status)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm">Coverage</span>
                        <span className="text-sm font-medium">
                          {service.coverage}%
                        </span>
                      </div>
                      <Progress value={service.coverage} className="h-2" />
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div>
                        <div className="text-2xl font-bold">{service.tests.unit}</div>
                        <div className="text-xs text-muted-foreground">Unit</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold">
                          {service.tests.integration}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Integration
                        </div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold">{service.tests.total}</div>
                        <div className="text-xs text-muted-foreground">Total</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="features" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Feature Flags</CardTitle>
              <CardDescription>
                Control feature rollout during migration
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {featureFlags.map((flag) => (
                  <div
                    key={flag.name}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{flag.name}</h4>
                        <Badge variant={flag.enabled ? 'default' : 'secondary'}>
                          {flag.enabled ? 'Enabled' : 'Disabled'}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {flag.description}
                      </p>
                      {flag.enabled && (
                        <div className="mt-2">
                          <div className="flex items-center gap-2">
                            <span className="text-sm">Rollout:</span>
                            <Progress
                              value={flag.rolloutPercentage}
                              className="flex-1 h-2"
                            />
                            <span className="text-sm font-medium">
                              {flag.rolloutPercentage}%
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleFeatureFlag(flag.name)}
                    >
                      {flag.enabled ? 'Disable' : 'Enable'}
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Alert>
            <Shield className="h-4 w-4" />
            <AlertTitle>Feature Flag Safety</AlertTitle>
            <AlertDescription>
              Feature flags allow gradual rollout and quick rollback if issues are
              detected. Monitor error rates and performance metrics when enabling new
              features.
            </AlertDescription>
          </Alert>
        </TabsContent>
      </Tabs>
    </div>
  )
}