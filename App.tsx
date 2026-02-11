
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { votingCenters as initialCenters } from './data';
import { VotingCenter, Person, ViewState, EmergencyContact } from './types';
import { 
  MagnifyingGlassIcon, 
  MapPinIcon, 
  UserGroupIcon, 
  InformationCircleIcon, 
  PhoneIcon, 
  ChatBubbleLeftRightIcon,
  HomeIcon, 
  ArrowLeftIcon,
  LockClosedIcon,
  Bars3Icon,
  XMarkIcon,
  PencilSquareIcon,
  TrashIcon,
  PlusIcon,
  Cog6ToothIcon,
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  ShieldCheckIcon,
  MegaphoneIcon,
  BuildingOfficeIcon,
  InboxStackIcon,
  KeyIcon,
  ExclamationCircleIcon,
  CheckCircleIcon,
  MapIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline';

const toBengaliDigits = (num: string | number) => {
  const bengaliDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return num.toString().replace(/\d/g, (d) => bengaliDigits[parseInt(d)]);
};

interface CustomModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  type: 'WARNING' | 'SUCCESS' | 'INFO' | 'DANGER';
  onConfirm?: () => void;
  onClose: () => void;
}

const App: React.FC = () => {
  const [centers, setCenters] = useState<VotingCenter[]>(() => {
    const saved = localStorage.getItem('voting_centers_data_v4');
    return saved ? JSON.parse(saved) : initialCenters;
  });

  const [emergencyContact, setEmergencyContact] = useState<EmergencyContact>(() => {
    const saved = localStorage.getItem('emergency_contact_v2');
    return saved ? JSON.parse(saved) : { name: 'ক্যাম্প কমান্ডার', mobile: '01712345678' };
  });

  const [userPassword] = useState(() => localStorage.getItem('app_user_password') || 'EPZArmy');
  const [adminPassword] = useState(() => localStorage.getItem('app_admin_password') || 'admin123');
  const [isLoggedIn, setIsLoggedIn] = useState(() => localStorage.getItem('app_is_logged_in') === 'true');
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(() => localStorage.getItem('app_is_admin_logged_in') === 'true');

  useEffect(() => {
    localStorage.setItem('voting_centers_data_v4', JSON.stringify(centers));
    localStorage.setItem('emergency_contact_v2', JSON.stringify(emergencyContact));
  }, [centers, emergencyContact]);

  const [inputPassword, setInputPassword] = useState('');
  const [inputAdminPassword, setInputAdminPassword] = useState('');
  const [view, setView] = useState<ViewState>(() => isAdminLoggedIn ? 'ADMIN' : 'HOME');
  const [selectedCenter, setSelectedCenter] = useState<VotingCenter | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loginError, setLoginError] = useState('');
  const [adminError, setAdminError] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showSOS, setShowSOS] = useState(false);
  const [showMapPicker, setShowMapPicker] = useState(false);
  
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const gMapRef = useRef<any>(null);
  const gMarkerRef = useRef<any>(null);
  const [mapSearchTerm, setMapSearchTerm] = useState('');

  const [modal, setModal] = useState<CustomModalProps>({
    isOpen: false,
    title: '',
    message: '',
    type: 'INFO',
    onClose: () => setModal(prev => ({ ...prev, isOpen: false }))
  });

  const showModal = (props: Partial<CustomModalProps>) => {
    setModal({
      isOpen: true,
      title: props.title || 'সতর্কবার্তা',
      message: props.message || '',
      type: props.type || 'INFO',
      onConfirm: props.onConfirm,
      onClose: () => setModal(prev => ({ ...prev, isOpen: false }))
    });
  };

  const [editCenter, setEditCenter] = useState<Partial<VotingCenter>>({});
  const [tempEmergency, setTempEmergency] = useState<EmergencyContact>(emergencyContact);
  const [newPasswordValue, setNewPasswordValue] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputPassword === userPassword) {
      setIsLoggedIn(true);
      localStorage.setItem('app_is_logged_in', 'true');
      setLoginError('');
    } else {
      setLoginError('ভুল পাসওয়ার্ড! আবার চেষ্টা করুন।');
    }
  };

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputAdminPassword === adminPassword) {
      setIsAdminLoggedIn(true);
      localStorage.setItem('app_is_admin_logged_in', 'true');
      setView('ADMIN');
      setAdminError('');
    } else {
      setAdminError('ভুল অ্যাডমিন পাসওয়ার্ড!');
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setIsAdminLoggedIn(false);
    localStorage.removeItem('app_is_logged_in');
    localStorage.removeItem('app_is_admin_logged_in');
    setView('HOME');
    setIsSidebarOpen(false);
  };

  const filteredCenters = useMemo(() => {
    const lowerQuery = searchQuery.toLowerCase();
    return centers.filter(c => 
      c.name.toLowerCase().includes(lowerQuery) ||
      c.centerNumber.includes(searchQuery) ||
      c.importantPersons.some(p => p.name.toLowerCase().includes(lowerQuery) || p.mobile.includes(searchQuery))
    );
  }, [searchQuery, centers]);

  const goBack = () => {
    if (view === 'CENTER_DETAILS') setView('HOME');
    else if (view === 'CENTER_INFO' || view === 'PERSONS') setView('CENTER_DETAILS');
    else if (view === 'EDIT_CENTER' || view === 'SETTINGS') setView('ADMIN');
    else if (view === 'ADMIN' || view === 'ADMIN_LOGIN') setView('HOME');
    else setView('HOME');
  };

  // Fix: Added missing goHome function used in MobileNav and Sidebar
  const goHome = () => {
    setView('HOME');
    setSelectedCenter(null);
    setIsSidebarOpen(false);
  };

  const startEdit = (center?: VotingCenter) => {
    if (center) {
      setEditCenter(JSON.parse(JSON.stringify(center)));
    } else {
      setEditCenter({
        id: Date.now().toString(),
        centerNumber: toBengaliDigits((centers.length + 1).toString().padStart(2, '0')),
        name: '',
        boothCount: '',
        voterCount: '',
        roomLocation: '',
        locationLink: '',
        importantPersons: []
      });
    }
    setView('EDIT_CENTER');
  };

  const saveCenter = () => {
    if (!editCenter.name) return showModal({ title: 'ত্রুটি', message: 'কেন্দ্রের নাম আবশ্যক।', type: 'WARNING' });
    setCenters(prev => {
      const idx = prev.findIndex(c => c.id === editCenter.id);
      if (idx > -1) {
        const next = [...prev];
        next[idx] = editCenter as VotingCenter;
        return next;
      }
      return [...prev, editCenter as VotingCenter];
    });
    setView('ADMIN');
    showModal({ title: 'সফল', message: 'তথ্য সংরক্ষিত হয়েছে।', type: 'SUCCESS' });
  };

  const addPersonToEdit = () => {
    const newPerson: Person = { id: Date.now().toString(), name: '', designation: '', mobile: '' };
    setEditCenter(prev => ({ ...prev, importantPersons: [...(prev.importantPersons || []), newPerson] }));
  };

  const updatePersonInEdit = (id: string, field: keyof Person, value: string) => {
    setEditCenter(prev => ({
      ...prev,
      importantPersons: (prev.importantPersons || []).map(p => p.id === id ? { ...p, [field]: value } : p)
    }));
  };

  const exportData = () => {
    const dataStr = JSON.stringify({ centers, emergencyContact }, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `epz_army_data.json`;
    link.click();
  };

  const importData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (json.centers) setCenters(json.centers);
        if (json.emergencyContact) setEmergencyContact(json.emergencyContact);
        showModal({ title: 'রিস্টোর সফল', message: 'তথ্য সফলভাবে রিস্টোর করা হয়েছে।', type: 'SUCCESS' });
      } catch (err) {
        showModal({ title: 'ত্রুটি', message: 'ভুল ফাইল ফরম্যাট।', type: 'DANGER' });
      }
    };
    reader.readAsText(file);
  };

  // UI Parts
  const Header = () => (
    <header className="bg-army-green text-white px-6 py-6 sticky top-0 z-50 shadow-sm border-b border-white/10">
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        <button onClick={() => setIsSidebarOpen(true)} className="p-2 -ml-2 hover:bg-white/10 rounded-lg">
          <Bars3Icon className="h-6 w-6" />
        </button>
        <div className="text-center">
          <h1 className="text-lg font-bold leading-tight">ইপিজেড আর্মি ক্যাম্প</h1>
          <p className="text-[10px] opacity-70 uppercase tracking-widest font-medium">জাতীয় সংসদ নির্বাচন ২০২৬</p>
        </div>
        <button onClick={() => setShowSOS(true)} className="bg-red-600 p-2 rounded-lg shadow-lg active:scale-95 transition-all">
          <MegaphoneIcon className="h-6 w-6" />
        </button>
      </div>
    </header>
  );

  const MobileNav = () => (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 flex justify-around items-center h-16 z-50 md:hidden px-4">
      <button onClick={goBack} className="flex flex-col items-center text-slate-400">
        <ArrowLeftIcon className="h-5 w-5" />
        <span className="text-[10px] mt-1 font-semibold">ব্যাক</span>
      </button>
      <button onClick={goHome} className="flex flex-col items-center bg-army-green text-white p-3 -mt-10 rounded-full shadow-xl border-4 border-white">
        <HomeIcon className="h-6 w-6" />
      </button>
      <button onClick={() => setIsSidebarOpen(true)} className="flex flex-col items-center text-slate-400">
        <Bars3Icon className="h-5 w-5" />
        <span className="text-[10px] mt-1 font-semibold">মেনু</span>
      </button>
    </nav>
  );

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
        <div className="max-w-sm w-full bg-white rounded-3xl shadow-sm border border-slate-200 p-10 text-center animate-fadeIn">
          <div className="bg-army-green w-16 h-16 rounded-2xl mx-auto mb-8 flex items-center justify-center shadow-lg">
            <ShieldCheckIcon className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold mb-1">স্বাগতম</h2>
          <p className="text-slate-400 text-sm mb-10">পাসওয়ার্ড দিয়ে প্রবেশ করুন</p>
          <form onSubmit={handleLogin} className="space-y-6">
            <input 
              type="password" 
              placeholder="পাসওয়ার্ড" 
              className="w-full px-5 py-4 rounded-xl border border-slate-200 focus:border-army-green outline-none text-center font-bold tracking-widest text-lg bg-slate-50" 
              value={inputPassword} 
              autoFocus 
              onChange={(e) => setInputPassword(e.target.value)} 
            />
            {loginError && <p className="text-red-500 text-xs font-bold">{loginError}</p>}
            <button type="submit" className="w-full bg-army-green text-white py-4 rounded-xl font-bold shadow-sm active:scale-95 transition-all">প্রবেশ করুন</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col pb-20 md:pb-0">
      <Header />
      
      {/* Sidebar Drawer */}
      <div className={`fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] transition-opacity duration-300 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={() => setIsSidebarOpen(false)}>
        <aside className={`fixed top-0 left-0 h-full w-72 bg-white shadow-2xl transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`} onClick={e => e.stopPropagation()}>
          <div className="p-8 bg-army-green text-white">
            <h2 className="text-xl font-bold">ইপিজেড আর্মি</h2>
            <p className="text-xs opacity-60">সংস্করণ ৫.০</p>
          </div>
          <nav className="p-6 space-y-2">
            <button onClick={goHome} className="flex items-center gap-4 w-full p-4 rounded-xl hover:bg-slate-50 text-slate-600 font-bold">
              <HomeIcon className="h-5 w-5" /> মূল পাতা
            </button>
            <button onClick={() => { isAdminLoggedIn ? setView('ADMIN') : setView('ADMIN_LOGIN'); setIsSidebarOpen(false); }} className="flex items-center gap-4 w-full p-4 rounded-xl hover:bg-slate-50 text-slate-600 font-bold">
              <Cog6ToothIcon className="h-5 w-5" /> অ্যাডমিন কন্ট্রোল
            </button>
            <button onClick={() => { setView('SETTINGS'); setIsSidebarOpen(false); }} className="flex items-center gap-4 w-full p-4 rounded-xl hover:bg-slate-50 text-slate-600 font-bold">
              <KeyIcon className="h-5 w-5" /> পাসওয়ার্ড বদল
            </button>
            <button onClick={handleLogout} className="flex items-center gap-4 w-full p-4 rounded-xl text-red-500 font-bold mt-10">
              <ArrowRightOnRectangleIcon className="h-5 w-5" /> লগআউট
            </button>
          </nav>
        </aside>
      </div>

      <main className="flex-1 max-w-4xl mx-auto w-full p-6">
        {view === 'HOME' && (
          <div className="space-y-8">
            <div className="relative">
              <MagnifyingGlassIcon className="h-5 w-5 absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="ভোট কেন্দ্র খুঁজুন..." 
                className="w-full pl-14 pr-6 py-5 rounded-2xl border border-slate-200 bg-white shadow-sm outline-none focus:border-army-green transition-all font-medium text-lg"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <h2 className="col-span-full text-sm font-bold text-slate-400 uppercase tracking-widest px-2">কেন্দ্রের তালিকা ({toBengaliDigits(filteredCenters.length)})</h2>
              {filteredCenters.map(c => (
                <button 
                  key={c.id} 
                  onClick={() => { setSelectedCenter(c); setView('CENTER_DETAILS'); }}
                  className="clean-card p-6 flex items-center gap-5 text-left group"
                >
                  <div className="bg-slate-50 text-army-green font-black w-12 h-12 flex items-center justify-center rounded-xl text-xl border border-slate-100 group-hover:bg-army-green group-hover:text-white transition-colors">
                    {c.centerNumber}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-slate-800 text-lg leading-snug">{c.name}</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">বিস্তারিত দেখুন</p>
                  </div>
                  <ArrowLeftIcon className="h-5 w-5 text-slate-300 rotate-180" />
                </button>
              ))}
            </div>
          </div>
        )}

        {view === 'CENTER_DETAILS' && selectedCenter && (
          <div className="animate-fadeIn space-y-6">
            <button onClick={goBack} className="flex items-center gap-2 text-slate-500 font-bold text-sm mb-4">
              <ArrowLeftIcon className="h-4 w-4" /> ফিরে যান
            </button>
            <div className="bg-white rounded-3xl border border-slate-200 p-8 text-center shadow-sm">
              <div className="inline-block bg-slate-50 text-army-green px-4 py-1.5 rounded-full text-xs font-bold mb-4 border border-slate-100 uppercase tracking-widest">
                কেন্দ্র নং {selectedCenter.centerNumber}
              </div>
              <h2 className="text-3xl font-bold mb-10 leading-tight">{selectedCenter.name}</h2>
              
              <div className="grid grid-cols-1 gap-3">
                <button onClick={() => setView('CENTER_INFO')} className="flex items-center gap-4 p-5 rounded-2xl bg-slate-50 hover:bg-slate-100 transition-all font-bold text-slate-700">
                  <div className="bg-white p-3 rounded-xl shadow-sm text-army-green"><InformationCircleIcon className="h-6 w-6" /></div>
                  ভোটকেন্দ্রের তথ্যাদি
                </button>
                <a href={selectedCenter.locationLink} target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 p-5 rounded-2xl bg-slate-50 hover:bg-slate-100 transition-all font-bold text-slate-700">
                  <div className="bg-white p-3 rounded-xl shadow-sm text-army-green"><MapPinIcon className="h-6 w-6" /></div>
                  ভোটকেন্দ্রের অবস্থান (ম্যাপ)
                </a>
                <button onClick={() => setView('PERSONS')} className="flex items-center gap-4 p-5 rounded-2xl bg-slate-50 hover:bg-slate-100 transition-all font-bold text-slate-700">
                  <div className="bg-white p-3 rounded-xl shadow-sm text-army-green"><UserGroupIcon className="h-6 w-6" /></div>
                  গুরুত্বপুর্ণ ব্যক্তিবর্গ
                </button>
              </div>
            </div>
          </div>
        )}

        {view === 'CENTER_INFO' && selectedCenter && (
          <div className="animate-fadeIn space-y-6 max-w-lg mx-auto">
            <button onClick={goBack} className="flex items-center gap-2 text-slate-500 font-bold text-sm">
              <ArrowLeftIcon className="h-4 w-4" /> ফিরে যান
            </button>
            <div className="bg-white p-8 rounded-3xl border border-slate-200 space-y-6 shadow-sm">
              <h3 className="text-xl font-bold border-b pb-4">কেন্দ্রের তথ্য</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl">
                  <span className="text-slate-500 font-semibold">ভোট কক্ষ সংখ্যা:</span>
                  <span className="font-bold text-xl">{toBengaliDigits(selectedCenter.boothCount)} টি</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl">
                  <span className="text-slate-500 font-semibold">মোট ভোটার:</span>
                  <span className="font-bold text-xl">{toBengaliDigits(selectedCenter.voterCount)} জন</span>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl">
                  <span className="text-slate-500 font-semibold block mb-2">অবস্থান বর্ণনা:</span>
                  <span className="font-bold text-slate-800 leading-relaxed">{selectedCenter.roomLocation}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {view === 'PERSONS' && selectedCenter && (
          <div className="animate-fadeIn space-y-6">
            <button onClick={goBack} className="flex items-center gap-2 text-slate-500 font-bold text-sm">
              <ArrowLeftIcon className="h-4 w-4" /> ফিরে যান
            </button>
            <div className="space-y-3">
              {selectedCenter.importantPersons.map(p => (
                <div key={p.id} className="bg-white p-6 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-6 shadow-sm">
                  <div className="flex-1">
                    <h4 className="font-bold text-xl text-slate-900">{p.name}</h4>
                    <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-1">{p.designation}</p>
                    <p className="text-army-green font-bold text-lg mt-2">{p.mobile}</p>
                  </div>
                  <div className="flex gap-3">
                    <a href={`tel:${p.mobile}`} className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-slate-50 text-army-green font-bold px-6 py-3 rounded-xl hover:bg-army-green hover:text-white transition-all border border-slate-100">
                      <PhoneIcon className="h-5 w-5" /> কল
                    </a>
                    <a href={`https://wa.me/${p.mobile.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-slate-50 text-emerald-600 font-bold px-6 py-3 rounded-xl hover:bg-emerald-600 hover:text-white transition-all border border-slate-100">
                      <ChatBubbleLeftRightIcon className="h-5 w-5" /> হোয়াটসএ্যাপ
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {view === 'ADMIN_LOGIN' && (
          <div className="max-w-sm mx-auto mt-20 bg-white p-10 rounded-3xl border border-slate-200 shadow-sm animate-fadeIn text-center">
             <div className="bg-slate-50 w-16 h-16 rounded-2xl mx-auto mb-6 flex items-center justify-center">
                <Cog6ToothIcon className="h-8 w-8 text-army-green" />
             </div>
             <h2 className="text-xl font-bold mb-8">অ্যাডমিন প্রবেশ</h2>
             <form onSubmit={handleAdminLogin} className="space-y-6">
               <input 
                 type="password" 
                 placeholder="পিন কোড" 
                 className="w-full px-6 py-4 rounded-xl border border-slate-100 focus:border-army-green outline-none text-center font-bold tracking-[0.4em] text-2xl bg-slate-50" 
                 value={inputAdminPassword} 
                 onChange={e => setInputAdminPassword(e.target.value)} 
               />
               {adminError && <p className="text-red-500 text-xs font-bold">{adminError}</p>}
               <button type="submit" className="w-full bg-army-green text-white py-4 rounded-xl font-bold">লগইন</button>
             </form>
          </div>
        )}

        {view === 'ADMIN' && (
          <div className="space-y-8 animate-fadeIn pb-10">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">অ্যাডমিন ড্যাশবোর্ড</h2>
              <button onClick={() => setView('HOME')} className="text-slate-400 font-bold text-sm">ফিরে যান</button>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">মোট কেন্দ্র</p>
                <p className="text-3xl font-black">{toBengaliDigits(centers.length)}</p>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">জনবল</p>
                <p className="text-3xl font-black">{toBengaliDigits(centers.reduce((a,b) => a + b.importantPersons.length, 0))}</p>
              </div>
            </div>

            <div className="bg-white p-8 rounded-3xl border border-red-100">
                <h3 className="text-lg font-bold text-red-600 mb-6 flex items-center gap-2"><MegaphoneIcon className="h-5 w-5" /> জরুরী যোগাযোগ</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                  <input placeholder="নাম" className="p-4 rounded-xl border border-slate-100 font-bold" value={tempEmergency.name} onChange={e => setTempEmergency({...tempEmergency, name: e.target.value})} />
                  <input placeholder="মোবাইল" className="p-4 rounded-xl border border-slate-100 font-bold" value={tempEmergency.mobile} onChange={e => setTempEmergency({...tempEmergency, mobile: e.target.value})} />
                </div>
                <button onClick={() => { setEmergencyContact(tempEmergency); showModal({ title: 'সফল', message: 'আপডেট হয়েছে।', type: 'SUCCESS' }); }} className="w-full bg-red-600 text-white py-4 rounded-xl font-bold">জরুরী তথ্য সেভ করুন</button>
            </div>

            <div className="flex items-center justify-between pt-10 border-t">
              <h3 className="text-lg font-bold">ভোট কেন্দ্র পরিচালনা</h3>
              <button onClick={() => startEdit()} className="bg-army-green text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-sm text-sm">
                <PlusIcon className="h-5 w-5" /> নতুন কেন্দ্র
              </button>
            </div>

            <div className="space-y-3">
              {centers.map(c => (
                <div key={c.id} className="bg-white p-6 rounded-2xl border border-slate-200 flex items-center justify-between">
                  <span className="font-bold text-lg">{c.centerNumber}. {c.name}</span>
                  <div className="flex gap-2">
                    <button onClick={() => startEdit(c)} className="p-3 bg-slate-50 text-army-green rounded-xl"><PencilSquareIcon className="h-5 w-5" /></button>
                    <button onClick={() => { setCenters(prev => prev.filter(x => x.id !== c.id)); showModal({ title: 'মুছে ফেলা হয়েছে', type: 'SUCCESS' }); }} className="p-3 bg-red-50 text-red-600 rounded-xl"><TrashIcon className="h-5 w-5" /></button>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-4 mt-10">
              <button onClick={exportData} className="flex flex-col items-center gap-2 p-6 bg-slate-50 rounded-2xl border border-slate-100 font-bold text-slate-600">
                <ArrowDownTrayIcon className="h-6 w-6" /> ডাটা ব্যাকআপ
              </button>
              <button onClick={() => fileInputRef.current?.click()} className="flex flex-col items-center gap-2 p-6 bg-slate-50 rounded-2xl border border-slate-100 font-bold text-slate-600">
                <ArrowUpTrayIcon className="h-6 w-6" /> ডাটা রিস্টোর
                <input type="file" ref={fileInputRef} onChange={importData} className="hidden" accept=".json" />
              </button>
            </div>
          </div>
        )}

        {view === 'EDIT_CENTER' && (
          <div className="max-w-2xl mx-auto pb-20 animate-fadeIn">
            <h2 className="text-2xl font-bold mb-10">কেন্দ্র সম্পাদনা (নং {editCenter.centerNumber})</h2>
            <div className="bg-white p-8 rounded-3xl border border-slate-200 space-y-8">
              <div className="space-y-4">
                <input placeholder="কেন্দ্রের নাম" className="w-full p-4 rounded-xl border border-slate-100 font-bold" value={editCenter.name} onChange={e => setEditCenter({...editCenter, name: e.target.value})} />
                <div className="grid grid-cols-2 gap-4">
                  <input placeholder="কক্ষ সংখ্যা" className="w-full p-4 rounded-xl border border-slate-100 font-bold" value={editCenter.boothCount} onChange={e => setEditCenter({...editCenter, boothCount: e.target.value})} />
                  <input placeholder="মোট ভোটার" className="w-full p-4 rounded-xl border border-slate-100 font-bold" value={editCenter.voterCount} onChange={e => setEditCenter({...editCenter, voterCount: e.target.value})} />
                </div>
                <input placeholder="অবস্থান ও তলা" className="w-full p-4 rounded-xl border border-slate-100 font-bold" value={editCenter.roomLocation} onChange={e => setEditCenter({...editCenter, roomLocation: e.target.value})} />
                <input placeholder="গুগল ম্যাপ লিংক" className="w-full p-4 rounded-xl border border-slate-100 font-mono text-sm" value={editCenter.locationLink} onChange={e => setEditCenter({...editCenter, locationLink: e.target.value})} />
              </div>

              <div className="pt-8 border-t">
                <div className="flex items-center justify-between mb-6">
                  <h4 className="font-bold">কর্মকর্তাদের তথ্য</h4>
                  <button onClick={addPersonToEdit} className="text-xs font-bold text-army-green bg-slate-50 px-4 py-2 rounded-lg border">যোগ করুন</button>
                </div>
                <div className="space-y-4">
                  {editCenter.importantPersons?.map(p => (
                    <div key={p.id} className="p-6 bg-slate-50 rounded-2xl relative border">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <input placeholder="নাম" className="p-3 rounded-lg border bg-white" value={p.name} onChange={e => updatePersonInEdit(p.id, 'name', e.target.value)} />
                        <input placeholder="পদবী" className="p-3 rounded-lg border bg-white" value={p.designation} onChange={e => updatePersonInEdit(p.id, 'designation', e.target.value)} />
                        <input placeholder="মোবাইল" className="p-3 rounded-lg border bg-white col-span-full" value={p.mobile} onChange={e => updatePersonInEdit(p.id, 'mobile', e.target.value)} />
                      </div>
                      <button onClick={() => setEditCenter(prev => ({ ...prev, importantPersons: prev.importantPersons?.filter(x => x.id !== p.id) }))} className="absolute -top-3 -right-3 bg-white text-red-500 p-2 rounded-full border shadow-sm">
                        <XMarkIcon className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-4 pt-10">
                <button onClick={() => setView('ADMIN')} className="flex-1 py-4 bg-slate-100 rounded-xl font-bold">বাতিল</button>
                <button onClick={saveCenter} className="flex-1 py-4 bg-army-green text-white rounded-xl font-bold">সংরক্ষণ করুন</button>
              </div>
            </div>
          </div>
        )}
      </main>

      <MobileNav />

      {showSOS && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md animate-fadeIn" onClick={() => setShowSOS(false)}>
          <div className="bg-white w-full max-w-sm rounded-[40px] overflow-hidden shadow-2xl animate-pop" onClick={e => e.stopPropagation()}>
            <div className="bg-red-600 p-12 text-center text-white">
              <MegaphoneIcon className="h-16 w-16 mx-auto mb-6 animate-pulse" />
              <h2 className="text-2xl font-black mb-1">জরুরী সাহায্য</h2>
              <p className="text-xs opacity-70 uppercase tracking-widest font-bold">দ্রুত যোগাযোগ করুন</p>
            </div>
            <div className="p-10 space-y-6">
               <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 text-center">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">{emergencyContact.name}</p>
                  <p className="font-black text-3xl text-slate-900 mb-6">{emergencyContact.mobile}</p>
                  <div className="flex gap-4">
                    <a href={`tel:${emergencyContact.mobile}`} className="flex-1 bg-red-600 text-white p-4 rounded-2xl flex items-center justify-center shadow-lg active:scale-95 transition-all">
                      <PhoneIcon className="h-7 w-7" />
                    </a>
                    <a href={`https://wa.me/${emergencyContact.mobile.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" className="flex-1 bg-emerald-600 text-white p-4 rounded-2xl flex items-center justify-center shadow-lg active:scale-95 transition-all">
                      <ChatBubbleLeftRightIcon className="h-7 w-7" />
                    </a>
                  </div>
               </div>
               <button onClick={() => setShowSOS(false)} className="w-full py-4 text-slate-400 font-bold uppercase tracking-widest text-[10px]">বন্ধ করুন</button>
            </div>
          </div>
        </div>
      )}

      {/* Basic Modal for Alerts */}
      {modal.isOpen && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white w-full max-w-xs rounded-3xl p-8 text-center animate-pop">
            <h3 className="text-lg font-bold mb-2">{modal.title}</h3>
            <p className="text-slate-500 text-sm mb-8 leading-relaxed">{modal.message}</p>
            <button onClick={modal.onClose} className="w-full bg-army-green text-white py-4 rounded-xl font-bold">ঠিক আছে</button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .animate-fadeIn { animation: fadeIn 0.4s ease-out; }
        @keyframes pop { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        .animate-pop { animation: pop 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
        * { -webkit-tap-highlight-color: transparent; }
      `}</style>
    </div>
  );
};

export default App;
