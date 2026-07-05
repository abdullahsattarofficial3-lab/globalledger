'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';
import { Toaster, toast } from 'react-hot-toast';
import { 
  LayoutDashboard, DollarSign, FileText, Users, 
  Calculator, BarChart3, LogOut, Moon, Sun,
  Plus, Trash2, Edit2, FileDown, Mail, MapPin,
  AlertCircle, Menu, X, TrendingUp, Sparkles,
  ChevronRight, RefreshCw, Eye, EyeOff, 
  CheckCircle, Crown, Settings, User, Key,
  Save, ArrowLeft
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, BarChart, 
  Bar, PieChart, Pie, Cell 
} from 'recharts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// ============================================================
// CONSTANTS
// ============================================================
const TAX_RATES: Record<string, { rate: number; description: string }> = {
  'Pakistan': { rate: 12, description: 'Freelancer income tax (12% avg)' },
  'India': { rate: 20, description: 'Income tax for freelancers (20% avg)' },
  'Bangladesh': { rate: 15, description: 'Self-employed tax (15% avg)' },
  'Philippines': { rate: 18, description: 'Self-employed tax (18% avg)' },
  'Nigeria': { rate: 16, description: 'Personal income tax (16% avg)' },
  'United States': { rate: 25, description: 'Self-employment tax (25% est)' },
  'United Kingdom': { rate: 22, description: 'Self-employed tax (22% est)' },
  'Other': { rate: 20, description: 'Estimated average rate (20%)' },
};

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#8B5CF6'];

// ============================================================
// MAIN COMPONENT
// ============================================================
export default function Home() {
  // ===== AUTH STATE =====
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [country, setCountry] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [businessName, setBusinessName] = useState('');
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [mode, setMode] = useState<'landing' | 'login' | 'signup' | 'onboarding' | 'dashboard'>('landing');
  const [darkMode, setDarkMode] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  // ===== TAB STATE =====
  const [view, setView] = useState<'overview' | 'earnings' | 'invoices' | 'clients' | 'tax' | 'currency' | 'settings'>('overview');
  const [userCurrency, setUserCurrency] = useState('USD');
  const [userProfile, setUserProfile] = useState<any>(null);

  // ===== DATA STATE =====
  const [earnings, setEarnings] = useState<any[]>([]);
  const [totalConverted, setTotalConverted] = useState(0);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [currencyLogs, setCurrencyLogs] = useState<any[]>([]);
  const [exchangeRates, setExchangeRates] = useState<Record<string, number>>({});
  const [ratesLoading, setRatesLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);

  // ===== FORM STATES =====
  const [showEarningForm, setShowEarningForm] = useState(false);
  const [editingEarning, setEditingEarning] = useState<any>(null);
  const [newEarning, setNewEarning] = useState({
    platform: '', amount: '', currency: 'USD', client_name: '', date: new Date().toISOString().split('T')[0]
  });

  const [showInvoiceForm, setShowInvoiceForm] = useState(false);
  const [newInvoice, setNewInvoice] = useState({
    client_name: '', description: '', amount: '', currency: 'USD', paid: false, date: new Date().toISOString().split('T')[0]
  });

  const [showClientForm, setShowClientForm] = useState(false);
  const [editingClient, setEditingClient] = useState<any>(null);
  const [newClient, setNewClient] = useState({ name: '', email: '', country: '', notes: '' });

  const [taxCountry, setTaxCountry] = useState('');
  const [annualIncome, setAnnualIncome] = useState('');
  const [taxResult, setTaxResult] = useState<any>(null);

  const [showCurrencyForm, setShowCurrencyForm] = useState(false);
  const [newCurrencyLog, setNewCurrencyLog] = useState({
    amount: '', from_currency: 'USD', to_currency: 'PKR', rate: '', date: new Date().toISOString().split('T')[0]
  });

  // ===== SETTINGS STATE =====
  const [settingsForm, setSettingsForm] = useState({
    full_name: '',
    business_name: '',
    country: '',
    default_currency: 'USD'
  });
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });
  const [settingsLoading, setSettingsLoading] = useState(false);

  // ============================================================
  // DARK MODE - FIXED WITH localStorage
  // ============================================================
  useEffect(() => {
    const saved = localStorage.getItem('darkMode');
    if (saved === 'true') {
      setDarkMode(true);
      document.documentElement.classList.add('dark');
    } else {
      setDarkMode(false);
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem('darkMode', String(newMode));
    if (newMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  // ============================================================
  // FETCH EXCHANGE RATES
  // ============================================================
  const fetchExchangeRates = async () => {
    setRatesLoading(true);
    try {
      const res = await fetch(`https://api.exchangerate-api.com/v4/latest/USD`);
      const data = await res.json();
      if (data.rates) {
        setExchangeRates(data.rates);
        toast.success('Exchange rates updated!');
      }
    } catch (err) {
      toast.error('Failed to fetch rates');
    }
    setRatesLoading(false);
  };

  useEffect(() => {
    if (mode === 'dashboard') fetchExchangeRates();
  }, [mode]);

  // ============================================================
  // FETCH USER DATA
  // ============================================================
  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (data.user) {
        setUser(data.user);
        const { data: profile } = await supabase
          .from('users')
          .select('*')
          .eq('id', data.user.id)
          .single();
        if (profile) {
          setUserProfile(profile);
          setUserCurrency(profile.default_currency || 'USD');
          setTaxCountry(profile.country || '');
          setSettingsForm({
            full_name: profile.full_name || data.user.user_metadata?.full_name || '',
            business_name: profile.business_name || '',
            country: profile.country || '',
            default_currency: profile.default_currency || 'USD'
          });
          setMode('dashboard');
          await fetchAllData(data.user.id);
        } else {
          setMode('onboarding');
        }
      }
      setDataLoading(false);
    });
  }, []);

  const fetchAllData = async (userId: string) => {
    setDataLoading(true);
    const { data: eData } = await supabase.from('earnings').select('*').eq('user_id', userId);
    if (eData) setEarnings(eData);

    const { data: iData } = await supabase.from('invoices').select('*').eq('user_id', userId);
    if (iData) setInvoices(iData);

    const { data: cData } = await supabase.from('clients').select('*').eq('user_id', userId);
    if (cData) setClients(cData);

    const { data: clData } = await supabase.from('currency_log').select('*').eq('user_id', userId);
    if (clData) setCurrencyLogs(clData);
    setDataLoading(false);
  };

  // ============================================================
  // AUTH HANDLERS
  // ============================================================
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    if (!email.trim()) { setError('Email is required'); setLoading(false); return; }
    if (!password) { setError('Password is required'); setLoading(false); return; }

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message);
      toast.error(error.message);
    } else {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        const { data: profile } = await supabase.from('users').select('*').eq('id', user.id).single();
        if (profile) {
          setUserProfile(profile);
          setUserCurrency(profile.default_currency || 'USD');
          setTaxCountry(profile.country || '');
          setSettingsForm({
            full_name: profile.full_name || user.user_metadata?.full_name || '',
            business_name: profile.business_name || '',
            country: profile.country || '',
            default_currency: profile.default_currency || 'USD'
          });
          setMode('dashboard');
          await fetchAllData(user.id);
          toast.success('Welcome back!');
        } else setMode('onboarding');
      }
    }
    setLoading(false);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    if (!fullName.trim()) { setError('Full name is required'); setLoading(false); return; }
    if (!email.trim()) { setError('Email is required'); setLoading(false); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters'); setLoading(false); return; }

    const { error } = await supabase.auth.signUp({
      email, password,
      options: { data: { full_name: fullName.trim() } }
    });
    if (error) {
      setError(error.message);
      toast.error(error.message);
    } else {
      toast.success('Account created! Please verify your email.');
      const { data: { user } } = await supabase.auth.getUser();
      if (user) { setUser(user); setMode('onboarding'); }
    }
    setLoading(false);
  };

  const handleOnboarding = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setError('No user found'); setLoading(false); return; }
    
    if (!country) { setError('Please select your country'); setLoading(false); return; }
    if (!currency) { setError('Please select your default currency'); setLoading(false); return; }

    const { error } = await supabase
      .from('users')
      .upsert({
        id: user.id,
        full_name: user.user_metadata?.full_name || '',
        country,
        default_currency: currency,
        business_name: businessName.trim() || null,
      }, { onConflict: 'id' });
    if (error) {
      setError(error.message);
      toast.error(error.message);
    } else {
      toast.success('Profile complete!');
      const { data: profile } = await supabase.from('users').select('*').eq('id', user.id).single();
      setUserProfile(profile);
      setUserCurrency(currency);
      setTaxCountry(country);
      setSettingsForm({
        full_name: profile.full_name || '',
        business_name: profile.business_name || '',
        country: profile.country || '',
        default_currency: profile.default_currency || 'USD'
      });
      setMode('dashboard');
      await fetchAllData(user.id);
    }
    setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setMode('landing');
    toast.success('Logged out');
  };

  // ============================================================
  // SETTINGS HANDLERS
  // ============================================================
  const updateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSettingsLoading(true);
    
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) { toast.error('User not found'); setSettingsLoading(false); return; }

    const { error: authError } = await supabase.auth.updateUser({
      data: { full_name: settingsForm.full_name }
    });
    if (authError) {
      toast.error(authError.message);
      setSettingsLoading(false);
      return;
    }

    const { error: dbError } = await supabase
      .from('users')
      .update({
        full_name: settingsForm.full_name,
        business_name: settingsForm.business_name || null,
        country: settingsForm.country,
        default_currency: settingsForm.default_currency
      })
      .eq('id', user.id);

    if (dbError) {
      toast.error(dbError.message);
    } else {
      toast.success('Profile updated!');
      const { data: updatedProfile } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();
      if (updatedProfile) {
        setUserProfile(updatedProfile);
        setUserCurrency(updatedProfile.default_currency || 'USD');
        setTaxCountry(updatedProfile.country || '');
        setUser({
          ...user,
          user_metadata: { ...user.user_metadata, full_name: settingsForm.full_name }
        });
        await fetchAllData(user.id);
      }
    }
    setSettingsLoading(false);
  };

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    if (passwordForm.new_password.length < 6) {
      toast.error('New password must be at least 6 characters');
      return;
    }
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      toast.error('Passwords do not match');
      return;
    }

    setSettingsLoading(true);
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: passwordForm.current_password
    });
    if (signInError) {
      toast.error('Current password is incorrect');
      setSettingsLoading(false);
      return;
    }

    const { error } = await supabase.auth.updateUser({
      password: passwordForm.new_password
    });
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Password updated successfully!');
      setPasswordForm({ current_password: '', new_password: '', confirm_password: '' });
    }
    setSettingsLoading(false);
  };

  // ============================================================
  // EARNINGS CRUD
  // ============================================================
  const addEarning = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    const platform = newEarning.platform.trim();
    const amount = parseFloat(newEarning.amount);
    const currency = newEarning.currency;
    const client_name = newEarning.client_name.trim();
    const date = newEarning.date;

    if (!platform) { toast.error('Platform is required'); return; }
    if (isNaN(amount) || amount <= 0) { toast.error('Valid amount required'); return; }
    if (!currency) { toast.error('Currency required'); return; }
    if (!date) { toast.error('Date required'); return; }

    setLoading(true);
    const payload = {
      user_id: user.id,
      platform,
      amount,
      currency,
      client_name: client_name || null,
      date,
    };
    
    let error;
    if (editingEarning) {
      const { error: e2 } = await supabase.from('earnings').update(payload).eq('id', editingEarning.id);
      error = e2;
    } else {
      const { error: e2 } = await supabase.from('earnings').insert(payload);
      error = e2;
    }
    if (error) { toast.error(error.message); } else {
      toast.success(editingEarning ? 'Updated!' : 'Added!');
      setNewEarning({ platform: '', amount: '', currency: 'USD', client_name: '', date: new Date().toISOString().split('T')[0] });
      setShowEarningForm(false);
      setEditingEarning(null);
      await fetchAllData(user.id);
    }
    setLoading(false);
  };

  const deleteEarning = async (id: string) => {
    if (!confirm('Are you sure you want to delete this earning?')) return;
    const { error } = await supabase.from('earnings').delete().eq('id', id);
    if (error) { toast.error(error.message); } else {
      toast.success('Deleted');
      if (user) await fetchAllData(user.id);
    }
  };

  // ============================================================
  // INVOICE CRUD
  // ============================================================
  const generateInvoiceNumber = async () => {
    const { data } = await supabase
      .from('invoices')
      .select('invoice_number')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1);
    if (data && data.length > 0) {
      const lastNum = parseInt(data[0].invoice_number.split('-')[1]) || 0;
      return `INV-${String(lastNum + 1).padStart(4, '0')}`;
    }
    return 'INV-0001';
  };

  const generatePDF = (invoice: any) => {
    const doc = new jsPDF();
    doc.setFontSize(22);
    doc.setTextColor(40, 40, 40);
    doc.text(userProfile?.business_name || 'GlobalLedger', 14, 25);
    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text('Professional Invoice', 14, 35);
    doc.setDrawColor(200, 200, 200);
    doc.setFillColor(245, 245, 245);
    doc.rect(14, 45, 182, 30, 'F');
    doc.setFontSize(10);
    doc.setTextColor(60, 60, 60);
    doc.text(`Invoice #: ${invoice.invoice_number}`, 20, 58);
    doc.text(`Date: ${invoice.date}`, 20, 68);
    doc.text(`Status: ${invoice.paid ? 'PAID ✅' : 'UNPAID ⚠️'}`, 130, 58);
    doc.text(`Currency: ${invoice.currency}`, 130, 68);
    doc.setFontSize(12);
    doc.setTextColor(40, 40, 40);
    doc.text('Bill To:', 14, 95);
    doc.setFontSize(11);
    doc.setTextColor(80, 80, 80);
    doc.text(invoice.client_name || 'N/A', 14, 105);
    autoTable(doc, {
      startY: 115,
      head: [['Description', 'Amount']],
      body: [[invoice.description || 'Service rendered', `${invoice.currency} ${Number(invoice.amount).toFixed(2)}`]],
      styles: { fontSize: 11 },
      headStyles: { fillColor: [41, 128, 185], textColor: [255, 255, 255] },
      foot: [['Total', `${invoice.currency} ${Number(invoice.amount).toFixed(2)}`]],
      footStyles: { fillColor: [240, 240, 240], textColor: [40, 40, 40], fontStyle: 'bold' }
    });
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(9);
    doc.setTextColor(150, 150, 150);
    doc.text('Thank you for your business!', 14, finalY);
    doc.text('This is a system-generated invoice.', 14, finalY + 6);
    doc.save(`invoice-${invoice.invoice_number}.pdf`);
    toast.success('PDF downloaded!');
  };

  const createInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    const client_name = newInvoice.client_name.trim();
    const description = newInvoice.description.trim();
    const amount = parseFloat(newInvoice.amount);
    const currency = newInvoice.currency;
    const date = newInvoice.date;

    if (!client_name) { toast.error('Client name is required'); return; }
    if (!description) { toast.error('Description is required'); return; }
    if (isNaN(amount) || amount <= 0) { toast.error('Valid amount required'); return; }
    if (!currency) { toast.error('Currency required'); return; }
    if (!date) { toast.error('Date required'); return; }

    setLoading(true);
    const invoiceNumber = await generateInvoiceNumber();
    const { error } = await supabase
      .from('invoices')
      .insert({
        user_id: user.id,
        client_name,
        description,
        amount,
        currency,
        paid: newInvoice.paid,
        invoice_number: invoiceNumber,
        date
      });
    if (error) { toast.error(error.message); } else {
      const { data: freshData } = await supabase
        .from('invoices')
        .select('*')
        .eq('user_id', user.id)
        .eq('invoice_number', invoiceNumber)
        .single();
      if (freshData) generatePDF(freshData);
      setNewInvoice({ client_name: '', description: '', amount: '', currency: 'USD', paid: false, date: new Date().toISOString().split('T')[0] });
      setShowInvoiceForm(false);
      toast.success('Invoice created!');
      await fetchAllData(user.id);
    }
    setLoading(false);
  };

  const deleteInvoice = async (id: string) => {
    if (!confirm('Delete this invoice?')) return;
    await supabase.from('invoices').delete().eq('id', id);
    toast.success('Deleted');
    if (user) await fetchAllData(user.id);
  };

  const togglePaid = async (id: string, current: boolean) => {
    await supabase.from('invoices').update({ paid: !current }).eq('id', id);
    toast.success('Status updated');
    if (user) await fetchAllData(user.id);
  };

  // ============================================================
  // CLIENT CRUD
  // ============================================================
  const addClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    const name = newClient.name.trim();
    if (!name) { toast.error('Client name is required'); return; }

    let error;
    if (editingClient) {
      const { error: e2 } = await supabase
        .from('clients')
        .update({ name, email: newClient.email || null, country: newClient.country || null, notes: newClient.notes || null })
        .eq('id', editingClient.id);
      error = e2;
    } else {
      const { error: e2 } = await supabase
        .from('clients')
        .insert({ user_id: user.id, name, email: newClient.email || null, country: newClient.country || null, notes: newClient.notes || null });
      error = e2;
    }
    if (error) { toast.error(error.message); } else {
      toast.success(editingClient ? 'Updated!' : 'Added!');
      setNewClient({ name: '', email: '', country: '', notes: '' });
      setShowClientForm(false);
      setEditingClient(null);
      await fetchAllData(user.id);
    }
  };

  const deleteClient = async (id: string) => {
    if (!confirm('Delete this client?')) return;
    await supabase.from('clients').delete().eq('id', id);
    toast.success('Deleted');
    if (user) await fetchAllData(user.id);
  };

  const editClient = (client: any) => {
    setEditingClient(client);
    setNewClient({ name: client.name, email: client.email || '', country: client.country || '', notes: client.notes || '' });
    setShowClientForm(true);
  };

  // ============================================================
  // TAX
  // ============================================================
  const calculateTax = () => {
    const incomeNum = parseFloat(annualIncome);
    if (!taxCountry || !incomeNum || incomeNum <= 0) {
      toast.error('Select country and enter valid income');
      return;
    }
    const taxInfo = TAX_RATES[taxCountry] || TAX_RATES['Other'];
    const estimatedTax = incomeNum * (taxInfo.rate / 100);
    setTaxResult({ estimatedTax, rate: taxInfo.rate, description: taxInfo.description });
    toast.success('Tax calculated!');
  };

  // ============================================================
  // CURRENCY
  // ============================================================
  const addCurrencyLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    const amount = parseFloat(newCurrencyLog.amount);
    const rate = parseFloat(newCurrencyLog.rate);
    if (isNaN(amount) || amount <= 0) { toast.error('Valid amount required'); return; }
    if (isNaN(rate) || rate <= 0) { toast.error('Valid rate required'); return; }

    const { error } = await supabase
      .from('currency_log')
      .insert({
        user_id: user.id,
        amount,
        from_currency: newCurrencyLog.from_currency,
        to_currency: newCurrencyLog.to_currency,
        rate,
        date: newCurrencyLog.date
      });
    if (error) { toast.error(error.message); } else {
      toast.success('Logged!');
      setNewCurrencyLog({ amount: '', from_currency: 'USD', to_currency: 'PKR', rate: '', date: new Date().toISOString().split('T')[0] });
      setShowCurrencyForm(false);
      await fetchAllData(user.id);
    }
  };

  const deleteCurrencyLog = async (id: string) => {
    if (!confirm('Delete this entry?')) return;
    await supabase.from('currency_log').delete().eq('id', id);
    toast.success('Deleted');
    if (user) await fetchAllData(user.id);
  };

  // ============================================================
  // DERIVED DATA
  // ============================================================
  const totalEarnings = earnings.reduce((sum, e) => sum + (e.amount || 0), 0);
  
  const monthlyData = (() => {
    const map: Record<string, number> = {};
    earnings.forEach(e => {
      const month = e.date?.substring(0, 7) || '2024-01';
      map[month] = (map[month] || 0) + (e.amount || 0);
    });
    return Object.entries(map)
      .map(([month, amount]) => ({ month, amount }))
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-6);
  })();

  const platformData = (() => {
    const map: Record<string, number> = {};
    earnings.forEach(e => {
      const p = e.platform || 'Other';
      map[p] = (map[p] || 0) + (e.amount || 0);
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  })();

  const chartData = currencyLogs.map(log => ({
    date: log.date,
    rate: log.rate,
    label: `${log.from_currency}/${log.to_currency}`
  }));

  const getInvoiceCount = (clientName: string) => 
    invoices.filter(inv => inv.client_name === clientName).length;

  const [rateChange, setRateChange] = useState(0);
  const [minRate, setMinRate] = useState(0);
  const [maxRate, setMaxRate] = useState(0);

  useEffect(() => {
    if (currencyLogs.length > 0) {
      const rates = currencyLogs.map((log: any) => log.rate);
      setMinRate(Math.min(...rates));
      setMaxRate(Math.max(...rates));
    }
  }, [currencyLogs]);

  const multiCurrencyData = (() => {
    const pairs = ['USD/PKR', 'USD/EUR', 'USD/GBP', 'USD/INR'];
    const result: any[] = [];
    const dates = [...new Set(currencyLogs.map((log: any) => log.date))].slice(-10);
    dates.forEach(date => {
      const entry: any = { date };
      pairs.forEach(pair => {
        const [from, to] = pair.split('/');
        const log = currencyLogs.find((l: any) => l.date === date && l.from_currency === from && l.to_currency === to);
        entry[pair] = log?.rate || 0;
      });
      result.push(entry);
    });
    return result;
  })();

  // ============================================================
  // RENDER: LANDING PAGE
  // ============================================================
  if (mode === 'landing') {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900">
        <Toaster position="top-right" />
        <nav className="fixed top-0 w-full z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <Crown className="text-blue-600" size={28} />
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">GlobalLedger</h1>
            </div>
            <div className="flex items-center gap-4">
              <button 
                onClick={toggleDarkMode}
                className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                aria-label="Toggle dark mode"
              >
                {darkMode ? <Sun size={20} className="text-yellow-400" /> : <Moon size={20} />}
              </button>
              <button onClick={() => setMode('login')} className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">Sign In</button>
              <button onClick={() => setMode('signup')} className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:shadow-lg transition shadow-md font-medium">Get Started</button>
            </div>
          </div>
        </nav>
        <main className="pt-16">
          <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900 py-20">
            <div className="absolute inset-0 opacity-20">
              <div className="absolute top-10 left-10 w-64 h-64 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl animate-pulse"></div>
              <div className="absolute bottom-10 right-10 w-96 h-96 bg-indigo-400 rounded-full mix-blend-multiply filter blur-3xl animate-pulse delay-1000"></div>
            </div>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
              <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.5 }} className="text-center max-w-4xl mx-auto">
                <span className="inline-block px-4 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm font-medium mb-6">🚀 For Freelancers Worldwide</span>
                <h1 className="text-4xl md:text-6xl font-extrabold text-gray-900 dark:text-white leading-tight">
                  Finance Tools Built For{' '}
                  <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Global Freelancers</span>
                </h1>
                <p className="mt-6 text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                  Track earnings in any currency, create professional invoices, estimate taxes, and manage clients – all in one place.
                </p>
                <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
                  <button onClick={() => setMode('signup')} className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:shadow-xl transition shadow-lg font-semibold text-lg flex items-center justify-center gap-2">
                    Start Free Trial <Sparkles size={20} />
                  </button>
                  <button className="px-8 py-4 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition font-semibold text-lg">Watch Demo</button>
                </div>
                <div className="mt-6 flex flex-wrap justify-center gap-6 text-sm text-gray-500 dark:text-gray-400">
                  <span className="flex items-center gap-1"><CheckCircle size={16} className="text-green-500" /> No credit card</span>
                  <span className="flex items-center gap-1"><CheckCircle size={16} className="text-green-500" /> Free forever</span>
                  <span className="flex items-center gap-1"><CheckCircle size={16} className="text-green-500" /> Multi-currency</span>
                </div>
              </motion.div>
            </div>
          </section>
          <section className="py-20 bg-white dark:bg-gray-900">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 dark:text-white mb-12">Everything You Need</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {[
                  { icon: '💰', title: 'Multi-Currency Tracking', desc: 'Track earnings in USD, EUR, GBP, PKR, INR, and more. Auto-convert to your default currency.', color: 'bg-blue-50 dark:bg-blue-900/20' },
                  { icon: '📄', title: 'Professional Invoices', desc: 'Create beautiful PDF invoices with your logo, auto-numbering, and payment status tracking.', color: 'bg-green-50 dark:bg-green-900/20' },
                  { icon: '📊', title: 'Tax & Currency Tools', desc: 'Estimate taxes for your country and track currency conversion rates with live charts.', color: 'bg-purple-50 dark:bg-purple-900/20' },
                ].map((f, i) => (
                  <motion.div key={i} initial={{ y: 20, opacity: 0 }} whileInView={{ y: 0, opacity: 1 }} transition={{ delay: i*0.1 }} className={`${f.color} p-8 rounded-2xl shadow-sm hover:shadow-lg transition border border-gray-200 dark:border-gray-700`}>
                    <div className="text-4xl mb-4">{f.icon}</div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">{f.title}</h3>
                    <p className="mt-2 text-gray-600 dark:text-gray-400">{f.desc}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>
          <section className="py-20 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Simple, Transparent Pricing</h2>
              <div className="max-w-md mx-auto bg-white/10 backdrop-blur-sm p-8 rounded-2xl border border-white/20">
                <div className="flex justify-center mb-4"><Crown size={48} className="text-yellow-300" /></div>
                <h3 className="text-2xl font-bold">Freelancer Pro</h3>
                <div className="text-5xl font-bold my-4">$5</div>
                <p className="text-blue-100 mb-6">per month</p>
                <ul className="text-left space-y-2 mb-6">
                  {['Multi-currency earnings', 'Professional invoices', 'Client management', 'Tax estimator', 'Currency tracker'].map((item, i) => (
                    <li key={i} className="flex items-center gap-2"><span className="text-green-400">✅</span> {item}</li>
                  ))}
                </ul>
                <button onClick={() => setMode('signup')} className="w-full bg-white text-blue-600 px-6 py-3 rounded-lg font-bold hover:bg-blue-50 transition shadow-lg">Start Free Trial</button>
              </div>
            </div>
          </section>
          <footer className="py-6 bg-gray-900 text-gray-400 text-center text-sm border-t border-gray-800">
            <p>© 2026 GlobalLedger. Built for freelancers worldwide.</p>
          </footer>
        </main>
      </div>
    );
  }

  // ============================================================
  // RENDER: LOGIN
  // ============================================================
  if (mode === 'login') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800 p-4">
        <Toaster position="top-right" />
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-full max-w-md bg-white/80 dark:bg-gray-800/80 backdrop-blur-md p-8 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700">
          <div className="text-center mb-8">
            <Crown className="mx-auto text-blue-600" size={40} />
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mt-2">Welcome Back</h2>
            <p className="text-gray-500 dark:text-gray-400">Sign in to your account</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-6">
            {error && <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-sm flex items-center gap-2"><AlertCircle size={16} /> {error}</div>}
            <div className="relative">
              <Mail className="absolute left-3 top-3.5 text-gray-400" size={20} />
              <input type="email" placeholder="Email address" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-3 pl-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent" required />
            </div>
            <div className="relative">
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3.5 text-gray-400">{showPassword ? <EyeOff size={20} /> : <Eye size={20} />}</button>
              <input type={showPassword ? 'text' : 'password'} placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-3 pl-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent" required />
            </div>
            <button type="submit" disabled={loading} className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-semibold hover:shadow-lg transition shadow-md disabled:opacity-50">
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
          <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
            Don't have an account? <button onClick={() => setMode('signup')} className="text-blue-600 dark:text-blue-400 font-medium hover:underline">Sign up</button>
          </p>
          <button onClick={() => setMode('landing')} className="mt-4 text-center text-sm text-gray-400 hover:underline block w-full">← Back to home</button>
        </motion.div>
      </div>
    );
  }

  // ============================================================
  // RENDER: SIGNUP
  // ============================================================
  if (mode === 'signup') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800 p-4">
        <Toaster position="top-right" />
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-full max-w-md bg-white/80 dark:bg-gray-800/80 backdrop-blur-md p-8 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700">
          <div className="text-center mb-8">
            <Crown className="mx-auto text-blue-600" size={40} />
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mt-2">Create Account</h2>
            <p className="text-gray-500 dark:text-gray-400">Join GlobalLedger</p>
          </div>
          <form onSubmit={handleSignup} className="space-y-6">
            {error && <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-sm flex items-center gap-2"><AlertCircle size={16} /> {error}</div>}
            <div className="relative">
              <Users className="absolute left-3 top-3.5 text-gray-400" size={20} />
              <input type="text" placeholder="Full Name" value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full px-4 py-3 pl-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500" required />
            </div>
            <div className="relative">
              <Mail className="absolute left-3 top-3.5 text-gray-400" size={20} />
              <input type="email" placeholder="Email address" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-3 pl-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500" required />
            </div>
            <div className="relative">
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3.5 text-gray-400">{showPassword ? <EyeOff size={20} /> : <Eye size={20} />}</button>
              <input type={showPassword ? 'text' : 'password'} placeholder="Password (min 6)" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-3 pl-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500" required minLength={6} />
            </div>
            <button type="submit" disabled={loading} className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-semibold hover:shadow-lg transition shadow-md disabled:opacity-50">
              {loading ? 'Creating...' : 'Create Account'}
            </button>
          </form>
          <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
            Already have an account? <button onClick={() => setMode('login')} className="text-blue-600 dark:text-blue-400 font-medium hover:underline">Sign in</button>
          </p>
          <button onClick={() => setMode('landing')} className="mt-4 text-center text-sm text-gray-400 hover:underline block w-full">← Back to home</button>
        </motion.div>
      </div>
    );
  }

  // ============================================================
  // RENDER: ONBOARDING
  // ============================================================
  if (mode === 'onboarding') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800 p-4">
        <Toaster position="top-right" />
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-full max-w-md bg-white/80 dark:bg-gray-800/80 backdrop-blur-md p-8 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Welcome!</h2>
            <p className="text-gray-500 dark:text-gray-400">Complete your profile</p>
          </div>
          <form onSubmit={handleOnboarding} className="space-y-6">
            {error && <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-sm flex items-center gap-2"><AlertCircle size={16} /> {error}</div>}
            <select value={country} onChange={(e) => setCountry(e.target.value)} className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500" required>
              <option value="">Select Country</option>
              <option value="Pakistan">Pakistan</option><option value="India">India</option>
              <option value="Bangladesh">Bangladesh</option><option value="Philippines">Philippines</option>
              <option value="Nigeria">Nigeria</option><option value="United States">United States</option>
              <option value="United Kingdom">United Kingdom</option><option value="Other">Other</option>
            </select>
            <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500" required>
              <option value="USD">USD ($)</option><option value="EUR">EUR (€)</option>
              <option value="GBP">GBP (£)</option><option value="PKR">PKR (Rs)</option>
              <option value="INR">INR (₹)</option><option value="PHP">PHP (₱)</option><option value="NGN">NGN (₦)</option>
            </select>
            <input type="text" placeholder="Business Name (optional)" value={businessName} onChange={(e) => setBusinessName(e.target.value)} className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500" />
            <button type="submit" disabled={loading} className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-semibold hover:shadow-lg transition shadow-md disabled:opacity-50">
              {loading ? 'Saving...' : 'Complete Setup'}
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  // ============================================================
  // DASHBOARD
  // ============================================================
  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      <Toaster position="top-right" />
      
      {/* ===== SIDEBAR ===== */}
      <motion.aside 
        initial={{ x: -300 }}
        animate={{ x: sidebarOpen ? 0 : -300 }}
        className={`fixed left-0 top-0 h-full w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 z-50 shadow-xl`}
      >
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Crown className="text-blue-600" size={24} />
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">GlobalLedger</h1>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700"><X size={20} /></button>
        </div>
        
        <nav className="p-4 space-y-1">
          {[
            { icon: LayoutDashboard, label: 'Overview', key: 'overview' },
            { icon: DollarSign, label: 'Earnings', key: 'earnings' },
            { icon: FileText, label: 'Invoices', key: 'invoices' },
            { icon: Users, label: 'Clients', key: 'clients' },
            { icon: Calculator, label: 'Tax', key: 'tax' },
            { icon: BarChart3, label: 'Currency', key: 'currency' },
            { icon: Settings, label: 'Settings', key: 'settings' },
          ].map((item) => (
            <button
              key={item.key}
              onClick={() => setView(item.key as any)}
              className={`flex items-center gap-3 w-full px-4 py-3 rounded-lg transition-all ${
                view === item.key 
                  ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 shadow-sm' 
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <item.icon size={20} />
              <span className="font-medium">{item.label}</span>
              {view === item.key && <ChevronRight size={16} className="ml-auto" />}
            </button>
          ))}
        </nav>
        
        <div className="absolute bottom-0 w-full p-4 border-t border-gray-200 dark:border-gray-700">
          <button onClick={handleLogout} className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition">
            <LogOut size={20} /> Logout
          </button>
        </div>
      </motion.aside>

      {/* ===== MAIN ===== */}
      <div className={`flex-1 transition-all ${sidebarOpen ? 'lg:ml-64' : 'ml-0'}`}>
        {/* ===== NAVBAR ===== */}
        <header className="sticky top-0 z-40 h-16 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700">
              {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center gap-2">
              👋 {user?.user_metadata?.full_name || 'Freelancer'}
              {userProfile?.subscription_status === 'active' && (
                <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-0.5 rounded-full">Pro</span>
              )}
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={fetchExchangeRates} className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 relative" title="Refresh rates">
              <RefreshCw size={18} className={ratesLoading ? 'animate-spin' : ''} />
            </button>
            <button 
              onClick={toggleDarkMode}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-label="Toggle dark mode"
            >
              {darkMode ? <Sun size={20} className="text-yellow-400" /> : <Moon size={20} />}
            </button>
            
            {/* User Avatar Dropdown */}
            <div className="relative">
              <button
                onClick={() => setView('settings')}
                className="flex items-center gap-2 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition"
              >
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                  {user?.user_metadata?.full_name?.charAt(0) || 'F'}
                </div>
              </button>
            </div>

            <button onClick={handleLogout} className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition text-sm font-medium">
              Logout
            </button>
          </div>
        </header>

        {/* ===== PAGE CONTENT ===== */}
        <main className="p-6 space-y-6">
          <AnimatePresence mode="wait">
            {dataLoading ? (
              <LoadingSkeleton />
            ) : (
              <>
                {view === 'overview' && <OverviewPage {...{ totalEarnings, earnings, invoices, clients, userCurrency, monthlyData, platformData }} />}
                {view === 'earnings' && <EarningsPage {...{ earnings, userCurrency, totalEarnings, showEarningForm, setShowEarningForm, newEarning, setNewEarning, editingEarning, setEditingEarning, addEarning, deleteEarning, loading }} />}
                {view === 'invoices' && <InvoicesPage {...{ invoices, showInvoiceForm, setShowInvoiceForm, newInvoice, setNewInvoice, createInvoice, deleteInvoice, togglePaid, generatePDF, loading }} />}
                {view === 'clients' && <ClientsPage {...{ clients, showClientForm, setShowClientForm, newClient, setNewClient, editingClient, setEditingClient, addClient, deleteClient, editClient, getInvoiceCount, loading }} />}
                {view === 'tax' && <TaxPage {...{ taxCountry, setTaxCountry, annualIncome, setAnnualIncome, taxResult, calculateTax, userCurrency }} />}
                {view === 'currency' && <CurrencyPage {...{ currencyLogs, showCurrencyForm, setShowCurrencyForm, newCurrencyLog, setNewCurrencyLog, addCurrencyLog, deleteCurrencyLog, chartData, exchangeRates, userCurrency, multiCurrencyData, rateChange, minRate, maxRate, COLORS }} />}
                {view === 'settings' && <SettingsPage {...{ settingsForm, setSettingsForm, passwordForm, setPasswordForm, updateProfile, changePassword, settingsLoading, user }} />}
              </>
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

// ============================================================
// LOADING SKELETON
// ============================================================
function LoadingSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded-2xl"></div>
        ))}
      </div>
      <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-2xl"></div>
    </div>
  );
}

// ============================================================
// SETTINGS PAGE
// ============================================================
function SettingsPage({ settingsForm, setSettingsForm, passwordForm, setPasswordForm, updateProfile, changePassword, settingsLoading, user }: any) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-3xl mx-auto space-y-8">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
        <Settings size={24} /> Account Settings
      </h2>

      {/* Profile Form */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
          <User size={20} /> Profile Information
        </h3>
        <form onSubmit={updateProfile} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Full Name</label>
              <input
                type="text"
                value={settingsForm.full_name}
                onChange={(e) => setSettingsForm({...settingsForm, full_name: e.target.value})}
                className="mt-1 w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Business Name</label>
              <input
                type="text"
                value={settingsForm.business_name}
                onChange={(e) => setSettingsForm({...settingsForm, business_name: e.target.value})}
                className="mt-1 w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Country</label>
              <select
                value={settingsForm.country}
                onChange={(e) => setSettingsForm({...settingsForm, country: e.target.value})}
                className="mt-1 w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select Country</option>
                <option value="Pakistan">Pakistan</option><option value="India">India</option>
                <option value="Bangladesh">Bangladesh</option><option value="Philippines">Philippines</option>
                <option value="Nigeria">Nigeria</option><option value="United States">United States</option>
                <option value="United Kingdom">United Kingdom</option><option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Default Currency</label>
              <select
                value={settingsForm.default_currency}
                onChange={(e) => setSettingsForm({...settingsForm, default_currency: e.target.value})}
                className="mt-1 w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="USD">USD ($)</option><option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option><option value="PKR">PKR (Rs)</option>
                <option value="INR">INR (₹)</option><option value="PHP">PHP (₱)</option><option value="NGN">NGN (₦)</option>
              </select>
            </div>
          </div>
          <button
            type="submit"
            disabled={settingsLoading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 flex items-center gap-2"
          >
            <Save size={18} /> {settingsLoading ? 'Saving...' : 'Update Profile'}
          </button>
        </form>
      </div>

      {/* Password Change */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
          <Key size={20} /> Change Password
        </h3>
        <form onSubmit={changePassword} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Current Password</label>
              <input
                type="password"
                value={passwordForm.current_password}
                onChange={(e) => setPasswordForm({...passwordForm, current_password: e.target.value})}
                className="mt-1 w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">New Password</label>
              <input
                type="password"
                value={passwordForm.new_password}
                onChange={(e) => setPasswordForm({...passwordForm, new_password: e.target.value})}
                className="mt-1 w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                required
                minLength={6}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Confirm New Password</label>
              <input
                type="password"
                value={passwordForm.confirm_password}
                onChange={(e) => setPasswordForm({...passwordForm, confirm_password: e.target.value})}
                className="mt-1 w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={settingsLoading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 flex items-center gap-2"
          >
            <Key size={18} /> {settingsLoading ? 'Updating...' : 'Change Password'}
          </button>
        </form>
      </div>

      <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg text-sm text-gray-500 dark:text-gray-400">
        <p>Email: <span className="font-medium text-gray-800 dark:text-gray-200">{user?.email}</span></p>
        <p className="mt-1">Account created: {new Date(user?.created_at).toLocaleDateString()}</p>
      </div>
    </motion.div>
  );
}

// ============================================================
// OVERVIEW PAGE
// ============================================================
function OverviewPage({ totalEarnings, earnings, invoices, clients, userCurrency, monthlyData, platformData }: any) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Earnings" value={`${userCurrency} ${totalEarnings.toFixed(2)}`} icon={<DollarSign className="text-blue-600" size={24} />} color="blue" trend="+12%" />
        <StatCard title="Earnings" value={earnings.length.toString()} icon={<TrendingUp className="text-green-600" size={24} />} color="green" trend="+8%" />
        <StatCard title="Invoices" value={invoices.length.toString()} icon={<FileText className="text-purple-600" size={24} />} color="purple" trend="+5%" />
        <StatCard title="Clients" value={clients.length.toString()} icon={<Users className="text-orange-600" size={24} />} color="orange" trend="+3%" />
      </div>
      {earnings.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">📊 Monthly Earnings ({userCurrency})</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="month" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip contentStyle={{ backgroundColor: '#1F2937', borderColor: '#374151' }} />
                <Bar dataKey="amount" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">🍩 Platform Breakdown</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={platformData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={5} dataKey="value">
                  {platformData.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#1F2937', borderColor: '#374151' }} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </motion.div>
  );
}

// ============================================================
// STAT CARD
// ============================================================
function StatCard({ title, value, icon, color, trend }: any) {
  const colors: any = {
    blue: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
    green: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
    purple: 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800',
    orange: 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800',
  };
  return (
    <div className={`${colors[color]} p-6 rounded-2xl border shadow-sm hover:shadow-md transition`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{value}</p>
          {trend && <p className="text-xs text-green-600 dark:text-green-400 mt-1">{trend} this month</p>}
        </div>
        <div className="p-3 bg-white dark:bg-gray-800 rounded-xl shadow-sm">{icon}</div>
      </div>
    </div>
  );
}

// ============================================================
// EMPTY STATE
// ============================================================
function EmptyState({ title, description, buttonText, onAction }: any) {
  return (
    <div className="text-center py-12">
      <div className="text-6xl mb-4">📭</div>
      <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200">{title}</h3>
      <p className="text-gray-500 dark:text-gray-400 mt-2">{description}</p>
      {buttonText && (
        <button onClick={onAction} className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition shadow-md">
          <Plus size={18} /> {buttonText}
        </button>
      )}
    </div>
  );
}

// ============================================================
// EARNINGS PAGE
// ============================================================
function EarningsPage({ earnings, userCurrency, totalEarnings, showEarningForm, setShowEarningForm, newEarning, setNewEarning, editingEarning, setEditingEarning, addEarning, deleteEarning, loading }: any) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div><h2 className="text-2xl font-bold text-gray-900 dark:text-white">💸 Earnings</h2><p className="text-sm text-gray-500">Total: {userCurrency} {totalEarnings.toFixed(2)}</p></div>
        <button onClick={() => { setShowEarningForm(!showEarningForm); setEditingEarning(null); }} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:shadow-lg transition shadow-md">
          <Plus size={20} /> {editingEarning ? 'Edit' : 'Add'}
        </button>
      </div>
      <AnimatePresence>
        {showEarningForm && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <h3 className="font-semibold mb-4">{editingEarning ? 'Edit' : 'Add'} Earning</h3>
            <form onSubmit={addEarning} className="grid grid-cols-1 md:grid-cols-5 gap-3">
              <input type="text" placeholder="Platform" value={newEarning.platform} onChange={(e) => setNewEarning({...newEarning, platform: e.target.value})} className="p-3 border rounded-lg dark:bg-gray-900 dark:border-gray-700 focus:ring-2 focus:ring-blue-500" required />
              <input type="number" step="0.01" placeholder="Amount" value={newEarning.amount} onChange={(e) => setNewEarning({...newEarning, amount: e.target.value})} className="p-3 border rounded-lg dark:bg-gray-900 dark:border-gray-700 focus:ring-2 focus:ring-blue-500" required />
              <select value={newEarning.currency} onChange={(e) => setNewEarning({...newEarning, currency: e.target.value})} className="p-3 border rounded-lg dark:bg-gray-900 dark:border-gray-700">
                <option value="USD">USD</option><option value="EUR">EUR</option><option value="GBP">GBP</option>
                <option value="PKR">PKR</option><option value="INR">INR</option><option value="PHP">PHP</option><option value="NGN">NGN</option>
              </select>
              <input type="text" placeholder="Client" value={newEarning.client_name} onChange={(e) => setNewEarning({...newEarning, client_name: e.target.value})} className="p-3 border rounded-lg dark:bg-gray-900 dark:border-gray-700" />
              <input type="date" value={newEarning.date} onChange={(e) => setNewEarning({...newEarning, date: e.target.value})} className="p-3 border rounded-lg dark:bg-gray-900 dark:border-gray-700" />
              <div className="md:col-span-5 flex gap-3">
                <button type="submit" disabled={loading} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">{editingEarning ? 'Update' : 'Save'}</button>
                <button type="button" onClick={() => { setShowEarningForm(false); setEditingEarning(null); }} className="px-6 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300">Cancel</button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        {earnings.length === 0 ? (
          <EmptyState title="No earnings yet" description="Start tracking your freelance income" buttonText="Add Earning" onAction={() => setShowEarningForm(true)} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700"><tr>
                <th className="p-4 text-left">Date</th><th className="p-4 text-left">Platform</th><th className="p-4 text-left">Client</th><th className="p-4 text-right">Amount</th><th className="p-4 text-center">Actions</th>
              </tr></thead>
              <tbody>
                {earnings.map((e: any) => (
                  <tr key={e.id} className="border-t dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="p-4">{e.date}</td><td className="p-4">{e.platform}</td><td className="p-4">{e.client_name || '-'}</td>
                    <td className="p-4 text-right font-medium">{e.currency} {Number(e.amount).toFixed(2)}</td>
                    <td className="p-4 text-center flex gap-2 justify-center">
                      <button onClick={() => { setEditingEarning(e); setNewEarning({platform: e.platform, amount: e.amount.toString(), currency: e.currency, client_name: e.client_name || '', date: e.date}); setShowEarningForm(true); }} className="text-blue-600 hover:bg-blue-50 p-1 rounded"><Edit2 size={16} /></button>
                      <button onClick={() => deleteEarning(e.id)} className="text-red-600 hover:bg-red-50 p-1 rounded"><Trash2 size={16} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50 dark:bg-gray-700 font-bold"><tr><td colSpan={3} className="p-4 text-right">Total:</td><td className="p-4 text-right text-blue-600">{userCurrency} {totalEarnings.toFixed(2)}</td><td></td></tr></tfoot>
            </table>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ============================================================
// INVOICES PAGE
// ============================================================
function InvoicesPage({ invoices, showInvoiceForm, setShowInvoiceForm, newInvoice, setNewInvoice, createInvoice, deleteInvoice, togglePaid, generatePDF, loading }: any) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div><h2 className="text-2xl font-bold text-gray-900 dark:text-white">📄 Invoices</h2><p className="text-sm text-gray-500">Total: {invoices.length}</p></div>
        <button onClick={() => setShowInvoiceForm(!showInvoiceForm)} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:shadow-lg transition shadow-md">
          <Plus size={20} /> Create
        </button>
      </div>
      <AnimatePresence>
        {showInvoiceForm && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <h3 className="font-semibold mb-4">New Invoice</h3>
            <form onSubmit={createInvoice} className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <input type="text" placeholder="Client Name" value={newInvoice.client_name} onChange={(e) => setNewInvoice({...newInvoice, client_name: e.target.value})} className="p-3 border rounded-lg dark:bg-gray-900 dark:border-gray-700" required />
              <input type="text" placeholder="Description" value={newInvoice.description} onChange={(e) => setNewInvoice({...newInvoice, description: e.target.value})} className="p-3 border rounded-lg dark:bg-gray-900 dark:border-gray-700" required />
              <input type="number" step="0.01" placeholder="Amount" value={newInvoice.amount} onChange={(e) => setNewInvoice({...newInvoice, amount: e.target.value})} className="p-3 border rounded-lg dark:bg-gray-900 dark:border-gray-700" required />
              <select value={newInvoice.currency} onChange={(e) => setNewInvoice({...newInvoice, currency: e.target.value})} className="p-3 border rounded-lg dark:bg-gray-900 dark:border-gray-700">
                <option value="USD">USD</option><option value="EUR">EUR</option><option value="GBP">GBP</option>
                <option value="PKR">PKR</option><option value="INR">INR</option><option value="PHP">PHP</option><option value="NGN">NGN</option>
              </select>
              <input type="date" value={newInvoice.date} onChange={(e) => setNewInvoice({...newInvoice, date: e.target.value})} className="p-3 border rounded-lg dark:bg-gray-900 dark:border-gray-700" />
              <label className="flex items-center gap-2 p-3"><input type="checkbox" checked={newInvoice.paid} onChange={(e) => setNewInvoice({...newInvoice, paid: e.target.checked})} /> Paid</label>
              <div className="md:col-span-3 flex gap-3">
                <button type="submit" disabled={loading} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">Create & Download PDF</button>
                <button type="button" onClick={() => setShowInvoiceForm(false)} className="px-6 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300">Cancel</button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        {invoices.length === 0 ? (
          <EmptyState title="No invoices yet" description="Create your first professional invoice" buttonText="Create Invoice" onAction={() => setShowInvoiceForm(true)} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700"><tr><th className="p-4 text-left">#</th><th className="p-4 text-left">Client</th><th className="p-4 text-left">Description</th><th className="p-4 text-right">Amount</th><th className="p-4 text-center">Status</th><th className="p-4 text-center">Actions</th></tr></thead>
              <tbody>
                {invoices.map((inv: any) => (
                  <tr key={inv.id} className="border-t dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="p-4 font-medium">{inv.invoice_number}</td><td className="p-4">{inv.client_name}</td><td className="p-4">{inv.description || '-'}</td>
                    <td className="p-4 text-right">{inv.currency} {Number(inv.amount).toFixed(2)}</td>
                    <td className="p-4 text-center"><button onClick={() => togglePaid(inv.id, inv.paid)} className={`px-3 py-1 rounded-full text-xs font-medium ${inv.paid ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{inv.paid ? 'Paid ✅' : 'Unpaid ⚠️'}</button></td>
                    <td className="p-4 text-center flex gap-2 justify-center">
                      <button onClick={() => generatePDF(inv)} className="text-blue-600 hover:bg-blue-50 p-1 rounded"><FileDown size={16} /></button>
                      <button onClick={() => deleteInvoice(inv.id)} className="text-red-600 hover:bg-red-50 p-1 rounded"><Trash2 size={16} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ============================================================
// CLIENTS PAGE
// ============================================================
function ClientsPage({ clients, showClientForm, setShowClientForm, newClient, setNewClient, editingClient, setEditingClient, addClient, deleteClient, editClient, getInvoiceCount, loading }: any) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div><h2 className="text-2xl font-bold text-gray-900 dark:text-white">👥 Clients</h2><p className="text-sm text-gray-500">Total: {clients.length}</p></div>
        <button onClick={() => { setShowClientForm(!showClientForm); setEditingClient(null); }} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:shadow-lg transition shadow-md">
          <Plus size={20} /> Add
        </button>
      </div>
      <AnimatePresence>
        {showClientForm && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <h3 className="font-semibold mb-4">{editingClient ? 'Edit' : 'Add'} Client</h3>
            <form onSubmit={addClient} className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input type="text" placeholder="Name *" value={newClient.name} onChange={(e) => setNewClient({...newClient, name: e.target.value})} className="p-3 border rounded-lg dark:bg-gray-900 dark:border-gray-700" required />
              <input type="email" placeholder="Email" value={newClient.email} onChange={(e) => setNewClient({...newClient, email: e.target.value})} className="p-3 border rounded-lg dark:bg-gray-900 dark:border-gray-700" />
              <input type="text" placeholder="Country" value={newClient.country} onChange={(e) => setNewClient({...newClient, country: e.target.value})} className="p-3 border rounded-lg dark:bg-gray-900 dark:border-gray-700" />
              <input type="text" placeholder="Notes" value={newClient.notes} onChange={(e) => setNewClient({...newClient, notes: e.target.value})} className="p-3 border rounded-lg dark:bg-gray-900 dark:border-gray-700" />
              <div className="md:col-span-2 flex gap-3">
                <button type="submit" disabled={loading} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">{editingClient ? 'Update' : 'Save'}</button>
                <button type="button" onClick={() => { setShowClientForm(false); setEditingClient(null); }} className="px-6 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300">Cancel</button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {clients.length === 0 ? (
          <div className="col-span-full"><EmptyState title="No clients yet" description="Add your first client" buttonText="Add Client" onAction={() => setShowClientForm(true)} /></div>
        ) : (
          clients.map((client: any) => (
            <div key={client.id} className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-lg transition">
              <div className="flex justify-between">
                <div><h3 className="font-semibold text-gray-900 dark:text-white">{client.name}</h3>
                  {client.email && <p className="text-sm text-gray-500 flex items-center gap-1"><Mail size={14} /> {client.email}</p>}
                  {client.country && <p className="text-sm text-gray-500 flex items-center gap-1"><MapPin size={14} /> {client.country}</p>}
                  {client.notes && <p className="text-sm text-gray-400 italic mt-1">{client.notes}</p>}
                  <span className="inline-block mt-2 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-xs">{getInvoiceCount(client.name)} invoices</span>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => editClient(client)} className="text-blue-600 hover:bg-blue-50 p-1 rounded"><Edit2 size={16} /></button>
                  <button onClick={() => deleteClient(client.id)} className="text-red-600 hover:bg-red-50 p-1 rounded"><Trash2 size={16} /></button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </motion.div>
  );
}

// ============================================================
// TAX PAGE
// ============================================================
function TaxPage({ taxCountry, setTaxCountry, annualIncome, setAnnualIncome, taxResult, calculateTax, userCurrency }: any) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">💰 Tax Estimator</h2>
      <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500 rounded-lg">
        <div className="flex items-start gap-3">
          <AlertCircle size={20} className="text-yellow-600 dark:text-yellow-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-yellow-800 dark:text-yellow-400">⚠️ Important Legal Notice</p>
            <p className="text-sm text-yellow-700 dark:text-yellow-500">
              This is a <strong>rough estimate for planning purposes only</strong>. 
              Tax laws vary significantly and change frequently. 
              <strong> Please consult a licensed tax professional in your country for accurate filing.</strong>
            </p>
          </div>
        </div>
      </div>
      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <select value={taxCountry} onChange={(e) => setTaxCountry(e.target.value)} className="p-3 border rounded-lg dark:bg-gray-900 dark:border-gray-700">
            <option value="">Select Country</option>
            <option value="Pakistan">Pakistan</option><option value="India">India</option>
            <option value="Bangladesh">Bangladesh</option><option value="Philippines">Philippines</option>
            <option value="Nigeria">Nigeria</option><option value="United States">United States</option>
            <option value="United Kingdom">United Kingdom</option><option value="Other">Other</option>
          </select>
          <input type="number" step="0.01" placeholder="Annual Income" value={annualIncome} onChange={(e) => setAnnualIncome(e.target.value)} className="p-3 border rounded-lg dark:bg-gray-900 dark:border-gray-700" />
          <button onClick={calculateTax} className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:shadow-lg transition shadow-md">Calculate</button>
        </div>
        {taxResult && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <div><p className="text-sm text-gray-600">Country</p><p className="font-bold">{taxCountry}</p></div>
            <div><p className="text-sm text-gray-600">Tax Rate</p><p className="font-bold">{taxResult.rate}%</p><p className="text-xs text-gray-500">{taxResult.description}</p></div>
            <div><p className="text-sm text-gray-600">Estimated Tax</p><p className="text-xl font-bold text-blue-600">{userCurrency} {taxResult.estimatedTax.toFixed(2)}</p></div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

// ============================================================
// CURRENCY PAGE (Fixed tooltip)
// ============================================================
function CurrencyPage({ 
  currencyLogs, showCurrencyForm, setShowCurrencyForm, newCurrencyLog, 
  setNewCurrencyLog, addCurrencyLog, deleteCurrencyLog, chartData, 
  exchangeRates, userCurrency, multiCurrencyData, rateChange, 
  minRate, maxRate, COLORS 
}: any) {
  const pairs = ['USD/PKR', 'USD/EUR', 'USD/GBP', 'USD/INR'];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">📊 Live Currency Tracker</h2>
          <p className="text-sm text-gray-500">Real-time exchange rates powered by live API</p>
        </div>
        <div className="flex gap-3">
          {rateChange !== 0 && (
            <div className={`px-4 py-2 rounded-lg ${rateChange > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {rateChange > 0 ? '↑' : '↓'} {Math.abs(rateChange).toFixed(2)}% (30s)
            </div>
          )}
          <button onClick={() => setShowCurrencyForm(!showCurrencyForm)} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:shadow-lg transition shadow-md">
            <Plus size={20} /> Log
          </button>
        </div>
      </div>
      {Object.keys(exchangeRates).length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {['PKR', 'EUR', 'GBP', 'INR'].map((curr) => {
            const rate = exchangeRates[curr] || 0;
            const logs = currencyLogs.filter((l: any) => l.to_currency === curr);
            const lastRate = logs.length > 0 ? logs[logs.length - 1].rate : rate;
            const change = lastRate ? ((rate - lastRate) / lastRate) * 100 : 0;
            return (
              <div key={curr} className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
                <p className="text-sm text-gray-500">{curr}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{rate.toFixed(2)}</p>
                <p className={`text-xs ${change > 0 ? 'text-green-600' : change < 0 ? 'text-red-600' : 'text-gray-400'}`}>
                  {change > 0 ? '↑' : change < 0 ? '↓' : '='} {Math.abs(change).toFixed(2)}%
                </p>
                <p className="text-xs text-gray-400 mt-1">Updated: {new Date().toLocaleTimeString()}</p>
              </div>
            );
          })}
        </div>
      )}
      {multiCurrencyData.length > 1 && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-gray-800 dark:text-white">📈 Multi-Currency Trends</h3>
            <div className="flex gap-2">
              <button className="px-3 py-1 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded">1W</button>
              <button className="px-3 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded">1M</button>
              <button className="px-3 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded">3M</button>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={multiCurrencyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="date" stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" domain={['auto', 'auto']} />
<Tooltip 
  contentStyle={{ backgroundColor: '#1F2937', borderColor: '#374151' }} 
  formatter={(value: any) => value?.toFixed(4) ?? '-'}
/>
              <Legend />
              {pairs.map((pair, i) => (
                <Line key={pair} type="monotone" dataKey={pair} stroke={COLORS[i % COLORS.length]} strokeWidth={2} dot={false} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
      {currencyLogs.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500">Total Logs</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{currencyLogs.length}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500">Min Rate</p>
            <p className="text-2xl font-bold text-red-600">{minRate.toFixed(4)}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500">Max Rate</p>
            <p className="text-2xl font-bold text-green-600">{maxRate.toFixed(4)}</p>
          </div>
        </div>
      )}
      <AnimatePresence>
        {showCurrencyForm && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <form onSubmit={addCurrencyLog} className="grid grid-cols-1 md:grid-cols-5 gap-3">
              <input type="number" step="0.01" placeholder="Amount" value={newCurrencyLog.amount} onChange={(e) => setNewCurrencyLog({...newCurrencyLog, amount: e.target.value})} className="p-3 border rounded-lg dark:bg-gray-900 dark:border-gray-700" required />
              <select value={newCurrencyLog.from_currency} onChange={(e) => setNewCurrencyLog({...newCurrencyLog, from_currency: e.target.value})} className="p-3 border rounded-lg dark:bg-gray-900 dark:border-gray-700">
                <option value="USD">USD</option><option value="EUR">EUR</option><option value="GBP">GBP</option>
                <option value="PKR">PKR</option><option value="INR">INR</option><option value="PHP">PHP</option><option value="NGN">NGN</option>
              </select>
              <select value={newCurrencyLog.to_currency} onChange={(e) => setNewCurrencyLog({...newCurrencyLog, to_currency: e.target.value})} className="p-3 border rounded-lg dark:bg-gray-900 dark:border-gray-700">
                <option value="USD">USD</option><option value="EUR">EUR</option><option value="GBP">GBP</option>
                <option value="PKR">PKR</option><option value="INR">INR</option><option value="PHP">PHP</option><option value="NGN">NGN</option>
              </select>
              <input type="number" step="0.000001" placeholder="Rate" value={newCurrencyLog.rate} onChange={(e) => setNewCurrencyLog({...newCurrencyLog, rate: e.target.value})} className="p-3 border rounded-lg dark:bg-gray-900 dark:border-gray-700" required />
              <input type="date" value={newCurrencyLog.date} onChange={(e) => setNewCurrencyLog({...newCurrencyLog, date: e.target.value})} className="p-3 border rounded-lg dark:bg-gray-900 dark:border-gray-700" />
              <div className="md:col-span-5 flex gap-3">
                <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Save</button>
                <button type="button" onClick={() => setShowCurrencyForm(false)} className="px-6 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300">Cancel</button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h3 className="font-semibold">📋 Historical Logs</h3>
          <span className="text-sm text-gray-500">{currencyLogs.length} entries</span>
        </div>
        {currencyLogs.length === 0 ? (
          <EmptyState title="No logs yet" description="Start tracking currency rates" buttonText="Log Now" onAction={() => setShowCurrencyForm(true)} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700"><tr><th className="p-4 text-left">Date</th><th className="p-4 text-right">Amount</th><th className="p-4 text-center">From → To</th><th className="p-4 text-right">Rate</th><th className="p-4 text-center">Action</th></tr></thead>
              <tbody>
                {currencyLogs.slice(0, 50).map((log: any) => (
                  <tr key={log.id} className="border-t dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="p-4">{log.date}</td><td className="p-4 text-right font-medium">{Number(log.amount).toFixed(2)}</td>
                    <td className="p-4 text-center"><span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-xs">{log.from_currency} → {log.to_currency}</span></td>
                    <td className="p-4 text-right font-mono">{Number(log.rate).toFixed(4)}</td>
                    <td className="p-4 text-center"><button onClick={() => deleteCurrencyLog(log.id)} className="text-red-600 hover:bg-red-50 p-1 rounded"><Trash2 size={16} /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {Object.keys(exchangeRates).length > 0 && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold mb-4">🌍 Live Exchange Rates (USD Base)</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {['PKR', 'EUR', 'GBP', 'INR', 'PHP', 'NGN'].map((curr) => (
              <div key={curr} className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg text-center">
                <p className="text-sm text-gray-500">{curr}</p>
                <p className="font-bold text-gray-900 dark:text-white">{exchangeRates[curr]?.toFixed(2) || '-'}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}