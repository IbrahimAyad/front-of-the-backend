#!/bin/bash

# Performance Testing Script
# Runs load tests using k6 or Artillery

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
BASE_URL="${BASE_URL:-http://localhost:3000}"
TOOL="${1:-k6}" # Default to k6, can pass 'artillery' as argument

echo "🚀 Performance Testing Suite"
echo "============================"
echo "Base URL: $BASE_URL"
echo "Tool: $TOOL"
echo ""

# Check if tools are installed
check_tool() {
    local tool=$1
    if ! command -v $tool &> /dev/null; then
        echo -e "${RED}Error: $tool is not installed${NC}"
        echo ""
        if [ "$tool" == "k6" ]; then
            echo "Install k6:"
            echo "  macOS: brew install k6"
            echo "  Linux: sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69"
            echo "         echo \"deb https://dl.k6.io/deb stable main\" | sudo tee /etc/apt/sources.list.d/k6.list"
            echo "         sudo apt-get update && sudo apt-get install k6"
        elif [ "$tool" == "artillery" ]; then
            echo "Install Artillery:"
            echo "  npm install -g artillery"
        fi
        exit 1
    fi
}

# Ensure the API is running
check_api() {
    echo -n "Checking API availability... "
    if curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/health" | grep -q "200"; then
        echo -e "${GREEN}✓ API is running${NC}"
    else
        echo -e "${RED}✗ API is not accessible${NC}"
        exit 1
    fi
}

# Get auth token
get_auth_token() {
    echo -n "Getting auth token... "
    local response=$(curl -s -X POST "$BASE_URL/api/auth/login" \
        -H "Content-Type: application/json" \
        -d '{"email":"admin@example.com","password":"admin123"}')
    
    AUTH_TOKEN=$(echo "$response" | jq -r '.token // .accessToken // empty')
    
    if [ ! -z "$AUTH_TOKEN" ]; then
        echo -e "${GREEN}✓ Got token${NC}"
    else
        echo -e "${YELLOW}⚠ Could not get auth token${NC}"
    fi
}

# Monitor system resources during test
monitor_resources() {
    local test_name=$1
    local pid=$2
    local log_file="performance-${test_name}-resources.log"
    
    echo "timestamp,cpu_percent,memory_mb,connections" > "$log_file"
    
    while kill -0 $pid 2>/dev/null; do
        timestamp=$(date +%s)
        
        # Get CPU usage (macOS vs Linux)
        if [[ "$OSTYPE" == "darwin"* ]]; then
            cpu=$(ps aux | grep "node\|fastify\|next" | awk '{sum+=$3} END {print sum}')
        else
            cpu=$(top -b -n 1 | grep "node\|fastify\|next" | awk '{sum+=$9} END {print sum}')
        fi
        
        # Get memory usage
        memory=$(ps aux | grep "node\|fastify\|next" | awk '{sum+=$6} END {print sum/1024}')
        
        # Get connection count
        connections=$(netstat -an | grep ":3000\|:3001" | grep ESTABLISHED | wc -l)
        
        echo "$timestamp,$cpu,$memory,$connections" >> "$log_file"
        sleep 5
    done
}

# Run k6 load test
run_k6_test() {
    echo -e "${BLUE}Running k6 Load Test${NC}"
    echo "------------------------"
    
    # Start resource monitoring
    monitor_resources "k6" $$ &
    MONITOR_PID=$!
    
    # Run the test
    k6 run \
        -e BASE_URL="$BASE_URL" \
        -e AUTH_TOKEN="$AUTH_TOKEN" \
        --out json=k6-results.json \
        --summary-export=k6-summary.json \
        tests/performance/k6-load-test.js
    
    # Stop monitoring
    kill $MONITOR_PID 2>/dev/null || true
    
    # Generate HTML report
    if [ -f "k6-summary.json" ]; then
        echo ""
        echo "Generating HTML report..."
        generate_k6_report
    fi
}

# Run Artillery load test
run_artillery_test() {
    echo -e "${BLUE}Running Artillery Load Test${NC}"
    echo "------------------------------"
    
    # Update Artillery config with correct URL
    sed -i.bak "s|target:.*|target: \"$BASE_URL\"|" tests/performance/artillery-config.yml
    
    # Start resource monitoring
    monitor_resources "artillery" $$ &
    MONITOR_PID=$!
    
    # Run the test
    artillery run \
        --output artillery-results.json \
        tests/performance/artillery-config.yml
    
    # Stop monitoring
    kill $MONITOR_PID 2>/dev/null || true
    
    # Generate report
    artillery report artillery-results.json
    
    # Restore original config
    mv tests/performance/artillery-config.yml.bak tests/performance/artillery-config.yml
}

# Generate k6 HTML report
generate_k6_report() {
    cat > k6-report.html << 'EOF'
<!DOCTYPE html>
<html>
<head>
    <title>k6 Performance Test Report</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .metric { display: inline-block; margin: 10px; padding: 20px; background: #f8f9fa; border-radius: 8px; min-width: 200px; }
        .metric h3 { margin: 0 0 10px 0; color: #333; }
        .metric .value { font-size: 2em; font-weight: bold; color: #007bff; }
        .metric .unit { color: #666; }
        .chart-container { margin: 30px 0; height: 400px; }
        .status-pass { color: #28a745; }
        .status-fail { color: #dc3545; }
    </style>
</head>
<body>
    <div class="container">
        <h1>k6 Performance Test Report</h1>
        <p>Generated: <span id="timestamp"></span></p>
        
        <h2>Summary Metrics</h2>
        <div id="metrics"></div>
        
        <h2>Response Time Distribution</h2>
        <div class="chart-container">
            <canvas id="responseTimeChart"></canvas>
        </div>
        
        <h2>Requests Per Second</h2>
        <div class="chart-container">
            <canvas id="rpsChart"></canvas>
        </div>
        
        <h2>Virtual Users</h2>
        <div class="chart-container">
            <canvas id="vusChart"></canvas>
        </div>
    </div>
    
    <script>
        // Load test data
        fetch('k6-summary.json')
            .then(res => res.json())
            .then(data => {
                // Display timestamp
                document.getElementById('timestamp').textContent = new Date().toLocaleString();
                
                // Display metrics
                const metricsDiv = document.getElementById('metrics');
                const metrics = data.metrics;
                
                // Key metrics to display
                const keyMetrics = [
                    { key: 'http_reqs', label: 'Total Requests', unit: '' },
                    { key: 'http_req_duration', label: 'Avg Response Time', unit: 'ms', value: 'avg' },
                    { key: 'http_req_duration', label: 'P95 Response Time', unit: 'ms', value: 'p(95)' },
                    { key: 'http_req_failed', label: 'Failed Requests', unit: '%', value: 'rate', multiply: 100 },
                    { key: 'vus_max', label: 'Max VUs', unit: '' },
                ];
                
                keyMetrics.forEach(metric => {
                    if (metrics[metric.key]) {
                        const div = document.createElement('div');
                        div.className = 'metric';
                        
                        let value = metrics[metric.key].values?.[metric.value || 'value'] || metrics[metric.key].value || 0;
                        if (metric.multiply) value *= metric.multiply;
                        
                        div.innerHTML = \`
                            <h3>\${metric.label}</h3>
                            <div class="value">\${value.toFixed(2)}</div>
                            <div class="unit">\${metric.unit}</div>
                        \`;
                        metricsDiv.appendChild(div);
                    }
                });
                
                // Load detailed results for charts
                fetch('k6-results.json')
                    .then(res => res.text())
                    .then(text => {
                        const lines = text.trim().split('\\n').map(line => JSON.parse(line));
                        createCharts(lines);
                    });
            });
        
        function createCharts(data) {
            // Prepare data
            const points = data.filter(d => d.type === 'Point' && d.metric === 'http_req_duration');
            const iterations = data.filter(d => d.type === 'Iter');
            
            // Response time over time
            const responseTimeData = points.map(p => ({
                x: new Date(p.data.time),
                y: p.data.value
            })).sort((a, b) => a.x - b.x);
            
            new Chart(document.getElementById('responseTimeChart'), {
                type: 'line',
                data: {
                    datasets: [{
                        label: 'Response Time (ms)',
                        data: responseTimeData,
                        borderColor: 'rgb(75, 192, 192)',
                        tension: 0.1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        x: { type: 'time' }
                    }
                }
            });
        }
    </script>
</body>
</html>
EOF
    
    echo -e "${GREEN}✓ HTML report generated: k6-report.html${NC}"
}

# Main execution
check_api
get_auth_token

if [ "$TOOL" == "k6" ]; then
    check_tool k6
    run_k6_test
elif [ "$TOOL" == "artillery" ]; then
    check_tool artillery
    run_artillery_test
else
    echo -e "${RED}Unknown tool: $TOOL${NC}"
    echo "Usage: $0 [k6|artillery]"
    exit 1
fi

# Display resource usage summary
echo ""
echo -e "${BLUE}Resource Usage Summary${NC}"
echo "----------------------"

if [ -f "performance-${TOOL}-resources.log" ]; then
    # Calculate averages
    avg_cpu=$(awk -F, 'NR>1 {sum+=$2; count++} END {print sum/count}' "performance-${TOOL}-resources.log")
    avg_mem=$(awk -F, 'NR>1 {sum+=$3; count++} END {print sum/count}' "performance-${TOOL}-resources.log")
    max_conn=$(awk -F, 'NR>1 {if($4>max) max=$4} END {print max}' "performance-${TOOL}-resources.log")
    
    echo "Average CPU Usage: ${avg_cpu}%"
    echo "Average Memory Usage: ${avg_mem} MB"
    echo "Max Connections: ${max_conn}"
fi

echo ""
echo -e "${GREEN}Performance testing complete!${NC}"
echo "Check the generated reports for detailed results."