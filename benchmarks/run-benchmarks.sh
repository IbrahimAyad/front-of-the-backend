#!/bin/bash

# Performance Benchmarking Script
# Runs comprehensive performance tests using Artillery

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
API_URL="${API_URL:-http://localhost:3000}"
RESULTS_DIR="./benchmark-results"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

echo -e "${BLUE}🚀 Starting Performance Benchmarks${NC}"
echo -e "${BLUE}Target: ${API_URL}${NC}"
echo -e "${BLUE}Timestamp: ${TIMESTAMP}${NC}"

# Create results directory
mkdir -p "${RESULTS_DIR}/${TIMESTAMP}"

# Function to run a specific test
run_test() {
    local test_name=$1
    local config_file=$2
    local description=$3
    
    echo -e "\n${YELLOW}📊 Running ${test_name}${NC}"
    echo -e "${YELLOW}Description: ${description}${NC}"
    
    # Check if API is responding
    if ! curl -f -s "${API_URL}/health" > /dev/null 2>&1; then
        echo -e "${RED}❌ API not responding at ${API_URL}${NC}"
        echo -e "${RED}Please ensure the server is running${NC}"
        return 1
    fi
    
    # Run the test
    echo -e "${BLUE}Starting ${test_name}...${NC}"
    
    if artillery run \
        --config "${config_file}" \
        --output "${RESULTS_DIR}/${TIMESTAMP}/${test_name}-raw.json" \
        > "${RESULTS_DIR}/${TIMESTAMP}/${test_name}-output.log" 2>&1; then
        
        echo -e "${GREEN}✅ ${test_name} completed successfully${NC}"
        
        # Generate HTML report
        artillery report \
            "${RESULTS_DIR}/${TIMESTAMP}/${test_name}-raw.json" \
            --output "${RESULTS_DIR}/${TIMESTAMP}/${test_name}-report.html"
        
        echo -e "${GREEN}📄 Report saved: ${RESULTS_DIR}/${TIMESTAMP}/${test_name}-report.html${NC}"
        
        # Extract key metrics
        echo -e "${BLUE}Key Metrics:${NC}"
        tail -20 "${RESULTS_DIR}/${TIMESTAMP}/${test_name}-output.log" | grep -E "(http|scenarios|errors|p95|p99|median)" || true
        
    else
        echo -e "${RED}❌ ${test_name} failed${NC}"
        echo -e "${RED}Check logs: ${RESULTS_DIR}/${TIMESTAMP}/${test_name}-output.log${NC}"
        return 1
    fi
}

# Function to check prerequisites
check_prerequisites() {
    echo -e "${BLUE}🔍 Checking prerequisites...${NC}"
    
    # Check if Artillery is installed
    if ! command -v artillery &> /dev/null; then
        echo -e "${RED}❌ Artillery is not installed${NC}"
        echo -e "${YELLOW}Install with: npm install -g artillery${NC}"
        exit 1
    fi
    
    # Check if curl is available
    if ! command -v curl &> /dev/null; then
        echo -e "${RED}❌ curl is not available${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ Prerequisites check passed${NC}"
}

# Function to create summary report
create_summary() {
    local summary_file="${RESULTS_DIR}/${TIMESTAMP}/summary.md"
    
    echo -e "\n${BLUE}📋 Creating summary report...${NC}"
    
    cat > "${summary_file}" << EOF
# Performance Benchmark Summary

**Date:** $(date)
**Target:** ${API_URL}
**Test Suite:** Complete API Performance Analysis

## Test Results

EOF

    # Add results for each test
    for test in load-test stress-test spike-test endurance-test; do
        if [[ -f "${RESULTS_DIR}/${TIMESTAMP}/${test}-output.log" ]]; then
            echo "### ${test}" >> "${summary_file}"
            echo "\`\`\`" >> "${summary_file}"
            tail -10 "${RESULTS_DIR}/${TIMESTAMP}/${test}-output.log" | grep -E "(http|scenarios|p95|p99|median)" >> "${summary_file}" || true
            echo "\`\`\`" >> "${summary_file}"
            echo "" >> "${summary_file}"
        fi
    done
    
    cat >> "${summary_file}" << EOF

## Files Generated

- \`summary.md\` - This summary report
EOF

    for test in load-test stress-test spike-test endurance-test; do
        if [[ -f "${RESULTS_DIR}/${TIMESTAMP}/${test}-report.html" ]]; then
            echo "- \`${test}-report.html\` - Detailed HTML report for ${test}" >> "${summary_file}"
            echo "- \`${test}-raw.json\` - Raw test data for ${test}" >> "${summary_file}"
            echo "- \`${test}-output.log\` - Console output for ${test}" >> "${summary_file}"
        fi
    done
    
    echo -e "${GREEN}📄 Summary report: ${summary_file}${NC}"
}

# Function to display help
show_help() {
    cat << EOF
Usage: $0 [OPTIONS] [TESTS]

Performance benchmarking script for the API using Artillery.

OPTIONS:
    -h, --help          Show this help message
    -u, --url URL       Set API URL (default: http://localhost:3000)
    -q, --quick         Run only load test (quick validation)
    --stress-only       Run only stress test
    --spike-only        Run only spike test
    --endurance-only    Run only endurance test

TESTS (if none specified, runs all):
    load                Basic load test
    stress              Stress test to find limits
    spike               Spike test for traffic bursts
    endurance           Long-running stability test

EXAMPLES:
    $0                              # Run all tests
    $0 --quick                      # Run only load test
    $0 load stress                  # Run specific tests
    $0 -u http://prod.example.com   # Test production environment

EOF
}

# Parse command line arguments
TESTS_TO_RUN=()
QUICK_MODE=false

while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_help
            exit 0
            ;;
        -u|--url)
            API_URL="$2"
            shift 2
            ;;
        -q|--quick)
            QUICK_MODE=true
            TESTS_TO_RUN=("load")
            shift
            ;;
        --stress-only)
            TESTS_TO_RUN=("stress")
            shift
            ;;
        --spike-only)
            TESTS_TO_RUN=("spike")
            shift
            ;;
        --endurance-only)
            TESTS_TO_RUN=("endurance")
            shift
            ;;
        load|stress|spike|endurance)
            TESTS_TO_RUN+=("$1")
            shift
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            show_help
            exit 1
            ;;
    esac
done

# Set default tests if none specified
if [[ ${#TESTS_TO_RUN[@]} -eq 0 ]]; then
    if [[ "$QUICK_MODE" == "true" ]]; then
        TESTS_TO_RUN=("load")
    else
        TESTS_TO_RUN=("load" "stress" "spike" "endurance")
    fi
fi

# Check prerequisites
check_prerequisites

# Run tests
echo -e "\n${BLUE}🎯 Running ${#TESTS_TO_RUN[@]} test(s): ${TESTS_TO_RUN[*]}${NC}"

for test in "${TESTS_TO_RUN[@]}"; do
    case $test in
        load)
            run_test "load-test" "load-test.yml" "Standard load testing with gradual ramp-up"
            ;;
        stress)
            run_test "stress-test" "stress-test.yml" "Stress testing to find breaking points"
            ;;
        spike)
            run_test "spike-test" "spike-test.yml" "Spike testing for traffic bursts"
            ;;
        endurance)
            if [[ "$QUICK_MODE" == "false" ]]; then
                echo -e "${YELLOW}⚠️  Endurance test takes 2+ hours. Continue? (y/N)${NC}"
                read -r response
                if [[ "$response" =~ ^[Yy]$ ]]; then
                    run_test "endurance-test" "endurance-test.yml" "Long-running stability test (2+ hours)"
                else
                    echo -e "${YELLOW}⏭️  Skipping endurance test${NC}"
                fi
            else
                echo -e "${YELLOW}⏭️  Skipping endurance test in quick mode${NC}"
            fi
            ;;
        *)
            echo -e "${RED}❌ Unknown test: $test${NC}"
            ;;
    esac
done

# Create summary
create_summary

echo -e "\n${GREEN}🎉 Benchmark suite completed!${NC}"
echo -e "${GREEN}📁 Results saved in: ${RESULTS_DIR}/${TIMESTAMP}${NC}"
echo -e "${BLUE}📊 View HTML reports by opening the .html files in your browser${NC}"

# Check if any tests failed
if grep -q "failed" "${RESULTS_DIR}/${TIMESTAMP}"/*.log 2>/dev/null; then
    echo -e "\n${YELLOW}⚠️  Some tests may have encountered issues. Check the logs for details.${NC}"
    exit 1
else
    echo -e "\n${GREEN}✅ All tests completed successfully!${NC}"
fi