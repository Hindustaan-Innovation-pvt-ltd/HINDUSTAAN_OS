import React, { useState } from 'react';
import { 
  CreditCard, Check, CheckCircle2, ShieldCheck, DollarSign, Zap, 
  Award, ArrowRight, Clock, Settings, AlertCircle, Server, Users, ArrowLeft
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
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
      color: 'border-border',
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
      color: 'border-primary/50 ring-2 ring-primary/20',
      features: [
        'Up to 150 active workspace seats',
        '500 GB high-speed SSD storage',
        'Advanced milestone & performance metrics',
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
      color: 'border-border',
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
    <div className="w-full space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-black text-foreground tracking-tight">Subscription Management</h1>
          </div>
          <p className="text-muted-foreground mt-1">Review billing settings, active licenses, and resource utilization.</p>
        </div>
        
        <div className="flex items-center bg-muted/50 p-1.5 rounded-xl border border-border">
          <button 
            onClick={() => setBillingCycle('monthly')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${billingCycle === 'monthly' ? 'bg-card shadow-xs text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
          >
            Monthly
          </button>
          <button 
            onClick={() => setBillingCycle('annually')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${billingCycle === 'annually' ? 'bg-card shadow-xs text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
          >
            Annually <Badge className="bg-primary/10 text-primary hover:bg-primary/20 text-[9px] font-black border-none px-1.5 py-0">Save 20%</Badge>
          </button>
        </div>
      </div>

      {/* Resource Allocation Panel */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="rounded-2xl border-border bg-card text-card-foreground shadow-sm col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Users className="h-4 w-4 text-emerald-500" /> Active Plan Seats
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-foreground">{seatsUsed}</span>
              <span className="text-muted-foreground font-semibold text-sm">/ {maxSeats} allocated</span>
            </div>
            <div className="h-2 w-full bg-muted rounded-full mt-3 overflow-hidden">
              <div 
                className="h-full bg-emerald-500 transition-all duration-500" 
                style={{ width: `${(seatsUsed / maxSeats) * 100}%` }}
              />
            </div>
            <p className="text-[11px] text-muted-foreground mt-2 font-semibold">
              Usage rate: {Math.round((seatsUsed / maxSeats) * 100)}%. Upgrade plan for additional seats.
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border bg-card text-card-foreground shadow-sm col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Server className="h-4 w-4 text-primary" /> Shared storage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-foreground">{storageUsed} GB</span>
              <span className="text-muted-foreground font-semibold text-sm">/ {maxStorage} GB</span>
            </div>
            <div className="h-2 w-full bg-muted rounded-full mt-3 overflow-hidden">
              <div 
                className="h-full bg-linear-to-r from-primary to-purple-500 transition-all duration-500" 
                style={{ width: `${(storageUsed / maxStorage) * 100}%` }}
              />
            </div>
            <p className="text-[11px] text-muted-foreground mt-2 font-semibold">
              Using {Math.round((storageUsed / maxStorage) * 100)}% of secure SSD allocation.
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-primary/30 bg-primary/5 shadow-sm col-span-1 flex flex-col justify-between">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-primary flex items-center gap-2">
              <Zap className="h-4 w-4" /> Active plan
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-2">
            <h3 className="text-2xl font-black text-foreground">{currentPlan}</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Your workspace renewed automatically on <span className="font-bold text-foreground">July 07, 2026</span>.
            </p>
          </CardContent>
          <CardFooter className="pt-0">
            <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground mt-1">
              <Clock className="h-3.5 w-3.5" /> Next invoice date: Aug 07, 2026
            </div>
          </CardFooter>
        </Card>
      </div>

      {/* Plan Comparisons */}
      <div>
        <h2 className="text-xl font-extrabold text-foreground mb-6">Choose workspace tier</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((p) => {
            const isActivePlan = currentPlan === p.id;
            const price = billingCycle === 'monthly' ? p.priceMonthly : p.priceAnnually;
            
            return (
              <Card key={p.id} className={`rounded-2xl bg-card border-border shadow-sm overflow-hidden flex flex-col justify-between ${p.color}`}>
                <CardHeader className="pb-6 border-b border-border p-6">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-black text-muted-foreground uppercase tracking-widest">{p.name}</span>
                    {isActivePlan ? (
                      <Badge className="bg-primary hover:bg-primary/90 text-primary-foreground font-extrabold text-[10px] rounded px-2.5 py-0.5">Active</Badge>
                    ) : (
                      <Badge variant="secondary" className="text-[10px] font-extrabold">{p.badge}</Badge>
                    )}
                  </div>
                  
                  <div className="flex items-baseline gap-1 mt-4">
                    <span className="text-sm font-bold text-muted-foreground">$</span>
                    <span className="text-4xl font-black text-foreground">{price}</span>
                    <span className="text-xs font-semibold text-muted-foreground">/ seat / mo</span>
                  </div>
                  {billingCycle === 'annually' && (
                    <p className="text-[10px] text-emerald-600 font-extrabold mt-1">Billed annually (${price * 12}/year)</p>
                  )}
                </CardHeader>
                
                <CardContent className="p-6 space-y-4 flex-1">
                  <ul className="space-y-3">
                    {p.features.map((f, index) => (
                      <li key={index} className="flex items-start gap-2.5 text-xs text-muted-foreground">
                        <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span className="font-semibold leading-tight text-foreground">{f}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>

                <CardFooter className="p-6 border-t border-border bg-muted/20">
                  <Button 
                    onClick={() => handleUpdatePlan(p.id as any)}
                    disabled={isUpdating !== null}
                    className={`w-full h-11 rounded-xl font-bold transition-all ${
                      isActivePlan 
                        ? 'bg-muted text-muted-foreground cursor-default hover:bg-muted' 
                        : 'bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm'
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
      <Card className="rounded-2xl border-border bg-card text-card-foreground shadow-sm">
        <CardHeader className="border-b border-border p-6">
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" /> Billing Settings & History
          </CardTitle>
          <CardDescription className="text-xs font-semibold">Verify active billing cards and download past invoices.</CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-muted/30 p-4 rounded-xl border border-border">
            <div className="flex items-center gap-3">
              <div className="h-10 w-12 bg-card rounded-lg flex items-center justify-center border border-border shrink-0">
                <span className="text-[10px] font-black tracking-widest text-muted-foreground uppercase">VISA</span>
              </div>
              <div>
                <p className="text-xs font-bold text-foreground">Visa ending in 4242</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">Expires 12/28 • Primary Payment Method</p>
              </div>
            </div>
            <Button variant="outline" className="h-9 text-xs font-bold rounded-lg border-border hover:bg-muted text-foreground">
              Update card
            </Button>
          </div>

          <div>
            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Billing history</h4>
            <div className="overflow-x-auto">
              <Table className="w-full min-w-[550px] text-xs text-left">
                <TableHeader>
                  <TableRow className="border-b border-border">
                    <TableHead className="font-bold">Invoice ID</TableHead>
                    <TableHead className="font-bold">Billing Date</TableHead>
                    <TableHead className="font-bold">Amount</TableHead>
                    <TableHead className="font-bold">Status</TableHead>
                    <TableHead className="text-right font-bold">Receipt</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[
                    { id: 'INV-2026-004', date: 'Jul 07, 2026', amount: '$99.00', status: 'Paid' },
                    { id: 'INV-2026-003', date: 'Jun 07, 2026', amount: '$99.00', status: 'Paid' },
                    { id: 'INV-2026-002', date: 'May 07, 2026', amount: '$99.00', status: 'Paid' },
                  ].map((inv) => (
                    <TableRow key={inv.id} className="border-b border-border/60">
                      <TableCell className="font-bold text-foreground">{inv.id}</TableCell>
                      <TableCell className="text-muted-foreground">{inv.date}</TableCell>
                      <TableCell className="font-bold text-foreground">{inv.amount}</TableCell>
                      <TableCell>
                        <Badge className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 text-[9px] font-bold">
                          {inv.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" className="h-7 text-primary font-bold text-[10px]">
                          Download
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
