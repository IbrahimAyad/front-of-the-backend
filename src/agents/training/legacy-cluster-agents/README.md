# Legacy Cluster Agents Training Materials

This directory contains training materials extracted from the 3 external agent projects that were removed from the Railway deployment.

## 📁 Directory Structure

### `./marketing-os/`
**Source**: `KCTMarketingOS-Agent.tsx`
- Place marketing automation training materials here
- Focus on campaign management, ad optimization
- Target integration: `paid-advertising-manager` + `social-media-manager`

### `./trend-oracle/`
**Source**: `trend-oracle.config.ts`  
- Place trend analysis and market prediction materials here
- Focus on data analysis, forecasting, market insights
- Target integration: `business-intelligence-analyst`

### `./customer-service/`
**Source**: `agentConfig.ts`
- Place customer service automation materials here  
- Focus on support workflows, customer journey optimization
- Target integration: `customer-success-manager`

## 📋 How to Add Training Materials

1. **Extract MD files** from the old agent projects
2. **Place them** in the appropriate subdirectory above
3. **Name them descriptively** (e.g., `marketing-automation-workflows.md`)
4. **Include context** about how the knowledge should be integrated

## 🔄 Integration Process

When ready to integrate:
1. Review all MD files in a directory
2. Identify key capabilities and knowledge
3. Map to current agent that should receive the knowledge
4. Update the agent class in `src/routes/ask.ts`
5. Test the enhanced capabilities

## ⚠️ Important Notes

- **Don't modify** the current working agents until ready
- **Test incrementally** - enhance one capability at a time
- **Keep backups** of working agent code before changes
- **Validate** each enhancement doesn't break existing functionality 