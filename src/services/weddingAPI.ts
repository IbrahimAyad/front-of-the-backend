import { 
  WeddingParty, 
  WeddingMember, 
  WeddingFormData, 
  WeddingAnalytics,
  WeddingContact,
  Customer,
  SuitMeasurements,
  ShippingAddress
} from '../types';

class WeddingAPI {
  private static instance: WeddingAPI;
  private readonly WEDDINGS_KEY = 'wedding-parties';
  private readonly WEDDING_CUSTOMERS_KEY = 'wedding-customers';

  static getInstance(): WeddingAPI {
    if (!WeddingAPI.instance) {
      WeddingAPI.instance = new WeddingAPI();
    }
    return WeddingAPI.instance;
  }

  // Wedding Party operations
  async getWeddingParties(): Promise<WeddingParty[]> {
    try {
      const savedWeddings = localStorage.getItem(this.WEDDINGS_KEY);
      if (!savedWeddings) return this.getMockWeddings();
      
      const weddings = JSON.parse(savedWeddings);
      return weddings.map((wedding: any) => ({
        ...wedding,
        weddingDate: new Date(wedding.weddingDate),
        createdAt: new Date(wedding.createdAt),
        updatedAt: new Date(wedding.updatedAt),
        members: wedding.members.map((member: any) => ({
          ...member,
          addedAt: new Date(member.addedAt),
          measurements: member.measurements ? {
            ...member.measurements,
            submittedAt: new Date(member.measurements.submittedAt)
          } : undefined
        }))
      }));
    } catch (error) {
      console.error('Error loading wedding parties:', error);
      return this.getMockWeddings();
    }
  }

  async createWeddingParty(formData: WeddingFormData): Promise<WeddingParty> {
    try {
      const weddings = await this.getWeddingParties();
      const weddingCode = this.generateWeddingCode();
      
      const newWedding: WeddingParty = {
        id: `WED${String(weddings.length + 1).padStart(3, '0')}`,
        weddingCode,
        weddingDate: new Date(formData.weddingDate),
        groomInfo: {
          name: formData.groomName,
          email: formData.groomEmail,
          phone: formData.groomPhone,
        },
        brideInfo: {
          name: formData.brideName,
          email: formData.brideEmail,
          phone: formData.bridePhone,
        },
        stylePreferences: {
          suitColor: formData.suitColor,
          userRole: formData.userRole,
        },
        attireType: {
          type: formData.attireType,
          description: this.getAttireDescription(formData.attireType),
        },
        accessories: formData.accessories,
        specialRequests: formData.specialRequests,
        members: [],
        status: 'planning',
        estimatedPartySize: formData.estimatedPartySize,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Auto-create customers with wedding tag
      await this.createWeddingCustomers(newWedding);

      const updatedWeddings = [...weddings, newWedding];
      localStorage.setItem(this.WEDDINGS_KEY, JSON.stringify(updatedWeddings));
      
      return newWedding;
    } catch (error) {
      console.error('Error creating wedding party:', error);
      throw error;
    }
  }

  async updateWeddingParty(weddingId: string, updates: Partial<WeddingParty>): Promise<WeddingParty> {
    try {
      const weddings = await this.getWeddingParties();
      const weddingIndex = weddings.findIndex(w => w.id === weddingId);
      
      if (weddingIndex === -1) {
        throw new Error('Wedding party not found');
      }

      const updatedWedding = {
        ...weddings[weddingIndex],
        ...updates,
        updatedAt: new Date(),
      };

      weddings[weddingIndex] = updatedWedding;
      localStorage.setItem(this.WEDDINGS_KEY, JSON.stringify(weddings));
      
      return updatedWedding;
    } catch (error) {
      console.error('Error updating wedding party:', error);
      throw error;
    }
  }

  async getWeddingByCode(weddingCode: string): Promise<WeddingParty | null> {
    const weddings = await this.getWeddingParties();
    return weddings.find(w => w.weddingCode === weddingCode) || null;
  }

  // Wedding Member operations
  async addWeddingMember(weddingId: string, memberData: Omit<WeddingMember, 'id' | 'addedAt'>): Promise<WeddingMember> {
    try {
      const weddings = await this.getWeddingParties();
      const wedding = weddings.find(w => w.id === weddingId);
      
      if (!wedding) {
        throw new Error('Wedding party not found');
      }

      const newMember: WeddingMember = {
        ...memberData,
        id: `MEM${String(wedding.members.length + 1).padStart(3, '0')}`,
        addedAt: new Date(),
      };

      wedding.members.push(newMember);
      await this.updateWeddingParty(weddingId, { members: wedding.members });
      
      return newMember;
    } catch (error) {
      console.error('Error adding wedding member:', error);
      throw error;
    }
  }

  async updateWeddingMember(weddingId: string, memberId: string, updates: Partial<WeddingMember>): Promise<WeddingMember> {
    try {
      const weddings = await this.getWeddingParties();
      const wedding = weddings.find(w => w.id === weddingId);
      
      if (!wedding) {
        throw new Error('Wedding party not found');
      }

      const memberIndex = wedding.members.findIndex(m => m.id === memberId);
      if (memberIndex === -1) {
        throw new Error('Wedding member not found');
      }

      const updatedMember = {
        ...wedding.members[memberIndex],
        ...updates,
      };

      wedding.members[memberIndex] = updatedMember;
      await this.updateWeddingParty(weddingId, { members: wedding.members });
      
      return updatedMember;
    } catch (error) {
      console.error('Error updating wedding member:', error);
      throw error;
    }
  }

  async removeWeddingMember(weddingId: string, memberId: string): Promise<void> {
    try {
      const weddings = await this.getWeddingParties();
      const wedding = weddings.find(w => w.id === weddingId);
      
      if (!wedding) {
        throw new Error('Wedding party not found');
      }

      wedding.members = wedding.members.filter(m => m.id !== memberId);
      await this.updateWeddingParty(weddingId, { members: wedding.members });
    } catch (error) {
      console.error('Error removing wedding member:', error);
      throw error;
    }
  }

  // Analytics operations
  async getWeddingAnalytics(): Promise<WeddingAnalytics> {
    const weddings = await this.getWeddingParties();
    const now = new Date();
    
    const upcomingWeddings = weddings.filter(w => w.weddingDate > now);
    const completedWeddings = weddings.filter(w => w.status === 'completed');
    const totalMembers = weddings.reduce((sum, w) => sum + w.members.length, 0);
    const pendingMeasurements = weddings.reduce((sum, w) => 
      sum + w.members.filter(m => m.measurementStatus === 'pending').length, 0
    );

    // Wedding by month data
    const weddingsByMonth = this.getWeddingsByMonth(weddings);
    
    // Popular colors
    const colorCounts: Record<string, number> = {};
    weddings.forEach(w => {
      colorCounts[w.stylePreferences.suitColor] = (colorCounts[w.stylePreferences.suitColor] || 0) + 1;
    });
    
    const popularColors = Object.entries(colorCounts)
      .map(([color, count]) => ({ color, count }))
      .sort((a, b) => b.count - a.count);

    const averagePartySize = weddings.length > 0 
      ? weddings.reduce((sum, w) => sum + w.members.length, 0) / weddings.length 
      : 0;

    return {
      totalWeddings: weddings.length,
      upcomingWeddings: upcomingWeddings.length,
      completedWeddings: completedWeddings.length,
      totalMembers,
      pendingMeasurements,
      weddingsByMonth,
      popularColors,
      averagePartySize: Math.round(averagePartySize * 10) / 10,
    };
  }

  // Customer integration
  private async createWeddingCustomers(wedding: WeddingParty): Promise<void> {
    try {
      const existingCustomers = this.getWeddingCustomers();
      
      // Create groom customer
      const groomCustomer: Customer = {
        id: `temp_groom_${Date.now()}`,
        name: 'Groom',
        email: 'groom@example.com',
        phone: '+1-555-0102',
        address: '456 Groom Ave, Wedding City, WS 12346',
        dateOfBirth: null,
        preferences: 'Groom customer',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Create bride customer (for coordination)
      const brideCustomer: Customer = {
        id: `temp_bride_${Date.now()}`,
        name: 'Bride',
        email: 'bride@example.com',
        phone: '+1-555-0101',
        address: '123 Bride St, Wedding City, WS 12345',
        dateOfBirth: null,
        preferences: 'Bride customer',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const updatedCustomers = [...existingCustomers, groomCustomer, brideCustomer];
      localStorage.setItem(this.WEDDING_CUSTOMERS_KEY, JSON.stringify(updatedCustomers));
      
      // Update wedding with customer IDs
      wedding.groomInfo.customerId = groomCustomer.id.toString();
      wedding.brideInfo.customerId = brideCustomer.id.toString();
    } catch (error) {
      console.error('Error creating wedding customers:', error);
    }
  }

  private getWeddingCustomers(): Customer[] {
    try {
      const saved = localStorage.getItem(this.WEDDING_CUSTOMERS_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error('Error loading wedding customers:', error);
      return [];
    }
  }

  // Utility methods
  private generateWeddingCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  private getAttireDescription(type: string): string {
    const descriptions = {
      tuxedo: 'Classic formal wear for black-tie events',
      suit: 'Traditional suit for semi-formal to formal occasions',
      modern_fit: 'Contemporary style with a tailored silhouette',
      slim_fit: 'Sleek and fitted for a more contemporary look',
    };
    return descriptions[type as keyof typeof descriptions] || 'Custom attire selection';
  }

  private getWeddingsByMonth(weddings: WeddingParty[]) {
    const monthCounts: Record<string, number> = {};
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    weddings.forEach(wedding => {
      const month = months[wedding.weddingDate.getMonth()];
      monthCounts[month] = (monthCounts[month] || 0) + 1;
    });

    return months.map(month => ({
      month,
      count: monthCounts[month] || 0,
    }));
  }

  // Mock data for initial setup
  private getMockWeddings(): WeddingParty[] {
    const mockWeddings: WeddingParty[] = [
      {
        id: 'WED001',
        weddingCode: 'ABC123',
        weddingDate: new Date('2025-06-15'),
        groomInfo: {
          name: 'John Smith',
          email: 'john@example.com',
          phone: '(555) 123-4567',
        },
        brideInfo: {
          name: 'Jane Doe',
          email: 'jane@example.com',
          phone: '(555) 987-6543',
        },
        stylePreferences: {
          suitColor: 'navy',
          userRole: 'groom',
        },
        attireType: {
          type: 'tuxedo',
          description: 'Classic formal wear for black-tie events',
        },
        accessories: ['tie', 'pocket_square'],
        members: [
          {
            id: 'MEM001',
            name: 'Mike Johnson',
            email: 'mike@example.com',
            role: 'best_man',
            measurementStatus: 'completed',
            addedAt: new Date('2025-01-10'),
          },
          {
            id: 'MEM002',
            name: 'David Wilson',
            email: 'david@example.com',
            role: 'groomsman',
            measurementStatus: 'pending',
            addedAt: new Date('2025-01-12'),
          },
        ],
        status: 'measurements',
        estimatedPartySize: 6,
        createdAt: new Date('2025-01-08'),
        updatedAt: new Date('2025-01-15'),
      },
    ];

    // Save mock data to localStorage
    localStorage.setItem(this.WEDDINGS_KEY, JSON.stringify(mockWeddings));
    return mockWeddings;
  }

  // Clear all data (for testing)
  async clearAllData(): Promise<void> {
    localStorage.removeItem(this.WEDDINGS_KEY);
    localStorage.removeItem(this.WEDDING_CUSTOMERS_KEY);
  }

  // Helper method to get a single wedding party
  private getWeddingParty(weddingId: string): WeddingParty | null {
    const savedWeddings = localStorage.getItem(this.WEDDINGS_KEY);
    if (!savedWeddings) return null;
    
    const weddings = JSON.parse(savedWeddings);
    return weddings.find((w: WeddingParty) => w.id === weddingId) || null;
  }

  // Helper method to save weddings to localStorage
  private saveWeddings(): void {
    const savedWeddings = localStorage.getItem(this.WEDDINGS_KEY);
    if (savedWeddings) {
      // This method is called after modifying wedding data in memory
      // The actual saving happens in the update methods that call this
      // For now, we'll implement a simple version that re-saves all weddings
      const weddings = JSON.parse(savedWeddings);
      localStorage.setItem(this.WEDDINGS_KEY, JSON.stringify(weddings));
    }
  }

  // Update member suit measurements
  updateMemberSuitMeasurements(weddingId: string, memberId: string, suitMeasurements: SuitMeasurements): WeddingMember | null {
    const savedWeddings = localStorage.getItem(this.WEDDINGS_KEY);
    if (!savedWeddings) return null;
    
    const weddings = JSON.parse(savedWeddings);
    const weddingIndex = weddings.findIndex((w: WeddingParty) => w.id === weddingId);
    if (weddingIndex === -1) return null;

    const memberIndex = weddings[weddingIndex].members.findIndex((m: WeddingMember) => m.id === memberId);
    if (memberIndex === -1) return null;

    weddings[weddingIndex].members[memberIndex] = {
      ...weddings[weddingIndex].members[memberIndex],
      suitMeasurements: {
        ...weddings[weddingIndex].members[memberIndex].suitMeasurements,
        ...suitMeasurements,
        finalizedAt: new Date()
      },
      measurementStatus: 'completed'
    };

    localStorage.setItem(this.WEDDINGS_KEY, JSON.stringify(weddings));
    return weddings[weddingIndex].members[memberIndex];
  }

  // Update member shipping address
  updateMemberShippingAddress(weddingId: string, memberId: string, shippingAddress: ShippingAddress): WeddingMember | null {
    const savedWeddings = localStorage.getItem(this.WEDDINGS_KEY);
    if (!savedWeddings) return null;
    
    const weddings = JSON.parse(savedWeddings);
    const weddingIndex = weddings.findIndex((w: WeddingParty) => w.id === weddingId);
    if (weddingIndex === -1) return null;

    const memberIndex = weddings[weddingIndex].members.findIndex((m: WeddingMember) => m.id === memberId);
    if (memberIndex === -1) return null;

    weddings[weddingIndex].members[memberIndex] = {
      ...weddings[weddingIndex].members[memberIndex],
      shippingAddress,
      needsShipping: true
    };

    localStorage.setItem(this.WEDDINGS_KEY, JSON.stringify(weddings));
    return weddings[weddingIndex].members[memberIndex];
  }

  // Update member order status
  updateMemberOrderStatus(weddingId: string, memberId: string, orderStatus: WeddingMember['orderStatus']): WeddingMember | null {
    const savedWeddings = localStorage.getItem(this.WEDDINGS_KEY);
    if (!savedWeddings) return null;
    
    const weddings = JSON.parse(savedWeddings);
    const weddingIndex = weddings.findIndex((w: WeddingParty) => w.id === weddingId);
    if (weddingIndex === -1) return null;

    const memberIndex = weddings[weddingIndex].members.findIndex((m: WeddingMember) => m.id === memberId);
    if (memberIndex === -1) return null;

    weddings[weddingIndex].members[memberIndex] = {
      ...weddings[weddingIndex].members[memberIndex],
      orderStatus
    };

    localStorage.setItem(this.WEDDINGS_KEY, JSON.stringify(weddings));
    return weddings[weddingIndex].members[memberIndex];
  }

  // Get members needing shipping
  getMembersNeedingShipping(weddingId: string): WeddingMember[] {
    const wedding = this.getWeddingParty(weddingId);
    if (!wedding) return [];

    return wedding.members.filter(member => 
      member.needsShipping && 
      member.shippingAddress &&
      member.orderStatus !== 'delivered'
    );
  }

  // Get members by order status
  getMembersByOrderStatus(weddingId: string, status: WeddingMember['orderStatus']): WeddingMember[] {
    const wedding = this.getWeddingParty(weddingId);
    if (!wedding) return [];

    return wedding.members.filter(member => member.orderStatus === status);
  }

  // Get measurement completion stats
  getMeasurementStats(weddingId: string) {
    const wedding = this.getWeddingParty(weddingId);
    if (!wedding) return null;

    const totalMembers = wedding.members.length;
    const basicMeasurements = wedding.members.filter(m => m.measurements).length;
    const suitMeasurements = wedding.members.filter(m => m.suitMeasurements?.finalizedAt).length;
    const shippingAddresses = wedding.members.filter(m => m.shippingAddress).length;

    return {
      totalMembers,
      basicMeasurements,
      suitMeasurements,
      shippingAddresses,
      basicMeasurementsPercent: Math.round((basicMeasurements / totalMembers) * 100),
      suitMeasurementsPercent: Math.round((suitMeasurements / totalMembers) * 100),
      shippingAddressesPercent: Math.round((shippingAddresses / totalMembers) * 100)
    };
  }
}

export const weddingAPI = WeddingAPI.getInstance(); 