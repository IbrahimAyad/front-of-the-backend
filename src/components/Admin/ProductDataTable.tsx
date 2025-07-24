import React, { useState, useCallback, useMemo } from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Checkbox,
  IconButton,
  Button,
  Chip,
  TextField,
  InputAdornment,
  Avatar,
  Tooltip,
  Menu,
  MenuItem,
  Typography,
  Toolbar,
  Badge,
  Switch,
  FormControlLabel,
  Select,
  OutlinedInput,
  LinearProgress,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon,
  Search as SearchIcon,
  FilterList as FilterListIcon,
  GetApp as ExportIcon,
  Add as AddIcon,
  Visibility as ViewIcon,
  VisibilityOff as HiddenIcon,
  Archive as ArchiveIcon,
  Unarchive as UnarchiveIcon,
  LocalOffer as PriceIcon,
  Inventory as InventoryIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  ContentCopy as DuplicateIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';

interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  subcategory?: string;
  price: number;
  compareAtPrice?: number;
  costPrice?: number;
  totalStock: number;
  availableStock: number;
  reservedStock: number;
  status: 'ACTIVE' | 'INACTIVE' | 'DISCONTINUED';
  isPublished: boolean;
  isFeatured: boolean;
  isOnSale: boolean;
  images: Array<{ url: string; isPrimary: boolean }>;
  variants: Array<{ id: string; name: string; stock: number }>;
  brand?: string;
  updatedAt: Date;
  sales?: number;
  revenue?: number;
}

interface ProductDataTableProps {
  products: Product[];
  onEdit: (product: Product) => void;
  onDelete: (productIds: string[]) => void;
  onBulkAction: (action: string, productIds: string[]) => void;
  onRefresh: () => void;
}

const ProductDataTable: React.FC<ProductDataTableProps> = ({
  products,
  onEdit,
  onDelete,
  onBulkAction,
  onRefresh,
}) => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [selected, setSelected] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterAnchorEl, setFilterAnchorEl] = useState<null | HTMLElement>(null);
  const [categoryFilter, setCategoryFilter] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [stockFilter, setStockFilter] = useState<'all' | 'low' | 'out'>('all');
  const [actionMenuAnchor, setActionMenuAnchor] = useState<null | HTMLElement>(null);
  const [currentProduct, setCurrentProduct] = useState<Product | null>(null);

  // Filter and search products
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      // Search filter
      if (searchQuery && !(
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.brand?.toLowerCase().includes(searchQuery.toLowerCase())
      )) {
        return false;
      }

      // Category filter
      if (categoryFilter.length > 0 && !categoryFilter.includes(product.category)) {
        return false;
      }

      // Status filter
      if (statusFilter.length > 0 && !statusFilter.includes(product.status)) {
        return false;
      }

      // Stock filter
      if (stockFilter === 'low' && product.availableStock > 10) {
        return false;
      }
      if (stockFilter === 'out' && product.availableStock > 0) {
        return false;
      }

      return true;
    });
  }, [products, searchQuery, categoryFilter, statusFilter, stockFilter]);

  const handleSelectAllClick = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      const newSelected = filteredProducts.map((n) => n.id);
      setSelected(newSelected);
      return;
    }
    setSelected([]);
  };

  const handleClick = (event: React.MouseEvent<unknown>, id: string) => {
    const selectedIndex = selected.indexOf(id);
    let newSelected: string[] = [];

    if (selectedIndex === -1) {
      newSelected = newSelected.concat(selected, id);
    } else if (selectedIndex === 0) {
      newSelected = newSelected.concat(selected.slice(1));
    } else if (selectedIndex === selected.length - 1) {
      newSelected = newSelected.concat(selected.slice(0, -1));
    } else if (selectedIndex > 0) {
      newSelected = newSelected.concat(
        selected.slice(0, selectedIndex),
        selected.slice(selectedIndex + 1)
      );
    }

    setSelected(newSelected);
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const isSelected = (id: string) => selected.indexOf(id) !== -1;

  const getStockStatus = (product: Product) => {
    if (product.availableStock === 0) {
      return { label: 'Out of Stock', color: 'error' as const, icon: <WarningIcon fontSize="small" /> };
    } else if (product.availableStock <= 10) {
      return { label: 'Low Stock', color: 'warning' as const, icon: <TrendingDownIcon fontSize="small" /> };
    } else {
      return { label: 'In Stock', color: 'success' as const, icon: <CheckCircleIcon fontSize="small" /> };
    }
  };

  const getStatusChip = (status: string) => {
    const statusConfig = {
      ACTIVE: { color: 'success' as const, label: 'Active' },
      INACTIVE: { color: 'default' as const, label: 'Inactive' },
      DISCONTINUED: { color: 'error' as const, label: 'Discontinued' },
    };
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.INACTIVE;
    return <Chip size="small" label={config.label} color={config.color} />;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const calculateMargin = (price: number, cost?: number) => {
    if (!cost || cost === 0) return null;
    const margin = ((price - cost) / price) * 100;
    return margin.toFixed(1);
  };

  return (
    <Paper sx={{ width: '100%', mb: 2 }}>
      <Toolbar
        sx={{
          pl: { sm: 2 },
          pr: { xs: 1, sm: 1 },
          ...(selected.length > 0 && {
            bgcolor: (theme) =>
              theme.palette.mode === 'light'
                ? 'rgba(25, 118, 210, 0.08)'
                : 'rgba(144, 202, 249, 0.08)',
          }),
        }}
      >
        {selected.length > 0 ? (
          <Typography
            sx={{ flex: '1 1 100%' }}
            color="inherit"
            variant="subtitle1"
            component="div"
          >
            {selected.length} selected
          </Typography>
        ) : (
          <Box sx={{ flex: '1 1 100%', display: 'flex', alignItems: 'center', gap: 2 }}>
            <TextField
              variant="outlined"
              size="small"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
              sx={{ minWidth: 300 }}
            />
            <IconButton
              onClick={(e) => setFilterAnchorEl(e.currentTarget)}
              color={categoryFilter.length > 0 || statusFilter.length > 0 || stockFilter !== 'all' ? 'primary' : 'default'}
            >
              <Badge
                badgeContent={
                  categoryFilter.length + statusFilter.length + (stockFilter !== 'all' ? 1 : 0)
                }
                color="primary"
              >
                <FilterListIcon />
              </Badge>
            </IconButton>
          </Box>
        )}

        {selected.length > 0 ? (
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              size="small"
              onClick={() => onBulkAction('publish', selected)}
              startIcon={<ViewIcon />}
            >
              Publish
            </Button>
            <Button
              size="small"
              onClick={() => onBulkAction('unpublish', selected)}
              startIcon={<HiddenIcon />}
            >
              Unpublish
            </Button>
            <Button
              size="small"
              onClick={() => onBulkAction('archive', selected)}
              startIcon={<ArchiveIcon />}
            >
              Archive
            </Button>
            <Button
              size="small"
              color="error"
              onClick={() => {
                onDelete(selected);
                setSelected([]);
              }}
              startIcon={<DeleteIcon />}
            >
              Delete
            </Button>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => onEdit({} as Product)}
            >
              Add Product
            </Button>
            <IconButton onClick={() => onBulkAction('export', [])}>
              <ExportIcon />
            </IconButton>
            <IconButton onClick={onRefresh}>
              <TrendingUpIcon />
            </IconButton>
          </Box>
        )}
      </Toolbar>

      <TableContainer>
        <Table sx={{ minWidth: 750 }} size="small">
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox">
                <Checkbox
                  color="primary"
                  indeterminate={selected.length > 0 && selected.length < filteredProducts.length}
                  checked={filteredProducts.length > 0 && selected.length === filteredProducts.length}
                  onChange={handleSelectAllClick}
                />
              </TableCell>
              <TableCell>Product</TableCell>
              <TableCell>SKU</TableCell>
              <TableCell>Category</TableCell>
              <TableCell align="center">Stock</TableCell>
              <TableCell align="right">Price</TableCell>
              <TableCell align="center">Margin</TableCell>
              <TableCell align="center">Status</TableCell>
              <TableCell align="center">Published</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredProducts
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((product) => {
                const isItemSelected = isSelected(product.id);
                const stockStatus = getStockStatus(product);
                const margin = calculateMargin(product.price, product.costPrice);

                return (
                  <TableRow
                    hover
                    onClick={(event) => handleClick(event, product.id)}
                    role="checkbox"
                    aria-checked={isItemSelected}
                    tabIndex={-1}
                    key={product.id}
                    selected={isItemSelected}
                  >
                    <TableCell padding="checkbox">
                      <Checkbox
                        color="primary"
                        checked={isItemSelected}
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar
                          src={product.images.find(img => img.isPrimary)?.url || product.images[0]?.url}
                          variant="rounded"
                          sx={{ width: 48, height: 48 }}
                        >
                          {product.name[0]}
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle2" fontWeight="medium">
                            {product.name}
                          </Typography>
                          {product.brand && (
                            <Typography variant="caption" color="text.secondary">
                              {product.brand}
                            </Typography>
                          )}
                          {product.isFeatured && (
                            <Chip
                              label="Featured"
                              size="small"
                              color="primary"
                              sx={{ ml: 1, height: 20 }}
                            />
                          )}
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                        {product.sku}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2">{product.category}</Typography>
                        {product.subcategory && (
                          <Typography variant="caption" color="text.secondary">
                            {product.subcategory}
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                        <Chip
                          icon={stockStatus.icon}
                          label={`${product.availableStock} / ${product.totalStock}`}
                          size="small"
                          color={stockStatus.color}
                        />
                        {product.reservedStock > 0 && (
                          <Tooltip title={`${product.reservedStock} reserved`}>
                            <Badge badgeContent={product.reservedStock} color="warning" max={999}>
                              <InventoryIcon fontSize="small" color="action" />
                            </Badge>
                          </Tooltip>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell align="right">
                      <Box>
                        <Typography variant="body2" fontWeight="medium">
                          {formatCurrency(product.price)}
                        </Typography>
                        {product.compareAtPrice && product.compareAtPrice > product.price && (
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ textDecoration: 'line-through' }}
                          >
                            {formatCurrency(product.compareAtPrice)}
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell align="center">
                      {margin ? (
                        <Chip
                          label={`${margin}%`}
                          size="small"
                          color={parseFloat(margin) > 50 ? 'success' : parseFloat(margin) > 30 ? 'default' : 'warning'}
                        />
                      ) : (
                        <Typography variant="caption" color="text.secondary">
                          —
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell align="center">
                      {getStatusChip(product.status)}
                    </TableCell>
                    <TableCell align="center">
                      <Switch
                        checked={product.isPublished}
                        onChange={(e) => {
                          e.stopPropagation();
                          onBulkAction('toggle-publish', [product.id]);
                        }}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                        <Tooltip title="Edit">
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              onEdit(product);
                            }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Duplicate">
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              onBulkAction('duplicate', [product.id]);
                            }}
                          >
                            <DuplicateIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            setCurrentProduct(product);
                            setActionMenuAnchor(e.currentTarget);
                          }}
                        >
                          <MoreVertIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                );
              })}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        rowsPerPageOptions={[10, 25, 50, 100]}
        component="div"
        count={filteredProducts.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />

      {/* Filter Menu */}
      <Menu
        anchorEl={filterAnchorEl}
        open={Boolean(filterAnchorEl)}
        onClose={() => setFilterAnchorEl(null)}
        PaperProps={{ sx: { width: 320, p: 2 } }}
      >
        <Typography variant="subtitle2" gutterBottom>
          Filter Products
        </Typography>
        
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Category
          </Typography>
          <Select
            multiple
            size="small"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as string[])}
            input={<OutlinedInput />}
            renderValue={(selected) => selected.join(', ')}
            fullWidth
          >
            {['Suits', 'Shirts', 'Ties', 'Vests', 'Accessories'].map((category) => (
              <MenuItem key={category} value={category}>
                <Checkbox checked={categoryFilter.indexOf(category) > -1} />
                {category}
              </MenuItem>
            ))}
          </Select>
        </Box>

        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Status
          </Typography>
          <Select
            multiple
            size="small"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as string[])}
            input={<OutlinedInput />}
            renderValue={(selected) => selected.join(', ')}
            fullWidth
          >
            {['ACTIVE', 'INACTIVE', 'DISCONTINUED'].map((status) => (
              <MenuItem key={status} value={status}>
                <Checkbox checked={statusFilter.indexOf(status) > -1} />
                {status}
              </MenuItem>
            ))}
          </Select>
        </Box>

        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Stock Level
          </Typography>
          <Select
            size="small"
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value as 'all' | 'low' | 'out')}
            fullWidth
          >
            <MenuItem value="all">All Products</MenuItem>
            <MenuItem value="low">Low Stock (≤10)</MenuItem>
            <MenuItem value="out">Out of Stock</MenuItem>
          </Select>
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Button
            size="small"
            onClick={() => {
              setCategoryFilter([]);
              setStatusFilter([]);
              setStockFilter('all');
            }}
          >
            Clear All
          </Button>
          <Button
            size="small"
            variant="contained"
            onClick={() => setFilterAnchorEl(null)}
          >
            Apply
          </Button>
        </Box>
      </Menu>

      {/* Action Menu */}
      <Menu
        anchorEl={actionMenuAnchor}
        open={Boolean(actionMenuAnchor)}
        onClose={() => setActionMenuAnchor(null)}
      >
        <MenuItem
          onClick={() => {
            if (currentProduct) {
              onEdit(currentProduct);
            }
            setActionMenuAnchor(null);
          }}
        >
          <EditIcon fontSize="small" sx={{ mr: 1 }} />
          Edit Product
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (currentProduct) {
              onBulkAction('duplicate', [currentProduct.id]);
            }
            setActionMenuAnchor(null);
          }}
        >
          <DuplicateIcon fontSize="small" sx={{ mr: 1 }} />
          Duplicate
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (currentProduct) {
              onBulkAction('archive', [currentProduct.id]);
            }
            setActionMenuAnchor(null);
          }}
        >
          <ArchiveIcon fontSize="small" sx={{ mr: 1 }} />
          Archive
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (currentProduct) {
              onDelete([currentProduct.id]);
            }
            setActionMenuAnchor(null);
          }}
          sx={{ color: 'error.main' }}
        >
          <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
          Delete
        </MenuItem>
      </Menu>
    </Paper>
  );
};

export default ProductDataTable;