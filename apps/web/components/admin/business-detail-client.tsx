'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import {
  ArrowLeft,
  Building2,
  Users,
  UsersRound,
  ArrowRightLeft,
  Coins,
  GitBranch,
  CalendarDays,
  Gift,
  ConciergeBell,
  Mail,
  Phone,
  MapPin,
  Tag,
  Clock,
  CalendarCheck,
  ExternalLink,
  Copy,
  Loader2,
  X,
  Plus,
  ArrowUpDown,
  CheckCircle2,
  Lock,
  QrCode,
  BarChart3,
  ShoppingCart,
} from 'lucide-react';
import { BusinessActivityChart } from './business-activity-chart';
import type {
  BusinessDetailResponse,
  AdminNote,
  AdminTag,
  AdminPlanChange,
} from '@/lib/admin';

// ============================================
// HELPERS
// ============================================

function formatNumber(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, '') + 'K';
  return n.toLocaleString();
}

function formatRelativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatLongDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

const SUGGESTED_TAGS = ['vip', 'churning', 'demo', 'needs-support', 'enterprise-prospect'];

// ============================================
// MAIN COMPONENT
// ============================================

interface BusinessDetailClientProps {
  businessId: string;
}

export function BusinessDetailClient({ businessId }: BusinessDetailClientProps) {
  const [data, setData] = useState<BusinessDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [noteContent, setNoteContent] = useState('');
  const [submittingNote, setSubmittingNote] = useState(false);

  const [newTag, setNewTag] = useState('');
  const [submittingTag, setSubmittingTag] = useState(false);

  const [planModalOpen, setPlanModalOpen] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [planChangeReason, setPlanChangeReason] = useState('');
  const [planModuleBooking, setPlanModuleBooking] = useState(false);
  const [planModulePos, setPlanModulePos] = useState(false);
  const [submittingPlan, setSubmittingPlan] = useState(false);

  const [copied, setCopied] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/businesses/${businessId}`);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? 'Failed to load business');
      }
      const json: BusinessDetailResponse = await res.json();
      setData(json);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [businessId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function handleAddNote() {
    if (!noteContent.trim() || submittingNote) return;
    setSubmittingNote(true);
    try {
      const res = await fetch(`/api/admin/businesses/${businessId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: noteContent.trim() }),
      });
      if (!res.ok) throw new Error('Failed to add note');
      const note: AdminNote = await res.json();
      setData((prev) => prev ? { ...prev, notes: [note, ...prev.notes] } : prev);
      setNoteContent('');
    } catch { /* Silently fail */ } finally { setSubmittingNote(false); }
  }

  async function handleAddTag(tag?: string) {
    const tagValue = (tag ?? newTag).trim().toLowerCase();
    if (!tagValue || submittingTag) return;
    const optimisticTag: AdminTag = { id: crypto.randomUUID(), business_id: businessId, tag: tagValue, created_at: new Date().toISOString() };
    setData((prev) => prev && !prev.tags.some((t) => t.tag === tagValue) ? { ...prev, tags: [...prev.tags, optimisticTag] } : prev);
    setNewTag('');
    setSubmittingTag(true);
    try {
      const res = await fetch(`/api/admin/businesses/${businessId}/tags`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tag: tagValue }) });
      if (!res.ok) setData((prev) => prev ? { ...prev, tags: prev.tags.filter((t) => t.id !== optimisticTag.id) } : prev);
    } catch { setData((prev) => prev ? { ...prev, tags: prev.tags.filter((t) => t.id !== optimisticTag.id) } : prev); } finally { setSubmittingTag(false); }
  }

  async function handleRemoveTag(tag: string) {
    setData((prev) => prev ? { ...prev, tags: prev.tags.filter((t) => t.tag !== tag) } : prev);
    try {
      const res = await fetch(`/api/admin/businesses/${businessId}/tags`, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tag }) });
      if (!res.ok) fetchData();
    } catch { fetchData(); }
  }

  async function handleChangePlan() {
    if (!selectedPlanId || submittingPlan) return;
    const targetPlan = data?.availablePlans.find((p) => p.id === selectedPlanId);
    const isTargetEnterprise = targetPlan?.name === 'enterprise';
    setSubmittingPlan(true);
    try {
      const res = await fetch(`/api/admin/businesses/${businessId}/plan`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          newPlanId: selectedPlanId,
          reason: planChangeReason.trim() || undefined,
          ...(isTargetEnterprise && {
            moduleBooking: planModuleBooking,
            modulePos: planModulePos,
          }),
        }),
      });
      if (!res.ok) throw new Error('Failed to change plan');
      setPlanModalOpen(false); setSelectedPlanId(''); setPlanChangeReason('');
      setPlanModuleBooking(false); setPlanModulePos(false);
      await fetchData();
    } catch { /* Keep modal open */ } finally { setSubmittingPlan(false); }
  }

  function handleCopyEmail() {
    if (!data?.business.owner_email) return;
    navigator.clipboard.writeText(data.business.owner_email);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 text-orange-500 animate-spin" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="space-y-4">
        <Link href="/admin/businesses" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-orange-600 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Businesses
        </Link>
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
          <p className="text-red-600">{error ?? 'Business not found'}</p>
        </div>
      </div>
    );
  }

  const { business, stats, notes, tags, planChanges, activityTrend, availablePlans } = data;

  const statCardsRow1 = [
    { label: 'Customers', value: stats.customer_count, subStat: `+${formatNumber(stats.new_customers_30d)} (30d)`, icon: Users, color: 'bg-blue-50 text-blue-600' },
    { label: 'Transactions (30d)', value: stats.transactions_30d, icon: ArrowRightLeft, color: 'bg-purple-50 text-purple-600' },
    { label: 'Points Issued', value: stats.points_issued, subStat: `+${formatNumber(stats.points_issued_30d)} (30d)`, icon: Coins, color: 'bg-yellow-50 text-yellow-600' },
    { label: 'Bookings (30d)', value: stats.bookings_30d, icon: CalendarDays, color: 'bg-indigo-50 text-indigo-600' },
  ];

  const statCardsRow2 = [
    { label: 'Staff', value: stats.staff_count, icon: UsersRound, color: 'bg-green-50 text-green-600' },
    { label: 'Branches', value: stats.branch_count, icon: GitBranch, color: 'bg-cyan-50 text-cyan-600' },
    { label: 'Rewards Active', value: stats.active_rewards, icon: Gift, color: 'bg-orange-50 text-orange-600' },
    { label: 'Services Active', value: stats.active_services, icon: ConciergeBell, color: 'bg-pink-50 text-pink-600' },
  ];

  const featureItems = [
    { label: 'Loyalty Program', enabled: business.has_loyalty, icon: Coins },
    { label: `Customers (${formatNumber(stats.customer_count)})`, enabled: true, icon: Users },
    { label: `Staff (${stats.staff_count})`, enabled: true, icon: UsersRound },
    { label: 'QR Codes', enabled: true, icon: QrCode },
    { label: `Branches (${stats.branch_count})`, enabled: true, icon: GitBranch },
    { label: `Rewards (${stats.active_rewards})`, enabled: true, icon: Gift },
    { label: 'Analytics', enabled: true, icon: BarChart3 },
    { label: 'Booking System', enabled: business.has_booking, icon: CalendarDays },
    { label: 'POS System', enabled: business.has_pos, icon: ShoppingCart },
  ];

  const existingTagNames = new Set(tags.map((t) => t.tag));
  const suggestedAvailable = SUGGESTED_TAGS.filter((t) => !existingTagNames.has(t));

  return (
    <div className="space-y-6">
      <Link href="/admin/businesses" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-orange-600 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Businesses
      </Link>

      {/* Header Info Card */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6">
        <div className="flex items-start gap-4 mb-4">
          <div className="w-14 h-14 rounded-2xl bg-orange-50 flex items-center justify-center overflow-hidden shrink-0">
            {business.logo_url ? (
              <Image src={business.logo_url} alt={business.name} width={56} height={56} className="w-full h-full object-cover" />
            ) : (
              <Building2 className="w-7 h-7 text-orange-500" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-gray-900 truncate">{business.name}</h1>
            <p className="text-gray-400 text-sm">{business.slug}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 mb-5">
          <Badge variant="outline" className="text-orange-600 border-orange-300 bg-orange-50">
            {business.plan_name}
          </Badge>
          <Button size="sm" variant="outline" onClick={() => { setPlanModalOpen(true); setSelectedPlanId(''); setPlanChangeReason(''); setPlanModuleBooking(false); setPlanModulePos(false); }} className="gap-1.5 h-7 text-xs">
            <ArrowUpDown className="w-3 h-3" /> Change Plan
          </Button>
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            {business.owner_email && <span className="flex items-center gap-1.5 text-gray-700"><Mail className="w-3.5 h-3.5 text-gray-400" />{business.owner_email}</span>}
            {business.phone && <span className="flex items-center gap-1.5 text-gray-700"><Phone className="w-3.5 h-3.5 text-gray-400" />{business.phone}</span>}
          </div>
          {business.city && <p className="flex items-center gap-1.5 text-gray-700"><MapPin className="w-3.5 h-3.5 text-gray-400" />{business.city}, Philippines</p>}
          {business.business_type && <p className="flex items-center gap-1.5 text-gray-700"><Tag className="w-3.5 h-3.5 text-gray-400" />{business.business_type}</p>}
        </div>

        <div className="flex flex-wrap gap-x-6 gap-y-2 mt-4 text-sm text-gray-500">
          {business.created_at && <span className="flex items-center gap-1.5"><CalendarCheck className="w-3.5 h-3.5 text-gray-400" />Registered: {formatLongDate(business.created_at)} ({formatRelativeTime(business.created_at)})</span>}
          {stats.last_active_at && <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-gray-400" />Last Active: {formatRelativeTime(stats.last_active_at)}</span>}
        </div>
      </div>

      {/* Performance Metrics */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Performance Metrics</h2>
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          {statCardsRow1.map((stat) => (
            <div key={stat.label} className="bg-white border border-gray-200 rounded-2xl p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${stat.color}`}><stat.icon className="w-4 h-4" /></div>
                <p className="text-sm text-gray-500">{stat.label}</p>
              </div>
              <p className="text-2xl font-bold text-gray-900">{formatNumber(stat.value)}</p>
              {stat.subStat && <p className="text-xs text-gray-400 mt-1">{stat.subStat}</p>}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mt-4">
          {statCardsRow2.map((stat) => (
            <div key={stat.label} className="bg-white border border-gray-200 rounded-2xl p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${stat.color}`}><stat.icon className="w-4 h-4" /></div>
                <p className="text-sm text-gray-500">{stat.label}</p>
              </div>
              <p className="text-2xl font-bold text-gray-900">{formatNumber(stat.value)}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Activity chart */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Activity Trend (Last 30 Days)</h2>
        <BusinessActivityChart data={activityTrend} />
      </div>

      {/* Feature Usage */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Feature Usage</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {featureItems.map((feature) => (
            <div key={feature.label} className={`flex items-center gap-3 rounded-xl px-4 py-3 ${feature.enabled ? 'bg-emerald-50 border border-emerald-200' : 'bg-gray-50 border border-gray-200'}`}>
              {feature.enabled ? <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /> : <Lock className="w-4 h-4 text-gray-400 shrink-0" />}
              <feature.icon className={`w-4 h-4 shrink-0 ${feature.enabled ? 'text-gray-600' : 'text-gray-400'}`} />
              <span className={`text-sm ${feature.enabled ? 'text-gray-700' : 'text-gray-400'}`}>{feature.label}</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-4"><Lock className="w-3 h-3 inline-block mr-1 -mt-0.5" />= Enterprise feature (not available on current plan)</p>
      </div>

      {/* Admin Notes */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Admin Notes</h2>
        <div className="flex gap-2 mb-4">
          <Textarea placeholder="Add an internal note..." value={noteContent} onChange={(e) => setNoteContent(e.target.value)} className="!bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 resize-none min-h-[80px]" onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleAddNote(); }} />
        </div>
        <Button size="sm" onClick={handleAddNote} disabled={!noteContent.trim() || submittingNote} className="mb-4">
          {submittingNote ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : <Plus className="w-4 h-4 mr-1.5" />}
          Add Note
        </Button>
        {notes.length === 0 ? <p className="text-sm text-gray-400">No notes yet.</p> : (
          <div className="space-y-3">{notes.map((note) => <NoteItem key={note.id} note={note} />)}</div>
        )}
      </div>

      {/* Tags */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Tags</h2>
        <div className="flex flex-wrap gap-2 mb-4">
          {tags.length === 0 && <p className="text-sm text-gray-400">No tags.</p>}
          {tags.map((t) => (
            <Badge key={t.tag} variant="secondary" className="gap-1 pr-1">{t.tag}
              <button onClick={() => handleRemoveTag(t.tag)} className="ml-1 rounded-full p-0.5 hover:bg-gray-200 transition-colors"><X className="w-3 h-3" /></button>
            </Badge>
          ))}
        </div>
        <div className="flex gap-2 mb-3">
          <Input placeholder="Add tag..." value={newTag} onChange={(e) => setNewTag(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') handleAddTag(); }} className="!bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 max-w-xs" />
          <Button size="sm" variant="outline" onClick={() => handleAddTag()} disabled={!newTag.trim() || submittingTag}><Plus className="w-4 h-4" /></Button>
        </div>
        {suggestedAvailable.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            <span className="text-xs text-gray-400 mr-1 self-center">Suggested:</span>
            {suggestedAvailable.map((tag) => (
              <button key={tag} onClick={() => handleAddTag(tag)} className="text-xs px-2 py-1 rounded-md bg-gray-100 text-gray-500 hover:text-orange-600 hover:bg-orange-50 transition-colors">+ {tag}</button>
            ))}
          </div>
        )}
      </div>

      {/* Plan History */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Plan Change History</h2>
        {planChanges.length === 0 ? (
          <p className="text-sm text-gray-400">No plan changes recorded. Business has been on {business.plan_name} plan since signup.</p>
        ) : (
          <div className="space-y-4">{planChanges.map((change) => <PlanChangeItem key={change.id} change={change} />)}</div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="flex gap-2 flex-wrap">
          {business.slug && <Button variant="outline" size="sm" asChild><a href={`/b/${business.slug}`} target="_blank" rel="noopener noreferrer" className="gap-1.5"><ExternalLink className="w-3.5 h-3.5" />Visit Public Page</a></Button>}
          {business.owner_email && <Button variant="outline" size="sm" asChild><a href={`mailto:${business.owner_email}`} className="gap-1.5"><Mail className="w-3.5 h-3.5" />Email Owner</a></Button>}
          {business.owner_email && <Button variant="outline" size="sm" onClick={handleCopyEmail} className="gap-1.5"><Copy className="w-3.5 h-3.5" />{copied ? 'Copied!' : 'Copy Owner Email'}</Button>}
        </div>
      </div>

      {/* Plan Change Dialog */}
      <Dialog open={planModalOpen} onOpenChange={setPlanModalOpen}>
        <DialogContent className="bg-white border-gray-200 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-gray-900">Change Plan</DialogTitle>
            <DialogDescription className="text-gray-500">Change the plan for {business.name}. Current plan: {business.plan_name}.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-sm text-gray-500 mb-1.5 block">New Plan</label>
              <Select value={selectedPlanId} onValueChange={setSelectedPlanId}>
                <SelectTrigger className="!bg-white border-gray-200 text-gray-900"><SelectValue placeholder="Select a plan" /></SelectTrigger>
                <SelectContent className="bg-white border-gray-200">
                  {availablePlans.filter((p) => p.id !== business.current_plan_id).map((plan) => (
                    <SelectItem key={plan.id} value={plan.id} className="text-gray-900">{plan.display_name}{plan.price_monthly != null && <span className="text-gray-400 ml-2">- PHP {plan.price_monthly}/mo</span>}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selectedPlanId && availablePlans.find((p) => p.id === selectedPlanId)?.name === 'enterprise' && (
              <div>
                <label className="text-sm text-gray-500 mb-2 block">Modules to enable</label>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Checkbox id="plan-mod-loyalty" checked disabled />
                    <label htmlFor="plan-mod-loyalty" className="text-sm text-gray-500">Loyalty (always included)</label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="plan-mod-booking"
                      checked={planModuleBooking}
                      onCheckedChange={(v) => setPlanModuleBooking(v === true)}
                    />
                    <label htmlFor="plan-mod-booking" className="text-sm text-gray-900">Booking System</label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="plan-mod-pos"
                      checked={planModulePos}
                      onCheckedChange={(v) => setPlanModulePos(v === true)}
                    />
                    <label htmlFor="plan-mod-pos" className="text-sm text-gray-900">POS System</label>
                  </div>
                </div>
              </div>
            )}
            <div>
              <label className="text-sm text-gray-500 mb-1.5 block">Reason (optional)</label>
              <Textarea placeholder="Why is this plan being changed?" value={planChangeReason} onChange={(e) => setPlanChangeReason(e.target.value)} className="!bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 resize-none" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPlanModalOpen(false)} disabled={submittingPlan}>Cancel</Button>
            <Button onClick={handleChangePlan} disabled={!selectedPlanId || submittingPlan}>
              {submittingPlan && <Loader2 className="w-4 h-4 animate-spin mr-1.5" />}Confirm Change
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ============================================
// INLINE SUB-COMPONENTS
// ============================================

function NoteItem({ note }: { note: AdminNote }) {
  return (
    <div className="border border-gray-200 rounded-xl p-3 bg-gray-50">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-gray-500">{note.author_email}</span>
        <span className="text-xs text-gray-400">{formatRelativeTime(note.created_at)}</span>
      </div>
      <p className="text-sm text-gray-700 whitespace-pre-wrap">{note.content}</p>
    </div>
  );
}

function PlanChangeItem({ change }: { change: AdminPlanChange }) {
  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <div className="w-2.5 h-2.5 rounded-full bg-orange-500 mt-1.5" />
        <div className="w-px flex-1 bg-gray-200" />
      </div>
      <div className="pb-4 flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-gray-500">{change.old_plan_name ?? 'None'}</span>
          <span className="text-gray-300">&rarr;</span>
          <span className="text-sm font-medium text-gray-900">{change.new_plan_name ?? 'None'}</span>
        </div>
        {change.reason && <p className="text-xs text-gray-400 mt-1">{change.reason}</p>}
        <p className="text-xs text-gray-400 mt-1">by {change.changed_by_email} &middot; {formatDate(change.created_at)}</p>
      </div>
    </div>
  );
}
