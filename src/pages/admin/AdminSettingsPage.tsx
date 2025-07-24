import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
  TextField,
  Button,
  Switch,
  FormControlLabel,
  Divider,
  Alert,
  Card,
  CardContent,
  MenuItem,
} from '@mui/material';
import {
  Settings as SettingsIcon,
  Store as StoreIcon,
  Inventory as InventoryIcon,
  LocalShipping as ShippingIcon,
  Receipt as TaxIcon,
  Save as SaveIcon,
} from '@mui/icons-material';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`settings-tabpanel-${index}`}
      aria-labelledby={`settings-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const AdminSettingsPage: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [storeSettings, setStoreSettings] = useState({
    storeName: 'KCT Menswear',
    storeDescription: 'Premium luxury menswear and tailoring services',
    contactEmail: 'contact@kctmenswear.com',
    contactPhone: '+1 (555) 123-4567',
    address: '123 Fashion Avenue, New York, NY 10001',
    businessHours: '9:00 AM - 6:00 PM',
    timezone: 'America/New_York',
  });

  const [inventorySettings, setInventorySettings] = useState({
    lowStockThreshold: 5,
    outOfStockNotifications: true,
    autoReorder: false,
    trackingEnabled: true,
    skuPrefix: 'KCT',
    barcodeEnabled: false,
  });

  const [shippingSettings, setShippingSettings] = useState({
    freeShippingThreshold: 100,
    standardShippingRate: 10,
    expeditedShippingRate: 25,
    internationalShipping: true,
    processingTime: '1-2 business days',
    trackingEnabled: true,
  });

  const [taxSettings, setTaxSettings] = useState({
    taxEnabled: true,
    defaultTaxRate: 8.5,
    taxIncluded: false,
    taxCalculation: 'per_item',
    regionBasedTax: true,
  });

  const handleSave = () => {
    // Handle saving settings
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <SettingsIcon sx={{ fontSize: 32, color: 'primary.main' }} />
          <Box>
            <Typography variant="h4" gutterBottom>
              Store Settings
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Configure your store preferences and policies
            </Typography>
          </Box>
        </Box>
        <Button
          variant="contained"
          startIcon={<SaveIcon />}
          onClick={handleSave}
          sx={{ borderRadius: 2 }}
        >
          Save Changes
        </Button>
      </Box>

      {saveSuccess && (
        <Alert severity="success" sx={{ mb: 3 }}>
          Settings saved successfully!
        </Alert>
      )}

      {/* Settings Tabs */}
      <Paper sx={{ borderRadius: 2 }}>
        <Tabs 
          value={tabValue} 
          onChange={(e, newValue) => setTabValue(newValue)}
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab 
            icon={<StoreIcon />} 
            label="Store Information" 
            iconPosition="start"
            sx={{ minHeight: 64 }}
          />
          <Tab 
            icon={<InventoryIcon />} 
            label="Inventory Settings" 
            iconPosition="start"
            sx={{ minHeight: 64 }}
          />
          <Tab 
            icon={<ShippingIcon />} 
            label="Shipping & Delivery" 
            iconPosition="start"
            sx={{ minHeight: 64 }}
          />
          <Tab 
            icon={<TaxIcon />} 
            label="Tax Settings" 
            iconPosition="start"
            sx={{ minHeight: 64 }}
          />
        </Tabs>

        {/* Store Information Tab */}
        <TabPanel value={tabValue} index={0}>
          <Typography variant="h6" gutterBottom>
            Store Information
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 3 }}>
            <TextField
              label="Store Name"
              fullWidth
              value={storeSettings.storeName}
              onChange={(e) => setStoreSettings({ ...storeSettings, storeName: e.target.value })}
            />
            <TextField
              label="Contact Email"
              type="email"
              fullWidth
              value={storeSettings.contactEmail}
              onChange={(e) => setStoreSettings({ ...storeSettings, contactEmail: e.target.value })}
            />
            <TextField
              label="Contact Phone"
              fullWidth
              value={storeSettings.contactPhone}
              onChange={(e) => setStoreSettings({ ...storeSettings, contactPhone: e.target.value })}
            />
            <TextField
              label="Business Hours"
              fullWidth
              value={storeSettings.businessHours}
              onChange={(e) => setStoreSettings({ ...storeSettings, businessHours: e.target.value })}
            />
          </Box>
          <Box sx={{ mt: 3 }}>
            <TextField
              label="Store Description"
              fullWidth
              multiline
              rows={3}
              value={storeSettings.storeDescription}
              onChange={(e) => setStoreSettings({ ...storeSettings, storeDescription: e.target.value })}
            />
          </Box>
          <Box sx={{ mt: 3 }}>
            <TextField
              label="Store Address"
              fullWidth
              multiline
              rows={2}
              value={storeSettings.address}
              onChange={(e) => setStoreSettings({ ...storeSettings, address: e.target.value })}
            />
          </Box>
        </TabPanel>

        {/* Inventory Settings Tab */}
        <TabPanel value={tabValue} index={1}>
          <Typography variant="h6" gutterBottom>
            Inventory Management
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 3 }}>
            <TextField
              label="Low Stock Threshold"
              type="number"
              fullWidth
              value={inventorySettings.lowStockThreshold}
              onChange={(e) => setInventorySettings({ ...inventorySettings, lowStockThreshold: parseInt(e.target.value) })}
              helperText="Alert when stock falls below this number"
            />
            <TextField
              label="SKU Prefix"
              fullWidth
              value={inventorySettings.skuPrefix}
              onChange={(e) => setInventorySettings({ ...inventorySettings, skuPrefix: e.target.value })}
              helperText="Prefix for auto-generated SKUs"
            />
          </Box>
          
          <Divider sx={{ my: 3 }} />
          
          <Typography variant="subtitle1" gutterBottom>
            Notifications & Automation
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={inventorySettings.outOfStockNotifications}
                  onChange={(e) => setInventorySettings({ ...inventorySettings, outOfStockNotifications: e.target.checked })}
                />
              }
              label="Out of Stock Notifications"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={inventorySettings.autoReorder}
                  onChange={(e) => setInventorySettings({ ...inventorySettings, autoReorder: e.target.checked })}
                />
              }
              label="Automatic Reordering"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={inventorySettings.trackingEnabled}
                  onChange={(e) => setInventorySettings({ ...inventorySettings, trackingEnabled: e.target.checked })}
                />
              }
              label="Inventory Tracking"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={inventorySettings.barcodeEnabled}
                  onChange={(e) => setInventorySettings({ ...inventorySettings, barcodeEnabled: e.target.checked })}
                />
              }
              label="Barcode Management"
            />
          </Box>
        </TabPanel>

        {/* Shipping Settings Tab */}
        <TabPanel value={tabValue} index={2}>
          <Typography variant="h6" gutterBottom>
            Shipping & Delivery
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 3 }}>
            <TextField
              label="Free Shipping Threshold ($)"
              type="number"
              fullWidth
              value={shippingSettings.freeShippingThreshold}
              onChange={(e) => setShippingSettings({ ...shippingSettings, freeShippingThreshold: parseInt(e.target.value) })}
            />
            <TextField
              label="Standard Shipping Rate ($)"
              type="number"
              fullWidth
              value={shippingSettings.standardShippingRate}
              onChange={(e) => setShippingSettings({ ...shippingSettings, standardShippingRate: parseInt(e.target.value) })}
            />
            <TextField
              label="Expedited Shipping Rate ($)"
              type="number"
              fullWidth
              value={shippingSettings.expeditedShippingRate}
              onChange={(e) => setShippingSettings({ ...shippingSettings, expeditedShippingRate: parseInt(e.target.value) })}
            />
            <TextField
              label="Processing Time"
              fullWidth
              value={shippingSettings.processingTime}
              onChange={(e) => setShippingSettings({ ...shippingSettings, processingTime: e.target.value })}
            />
          </Box>

          <Divider sx={{ my: 3 }} />

          <Typography variant="subtitle1" gutterBottom>
            Shipping Options
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={shippingSettings.internationalShipping}
                  onChange={(e) => setShippingSettings({ ...shippingSettings, internationalShipping: e.target.checked })}
                />
              }
              label="International Shipping"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={shippingSettings.trackingEnabled}
                  onChange={(e) => setShippingSettings({ ...shippingSettings, trackingEnabled: e.target.checked })}
                />
              }
              label="Package Tracking"
            />
          </Box>
        </TabPanel>

        {/* Tax Settings Tab */}
        <TabPanel value={tabValue} index={3}>
          <Typography variant="h6" gutterBottom>
            Tax Configuration
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 3 }}>
            <TextField
              label="Default Tax Rate (%)"
              type="number"
              fullWidth
              value={taxSettings.defaultTaxRate}
              onChange={(e) => setTaxSettings({ ...taxSettings, defaultTaxRate: parseFloat(e.target.value) })}
              disabled={!taxSettings.taxEnabled}
            />
            <TextField
              label="Tax Calculation Method"
              select
              fullWidth
              value={taxSettings.taxCalculation}
              onChange={(e) => setTaxSettings({ ...taxSettings, taxCalculation: e.target.value })}
              disabled={!taxSettings.taxEnabled}
            >
              <MenuItem value="per_item">Per Item</MenuItem>
              <MenuItem value="per_order">Per Order</MenuItem>
              <MenuItem value="compound">Compound</MenuItem>
            </TextField>
          </Box>

          <Divider sx={{ my: 3 }} />

          <Typography variant="subtitle1" gutterBottom>
            Tax Options
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={taxSettings.taxEnabled}
                  onChange={(e) => setTaxSettings({ ...taxSettings, taxEnabled: e.target.checked })}
                />
              }
              label="Enable Tax Calculation"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={taxSettings.taxIncluded}
                  onChange={(e) => setTaxSettings({ ...taxSettings, taxIncluded: e.target.checked })}
                  disabled={!taxSettings.taxEnabled}
                />
              }
              label="Tax Included in Prices"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={taxSettings.regionBasedTax}
                  onChange={(e) => setTaxSettings({ ...taxSettings, regionBasedTax: e.target.checked })}
                  disabled={!taxSettings.taxEnabled}
                />
              }
              label="Region-Based Tax Rates"
            />
          </Box>
        </TabPanel>
      </Paper>
    </Box>
  );
};

export default AdminSettingsPage; 