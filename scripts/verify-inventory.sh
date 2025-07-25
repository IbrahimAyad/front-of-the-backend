#!/bin/bash

echo "📊 Verifying inventory counts..."

# Check current counts
RESULT=$(npx tsx -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
(async () => {
  const suits = await prisma.product.count({ where: { category: 'Suits' } });
  const shirts = await prisma.product.count({ where: { category: 'Shirts' } });
  const ties = await prisma.product.count({ where: { category: 'Ties' } });
  const total = await prisma.product.count();
  const variants = await prisma.productVariant.count();
  
  // Check tie variants
  const tieVariants = await prisma.productVariant.count({
    where: { product: { category: 'Ties' } }
  });
  
  console.log(JSON.stringify({
    total,
    suits,
    shirts,
    ties,
    variants,
    tieVariants
  }));
  
  process.exit(0);
})();
" 2>/dev/null)

# Parse results
TOTAL=$(echo $RESULT | jq -r '.total')
SUITS=$(echo $RESULT | jq -r '.suits')
SHIRTS=$(echo $RESULT | jq -r '.shirts')
TIES=$(echo $RESULT | jq -r '.ties')
VARIANTS=$(echo $RESULT | jq -r '.variants')
TIE_VARIANTS=$(echo $RESULT | jq -r '.tieVariants')

echo ""
echo "Current Inventory:"
echo "- Total Products: $TOTAL"
echo "- Suits: $SUITS (target: 29)"
echo "- Shirts: $SHIRTS (target: 14)"
echo "- Ties: $TIES (target: 4)"
echo "- Total Variants: $VARIANTS"
echo "- Tie Variants: $TIE_VARIANTS (target: 304)"
echo ""

# Check if we meet targets
if [ "$SUITS" -eq 29 ] && [ "$SHIRTS" -eq 14 ] && [ "$TIES" -eq 4 ] && [ "$TIE_VARIANTS" -eq 304 ]; then
  echo "✅ All inventory targets met!"
else
  echo "⚠️  Inventory needs adjustment:"
  
  if [ "$SUITS" -ne 29 ]; then
    echo "   - Suits: $SUITS (need 29)"
  fi
  
  if [ "$TIE_VARIANTS" -ne 304 ]; then
    echo "   - Tie colors: $((TIE_VARIANTS / 4)) per tie (need 76)"
  fi
fi