import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  LinearProgress,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  IconButton,
  Avatar,
  Divider,
  Paper,
  Badge,
} from '@mui/material';
import {
  Star as StarIcon,
  Diamond as DiamondIcon,
  LocalOffer as OfferIcon,
  CardGiftcard as GiftIcon,
  TrendingUp as TrendingUpIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Redeem as RedeemIcon,
  History as HistoryIcon,
  EmojiEvents as CrownIcon,
  CardGiftcard as VoucherIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

interface LoyaltyTier {
  id: string;
  name: string;
  minPoints: number;
  maxPoints?: number;
  color: string;
  benefits: string[];
  discountPercentage: number;
  icon: React.ReactNode;
}

interface LoyaltyOffer {
  id: string;
  title: string;
  description: string;
  type: 'discount' | 'freebie' | 'upgrade' | 'points';
  value: number;
  pointsCost: number;
  validUntil: Date;
  isActive: boolean;
  tierRequired?: string;
  usageLimit?: number;
  usedCount: number;
}

interface PointsTransaction {
  id: string;
  type: 'earned' | 'redeemed' | 'expired' | 'bonus';
  points: number;
  description: string;
  date: Date;
  relatedOrderId?: string;
  relatedOfferId?: string;
}

interface CustomerLoyaltyData {
  customerId: string;
  totalPoints: number;
  availablePoints: number;
  currentTier: string;
  nextTier?: string;
  pointsToNextTier?: number;
  lifetimeSpent: number;
  joinDate: Date;
  lastActivity: Date;
  transactions: PointsTransaction[];
  redeemedOffers: string[];
}

interface CustomerLoyaltyProps {
  customerId: string | number;
  customerName: string;
  onPointsUpdate?: (points: number) => void;
}

const loyaltyTiers: LoyaltyTier[] = [
  {
    id: 'bronze',
    name: 'Bronze',
    minPoints: 0,
    maxPoints: 999,
    color: '#CD7F32',
    benefits: ['5% discount on alterations', 'Birthday offer'],
    discountPercentage: 5,
    icon: <StarIcon />,
  },
  {
    id: 'silver',
    name: 'Silver',
    minPoints: 1000,
    maxPoints: 2999,
    color: '#C0C0C0',
    benefits: ['10% discount on all items', 'Priority booking', 'Free garment bag'],
    discountPercentage: 10,
    icon: <StarIcon />,
  },
  {
    id: 'gold',
    name: 'Gold',
    minPoints: 3000,
    maxPoints: 7999,
    color: '#FFD700',
    benefits: ['15% discount', 'Free home consultation', 'Complimentary pressing'],
    discountPercentage: 15,
    icon: <CrownIcon />,
  },
  {
    id: 'platinum',
    name: 'Platinum',
    minPoints: 8000,
    color: '#E5E4E2',
    benefits: ['20% discount', 'Personal stylist', 'Free delivery', 'Exclusive events'],
    discountPercentage: 20,
    icon: <DiamondIcon />,
  },
];

const CustomerLoyalty: React.FC<CustomerLoyaltyProps> = ({
  customerId,
  customerName,
  onPointsUpdate,
}) => {
  const [loyaltyData, setLoyaltyData] = useState<CustomerLoyaltyData | null>(null);
  const [availableOffers, setAvailableOffers] = useState<LoyaltyOffer[]>([]);
  const [addPointsDialogOpen, setAddPointsDialogOpen] = useState(false);
  const [newPointsAmount, setNewPointsAmount] = useState(0);
  const [pointsReason, setPointsReason] = useState('');
  const [showTransactionHistory, setShowTransactionHistory] = useState(false);

  // Mock data initialization
  useEffect(() => {
    const mockLoyaltyData: CustomerLoyaltyData = {
      customerId: customerId.toString(),
      totalPoints: 2450,
      availablePoints: 1850,
      currentTier: 'silver',
      nextTier: 'gold',
      pointsToNextTier: 550,
      lifetimeSpent: 4500,
      joinDate: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000), // 1 year ago
      lastActivity: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 1 week ago
      transactions: [
        {
          id: '1',
          type: 'earned',
          points: 450,
          description: 'Purchase - Navy Suit Order #ORD-001',
          date: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000),
          relatedOrderId: 'ORD-001',
        },
        {
          id: '2',
          type: 'redeemed',
          points: -200,
          description: 'Redeemed: Free Shirt Upgrade',
          date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
          relatedOfferId: 'OFFER-001',
        },
        {
          id: '3',
          type: 'bonus',
          points: 100,
          description: 'Birthday Bonus Points',
          date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        },
        {
          id: '4',
          type: 'earned',
          points: 300,
          description: 'Referral Bonus - Friend Purchase',
          date: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
        },
      ],
      redeemedOffers: ['OFFER-001'],
    };

    const mockOffers: LoyaltyOffer[] = [
      {
        id: 'OFFER-001',
        title: 'Free Shirt Upgrade',
        description: 'Upgrade any shirt to premium cotton',
        type: 'upgrade',
        value: 50,
        pointsCost: 200,
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        isActive: true,
        usageLimit: 1,
        usedCount: 0,
      },
      {
        id: 'OFFER-002',
        title: '15% Off Next Purchase',
        description: 'Get 15% discount on your next order',
        type: 'discount',
        value: 15,
        pointsCost: 500,
        validUntil: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
        isActive: true,
        usageLimit: 1,
        usedCount: 0,
      },
      {
        id: 'OFFER-003',
        title: 'Free Alterations',
        description: 'Complimentary alterations on any purchase',
        type: 'freebie',
        value: 75,
        pointsCost: 300,
        validUntil: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
        isActive: true,
        tierRequired: 'silver',
        usageLimit: 2,
        usedCount: 0,
      },
      {
        id: 'OFFER-004',
        title: 'Double Points Weekend',
        description: 'Earn 2x points on all purchases this weekend',
        type: 'points',
        value: 100,
        pointsCost: 0,
        validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        isActive: true,
        usageLimit: 1,
        usedCount: 0,
      },
    ];

    setLoyaltyData(mockLoyaltyData);
    setAvailableOffers(mockOffers);
  }, [customerId]);

  const getCurrentTier = () => {
    if (!loyaltyData) return loyaltyTiers[0];
    return loyaltyTiers.find(tier => tier.id === loyaltyData.currentTier) || loyaltyTiers[0];
  };

  const getNextTier = () => {
    if (!loyaltyData) return null;
    const currentTierIndex = loyaltyTiers.findIndex(tier => tier.id === loyaltyData.currentTier);
    return currentTierIndex < loyaltyTiers.length - 1 ? loyaltyTiers[currentTierIndex + 1] : null;
  };

  const getTierProgress = () => {
    if (!loyaltyData) return 0;
    const currentTier = getCurrentTier();
    const nextTier = getNextTier();
    
    if (!nextTier) return 100; // Max tier reached
    
    const pointsInCurrentTier = loyaltyData.totalPoints - currentTier.minPoints;
    const pointsNeededForNextTier = nextTier.minPoints - currentTier.minPoints;
    
    return (pointsInCurrentTier / pointsNeededForNextTier) * 100;
  };

  const handleAddPoints = () => {
    if (!loyaltyData || newPointsAmount <= 0) {
      toast.error('Please enter a valid points amount');
      return;
    }

    const newTransaction: PointsTransaction = {
      id: Date.now().toString(),
      type: 'bonus',
      points: newPointsAmount,
      description: pointsReason || 'Manual points adjustment',
      date: new Date(),
    };

    setLoyaltyData(prev => {
      if (!prev) return prev;
      
      const updatedData = {
        ...prev,
        totalPoints: prev.totalPoints + newPointsAmount,
        availablePoints: prev.availablePoints + newPointsAmount,
        transactions: [newTransaction, ...prev.transactions],
      };

      // Check for tier upgrade
      const newTier = loyaltyTiers.find(tier => 
        updatedData.totalPoints >= tier.minPoints && 
        (!tier.maxPoints || updatedData.totalPoints <= tier.maxPoints)
      );

      if (newTier && newTier.id !== prev.currentTier) {
        updatedData.currentTier = newTier.id;
        toast.success(`Congratulations! ${customerName} has been upgraded to ${newTier.name} tier!`);
      }

      return updatedData;
    });

    if (onPointsUpdate) {
      onPointsUpdate(loyaltyData.availablePoints + newPointsAmount);
    }

    setAddPointsDialogOpen(false);
    setNewPointsAmount(0);
    setPointsReason('');
    toast.success(`Added ${newPointsAmount} points to ${customerName}'s account`);
  };

  const handleRedeemOffer = (offer: LoyaltyOffer) => {
    if (!loyaltyData) return;

    if (loyaltyData.availablePoints < offer.pointsCost) {
      toast.error('Insufficient points to redeem this offer');
      return;
    }

    if (offer.tierRequired) {
      const requiredTierIndex = loyaltyTiers.findIndex(tier => tier.id === offer.tierRequired);
      const currentTierIndex = loyaltyTiers.findIndex(tier => tier.id === loyaltyData.currentTier);
      
      if (currentTierIndex < requiredTierIndex) {
        toast.error(`This offer requires ${loyaltyTiers[requiredTierIndex].name} tier or higher`);
        return;
      }
    }

    const redeemTransaction: PointsTransaction = {
      id: Date.now().toString(),
      type: 'redeemed',
      points: -offer.pointsCost,
      description: `Redeemed: ${offer.title}`,
      date: new Date(),
      relatedOfferId: offer.id,
    };

    setLoyaltyData(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        availablePoints: prev.availablePoints - offer.pointsCost,
        transactions: [redeemTransaction, ...prev.transactions],
        redeemedOffers: [...prev.redeemedOffers, offer.id],
      };
    });

    setAvailableOffers(prev => 
      prev.map(o => 
        o.id === offer.id 
          ? { ...o, usedCount: o.usedCount + 1 }
          : o
      )
    );

    toast.success(`Successfully redeemed: ${offer.title}`);
  };

  const getOfferTypeIcon = (type: string) => {
    switch (type) {
      case 'discount':
        return <OfferIcon />;
      case 'freebie':
        return <GiftIcon />;
      case 'upgrade':
        return <TrendingUpIcon />;
      case 'points':
        return <StarIcon />;
      default:
        return <VoucherIcon />;
    }
  };

  const getOfferTypeColor = (type: string) => {
    switch (type) {
      case 'discount':
        return 'primary';
      case 'freebie':
        return 'success';
      case 'upgrade':
        return 'warning';
      case 'points':
        return 'info';
      default:
        return 'default';
    }
  };

  if (!loyaltyData) {
    return <Typography>Loading loyalty data...</Typography>;
  }

  const currentTier = getCurrentTier();
  const nextTier = getNextTier();
  const tierProgress = getTierProgress();

  return (
    <Box>
      {/* Loyalty Overview */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h5" fontWeight="bold">
              Loyalty Program: {customerName}
            </Typography>
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={() => setAddPointsDialogOpen(true)}
            >
              Add Points
            </Button>
          </Box>

          <Grid container spacing={3}>
            {/* Current Tier */}
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 3, textAlign: 'center', bgcolor: currentTier.color + '20' }}>
                <Avatar sx={{ bgcolor: currentTier.color, mx: 'auto', mb: 2, width: 60, height: 60 }}>
                  {currentTier.icon}
                </Avatar>
                <Typography variant="h6" fontWeight="bold">
                  {currentTier.name} Member
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {currentTier.discountPercentage}% Discount
                </Typography>
              </Paper>
            </Grid>

            {/* Points Summary */}
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="h4" color="primary" fontWeight="bold">
                  {loyaltyData.availablePoints.toLocaleString()}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Available Points
                </Typography>
                <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                  Total Earned: {loyaltyData.totalPoints.toLocaleString()}
                </Typography>
              </Paper>
            </Grid>

            {/* Progress to Next Tier */}
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 3 }}>
                {nextTier ? (
                  <>
                    <Typography variant="h6" gutterBottom>
                      Progress to {nextTier.name}
                    </Typography>
                    <LinearProgress 
                      variant="determinate" 
                      value={tierProgress} 
                      sx={{ mb: 1, height: 8, borderRadius: 4 }}
                    />
                    <Typography variant="body2" color="text.secondary">
                      {loyaltyData.pointsToNextTier} points to go
                    </Typography>
                  </>
                ) : (
                  <>
                    <Typography variant="h6" gutterBottom>
                      Maximum Tier Reached!
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      You've achieved the highest tier
                    </Typography>
                  </>
                )}
              </Paper>
            </Grid>
          </Grid>

          {/* Tier Benefits */}
          <Box sx={{ mt: 3 }}>
            <Typography variant="h6" gutterBottom>
              Your {currentTier.name} Benefits
            </Typography>
            <Grid container spacing={1}>
              {currentTier.benefits.map((benefit, index) => (
                <Grid item key={index}>
                  <Chip label={benefit} color="primary" variant="outlined" size="small" />
                </Grid>
              ))}
            </Grid>
          </Box>
        </CardContent>
      </Card>

      {/* Available Offers */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Available Offers
          </Typography>
          
          <Grid container spacing={2}>
            {availableOffers
              .filter(offer => offer.isActive && !loyaltyData.redeemedOffers.includes(offer.id))
              .map(offer => (
                <Grid item xs={12} sm={6} md={4} key={offer.id}>
                  <Card variant="outlined" sx={{ height: '100%' }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Avatar sx={{ bgcolor: `${getOfferTypeColor(offer.type)}.main`, mr: 2 }}>
                          {getOfferTypeIcon(offer.type)}
                        </Avatar>
                        <Box>
                          <Typography variant="h6" fontSize="1rem">
                            {offer.title}
                          </Typography>
                          <Chip 
                            label={`${offer.pointsCost} points`} 
                            size="small" 
                            color="primary"
                          />
                        </Box>
                      </Box>
                      
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        {offer.description}
                      </Typography>
                      
                      <Typography variant="caption" display="block" color="text.secondary" sx={{ mb: 2 }}>
                        Valid until: {format(offer.validUntil, 'MMM dd, yyyy')}
                      </Typography>
                      
                      <Button
                        fullWidth
                        variant="contained"
                        size="small"
                        startIcon={<RedeemIcon />}
                        onClick={() => handleRedeemOffer(offer)}
                        disabled={loyaltyData.availablePoints < offer.pointsCost}
                      >
                        Redeem
                      </Button>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
          </Grid>
        </CardContent>
      </Card>

      {/* Transaction History */}
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              Points History
            </Typography>
            <Button
              startIcon={<HistoryIcon />}
              onClick={() => setShowTransactionHistory(!showTransactionHistory)}
            >
              {showTransactionHistory ? 'Hide' : 'Show'} History
            </Button>
          </Box>

          {showTransactionHistory && (
            <List>
              {loyaltyData.transactions.slice(0, 10).map((transaction, index) => (
                <React.Fragment key={transaction.id}>
                  <ListItem>
                    <ListItemIcon>
                      {transaction.type === 'earned' && <TrendingUpIcon color="success" />}
                      {transaction.type === 'redeemed' && <RedeemIcon color="error" />}
                      {transaction.type === 'bonus' && <GiftIcon color="primary" />}
                      {transaction.type === 'expired' && <HistoryIcon color="disabled" />}
                    </ListItemIcon>
                    <ListItemText
                      primary={transaction.description}
                      secondary={format(transaction.date, 'MMM dd, yyyy - HH:mm')}
                    />
                    <ListItemSecondaryAction>
                      <Typography
                        variant="body2"
                        color={transaction.points > 0 ? 'success.main' : 'error.main'}
                        fontWeight="bold"
                      >
                        {transaction.points > 0 ? '+' : ''}{transaction.points}
                      </Typography>
                    </ListItemSecondaryAction>
                  </ListItem>
                  {index < loyaltyData.transactions.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          )}
        </CardContent>
      </Card>

      {/* Add Points Dialog */}
      <Dialog open={addPointsDialogOpen} onClose={() => setAddPointsDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Points to {customerName}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Points Amount"
                type="number"
                value={newPointsAmount}
                onChange={(e) => setNewPointsAmount(Number(e.target.value))}
                inputProps={{ min: 1 }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Reason"
                multiline
                rows={2}
                value={pointsReason}
                onChange={(e) => setPointsReason(e.target.value)}
                placeholder="e.g., Bonus for referral, Compensation, etc."
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddPointsDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleAddPoints} variant="contained">
            Add Points
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CustomerLoyalty; 