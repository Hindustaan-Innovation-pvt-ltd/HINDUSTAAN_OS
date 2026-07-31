import React, { useState } from 'react';
import { 
  CreditCard, Check, CheckCircle2, ShieldCheck, DollarSign, Zap, 
  Award, ArrowRight, Clock, Settings, AlertCircle, Server, Users, ArrowLeft
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import api from '@/lib/api';

export default function Subscriptions() {
  const [currentPlan, setCurrentPlan] = useState<'Standard' | 'Pro Enterprise' | 'Ultimate'>('Pro Enterprise');
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annually'>('annually');
  const [isUpdating, setIsUpdating] = useState<string | null>(null);

  // Storage and Seat Data from Workspace
  const storageUsed = 45; // 45 GB or %
  const seatsUsed = 136;
  const maxSeats = currentPlan === 'Standard' ? 50 : currentPlan === 'Pro Enterprise' ? 150 : 500;
  const maxStorage = currentPlan === 'Standard' ? 100 : currentPlan === 'Pro Enterprise' ? 500 : 2000;

  const fetchSubscription = async () => {
    try {
      const res = await api.get('/subscription');
      if (res.data?.success && res.data.data) {
        const sub = res.data.data;
        setCurrentPlan(sub.planName);
        setBillingCycle(sub.billingCycle);
      }
    } catch (e) {
      console.error("Failed to load subscription details:", e);
    }
  };

  React.useEffect(() => {
    fetchSubscription();
  }, []);

  const plans = [
    {
      id: 'Standard',
      name: 'Standard Team',
      priceMonthly: 49,
      priceAnnually: 39,
      seats: 50,
      storage: '100 GB',
      badge: 'Team Choice',
      color: 'border-slate-200 dark:border-slate-800',
      features: [
        'Up to 50 active workspace seats',
        '100 GB SSD secure cloud storage',
        'Standard Kanban & Time sheets',
        'Email & community support',
        'Daily workspace backups'
      ]
    },
    {
      id: 'Pro Enterprise',
      name: 'Pro Enterprise',
      priceMonthly: 129,
      priceAnnually: 99,
      seats: 150,
      storage: '500 GB',
      badge: 'Popular Plan',
      color: 'border-orange-500/50 dark:border-orange-500/30 ring-2 ring-orange-500/20',
      features: [
        'Up to 150 active workspace seats',
        '500 GB high-speed SSD storage',
        'Advanced contribution score logic',
        'SSO & Multi-factor enforcement',
        '24/7 dedicated response manager',
        'Custom export workflows (CSV/PDF)'
      ]
    },
    {
      id: 'Ultimate',
      name: 'Ultimate Corporation',
      priceMonthly: 299,
      priceAnnually: 249,
      seats: 500,
      storage: '2 TB',
      badge: 'Maximum Scale',
      color: 'border-slate-200 dark:border-slate-800',
      features: [
        'Up to 500 active workspace seats',
        '2 TB secure dedicated storage',
        'Custom webhook integrations',
        'Full audit logging & exports',
        'Priority phone & SLA support',
        'Dedicated training modules'
      ]
    }
  ];

  const handleUpdatePlan = async (planId: 'Standard' | 'Pro Enterprise' | 'Ultimate') => {
    if (planId === currentPlan) {
      toast.info(`You are already subscribed to the ${planId} plan.`);
      return;
    }

    const planObj = plans.find(p => p.id === planId);
    if (!planObj) return;

    setIsUpdating(planId);
    toast.loading(`Processing subscription update to ${planId}...`);

    try {
      const price = billingCycle === 'annually' ? planObj.priceAnnually : planObj.priceMonthly;
      const res = await api.post('/subscription/upgrade', {
        planName: planId,
        price,
        billingCycle
      });
      if (res.data?.success) {
        toast.dismiss();
        setCurrentPlan(planId);
        toast.success(`Successfully updated subscription to ${planId}!`);
      }
    } catch (err: any) {
      toast.dismiss();
      toast.error('Subscription update failed', { description: err.response?.data?.message || err.message });
    } finally {
      setIsUpdating(null);
    }
  };

  return (
    <div className="flex-1 overflow-auto bg-slate-50 dark:bg-slate-950 p-6">
      <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-300">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Subscription Management</h1>
            </div>
            <p className="text-slate-500 dark:text-slate-400 mt-1">Review billing settings, active licenses, and resource utilization.</p>
          </div>
          
          <div className="flex items-center bg-slate-100 dark:bg-slate-900 p-1.5 rounded-xl border border-slate-200 dark:border-slate-800">
            <button 
              onClick={() => setBillingCycle('monthly')}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${billingCycle === 'monthly' ? 'bg-white dark:bg-slate-800 shadow-sm text-slate-900 dark:text-white' : 'text-slate-500 hover:text-slate-800'}`}
            >
              Monthly
            </button>
            <button 
              onClick={() => setBillingCycle('annually')}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${billingCycle === 'annually' ? 'bg-white dark:bg-slate-800 shadow-sm text-slate-900 dark:text-white' : 'text-slate-500 hover:text-slate-800'}`}
            >
              Annually <Badge className="bg-orange-500/10 text-orange-600 hover:bg-orange-500/20 text-[9px] font-black border-none px-1.5 py-0">Save 20%</Badge>
            </button>
          </div>
        </div>

        {/* Resource Allocation Panel */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c1222]/50 shadow-sm col-span-1">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <Users className="h-4 w-4 text-emerald-500" /> Active Plan Seats
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-slate-900 dark:text-white">{seatsUsed}</span>
                <span className="text-slate-500 font-semibold text-sm">/ {maxSeats} allocated</span>
              </div>
              <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full mt-3 overflow-hidden">
                <div 
                  className="h-full bg-emerald-500 transition-all duration-500" 
                  style={{ width: `${(seatsUsed / maxSeats) * 100}%` }}
                />
              </div>
              <p className="text-[11px] text-slate-450 mt-2 font-semibold">
                Usage rate: {Math.round((seatsUsed / maxSeats) * 100)}%. Upgrade plan for additional seats.
              </p>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c1222]/50 shadow-sm col-span-1">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <Server className="h-4 w-4 text-[#5B7CFF]" /> Shared storage
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-slate-900 dark:text-white">{storageUsed} GB</span>
                <span className="text-slate-500 font-semibold text-sm">/ {maxStorage} GB</span>
              </div>
              <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full mt-3 overflow-hidden">
                <div 
                  className="h-full bg-linear-to-r from-[#5B7CFF] to-[#A855F7] transition-all duration-500" 
                  style={{ width: `${(storageUsed / maxStorage) * 100}%` }}
                />
              </div>
              <p className="text-[11px] text-slate-450 mt-2 font-semibold">
                Using {Math.round((storageUsed / maxStorage) * 100)}% of secure SSD allocation.
              </p>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-orange-500/30 dark:border-orange-500/20 bg-orange-50/10 dark:bg-orange-950/10 shadow-sm col-span-1 flex flex-col justify-between">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-orange-600 dark:text-orange-400 flex items-center gap-2">
                <Zap className="h-4 w-4" /> Active plan
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-2">
              <h3 className="text-2xl font-black text-slate-900 dark:text-white">{currentPlan}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Your workspace renewed automatically on <span className="font-bold text-slate-700 dark:text-slate-300">July 07, 2026</span>.
              </p>
            </CardContent>
            <CardFooter className="pt-0">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-450 mt-1">
                <Clock className="h-3.5 w-3.5" /> Next invoice date: Aug 07, 2026
              </div>
            </CardFooter>
          </Card>
        </div>

        {/* Plan Comparisons */}
        <div>
          <h2 className="text-xl font-extrabold text-slate-950 dark:text-white mb-6">Choose workspace tier</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((p) => {
              const isActivePlan = currentPlan === p.id;
              const price = billingCycle === 'monthly' ? p.priceMonthly : p.priceAnnually;
              
              return (
                <Card key={p.id} className={`rounded-2xl bg-white dark:bg-[#0c1222]/50 shadow-sm overflow-hidden flex flex-col justify-between ${p.color}`}>
                  <CardHeader className="pb-6 border-b border-slate-100 dark:border-slate-800/60 p-6">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-black text-slate-500 uppercase tracking-widest">{p.name}</span>
                      {isActivePlan ? (
                        <Badge className="bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-[10px] rounded px-2.5 py-0.5">Active</Badge>
                      ) : (
                        <Badge variant="secondary" className="text-[10px] font-extrabold">{p.badge}</Badge>
                      )}
                    </div>
                    
                    <div className="flex items-baseline gap-1 mt-4">
                      <span className="text-sm font-bold text-slate-550 dark:text-slate-400">$</span>
                      <span className="text-4xl font-black text-slate-950 dark:text-white">{price}</span>
                      <span className="text-xs font-semibold text-slate-400">/ seat / mo</span>
                    </div>
                    {billingCycle === 'annually' && (
                      <p className="text-[10px] text-emerald-600 font-extrabold mt-1">Billed annually (${price * 12}/year)</p>
                    )}
                  </CardHeader>
                  
                  <CardContent className="p-6 space-y-4 flex-1">
                    <ul className="space-y-3">
                      {p.features.map((f, index) => (
                        <li key={index} className="flex items-start gap-2.5 text-xs text-slate-650 dark:text-slate-350">
                          <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                          <span className="font-semibold leading-tight">{f}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>

                  <CardFooter className="p-6 border-t border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/10">
                    <Button 
                      onClick={() => handleUpdatePlan(p.id as any)}
                      disabled={isUpdating !== null}
                      className={`w-full h-11 rounded-xl font-bold transition-all ${
                        isActivePlan 
                          ? 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 cursor-default hover:bg-slate-100 dark:hover:bg-slate-800' 
                          : 'bg-orange-600 hover:bg-orange-700 text-white shadow-sm'
                      }`}
                    >
                      {isActivePlan ? 'Current Active Subscription' : `Choose ${p.name}`}
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Billing details card */}
        <Card className="rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c1222]/50 shadow-sm">
          <CardHeader className="border-b border-slate-100 dark:border-slate-800/60 p-6">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-orange-600" /> Billing Settings & History
            </CardTitle>
            <CardDescription className="text-xs font-semibold">Verify active billing cards and download past invoices.</CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-50/50 dark:bg-slate-900/30 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="h-10 w-12 bg-white dark:bg-slate-850 rounded-lg flex items-center justify-center border border-slate-200 dark:border-slate-850 shrink-0">
                  <span className="text-[10px] font-black tracking-widest text-slate-500 dark:text-slate-400 uppercase">VISA</span>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">Visa ending in 4242</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Expires 12/28 • Primary Payment Method</p>
                </div>
              </div>
              <Button variant="outline" className="h-9 text-xs font-bold rounded-lg border-slate-200 dark:border-slate-850 hover:bg-slate-100">
                Update card
              </Button>
            </div>

            <div>
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Billing history</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="text-slate-400 uppercase border-b border-slate-100 dark:border-slate-800 pb-2">
                      <th className="pb-2 font-bold">Invoice ID</th>
                      <th className="pb-2 font-bold">Billing Date</th>
                      <th className="pb-2 font-bold">Amount</th>
                      <th className="pb-2 font-bold">Status</th>
                      <th className="pb-2 text-right font-bold">Receipt</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { id: 'INV-2026-004', date: 'Jul 07, 2026', amount: '$99.00', status: 'Paid' },
                      { id: 'INV-2026-003', date: 'Jun 07, 2026', amount: '$99.00', status: 'Paid' },
                      { id: 'INV-2026-002', date: 'May 07, 2026', amount: '$99.00', status: 'Paid' },
                    ].map((inv) => (
                      <tr key={inv.id} className="border-b border-slate-100/60 dark:border-slate-800/40 py-2.5">
                        <td className="py-3 font-bold text-slate-900 dark:text-white">{inv.id}</td>
                        <td className="py-3 text-slate-500">{inv.date}</td>
                        <td className="py-3 font-bold text-slate-900 dark:text-white">{inv.amount}</td>
                        <td className="py-3">
                          <Badge className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 text-[9px] font-bold">
                            {inv.status}
                          </Badge>
                        </td>
                        <td className="py-3 text-right">
                          <Button variant="ghost" size="sm" className="h-7 text-[#5B7CFF] font-bold text-[10px]">
                            Download
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
