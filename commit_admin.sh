#!/bin/bash

# Remove any lock files
rm -f .git/index.lock

# Add the admin files
echo "Adding admin files..."
git add src/components/Admin/ProductDataTable.tsx
git add src/components/Admin/OutfitBuilderSection.tsx  
git add src/pages/admin/EnhancedAdminDashboard.tsx
git add src/pages/admin/AdminProductsPage.tsx
git add src/routes/adminRoutes.tsx
git add src/App.tsx
git add package.json

# Commit the changes
echo "Committing changes..."
git commit -m "Add Shopify-style admin dashboard with outfit builder

- Enhanced product management table with advanced filtering
- Dedicated outfit builder with drag-and-drop interface
- Professional admin navigation and layout
- Integration with API for real product data"

# Push to GitHub
echo "Pushing to GitHub..."
git push origin main

echo "Done! Changes pushed to GitHub."