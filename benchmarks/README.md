# Performance Benchmarks

This directory contains comprehensive performance testing configurations using Artillery for load testing, stress testing, spike testing, and endurance testing.

## Quick Start

```bash
# Install Artillery (if not already installed)
npm install -g artillery

# Run all benchmark tests
./run-benchmarks.sh

# Run only load test (quick validation)
./run-benchmarks.sh --quick

# Run specific tests
./run-benchmarks.sh load stress
```

## Test Configurations

### 1. Load Test (`load-test.yml`)
**Purpose:** Standard performance baseline testing
- **Duration:** ~11 minutes
- **Peak Load:** 50 concurrent users
- **Scenarios:** Public browsing, authentication, customer management, orders, admin operations
- **Thresholds:** 
  - P95 < 500ms
  - P99 < 1000ms
  - Error rate < 1%

### 2. Stress Test (`stress-test.yml`)
**Purpose:** Find system breaking points and limits
- **Duration:** ~15 minutes
- **Peak Load:** 500 concurrent users
- **Focus:** Database intensive operations, search/filter load, auth stress, rate limiting
- **Thresholds:**
  - P95 < 2000ms
  - P99 < 5000ms
  - Error rate < 10%

### 3. Spike Test (`spike-test.yml`)
**Purpose:** Test resilience to sudden traffic spikes
- **Duration:** ~8 minutes
- **Pattern:** Baseline → Spike (100 users) → Baseline → Larger Spike (200 users) → Recovery
- **Focus:** Product browsing, authentication bursts, search spikes
- **Thresholds:**
  - P95 < 1000ms
  - Error rate < 5%

### 4. Endurance Test (`endurance-test.yml`)
**Purpose:** Long-running stability testing
- **Duration:** ~2.5 hours
- **Load:** Sustained 20 concurrent users
- **Focus:** Memory leaks, connection pooling, database performance degradation
- **Thresholds:**
  - P95 < 800ms
  - P99 < 2000ms
  - Error rate < 2%

## Test Scenarios

Each configuration includes realistic user behavior patterns:

### Public API Usage (40% of traffic)
- Product browsing and search
- Category filtering
- Pagination
- No authentication required

### User Authentication (20% of traffic)
- Login/logout flows
- Token validation
- Profile access

### Customer Management (15% of traffic)
- Customer listing and search
- Customer analytics
- Admin-only operations

### Order Processing (15% of traffic)
- Order history
- Order statistics
- User-specific data

### Admin Operations (10% of traffic)
- Product statistics
- Best sellers analysis
- Price distribution
- Administrative tasks

## Metrics Tracked

### Response Time Metrics
- **Median:** 50th percentile response time
- **P95:** 95th percentile (95% of requests faster than this)
- **P99:** 99th percentile (99% of requests faster than this)

### Throughput Metrics
- **RPS:** Requests per second
- **Concurrent Users:** Number of simultaneous users
- **Total Requests:** Total requests processed

### Error Metrics
- **Error Rate:** Percentage of failed requests
- **Status Codes:** Distribution of HTTP response codes
- **Timeout Rate:** Percentage of requests that timed out

### Custom Metrics
- **Authentication Success Rate:** Successful logins vs attempts
- **Database Response Time:** Specific tracking for DB operations
- **Endpoint-Specific Performance:** Individual API endpoint analysis

## Running Tests

### Prerequisites
```bash
# Install Artillery globally
npm install -g artillery

# Verify installation
artillery version

# Ensure API server is running
curl http://localhost:3000/health
```

### Basic Usage
```bash
# Run all tests (recommended for comprehensive analysis)
./run-benchmarks.sh

# Quick validation (load test only)
./run-benchmarks.sh --quick

# Test specific environment
./run-benchmarks.sh -u https://api.production.com

# Run individual test types
./run-benchmarks.sh load        # Load test only
./run-benchmarks.sh stress      # Stress test only
./run-benchmarks.sh spike       # Spike test only
./run-benchmarks.sh endurance   # Endurance test only (2+ hours)
```

### Advanced Usage
```bash
# Multiple specific tests
./run-benchmarks.sh load stress spike

# Custom URL with specific tests
./run-benchmarks.sh -u http://staging.example.com load stress

# Help and options
./run-benchmarks.sh --help
```

## Results and Reports

After running tests, results are saved in `./benchmark-results/TIMESTAMP/`:

### Generated Files
- `summary.md` - Executive summary of all test results
- `{test-name}-report.html` - Detailed HTML reports with charts
- `{test-name}-raw.json` - Raw test data for further analysis
- `{test-name}-output.log` - Console output and error logs

### Key Metrics to Monitor

#### Performance Indicators
- **Response Time Trends:** Should remain stable under load
- **Error Rate:** Should stay below threshold limits
- **Throughput:** Requests per second capacity

#### Warning Signs
- **Increasing Response Times:** May indicate resource bottlenecks
- **High Error Rates:** Could suggest system instability
- **Memory Issues:** Look for degrading performance over time

#### Success Criteria
✅ **Good Performance:**
- P95 response time < 500ms under normal load
- Error rate < 1% during load testing
- Stable performance during endurance testing

⚠️ **Acceptable Performance:**
- P95 response time < 1000ms under stress
- Error rate < 5% during spike testing
- Graceful degradation under extreme load

❌ **Poor Performance:**
- P95 response time > 2000ms under normal load
- Error rate > 10% during regular testing
- System crashes or becomes unresponsive

## Troubleshooting

### Common Issues

#### API Not Responding
```bash
# Check if server is running
curl http://localhost:3000/health

# Check server logs
tail -f logs/server.log
```

#### Artillery Installation Issues
```bash
# Reinstall Artillery
npm uninstall -g artillery
npm install -g artillery

# Check Node.js version (requires Node 14+)
node --version
```

#### High Error Rates
- Check server resource usage (CPU, memory, database connections)
- Verify database connection limits
- Review rate limiting configuration
- Check for proper error handling in API endpoints

#### Slow Response Times
- Monitor database query performance
- Check for N+1 query problems
- Review caching implementation
- Verify proper indexing on database tables

### Performance Optimization Tips

#### Database Optimization
- Add indexes on frequently queried columns
- Implement connection pooling
- Use read replicas for read-heavy operations
- Optimize slow queries

#### Caching Strategy
- Implement Redis caching for frequently accessed data
- Use CDN for static assets
- Cache database query results
- Implement application-level caching

#### Server Configuration
- Tune server thread/worker pools
- Optimize garbage collection settings
- Configure proper connection limits
- Implement health check endpoints

## Integration with CI/CD

### GitHub Actions Example
```yaml
name: Performance Tests
on:
  push:
    branches: [main]

jobs:
  performance:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      
      - name: Install Artillery
        run: npm install -g artillery
      
      - name: Start API Server
        run: |
          npm install
          npm run start:test &
          sleep 30
      
      - name: Run Load Tests
        run: ./benchmarks/run-benchmarks.sh --quick
      
      - name: Upload Results
        uses: actions/upload-artifact@v2
        with:
          name: performance-results
          path: benchmarks/benchmark-results/
```

## Monitoring and Alerting

### Key Metrics to Alert On
- Response time P95 > 1000ms
- Error rate > 5%
- CPU usage > 80%
- Memory usage > 85%
- Database connection pool exhaustion

### Recommended Tools
- **APM:** New Relic, DataDog, or Sentry
- **Infrastructure:** Prometheus + Grafana
- **Logs:** ELK Stack or Loki
- **Alerts:** PagerDuty or Slack integration

## Next Steps

After running benchmarks:

1. **Analyze Results:** Review HTML reports and identify bottlenecks
2. **Optimize Performance:** Address identified issues
3. **Baseline Establishment:** Document current performance levels
4. **Continuous Monitoring:** Set up regular performance testing
5. **Alert Thresholds:** Configure monitoring based on test results