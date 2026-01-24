// apps/web/lib/xendit.ts
// Xendit SDK wrapper for LoyaltyHub billing
// Using xendit-node SDK v6+ with proper TypeScript types

import Xendit from 'xendit-node';
import type {
  CustomerRequest,
  Customer as XenditCustomer,
} from 'xendit-node/customer/models';
import type {
  PaymentMethodParameters,
  PaymentMethod as XenditPaymentMethod,
  PaymentMethodType,
  PaymentMethodReusability,
} from 'xendit-node/payment_method/models';
import type {
  CreateInvoiceRequest,
  Invoice as XenditInvoice,
} from 'xendit-node/invoice/models';

// ============================================
// XENDIT CLIENT INITIALIZATION
// ============================================

// Lazy initialization - only create client when needed
let xenditClient: Xendit | null = null;

function getXenditClient(): Xendit | null {
  if (xenditClient) return xenditClient;

  const secretKey = process.env.XENDIT_SECRET_KEY;
  if (!secretKey) {
    console.warn(
      'XENDIT_SECRET_KEY is not set - Xendit features will not work',
    );
    return null;
  }

  xenditClient = new Xendit({ secretKey });
  return xenditClient;
}
// ============================================
// TYPES
// ============================================

export interface CreateCustomerParams {
  referenceId: string;
  email: string;
  givenNames: string;
  mobileNumber?: string;
  metadata?: Record<string, string>;
}

export interface TokenizeCardParams {
  customerId?: string;
  cardNumber: string;
  expiryMonth: string;
  expiryYear: string;
  cvv: string;
  cardholderName?: string;
  currency?: string;
}

export interface CreateEWalletPaymentMethodParams {
  customerId?: string;
  channelCode: 'GCASH' | 'PAYMAYA' | 'GRABPAY' | 'SHOPEEPAY';
  mobileNumber?: string;
  successReturnUrl: string;
  failureReturnUrl: string;
}

export interface CreateInvoiceParams {
  externalId: string;
  amount: number;
  description: string;
  customerEmail?: string;
  customerName?: string;
  customerId?: string;
  successRedirectUrl?: string;
  failureRedirectUrl?: string;
  currency?: string;
  invoiceDuration?: number;
  reminderTime?: number;
  metadata?: Record<string, string>;
}

export interface RecurringInvoiceParams extends CreateInvoiceParams {
  recurringPaymentId?: string;
  shouldSendEmail?: boolean;
}

// Response types
export type Customer = XenditCustomer;
export type PaymentMethod = XenditPaymentMethod;
export type Invoice = XenditInvoice;

// ============================================
// HELPER: Ensure client is initialized
// ============================================

function getClient(): Xendit {
  const client = getXenditClient();
  if (!client) {
    throw new Error('Xendit client not initialized. Check XENDIT_SECRET_KEY.');
  }
  return client;
}

// ============================================
// CUSTOMER MANAGEMENT
// ============================================

export async function createCustomer(
  params: CreateCustomerParams,
): Promise<Customer> {
  const client = getClient();

  const customerData: CustomerRequest = {
    referenceId: params.referenceId,
    email: params.email,
    type: 'INDIVIDUAL',
    individualDetail: {
      givenNames: params.givenNames,
    },
    mobileNumber: params.mobileNumber,
    metadata: params.metadata,
  };

  const customer = await client.Customer.createCustomer({
    data: customerData,
  });

  return customer;
}

export async function getCustomer(customerId: string): Promise<Customer> {
  const client = getClient();

  const customer = await client.Customer.getCustomer({
    id: customerId,
  });

  return customer;
}

export async function getCustomerByReferenceId(
  referenceId: string,
): Promise<Customer | null> {
  const client = getClient();

  const response = await client.Customer.getCustomerByReferenceID({
    referenceId,
  });

  // Response contains a 'data' array
  const customers = response.data;

  if (customers && customers.length > 0) {
    return customers[0];
  }

  return null;
}

// ============================================
// PAYMENT METHOD MANAGEMENT
// ============================================

export async function createCardPaymentMethod(
  params: TokenizeCardParams,
): Promise<PaymentMethod> {
  const client = getClient();

  const paymentMethodData: PaymentMethodParameters = {
    type: 'CARD' as PaymentMethodType,
    reusability: 'MULTIPLE_USE' as PaymentMethodReusability,
    customerId: params.customerId,
    card: {
      currency: params.currency || 'PHP',
      cardInformation: {
        cardNumber: params.cardNumber,
        expiryMonth: params.expiryMonth,
        expiryYear: params.expiryYear,
        cvv: params.cvv,
        cardholderName: params.cardholderName,
      },
    },
  };

  const paymentMethod = await client.PaymentMethod.createPaymentMethod({
    data: paymentMethodData,
  });

  return paymentMethod;
}

export async function createEWalletPaymentMethod(
  params: CreateEWalletPaymentMethodParams,
): Promise<PaymentMethod> {
  const client = getClient();

  const paymentMethodData: PaymentMethodParameters = {
    type: 'EWALLET' as PaymentMethodType,
    reusability: 'MULTIPLE_USE' as PaymentMethodReusability,
    customerId: params.customerId,
    ewallet: {
      channelCode: params.channelCode,
      channelProperties: {
        successReturnUrl: params.successReturnUrl,
        failureReturnUrl: params.failureReturnUrl,
        mobileNumber: params.mobileNumber,
      },
    },
  };

  const paymentMethod = await client.PaymentMethod.createPaymentMethod({
    data: paymentMethodData,
  });

  return paymentMethod;
}

export async function getPaymentMethod(
  paymentMethodId: string,
): Promise<PaymentMethod> {
  const client = getClient();

  const paymentMethod = await client.PaymentMethod.getPaymentMethodByID({
    paymentMethodId,
  });

  return paymentMethod;
}

export async function getPaymentMethods(
  customerId: string,
): Promise<PaymentMethod[]> {
  const client = getClient();

  const response = await client.PaymentMethod.getAllPaymentMethods({
    customerId,
  });

  return response.data || [];
}

// ============================================
// INVOICE MANAGEMENT (For Billing)
// ============================================

export async function createInvoice(
  params: CreateInvoiceParams,
): Promise<Invoice> {
  const client = getClient();

  const invoiceData: CreateInvoiceRequest = {
    externalId: params.externalId,
    amount: params.amount,
    description: params.description,
    currency: (params.currency || 'PHP') as
      | 'IDR'
      | 'PHP'
      | 'THB'
      | 'VND'
      | 'MYR',
    customer: params.customerEmail
      ? {
          email: params.customerEmail,
          givenNames: params.customerName,
        }
      : undefined,
    successRedirectUrl: params.successRedirectUrl,
    failureRedirectUrl: params.failureRedirectUrl,
    invoiceDuration: params.invoiceDuration || 86400, // 24 hours default
    metadata: params.metadata,
  };

  const invoice = await client.Invoice.createInvoice({
    data: invoiceData,
  });

  return invoice;
}

export async function getInvoice(invoiceId: string): Promise<Invoice> {
  const client = getClient();

  const invoice = await client.Invoice.getInvoiceById({
    invoiceId,
  });

  return invoice;
}

export async function getInvoices(options?: {
  customerId?: string;
  externalId?: string;
  limit?: number;
}): Promise<Invoice[]> {
  const client = getClient();

  const invoices = await client.Invoice.getInvoices({
    externalId: options?.externalId,
    limit: options?.limit || 20,
  });

  return invoices;
}

export async function expireInvoice(invoiceId: string): Promise<Invoice> {
  const client = getClient();

  const invoice = await client.Invoice.expireInvoice({
    invoiceId,
  });

  return invoice;
}

// ============================================
// RECURRING BILLING (Via REST API)
// Xendit SDK doesn't include Recurring API, so we use fetch
// ============================================

const XENDIT_API_URL = 'https://api.xendit.co';

interface RecurringPlanParams {
  referenceId: string;
  name: string;
  amount: number;
  currency: string;
  interval: 'DAY' | 'WEEK' | 'MONTH' | 'YEAR';
  intervalCount: number;
  description?: string;
}

interface RecurringSubscriptionParams {
  planId: string;
  customerId: string;
  paymentMethodId?: string;
  metadata?: Record<string, string>;
}

interface RecurringPlan {
  id: string;
  referenceId: string;
  name: string;
  amount: number;
  currency: string;
  interval: string;
  intervalCount: number;
  status: string;
  created: string;
  updated: string;
}

interface RecurringSubscription {
  id: string;
  planId: string;
  customerId: string;
  paymentMethodId?: string;
  status: string;
  currentCycleCount: number;
  metadata?: Record<string, string>;
  created: string;
  updated: string;
  actions?: Array<{ action: string; url?: string }>;
}

async function xenditFetch<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const secretKey = process.env.XENDIT_SECRET_KEY;
  if (!secretKey) {
    throw new Error('XENDIT_SECRET_KEY is not set');
  }

  const response = await fetch(`${XENDIT_API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Basic ${Buffer.from(secretKey + ':').toString('base64')}`,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ message: response.statusText }));
    throw new Error(error.message || `Xendit API error: ${response.status}`);
  }

  return response.json();
}

export async function createRecurringPlan(
  params: RecurringPlanParams,
): Promise<RecurringPlan> {
  return xenditFetch<RecurringPlan>('/recurring/plans', {
    method: 'POST',
    body: JSON.stringify({
      reference_id: params.referenceId,
      name: params.name,
      amount: params.amount,
      currency: params.currency,
      payment_methods: [
        { payment_method_type: 'CARD' },
        { payment_method_type: 'EWALLET' },
      ],
      schedule: {
        interval: params.interval,
        interval_count: params.intervalCount,
      },
      description: params.description,
    }),
  });
}

export async function getRecurringPlan(planId: string): Promise<RecurringPlan> {
  return xenditFetch<RecurringPlan>(`/recurring/plans/${planId}`);
}

export async function createRecurringSubscription(
  params: RecurringSubscriptionParams,
): Promise<RecurringSubscription> {
  return xenditFetch<RecurringSubscription>('/recurring/subscriptions', {
    method: 'POST',
    body: JSON.stringify({
      plan_id: params.planId,
      customer_id: params.customerId,
      payment_method_id: params.paymentMethodId,
      metadata: params.metadata,
    }),
  });
}

export async function getRecurringSubscription(
  subscriptionId: string,
): Promise<RecurringSubscription> {
  return xenditFetch<RecurringSubscription>(
    `/recurring/subscriptions/${subscriptionId}`,
  );
}

export async function pauseRecurringSubscription(
  subscriptionId: string,
): Promise<RecurringSubscription> {
  return xenditFetch<RecurringSubscription>(
    `/recurring/subscriptions/${subscriptionId}/pause`,
    {
      method: 'POST',
    },
  );
}

export async function resumeRecurringSubscription(
  subscriptionId: string,
): Promise<RecurringSubscription> {
  return xenditFetch<RecurringSubscription>(
    `/recurring/subscriptions/${subscriptionId}/resume`,
    {
      method: 'POST',
    },
  );
}

export async function cancelRecurringSubscription(
  subscriptionId: string,
): Promise<RecurringSubscription> {
  return xenditFetch<RecurringSubscription>(
    `/recurring/subscriptions/${subscriptionId}/cancel`,
    {
      method: 'POST',
    },
  );
}

// ============================================
// WEBHOOK VERIFICATION
// ============================================

export function verifyWebhookSignature(
  payload: string,
  signature: string,
  webhookToken: string,
): boolean {
  const crypto = require('crypto');
  const expectedSignature = crypto
    .createHmac('sha256', webhookToken)
    .update(payload)
    .digest('hex');
  return signature === expectedSignature;
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

export function formatAmountForXendit(centavos: number): number {
  // Xendit uses full amount (pesos, not centavos) for PHP
  return centavos / 100;
}

export function formatAmountFromXendit(pesos: number): number {
  // Convert back to centavos for internal storage
  return Math.round(pesos * 100);
}

export function mapXenditStatusToInternal(status: string): string {
  const statusMap: Record<string, string> = {
    ACTIVE: 'active',
    PAUSED: 'paused',
    STOPPED: 'canceled',
    CANCELLED: 'canceled',
    PENDING: 'pending',
    PAID: 'paid',
    SETTLED: 'paid',
    FAILED: 'past_due',
    EXPIRED: 'expired',
  };
  return statusMap[status.toUpperCase()] || status.toLowerCase();
}

export function getPaymentMethodDisplay(paymentMethod: PaymentMethod): {
  type: string;
  display: string;
  last4?: string;
} {
  const pmType = paymentMethod.type;

  if (pmType === 'CARD' && paymentMethod.card) {
    const card = paymentMethod.card;
    // Safely access properties that might not be in the type definition
    const brand = ('brand' in card ? String(card.brand) : null) || 'Card';
    const cardInfo = card.cardInformation;
    const maskedNumber =
      cardInfo && 'maskedCardNumber' in cardInfo
        ? String(cardInfo.maskedCardNumber)
        : null;
    const last4 = maskedNumber?.slice(-4) || '****';
    return {
      type: 'card',
      display: `${brand} •••• ${last4}`,
      last4,
    };
  }

  if (pmType === 'EWALLET' && paymentMethod.ewallet) {
    const walletNames: Record<string, string> = {
      GCASH: 'GCash',
      PAYMAYA: 'Maya',
      GRABPAY: 'GrabPay',
      SHOPEEPAY: 'ShopeePay',
    };
    const channelCode = paymentMethod.ewallet.channelCode || 'EWALLET';
    return {
      type: 'ewallet',
      display: walletNames[channelCode] || 'E-Wallet',
    };
  }

  return {
    type: 'unknown',
    display: 'Payment Method',
  };
}

// Export the client for advanced usage
export { getXenditClient as xenditClient };
export default getXenditClient;
