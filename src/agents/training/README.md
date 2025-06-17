# KCT AI Agents Training Materials

This directory contains training materials and documentation for enhancing our AI agents with knowledge from legacy systems.

## 🤖 Current Active Agents

Our system currently has **5 working AI agents** accessible via `/api/agents/*`:

### 1. Paid Advertising Manager (`paid-advertising-manager`)
- **Capabilities**: `analyze-ad-performance`, `set-campaign-goals`
- **Training Directory**: `./paid-advertising-manager/`
- **Purpose**: Analyzes ad performance and optimizes campaigns

### 2. Social Media Manager (`social-media-manager`)
- **Capabilities**: `create-content`, `analyze-engagement`
- **Training Directory**: `./social-media-manager/`
- **Purpose**: Creates engaging content and analyzes social performance

### 3. Customer Success Manager (`customer-success-manager`)
- **Capabilities**: TBD (to be enhanced with legacy materials)
- **Training Directory**: `./customer-success-manager/`
- **Purpose**: Optimizes customer journey and retention

### 4. Content Creation Specialist (`content-creation-specialist`)
- **Capabilities**: TBD (to be enhanced with legacy materials)
- **Training Directory**: `./content-creation-specialist/`
- **Purpose**: Generates marketing content and copy

### 5. Business Intelligence Analyst (`business-intelligence-analyst`)
- **Capabilities**: TBD (to be enhanced with legacy materials)
- **Training Directory**: `./business-intelligence-analyst/`
- **Purpose**: Provides data analysis and business insights

## 📚 Legacy Training Materials

### Legacy Cluster Agents (Removed but Knowledge Preserved)
The following directories contain training materials from the 3 external agent projects that were removed:

#### `./legacy-cluster-agents/marketing-os/`
- **Source**: KCTMarketingOS-Agent.tsx
- **Knowledge Areas**: Marketing automation, campaign management
- **Integration Target**: Enhance `paid-advertising-manager` and `social-media-manager`

#### `./legacy-cluster-agents/trend-oracle/`
- **Source**: trend-oracle.config.ts
- **Knowledge Areas**: Trend analysis, market predictions
- **Integration Target**: Enhance `business-intelligence-analyst`

#### `./legacy-cluster-agents/customer-service/`
- **Source**: agentConfig.ts
- **Knowledge Areas**: Customer service automation, support workflows
- **Integration Target**: Enhance `customer-success-manager`

## 🔄 Enhancement Process

When ready to enhance our agents with legacy knowledge:

1. **Review Training Materials**: Study the MD files in each directory
2. **Map Capabilities**: Identify which current agent should receive which knowledge
3. **Update Agent Logic**: Modify the agent classes in `src/routes/ask.ts`
4. **Test Integration**: Verify enhanced capabilities work correctly
5. **Update API Documentation**: Document new capabilities

## 🚀 Current Status

- ✅ **5 Active Agents**: All working and accessible via API
- ✅ **Clean Codebase**: All external agent projects removed
- ✅ **Stable System**: No build errors or deployment issues
- 📋 **Training Materials**: Ready for future integration

## 📋 Next Steps

1. Place training MD files from legacy agents in appropriate directories
2. Review and organize the training content
3. Plan enhancement roadmap for each agent
4. Implement enhancements incrementally
5. Test and validate each enhancement

## 🔧 Technical Notes

- **Agent Endpoint**: `/api/agents/capabilities` - Lists all available agents
- **Execution Endpoint**: `/api/agents/execute` - Executes agent tasks (requires auth)
- **History Endpoint**: `/api/agents/history` - Shows execution history
- **Agent Code Location**: `src/routes/ask.ts`
- **Config**: Uses `SERVER_CONFIG` from `src/config/server.ts`

---

**Important**: This system is currently working perfectly. Any enhancements should be done incrementally to maintain stability. 