import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Button,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Collapse,
  Alert,
  LinearProgress,
  Tooltip,
  Badge,
} from '@mui/material';
import {
  Add as AddIcon,
  Remove as RemoveIcon,
  ShoppingCart as CartIcon,
  LocalOffer as OfferIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  CheckCircle as CheckIcon,
  Info as InfoIcon,
} from '@mui/icons-material';

interface BundleItem {
  id: string;
  name: string;
  price: number;
  compareAtPrice?: number;
  category: string;
  variant?: {
    size?: string;
    color?: string;
  };
  quantity: number;
}

interface BundleDiscount {
  type: 'percentage' | 'fixed' | 'tiered';
  value: number;
  minItems?: number;
  description: string;
}

interface BundlePriceCalculatorProps {
  items: BundleItem[];
  onItemQuantityChange?: (itemId: string, quantity: number) => void;
  onAddToCart?: (bundle: BundleItem[]) => void;
  discounts?: BundleDiscount[];
  showBreakdown?: boolean;
  currency?: string;
}

const defaultDiscounts: BundleDiscount[] = [
  { type: 'percentage', value: 10, minItems: 2, description: 'Buy 2+ items, save 10%' },
  { type: 'percentage', value: 15, minItems: 3, description: 'Buy 3+ items, save 15%' },
  { type: 'percentage', value: 20, minItems: 4, description: 'Buy 4+ items, save 20%' },
];

const BundlePriceCalculator: React.FC<BundlePriceCalculatorProps> = ({
  items = [],
  onItemQuantityChange,
  onAddToCart,
  discounts = defaultDiscounts,
  showBreakdown = true,
  currency = '$',
}) => {
  const [expanded, setExpanded] = useState(true);
  const [showSavingsAnimation, setShowSavingsAnimation] = useState(false);

  // Calculate totals
  const calculations = useMemo(() => {
    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const originalTotal = items.reduce(
      (sum, item) => sum + (item.compareAtPrice || item.price) * item.quantity,
      0
    );

    // Find applicable discount
    const applicableDiscounts = discounts
      .filter((d) => !d.minItems || totalItems >= d.minItems)
      .sort((a, b) => (b.value || 0) - (a.value || 0));

    const bestDiscount = applicableDiscounts[0];

    let discountAmount = 0;
    if (bestDiscount) {
      if (bestDiscount.type === 'percentage') {
        discountAmount = subtotal * (bestDiscount.value / 100);
      } else if (bestDiscount.type === 'fixed') {
        discountAmount = bestDiscount.value;
      }
    }

    const finalPrice = subtotal - discountAmount;
    const totalSavings = originalTotal - finalPrice;
    const savingsPercentage = originalTotal > 0 ? (totalSavings / originalTotal) * 100 : 0;

    return {
      totalItems,
      subtotal,
      originalTotal,
      discountAmount,
      finalPrice,
      totalSavings,
      savingsPercentage,
      bestDiscount,
    };
  }, [items, discounts]);

  // Animate savings when they change
  useEffect(() => {
    if (calculations.totalSavings > 0) {
      setShowSavingsAnimation(true);
      const timer = setTimeout(() => setShowSavingsAnimation(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [calculations.totalSavings]);

  const formatPrice = (price: number) => {
    return `${currency}${price.toFixed(2)}`;
  };

  const handleQuantityChange = (itemId: string, delta: number) => {
    const item = items.find((i) => i.id === itemId);
    if (item && onItemQuantityChange) {
      const newQuantity = Math.max(0, item.quantity + delta);
      onItemQuantityChange(itemId, newQuantity);
    }
  };

  const getNextDiscount = () => {
    const nextDiscounts = discounts
      .filter((d) => d.minItems && d.minItems > calculations.totalItems)
      .sort((a, b) => (a.minItems || 0) - (b.minItems || 0));
    return nextDiscounts[0];
  };

  const nextDiscount = getNextDiscount();
  const itemsNeededForNextDiscount = nextDiscount
    ? (nextDiscount.minItems || 0) - calculations.totalItems
    : 0;

  if (items.length === 0) {
    return null;
  }

  return (
    <Card
      sx={{
        position: 'sticky',
        top: 80,
        transition: 'all 0.3s ease',
        border: calculations.totalSavings > 0 ? '2px solid' : '1px solid',
        borderColor: calculations.totalSavings > 0 ? 'success.main' : 'divider',
      }}
    >
      <CardContent>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <OfferIcon color="primary" />
            <Typography variant="h6" fontWeight="bold">
              Bundle Price
            </Typography>
            <Badge badgeContent={calculations.totalItems} color="primary">
              <Box />
            </Badge>
          </Box>
          <IconButton size="small" onClick={() => setExpanded(!expanded)}>
            {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
        </Box>

        {/* Savings Alert */}
        {calculations.totalSavings > 0 && (
          <Alert
            severity="success"
            icon={<CheckIcon />}
            sx={{
              mb: 2,
              animation: showSavingsAnimation ? 'pulse 0.5s ease-in-out' : 'none',
              '@keyframes pulse': {
                '0%': { transform: 'scale(1)' },
                '50%': { transform: 'scale(1.02)' },
                '100%': { transform: 'scale(1)' },
              },
            }}
          >
            <Typography variant="subtitle2" fontWeight="bold">
              You save {formatPrice(calculations.totalSavings)} ({calculations.savingsPercentage.toFixed(0)}% off)
            </Typography>
          </Alert>
        )}

        {/* Next Discount Prompt */}
        {nextDiscount && itemsNeededForNextDiscount > 0 && (
          <Alert
            severity="info"
            icon={<InfoIcon />}
            sx={{ mb: 2 }}
          >
            <Typography variant="caption">
              Add {itemsNeededForNextDiscount} more {itemsNeededForNextDiscount === 1 ? 'item' : 'items'} to get {nextDiscount.value}% off
            </Typography>
          </Alert>
        )}

        <Collapse in={expanded}>
          {/* Items List */}
          <List sx={{ py: 0 }}>
            {items.map((item) => (
              <ListItem key={item.id} sx={{ px: 0 }}>
                <ListItemText
                  primary={
                    <Typography variant="body2" noWrap>
                      {item.name}
                    </Typography>
                  }
                  secondary={
                    <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5 }}>
                      {item.variant?.color && (
                        <Chip label={item.variant.color} size="small" variant="outlined" />
                      )}
                      {item.variant?.size && (
                        <Chip label={item.variant.size} size="small" variant="outlined" />
                      )}
                    </Box>
                  }
                />
                <ListItemSecondaryAction>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ textAlign: 'right', mr: 1 }}>
                      <Typography variant="body2" fontWeight="bold">
                        {formatPrice(item.price * item.quantity)}
                      </Typography>
                      {item.compareAtPrice && (
                        <Typography
                          variant="caption"
                          sx={{ textDecoration: 'line-through', color: 'text.secondary' }}
                        >
                          {formatPrice(item.compareAtPrice * item.quantity)}
                        </Typography>
                      )}
                    </Box>
                    {onItemQuantityChange && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <IconButton
                          size="small"
                          onClick={() => handleQuantityChange(item.id, -1)}
                          disabled={item.quantity <= 1}
                        >
                          <RemoveIcon fontSize="small" />
                        </IconButton>
                        <Typography variant="body2" sx={{ minWidth: 20, textAlign: 'center' }}>
                          {item.quantity}
                        </Typography>
                        <IconButton
                          size="small"
                          onClick={() => handleQuantityChange(item.id, 1)}
                        >
                          <AddIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    )}
                  </Box>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>

          <Divider sx={{ my: 2 }} />

          {/* Price Breakdown */}
          {showBreakdown && (
            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Subtotal ({calculations.totalItems} items)
                </Typography>
                <Typography variant="body2">{formatPrice(calculations.subtotal)}</Typography>
              </Box>

              {calculations.originalTotal > calculations.subtotal && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    Item Discounts
                  </Typography>
                  <Typography variant="body2" color="success.main">
                    -{formatPrice(calculations.originalTotal - calculations.subtotal)}
                  </Typography>
                </Box>
              )}

              {calculations.bestDiscount && calculations.discountAmount > 0 && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    {calculations.bestDiscount.description}
                  </Typography>
                  <Typography variant="body2" color="success.main">
                    -{formatPrice(calculations.discountAmount)}
                  </Typography>
                </Box>
              )}
            </Box>
          )}
        </Collapse>

        <Divider sx={{ mb: 2 }} />

        {/* Total */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', mb: 2 }}>
          <Typography variant="h6" fontWeight="bold">
            Total
          </Typography>
          <Box sx={{ textAlign: 'right' }}>
            <Typography variant="h5" fontWeight="bold" color="primary">
              {formatPrice(calculations.finalPrice)}
            </Typography>
            {calculations.originalTotal > calculations.finalPrice && (
              <Typography
                variant="body2"
                sx={{ textDecoration: 'line-through', color: 'text.secondary' }}
              >
                {formatPrice(calculations.originalTotal)}
              </Typography>
            )}
          </Box>
        </Box>

        {/* Savings Progress */}
        {discounts.length > 0 && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="caption" color="text.secondary" gutterBottom>
              Bundle Savings Progress
            </Typography>
            <Box sx={{ position: 'relative', mt: 1 }}>
              <LinearProgress
                variant="determinate"
                value={Math.min(100, (calculations.savingsPercentage / 20) * 100)}
                sx={{
                  height: 8,
                  borderRadius: 1,
                  backgroundColor: 'grey.200',
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: 'success.main',
                  },
                }}
              />
              {discounts.map((discount, index) => {
                const position = ((discount.value || 0) / 20) * 100;
                return (
                  <Tooltip key={index} title={discount.description}>
                    <Box
                      sx={{
                        position: 'absolute',
                        left: `${position}%`,
                        top: -4,
                        width: 16,
                        height: 16,
                        borderRadius: '50%',
                        backgroundColor:
                          calculations.savingsPercentage >= (discount.value || 0)
                            ? 'success.main'
                            : 'grey.300',
                        border: '2px solid white',
                        transform: 'translateX(-50%)',
                        cursor: 'pointer',
                      }}
                    />
                  </Tooltip>
                );
              })}
            </Box>
          </Box>
        )}

        {/* Add to Cart Button */}
        {onAddToCart && (
          <Button
            fullWidth
            variant="contained"
            size="large"
            startIcon={<CartIcon />}
            onClick={() => onAddToCart(items)}
            sx={{
              backgroundColor: '#8B0000',
              '&:hover': {
                backgroundColor: '#660000',
              },
            }}
          >
            Add Bundle to Cart
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default BundlePriceCalculator;