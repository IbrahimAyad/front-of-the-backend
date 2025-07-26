import React, { useState } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Avatar,
  IconButton,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Grid,
  Card,
  CardContent,
  Tooltip,
  Badge,
} from '@mui/material';
import {
  ShoppingBag,
  FilterList,
  Group,
  Person,
  Event,
  AttachMoney,
  Search,
  Visibility,
} from '@mui/icons-material';

interface PurchaseHistoryTableProps {
  customerId: string;
  purchaseHistory: any[];
}

const PurchaseHistoryTable: React.FC<PurchaseHistoryTableProps> = ({
  customerId,
  purchaseHistory,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [occasionFilter, setOccasionFilter] = useState('');

  // Enhanced mock data for demonstration
  const mockPurchaseHistory = [
    {
      id: 'ph1',
      productName: 'Navy Blue Tuxedo - Slim Fit with Satin Lapel',
      category: 'Tuxedo',
      productType: 'Formal',
      size: '42R',
      color: 'Navy Blue',
      occasion: 'wedding',
      orderDate: '2024-12-20',
      paidDate: '2024-12-20',
      price: 599.99,
      quantity: 1,
      isGroupOrder: true,
      groupOrderId: 'group_001',
      orderTotal: 899.97,
    },
    {
      id: 'ph2',
      productName: 'White French Cuff Dress Shirt - Classic Fit',
      category: 'Shirt',
      productType: 'Formal',
      size: '16.5/34',
      color: 'White',
      occasion: 'wedding',
      orderDate: '2024-12-20',
      paidDate: '2024-12-20',
      price: 149.99,
      quantity: 2,
      isGroupOrder: true,
      groupOrderId: 'group_001',
      orderTotal: 899.97,
    },
    {
      id: 'ph3',
      productName: 'Black Silk Bow Tie - Hand-tied',
      category: 'Accessories',
      productType: 'Formal',
      color: 'Black',
      occasion: 'wedding',
      orderDate: '2024-12-20',
      paidDate: '2024-12-20',
      price: 89.99,
      quantity: 1,
      isGroupOrder: true,
      groupOrderId: 'group_001',
      orderTotal: 899.97,
    },
    {
      id: 'ph4',
      productName: 'Charcoal Grey Business Suit - Modern Fit',
      category: 'Suit',
      productType: 'Business',
      size: '42R',
      color: 'Charcoal Grey',
      occasion: 'business',
      orderDate: '2024-10-15',
      paidDate: '2024-10-15',
      price: 749.99,
      quantity: 1,
      isGroupOrder: false,
      orderTotal: 749.99,
    },
    {
      id: 'ph5',
      productName: 'Royal Blue Prom Tuxedo - Shawl Lapel',
      category: 'Tuxedo',
      productType: 'Prom',
      size: '42R',
      color: 'Royal Blue',
      occasion: 'prom',
      orderDate: '2024-03-28',
      paidDate: '2024-03-28',
      price: 449.99,
      quantity: 1,
      isGroupOrder: false,
      orderTotal: 449.99,
    },
  ];

  const displayHistory = purchaseHistory.length > 0 ? purchaseHistory : mockPurchaseHistory;

  // Filter the purchase history
  const filteredHistory = displayHistory.filter(item => {
    const matchesSearch = item.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.color?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.size?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !categoryFilter || item.category === categoryFilter;
    const matchesOccasion = !occasionFilter || item.occasion === occasionFilter;
    
    return matchesSearch && matchesCategory && matchesOccasion;
  });

  // Calculate summary stats
  const totalSpent = filteredHistory.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const totalItems = filteredHistory.reduce((sum, item) => sum + item.quantity, 0);
  const uniqueCategories = [...new Set(filteredHistory.map(item => item.category))];
  const groupOrders = filteredHistory.filter(item => item.isGroupOrder).length;

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'tuxedo': return '🤵';
      case 'suit': return '👔';
      case 'shirt': return '👕';
      case 'accessories': return '👎';
      default: return '🛍️';
    }
  };

  const getOccasionColor = (occasion: string) => {
    switch (occasion) {
      case 'wedding': return 'error';
      case 'prom': return 'secondary';
      case 'business': return 'primary';
      default: return 'default';
    }
  };

  return (
    <Box>
      {/* Summary Cards */}
      <Grid container spacing={2} mb={3}>
        <Grid item xs={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <ShoppingBag color="primary" sx={{ fontSize: 32, mb: 1 }} />
              <Typography variant="h6" fontWeight="bold">
                {filteredHistory.length}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Total Purchases
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <AttachMoney color="success" sx={{ fontSize: 32, mb: 1 }} />
              <Typography variant="h6" fontWeight="bold">
                ${totalSpent.toFixed(2)}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Total Spent
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Group color="info" sx={{ fontSize: 32, mb: 1 }} />
              <Typography variant="h6" fontWeight="bold">
                {groupOrders}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Group Orders
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <FilterList color="warning" sx={{ fontSize: 32, mb: 1 }} />
              <Typography variant="h6" fontWeight="bold">
                {uniqueCategories.length}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Categories
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters */}
      <Grid container spacing={2} mb={3}>
        <Grid item xs={6}>
          <TextField
            fullWidth
            label="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: <Search sx={{ mr: 1, color: 'action.active' }} />,
            }}
          />
        </Grid>
        <Grid item xs={3}>
          <FormControl fullWidth>
            <InputLabel>Category</InputLabel>
            <Select
              value={categoryFilter}
              label="Category"
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <MenuItem value="">All Categories</MenuItem>
              <MenuItem value="Tuxedo">Tuxedo</MenuItem>
              <MenuItem value="Suit">Suit</MenuItem>
              <MenuItem value="Shirt">Shirt</MenuItem>
              <MenuItem value="Accessories">Accessories</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={3}>
          <FormControl fullWidth>
            <InputLabel>Occasion</InputLabel>
            <Select
              value={occasionFilter}
              label="Occasion"
              onChange={(e) => setOccasionFilter(e.target.value)}
            >
              <MenuItem value="">All Occasions</MenuItem>
              <MenuItem value="wedding">Wedding</MenuItem>
              <MenuItem value="prom">Prom</MenuItem>
              <MenuItem value="business">Business</MenuItem>
              <MenuItem value="general">General</MenuItem>
            </Select>
          </FormControl>
        </Grid>
      </Grid>

      {/* Purchase History Table */}
      <TableContainer component={Paper} variant="outlined">
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Product</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Size/Color</TableCell>
              <TableCell>Occasion</TableCell>
              <TableCell>Date</TableCell>
              <TableCell align="right">Price</TableCell>
              <TableCell align="center">Qty</TableCell>
              <TableCell align="center">Order Type</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredHistory.map((item) => (
              <TableRow key={item.id} hover>
                <TableCell>
                  <Box display="flex" alignItems="center" gap={2}>
                    <Avatar sx={{ bgcolor: 'primary.main', width: 40, height: 40 }}>
                      {getCategoryIcon(item.category)}
                    </Avatar>
                    <Box>
                      <Typography variant="body2" fontWeight="medium">
                        {item.productName}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        {item.productType}
                      </Typography>
                    </Box>
                  </Box>
                </TableCell>
                
                <TableCell>
                  <Chip 
                    label={item.category} 
                    size="small" 
                    variant="outlined"
                    color="primary"
                  />
                </TableCell>
                
                <TableCell>
                  <Box>
                    {item.size && (
                      <Chip 
                        label={item.size} 
                        size="small" 
                        sx={{ mb: 0.5, mr: 0.5 }}
                      />
                    )}
                    {item.color && (
                      <Chip 
                        label={item.color} 
                        size="small" 
                        variant="outlined"
                      />
                    )}
                  </Box>
                </TableCell>
                
                <TableCell>
                  <Chip 
                    label={item.occasion} 
                    size="small" 
                    color={getOccasionColor(item.occasion) as any}
                  />
                </TableCell>
                
                <TableCell>
                  <Box>
                    <Typography variant="body2">
                      {new Date(item.orderDate).toLocaleDateString()}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      <Event sx={{ fontSize: 12, mr: 0.5 }} />
                      {new Date(item.orderDate).toLocaleDateString('en-US', { 
                        weekday: 'short' 
                      })}
                    </Typography>
                  </Box>
                </TableCell>
                
                <TableCell align="right">
                  <Typography variant="body2" fontWeight="medium">
                    ${item.price.toFixed(2)}
                  </Typography>
                  {item.quantity > 1 && (
                    <Typography variant="caption" color="textSecondary">
                      × {item.quantity}
                    </Typography>
                  )}
                </TableCell>
                
                <TableCell align="center">
                  <Typography variant="body2" fontWeight="bold">
                    {item.quantity}
                  </Typography>
                </TableCell>
                
                <TableCell align="center">
                  {item.isGroupOrder ? (
                    <Tooltip title="Part of group order">
                      <Badge color="secondary" variant="dot">
                        <Group color="action" />
                      </Badge>
                    </Tooltip>
                  ) : (
                    <Tooltip title="Individual order">
                      <Person color="action" />
                    </Tooltip>
                  )}
                </TableCell>
                
                <TableCell align="center">
                  <Tooltip title="View Order Details">
                    <IconButton size="small">
                      <Visibility />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {filteredHistory.length === 0 && (
        <Box textAlign="center" py={4}>
          <ShoppingBag sx={{ fontSize: 64, color: 'action.disabled', mb: 2 }} />
          <Typography variant="h6" color="textSecondary">
            No purchases found
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Try adjusting your search or filter criteria
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default PurchaseHistoryTable; 