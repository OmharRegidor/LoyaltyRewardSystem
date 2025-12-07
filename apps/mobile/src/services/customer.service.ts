// src/services/customer.service.ts

import { supabase } from '../lib/supabase';
import type { Customer, CustomerInsert } from '../types/database.types';
import { nanoid } from 'nanoid/non-secure';

const generateQRCodeUrl = (customerId: string): string => {
  return `loyaltyhub://customer/${customerId}`;
};

export const customerService = {
  async getByUserId(userId: string): Promise<Customer | null> {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  async create(userId: string): Promise<Customer> {
    const tempId = nanoid(12);

    const customerData: CustomerInsert = {
      user_id: userId,
      total_points: 0,
      qr_code_url: generateQRCodeUrl(tempId),
    };

    const { data, error } = await supabase
      .from('customers')
      .insert(customerData)
      .select()
      .single();

    if (error) throw error;

    // Update QR with actual ID
    await supabase
      .from('customers')
      .update({ qr_code_url: generateQRCodeUrl(data.id) })
      .eq('id', data.id);

    return { ...data, qr_code_url: generateQRCodeUrl(data.id) };
  },

  async findOrCreate(userId: string): Promise<Customer> {
    const existing = await this.getByUserId(userId);
    if (existing) return existing;
    return this.create(userId);
  },

  async updateLastVisit(customerId: string): Promise<void> {
    await supabase
      .from('customers')
      .update({ last_visit: new Date().toISOString() })
      .eq('id', customerId);
  },
};
