interface TailoringTicket {
  id: string;
  ticketNumber: string;
  physicalTicketNumber?: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  services: AlterationService[];
  status: 'dropped_off' | 'in_progress' | 'quality_check' | 'ready_pickup' | 'completed';
  priority: 'normal' | 'rush';
  location: 'shop_1' | 'shop_2';
  dropOffDate: Date;
  estimatedPickupDate: Date;
  scheduledPickupDate: Date;
  actualPickupDate?: Date;
  notes?: string;
  totalItems: number;
  createdAt: Date;
  updatedAt: Date;
}

interface AlterationService {
  id: string;
  type: string;
  description: string;
  garmentType: 'shirt' | 'pants' | 'jacket' | 'other';
  quantity: number;
  notes?: string;
}

interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
}

class TailoringAPI {
  private static instance: TailoringAPI;
  private readonly TICKETS_KEY = 'tailoring-tickets';
  private readonly CUSTOMERS_KEY = 'tailoring-customers';

  static getInstance(): TailoringAPI {
    if (!TailoringAPI.instance) {
      TailoringAPI.instance = new TailoringAPI();
    }
    return TailoringAPI.instance;
  }

  // Ticket operations
  async getTickets(): Promise<TailoringTicket[]> {
    try {
      const savedTickets = localStorage.getItem(this.TICKETS_KEY);
      if (!savedTickets) return [];
      
      const tickets = JSON.parse(savedTickets);
      return tickets.map((ticket: any) => ({
        ...ticket,
        dropOffDate: new Date(ticket.dropOffDate),
        estimatedPickupDate: new Date(ticket.estimatedPickupDate),
        scheduledPickupDate: new Date(ticket.scheduledPickupDate),
        actualPickupDate: ticket.actualPickupDate ? new Date(ticket.actualPickupDate) : undefined,
        createdAt: new Date(ticket.createdAt),
        updatedAt: new Date(ticket.updatedAt),
      }));
    } catch (error) {
      console.error('Error loading tickets:', error);
      return [];
    }
  }

  async createTicket(ticketData: Omit<TailoringTicket, 'id' | 'ticketNumber' | 'createdAt' | 'updatedAt'>): Promise<TailoringTicket> {
    try {
      const tickets = await this.getTickets();
      const newTicket: TailoringTicket = {
        ...ticketData,
        id: `TKT${String(tickets.length + 1).padStart(3, '0')}`,
        ticketNumber: `T-2024-${String(tickets.length + 1).padStart(3, '0')}`,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const updatedTickets = [...tickets, newTicket];
      localStorage.setItem(this.TICKETS_KEY, JSON.stringify(updatedTickets));
      
      return newTicket;
    } catch (error) {
      console.error('Error creating ticket:', error);
      throw error;
    }
  }

  async updateTicket(ticketId: string, updates: Partial<TailoringTicket>): Promise<TailoringTicket> {
    try {
      const tickets = await this.getTickets();
      const ticketIndex = tickets.findIndex(t => t.id === ticketId);
      
      if (ticketIndex === -1) {
        throw new Error('Ticket not found');
      }

      const updatedTicket = {
        ...tickets[ticketIndex],
        ...updates,
        updatedAt: new Date(),
      };

      tickets[ticketIndex] = updatedTicket;
      localStorage.setItem(this.TICKETS_KEY, JSON.stringify(tickets));
      
      return updatedTicket;
    } catch (error) {
      console.error('Error updating ticket:', error);
      throw error;
    }
  }

  async deleteTicket(ticketId: string): Promise<void> {
    try {
      const tickets = await this.getTickets();
      const filteredTickets = tickets.filter(t => t.id !== ticketId);
      localStorage.setItem(this.TICKETS_KEY, JSON.stringify(filteredTickets));
    } catch (error) {
      console.error('Error deleting ticket:', error);
      throw error;
    }
  }

  // Customer operations
  async getCustomers(): Promise<Customer[]> {
    try {
      const savedCustomers = localStorage.getItem(this.CUSTOMERS_KEY);
      return savedCustomers ? JSON.parse(savedCustomers) : [];
    } catch (error) {
      console.error('Error loading customers:', error);
      return [];
    }
  }

  async createCustomer(customerData: Omit<Customer, 'id'>): Promise<Customer> {
    try {
      const customers = await this.getCustomers();
      const newCustomer: Customer = {
        ...customerData,
        id: `CUST${String(customers.length + 1).padStart(3, '0')}`,
      };

      const updatedCustomers = [...customers, newCustomer];
      localStorage.setItem(this.CUSTOMERS_KEY, JSON.stringify(updatedCustomers));
      
      return newCustomer;
    } catch (error) {
      console.error('Error creating customer:', error);
      throw error;
    }
  }

  async updateCustomer(customerId: string, updates: Partial<Customer>): Promise<Customer> {
    try {
      const customers = await this.getCustomers();
      const customerIndex = customers.findIndex(c => c.id === customerId);
      
      if (customerIndex === -1) {
        throw new Error('Customer not found');
      }

      const updatedCustomer = {
        ...customers[customerIndex],
        ...updates,
      };

      customers[customerIndex] = updatedCustomer;
      localStorage.setItem(this.CUSTOMERS_KEY, JSON.stringify(customers));
      
      return updatedCustomer;
    } catch (error) {
      console.error('Error updating customer:', error);
      throw error;
    }
  }

  // Analytics operations
  async getTicketsByStatus(status: string): Promise<TailoringTicket[]> {
    const tickets = await this.getTickets();
    return tickets.filter(ticket => ticket.status === status);
  }

  async getTicketsByDateRange(startDate: Date, endDate: Date): Promise<TailoringTicket[]> {
    const tickets = await this.getTickets();
    return tickets.filter(ticket => 
      ticket.dropOffDate >= startDate && ticket.dropOffDate <= endDate
    );
  }

  async getOverdueTickets(): Promise<TailoringTicket[]> {
    const tickets = await this.getTickets();
    const now = new Date();
    return tickets.filter(ticket => 
      ticket.status !== 'completed' && ticket.scheduledPickupDate < now
    );
  }

  // Utility methods
  generateTicketNumber(): string {
    const timestamp = Date.now();
    return `T-2024-${timestamp.toString().slice(-6)}`;
  }

  generatePhysicalTicketNumber(): string {
    const timestamp = Date.now();
    return `P-${timestamp.toString().slice(-4)}`;
  }
}

// Export singleton instance
export const tailoringAPI = TailoringAPI.getInstance();
export type { TailoringTicket, AlterationService, Customer }; 