// src/services/customer.service.ts

import { supabase } from '../lib/supabase';
import type { Customer } from '../types/database.types';
import { nanoid } from 'nanoid/non-secure';

export const customerService = {
  async getByUserId(userId: string): Promise<Customer | null> {
    console.log('DB: getByUserId called with:', userId);

    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle(); // ← Changed from .single() to .maybeSingle()

    console.log('DB: getByUserId result:', { data, error });

    if (error) {
      console.error('DB: getByUserId error:', error);
      throw error;
    }

    return data; // Returns null if no row found (no error)
  },

  async create(userId: string): Promise<Customer> {
    console.log('DB: create called with:', userId);

    const customerData = {
      user_id: userId,
      phone: null,
      total_points: 0,
      qr_code_url: `loyaltyhub://customer/${nanoid(12)}`,
    };

    console.log('DB: inserting:', customerData);

    const { data, error } = await supabase
      .from('customers')
      .insert(customerData)
      .select()
      .single();

    console.log('DB: create result:', { data, error });

    if (error) {
      console.error('DB: create error:', error);
      throw error;
    }

    return data;
  },

  async findOrCreate(userId: string): Promise<Customer> {
    console.log('DB: findOrCreate called with:', userId);

    const existing = await this.getByUserId(userId);

    if (existing) {
      console.log('DB: found existing customer');
      return existing;
    }

    console.log('DB: creating new customer');
    return this.create(userId);
  },
};
