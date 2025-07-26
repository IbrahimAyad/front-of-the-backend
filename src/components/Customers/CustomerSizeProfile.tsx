import React from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  LinearProgress,
  Chip,
  Avatar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';
import {
  Straighten,
  CheckCircle,
  Warning,
  TrendingUp,
} from '@mui/icons-material';

interface CustomerSizeProfileProps {
  customerId: string;
  sizeProfile: any;
  purchaseHistory: any[];
}

const CustomerSizeProfile: React.FC<CustomerSizeProfileProps> = ({
  customerId,
  sizeProfile,
  purchaseHistory,
}) => {
  // Mock size data for demonstration
  const mockSizeProfile = {
    jacket: '42R',
    jacketConfidence: 0.95,
    shirt: '16.5/34',
    shirtConfidence: 0.88,
    pants: '34W/32L', 
    pantsConfidence: 0.75,
    shoes: '10.5',
    shoesConfidence: 0.60,
    completeness: 0.80,
  };

  const displayProfile = sizeProfile || mockSizeProfile;

  // Extract sizes from purchase history
  const extractedSizes = purchaseHistory
    .filter(item => item.size)
    .map(item => ({
      category: item.category,
      size: item.size,
      product: item.productName,
      date: item.orderDate,
    }));

  const getSizeIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'jacket': return '🧥';
      case 'shirt': return '👕';
      case 'pants': return '👖';
      case 'shoes': return '👞';
      default: return '📏';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'success';
    if (confidence >= 0.6) return 'warning';
    return 'error';
  };

  const getConfidenceIcon = (confidence: number) => {
    if (confidence >= 0.8) return <CheckCircle color="success" />;
    if (confidence >= 0.6) return <Warning color="warning" />;
    return <Warning color="error" />;
  };

  return (
    <Box>
      {/* Size Profile Overview */}
      <Box mb={4}>
        <Typography variant="h6" gutterBottom>
          Size Profile Analysis
        </Typography>
        
        <Grid container spacing={3}>
          {/* Profile Completeness */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" gap={2} mb={2}>
                  <TrendingUp color="primary" />
                  <Typography variant="h6">Profile Completeness</Typography>
                </Box>
                
                <Box display="flex" alignItems="center" gap={2}>
                  <LinearProgress
                    variant="determinate"
                    value={displayProfile.completeness * 100}
                    sx={{ flexGrow: 1, height: 10, borderRadius: 5 }}
                    color={getConfidenceColor(displayProfile.completeness) as any}
                  />
                  <Typography variant="h6" fontWeight="bold">
                    {Math.round(displayProfile.completeness * 100)}%
                  </Typography>
                </Box>
                
                <Typography variant="body2" color="textSecondary" mt={1}>
                  Based on {extractedSizes.length} purchase data points
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Size Confidence Summary */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Size Confidence Levels
                </Typography>
                
                <Box display="flex" flexDirection="column" gap={1}>
                  {Object.entries(displayProfile)
                    .filter(([key]) => key.includes('Confidence'))
                    .map(([key, confidence]) => {
                      const sizeType = key.replace('Confidence', '');
                      return (
                        <Box key={key} display="flex" alignItems="center" justifyContent="space-between">
                          <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                            {sizeType}
                          </Typography>
                          <Box display="flex" alignItems="center" gap={1}>
                            {getConfidenceIcon(confidence as number)}
                            <Typography variant="body2" fontWeight="medium">
                              {Math.round((confidence as number) * 100)}%
                            </Typography>
                          </Box>
                        </Box>
                      );
                    })}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>

      {/* Size Details Cards */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Avatar sx={{ bgcolor: 'primary.main', mx: 'auto', mb: 2 }}>
                🧥
              </Avatar>
              <Typography variant="h6" fontWeight="bold">
                {displayProfile.jacket || 'Unknown'}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Jacket Size
              </Typography>
              <LinearProgress
                variant="determinate"
                value={(displayProfile.jacketConfidence || 0) * 100}
                sx={{ mt: 1 }}
                color={getConfidenceColor(displayProfile.jacketConfidence || 0) as any}
              />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Avatar sx={{ bgcolor: 'secondary.main', mx: 'auto', mb: 2 }}>
                👕
              </Avatar>
              <Typography variant="h6" fontWeight="bold">
                {displayProfile.shirt || 'Unknown'}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Shirt Size
              </Typography>
              <LinearProgress
                variant="determinate"
                value={(displayProfile.shirtConfidence || 0) * 100}
                sx={{ mt: 1 }}
                color={getConfidenceColor(displayProfile.shirtConfidence || 0) as any}
              />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Avatar sx={{ bgcolor: 'info.main', mx: 'auto', mb: 2 }}>
                👖
              </Avatar>
              <Typography variant="h6" fontWeight="bold">
                {displayProfile.pants || 'Unknown'}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Pants Size
              </Typography>
              <LinearProgress
                variant="determinate"
                value={(displayProfile.pantsConfidence || 0) * 100}
                sx={{ mt: 1 }}
                color={getConfidenceColor(displayProfile.pantsConfidence || 0) as any}
              />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Avatar sx={{ bgcolor: 'warning.main', mx: 'auto', mb: 2 }}>
                👞
              </Avatar>
              <Typography variant="h6" fontWeight="bold">
                {displayProfile.shoes || 'Unknown'}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Shoe Size
              </Typography>
              <LinearProgress
                variant="determinate"
                value={(displayProfile.shoesConfidence || 0) * 100}
                sx={{ mt: 1 }}
                color={getConfidenceColor(displayProfile.shoesConfidence || 0) as any}
              />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Purchase-Based Size History */}
      <Box>
        <Typography variant="h6" gutterBottom>
          Size History from Purchases
        </Typography>
        
        <TableContainer component={Paper} variant="outlined">
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Product Category</TableCell>
                <TableCell>Size</TableCell>
                <TableCell>Product</TableCell>
                <TableCell>Purchase Date</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {extractedSizes.map((item, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={1}>
                      <span>{getSizeIcon(item.category)}</span>
                      <Typography variant="body2">
                        {item.category}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={item.size} 
                      size="small" 
                      color="primary"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {item.product}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {new Date(item.date).toLocaleDateString()}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {extractedSizes.length === 0 && (
          <Box textAlign="center" py={4}>
            <Straighten sx={{ fontSize: 64, color: 'action.disabled', mb: 2 }} />
            <Typography variant="h6" color="textSecondary">
              No size data available
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Size information will be extracted from future purchases
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default CustomerSizeProfile; 