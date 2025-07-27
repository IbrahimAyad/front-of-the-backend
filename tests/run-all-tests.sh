#!/bin/bash

# Comprehensive Test Runner
# Executes all testing suites in the correct order

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Configuration
API_URL="${API_URL:-http://localhost:3000}"
RESULTS_DIR="./test-results"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
REPORT_DIR="${RESULTS_DIR}/${TIMESTAMP}"

# Test tracking
TOTAL_SUITES=0
PASSED_SUITES=0
FAILED_SUITES=0

echo -e "${BLUE}🚀 Starting Comprehensive Test Suite${NC}"
echo -e "${BLUE}==================================${NC}"
echo -e "${BLUE}Target API: ${API_URL}${NC}"
echo -e "${BLUE}Timestamp: ${TIMESTAMP}${NC}"

# Create results directory
mkdir -p "${REPORT_DIR}"

# Function to log with timestamp
log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') $1" | tee -a "${REPORT_DIR}/test-run.log"
}

# Function to run a test suite
run_test_suite() {
    local suite_name=$1
    local command=$2
    local description=$3
    
    ((TOTAL_SUITES++))
    
    log ""
    log "🎯 Running ${suite_name}"
    log "Description: ${description}"
    log "Command: ${command}"
    log "----------------------------------------"
    
    if eval $command > "${REPORT_DIR}/${suite_name}.log" 2>&1; then
        log "✅ ${suite_name} PASSED"
        ((PASSED_SUITES++))
    else
        log "❌ ${suite_name} FAILED"
        ((FAILED_SUITES++))
        
        # Show last few lines of failed test
        echo -e "${RED}Last 10 lines of ${suite_name}:${NC}"
        tail -10 "${REPORT_DIR}/${suite_name}.log"
    fi
}

# Function to check prerequisites
check_prerequisites() {
    log "🔍 Checking prerequisites..."
    
    # Check if API server is running
    if ! curl -f -s "${API_URL}/health" > /dev/null 2>&1; then
        log "❌ API server not responding at ${API_URL}"
        log "Please start the server with: npm run dev"
        exit 1
    fi
    
    # Check required tools
    local missing_tools=()
    
    if ! command -v npm &> /dev/null; then
        missing_tools+=("npm")
    fi
    
    if ! command -v npx &> /dev/null; then
        missing_tools+=("npx")
    fi
    
    if ! command -v artillery &> /dev/null; then
        missing_tools+=("artillery")
    fi
    
    if ! command -v playwright &> /dev/null; then
        missing_tools+=("playwright")
    fi
    
    if [ ${#missing_tools[@]} -ne 0 ]; then
        log "❌ Missing required tools: ${missing_tools[*]}"
        log "Please install missing tools and try again"
        exit 1
    fi
    
    log "✅ Prerequisites check passed"
}

# Function to install dependencies if needed
install_dependencies() {
    log "📦 Checking dependencies..."
    
    if [ ! -d "node_modules" ]; then
        log "Installing npm dependencies..."
        npm install > "${REPORT_DIR}/npm-install.log" 2>&1
    fi
    
    # Install Playwright browsers if needed
    if ! npx playwright --version > /dev/null 2>&1; then
        log "Installing Playwright browsers..."
        npx playwright install > "${REPORT_DIR}/playwright-install.log" 2>&1
    fi
    
    log "✅ Dependencies ready"
}

# Function to generate final report
generate_report() {
    local success_rate=$((PASSED_SUITES * 100 / TOTAL_SUITES))
    
    log ""
    log "📊 TEST SUITE SUMMARY"
    log "===================="
    log "Total Test Suites: ${TOTAL_SUITES}"
    log "Passed: ${PASSED_SUITES}"
    log "Failed: ${FAILED_SUITES}"
    log "Success Rate: ${success_rate}%"
    
    # Create summary JSON
    cat > "${REPORT_DIR}/summary.json" << EOF
{
  "timestamp": "${TIMESTAMP}",
  "api_url": "${API_URL}",
  "total_suites": ${TOTAL_SUITES},
  "passed_suites": ${PASSED_SUITES},
  "failed_suites": ${FAILED_SUITES},
  "success_rate": ${success_rate},
  "test_suites": [
    "unit-tests",
    "service-integration",
    "api-integration", 
    "ui-components",
    "e2e-tests",
    "performance-tests"
  ]
}
EOF

    # Create HTML report
    cat > "${REPORT_DIR}/report.html" << EOF
<!DOCTYPE html>
<html>
<head>
    <title>Test Suite Report - ${TIMESTAMP}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .header { background: #f4f4f4; padding: 20px; border-radius: 8px; }
        .passed { color: #28a745; }
        .failed { color: #dc3545; }
        .suite { margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 5px; }
        .logs { background: #f8f9fa; padding: 10px; border-radius: 3px; font-family: monospace; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Test Suite Report</h1>
        <p><strong>Timestamp:</strong> ${TIMESTAMP}</p>
        <p><strong>API URL:</strong> ${API_URL}</p>
        <p><strong>Success Rate:</strong> ${success_rate}%</p>
    </div>
    
    <h2>Results Summary</h2>
    <ul>
        <li class="passed">Passed: ${PASSED_SUITES}</li>
        <li class="failed">Failed: ${FAILED_SUITES}</li>
    </ul>
    
    <h2>Individual Test Suites</h2>
EOF

    # Add individual test suite results to HTML
    for log_file in "${REPORT_DIR}"/*.log; do
        if [[ -f "$log_file" && "$log_file" != *"test-run.log"* ]]; then
            local suite_name=$(basename "$log_file" .log)
            local status="passed"
            
            if grep -q "FAILED" "$log_file" || grep -q "Error" "$log_file"; then
                status="failed"
            fi
            
            cat >> "${REPORT_DIR}/report.html" << EOF
    <div class="suite">
        <h3 class="${status}">${suite_name} - ${status^^}</h3>
        <div class="logs">
            <pre>$(tail -20 "$log_file")</pre>
        </div>
    </div>
EOF
        fi
    done
    
    cat >> "${REPORT_DIR}/report.html" << EOF
</body>
</html>
EOF

    log "📄 Reports generated:"
    log "  - Summary: ${REPORT_DIR}/summary.json"
    log "  - HTML Report: ${REPORT_DIR}/report.html"
    log "  - Full logs: ${REPORT_DIR}/"
}

# Main test execution
main() {
    log "🏁 Starting comprehensive test execution"
    
    # Prerequisites
    check_prerequisites
    install_dependencies
    
    # 1. Unit Tests
    run_test_suite \
        "unit-tests" \
        "npm run test:unit" \
        "Service layer unit tests with mocked dependencies"
    
    # 2. Service Integration Tests
    run_test_suite \
        "service-integration" \
        "npm run test:integration:services" \
        "Service layer integration tests with real database"
    
    # 3. API Integration Tests
    run_test_suite \
        "api-integration" \
        "./tests/integration/test-all-apis.sh" \
        "All API endpoints and routes testing"
    
    # 4. UI Component Tests
    run_test_suite \
        "ui-components" \
        "npm run test:ui" \
        "React component tests for cart and checkout"
    
    # 5. E2E Tests
    run_test_suite \
        "e2e-tests" \
        "npx playwright test tests/e2e/" \
        "End-to-end user journey testing"
    
    # 6. Performance Tests (quick version)
    run_test_suite \
        "performance-tests" \
        "./benchmarks/run-benchmarks.sh --quick" \
        "Performance and load testing with Artillery"
    
    # Generate final report
    generate_report
    
    # Exit with appropriate code
    if [[ $FAILED_SUITES -eq 0 ]]; then
        log "🎉 All test suites passed!"
        echo -e "${GREEN}🎉 ALL TESTS PASSED! 🎉${NC}"
        exit 0
    else
        log "❌ ${FAILED_SUITES} test suite(s) failed"
        echo -e "${RED}❌ ${FAILED_SUITES} TEST SUITE(S) FAILED${NC}"
        exit 1
    fi
}

# Handle command line arguments
case "${1:-}" in
    "help"|"-h"|"--help")
        echo "Usage: $0 [options]"
        echo ""
        echo "Options:"
        echo "  help, -h, --help    Show this help message"
        echo "  --quick             Run only critical tests (faster)"
        echo "  --unit-only         Run only unit tests"
        echo "  --e2e-only          Run only E2E tests"
        echo "  --api-only          Run only API tests"
        echo ""
        echo "Environment variables:"
        echo "  API_URL             Base API URL (default: http://localhost:3000)"
        echo ""
        echo "Examples:"
        echo "  $0                  Run all test suites"
        echo "  $0 --quick          Run critical tests only"
        echo "  API_URL=https://staging.example.com $0"
        exit 0
        ;;
    "--quick")
        # Quick mode - only run critical tests
        check_prerequisites
        install_dependencies
        
        run_test_suite \
            "unit-tests" \
            "npm run test:unit" \
            "Unit tests only"
            
        run_test_suite \
            "api-integration" \
            "./tests/integration/test-all-apis.sh auth products" \
            "Critical API endpoints"
            
        run_test_suite \
            "e2e-critical" \
            "npx playwright test tests/e2e/complete-purchase.test.ts" \
            "Critical E2E flow"
        
        generate_report
        ;;
    "--unit-only")
        check_prerequisites
        run_test_suite \
            "unit-tests" \
            "npm run test:unit" \
            "Unit tests only"
        generate_report
        ;;
    "--e2e-only")
        check_prerequisites
        install_dependencies
        run_test_suite \
            "e2e-tests" \
            "npx playwright test tests/e2e/" \
            "E2E tests only"
        generate_report
        ;;
    "--api-only")
        check_prerequisites
        run_test_suite \
            "api-integration" \
            "./tests/integration/test-all-apis.sh" \
            "API integration tests only"
        generate_report
        ;;
    "")
        main
        ;;
    *)
        echo "Unknown option: $1"
        echo "Run '$0 help' for usage information"
        exit 1
        ;;
esac