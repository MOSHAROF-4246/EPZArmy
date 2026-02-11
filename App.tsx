
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { votingCenters as initialCenters } from './data';
import { VotingCenter, Person, ViewState, EmergencyContact } from './types';
import { GoogleGenAI } from "@google/genai";
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
  // Gemini AI Initialization
  // Note: ai instance is initialized as per developer guidelines
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

  // Persistence logic - Centers
  const [centers, setCenters] = useState<VotingCenter[]>(() => {
    const saved = localStorage.getItem('voting_centers_data_v5');
    return saved ? JSON.parse(saved) : initialCenters;
  });

  // Persistence logic - Emergency Contact
  const [emergencyContact, setEmergencyContact] = useState<EmergencyContact>(() => {
    const saved = localStorage.getItem('emergency_contact_v2');
    return saved ? JSON.parse(saved) : { name: 'ক্যাম্প কমান্ডার', mobile: '01712345678' };
  });

  // Passwords
  const [userPassword, setUserPassword] = useState(() => localStorage.getItem('app_user_password') || 'EPZArmy');
  const [adminPassword, setAdminPassword] = useState(() => localStorage.getItem('app_admin_password') || 'admin123');

  // Session State
  const [isLoggedIn, setIsLoggedIn] = useState(() => localStorage.getItem('app_is_logged_in') === 'true');
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(() => localStorage.getItem('app_is_admin_logged_in') === 'true');

  useEffect(() => {
    localStorage.setItem('voting_centers_data_v5', JSON.stringify(centers));
    localStorage.setItem('emergency_contact_v2', JSON.stringify(emergencyContact));
    localStorage.setItem('app_user_password', userPassword);
    localStorage.setItem('app_admin_password', adminPassword);
    localStorage.setItem('app_is_logged_in', isLoggedIn.toString());
    localStorage.setItem('app_is_admin_logged_in', isAdminLoggedIn.toString());
  }, [centers, emergencyContact, userPassword, adminPassword, isLoggedIn, isAdminLoggedIn]);

  // View & UI State
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
  const [isSyncing, setIsSyncing] = useState(false);
  
  // Google Map Refs
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const gMapRef = useRef<any>(null);
  const gMarkerRef = useRef<any>(null);
  const [mapSearchTerm, setMapSearchTerm] = useState('');

  // Password Edit State
  const [newUserPass, setNewUserPass] = useState('');
  const [newAdminPass, setNewAdminPass] = useState('');

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
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load Maps Script properly
  useEffect(() => {
    if (typeof window === 'undefined' || (window as any).google) return;
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.API_KEY || ''}&libraries=places`;
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputPassword === userPassword) {
      setIsLoggedIn(true);
      setLoginError('');
    } else {
      setLoginError('ভুল পাসওয়ার্ড! আবার চেষ্টা করুন।');
    }
  };

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputAdminPassword === adminPassword) {
      setIsAdminLoggedIn(true);
      setView('ADMIN');
      setAdminError('');
    } else {
      setAdminError('ভুল অ্যাডমিন পাসওয়ার্ড!');
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setIsAdminLoggedIn(false);
    setView('HOME');
    setIsSidebarOpen(false);
  };

  const goBack = () => {
    if (view === 'CENTER_DETAILS') setView('HOME');
    else if (view === 'CENTER_INFO' || view === 'PERSONS') setView('CENTER_DETAILS');
    else if (view === 'EDIT_CENTER' || view === 'SETTINGS') setView('ADMIN');
    else if (view === 'ADMIN' || view === 'ADMIN_LOGIN') setView('HOME');
    else setView('HOME');
  };

  const goHome = () => {
    setView('HOME');
    setSelectedCenter(null);
    setIsSidebarOpen(false);
  };

  // Google Maps Picker Fix
  useEffect(() => {
    if (showMapPicker && mapContainerRef.current && (window as any).google) {
      const google = (window as any).google;
      const initialPos = { lat: 22.2513, lng: 91.7915 }; // EPZ Default
      
      const mapOptions = {
        center: initialPos,
        zoom: 15,
        disableDefaultUI: false,
        zoomControl: true,
        streetViewControl: false,
        mapTypeControl: false,
      };

      gMapRef.current = new google.maps.Map(mapContainerRef.current, mapOptions);
      gMarkerRef.current = new google.maps.Marker({
        position: initialPos,
        map: gMapRef.current,
        draggable: true,
        animation: google.maps.Animation.DROP,
      });

      gMapRef.current.addListener('click', (e: any) => {
        gMarkerRef.current.setPosition(e.latLng);
      });
    }
  }, [showMapPicker]);

  const handleMapSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mapSearchTerm || !(window as any).google) return;
    const google = (window as any).google;
    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ address: mapSearchTerm + ', Chattogram' }, (results: any, status: any) => {
      if (status === 'OK' && results[0]) {
        const pos = results[0].geometry.location;
        gMapRef.current.setCenter(pos);
        gMapRef.current.setZoom(17);
        gMarkerRef.current.setPosition(pos);
      }
    });
  };

  const handleMapConfirm = () => {
    if (gMarkerRef.current) {
      const pos = gMarkerRef.current.getPosition();
      const link = `https://www.google.com/maps?q=${pos.lat()},${pos.lng()}`;
      setEditCenter(prev => ({ ...prev, locationLink: link }));
      setShowMapPicker(false);
    }
  };

  const filteredCenters = useMemo(() => {
    const lowerQuery = searchQuery.toLowerCase();
    return centers.filter(c => 
      c.name.toLowerCase().includes(lowerQuery) ||
      c.centerNumber.includes(searchQuery) ||
      c.importantPersons.some(p => p.name.toLowerCase().includes(lowerQuery) || p.mobile.includes(searchQuery))
    );
  }, [searchQuery, centers]);

  const syncCentralData = async () => {
    setIsSyncing(true);
    // Simulate central sync
    setTimeout(() => {
      setIsSyncing(false);
      showModal({ title: 'সফল', message: 'কেন্দ্রীয় সার্ভারের সাথে ডাটা সিঙ্ক সফল হয়েছে।', type: 'SUCCESS' });
    }, 2000);
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
  };

  const getMapEmbedUrl = (link: string) => {
    const match = link?.match(/q=([\d.]+),([\d.]+)/);
    return match ? `https://maps.google.com/maps?q=${match[1]},${match[2]}&hl=bn&z=15&output=embed` : null;
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 p-6">
        <div className="max-w-sm w-full bg-white rounded-3xl shadow-xl p-10 text-center animate-fadeIn">
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
    <div className="min-h-screen flex flex-col bg-[#fdfdfd] text-[#1a202c]">
      {/* Header */}
      <header className="bg-army-green text-white px-6 py-5 sticky top-0 z-50 border-b border-white/10 shadow-sm">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <button onClick={() => setIsSidebarOpen(true)} className="p-2 -ml-2 hover:bg-white/10 rounded-lg">
            <Bars3Icon className="h-6 w-6" />
          </button>
          <div className="text-center">
            <h1 className="text-lg font-bold leading-tight">ইপিজেড আর্মি ক্যাম্প</h1>
            <p className="text-[10px] opacity-70 uppercase tracking-widest font-medium">ত্রোয়োদশ জাতীয় সংসদ নির্বাচন ২০২৬</p>
          </div>
          <button onClick={() => setShowSOS(true)} className="bg-red-600 p-2.5 rounded-xl shadow-lg active:scale-95 transition-all">
            <MegaphoneIcon className="h-6 w-6" />
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-4xl mx-auto w-full p-6 pb-24 md:pb-12">
        {view === 'HOME' && (
          <div className="space-y-8 animate-fadeIn">
            <div className="relative group">
              <MagnifyingGlassIcon className="h-6 w-6 absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-army-green transition-colors" />
              <input 
                type="text" 
                placeholder="ভোট কেন্দ্র বা সদস্য খুঁজুন..." 
                className="w-full pl-14 pr-6 py-5 rounded-2xl border border-slate-200 bg-white shadow-sm outline-none focus:border-army-green transition-all font-medium text-lg placeholder:text-slate-300"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <h2 className="col-span-full text-xs font-bold text-slate-400 uppercase tracking-widest px-2 mb-2 flex items-center gap-2">
                <BuildingOfficeIcon className="h-4 w-4" /> কেন্দ্রের তালিকা ({toBengaliDigits(filteredCenters.length)})
              </h2>
              {filteredCenters.map(c => (
                <button 
                  key={c.id} 
                  onClick={() => { setSelectedCenter(c); setView('CENTER_DETAILS'); }}
                  className="bg-white border border-slate-100 p-6 rounded-2xl flex items-center gap-5 text-left group hover:border-army-green/30 hover:shadow-md transition-all active:scale-[0.98]"
                >
                  <div className="bg-slate-50 text-army-green font-black w-12 h-12 flex items-center justify-center rounded-xl text-xl border border-slate-100 group-hover:bg-army-green group-hover:text-white transition-colors">
                    {c.centerNumber}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-slate-800 text-lg leading-tight">{c.name}</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1.5 flex items-center gap-1">
                      বিস্তারিত দেখুন <ArrowLeftIcon className="h-3 w-3 rotate-180" />
                    </p>
                  </div>
                </button>
              ))}
              {filteredCenters.length === 0 && (
                <div className="col-span-full py-20 text-center text-slate-300 font-medium">কোন তথ্য পাওয়া যায়নি</div>
              )}
            </div>
          </div>
        )}

        {view === 'CENTER_DETAILS' && selectedCenter && (
          <div className="animate-fadeIn space-y-6">
            <button onClick={goBack} className="flex items-center gap-2 text-slate-500 font-bold text-sm mb-4 hover:text-army-green transition-colors">
              <ArrowLeftIcon className="h-4 w-4" /> ফিরে যান
            </button>
            <div className="bg-white rounded-3xl border border-slate-200 p-8 md:p-12 text-center shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1.5 bg-army-green opacity-20"></div>
              <div className="inline-block bg-slate-50 text-army-green px-4 py-1.5 rounded-full text-[11px] font-bold mb-6 border border-slate-100 uppercase tracking-widest">
                কেন্দ্র নং {selectedCenter.centerNumber}
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-10 leading-tight text-slate-900">{selectedCenter.name}</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <button onClick={() => setView('CENTER_INFO')} className="flex flex-col items-center gap-4 p-8 rounded-2xl bg-slate-50 hover:bg-slate-100 transition-all font-bold text-slate-700 border border-slate-100">
                  <div className="bg-white p-4 rounded-xl shadow-sm text-army-green border border-slate-100"><InformationCircleIcon className="h-7 w-7" /></div>
                  ভোটকেন্দ্রের তথ্যাদি
                </button>
                <a href={selectedCenter.locationLink} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-4 p-8 rounded-2xl bg-slate-50 hover:bg-slate-100 transition-all font-bold text-slate-700 border border-slate-100">
                  <div className="bg-white p-4 rounded-xl shadow-sm text-army-green border border-slate-100"><MapPinIcon className="h-7 w-7" /></div>
                  অবস্থান (গুগল ম্যাপ)
                </a>
                <button onClick={() => setView('PERSONS')} className="flex flex-col items-center gap-4 p-8 rounded-2xl bg-slate-50 hover:bg-slate-100 transition-all font-bold text-slate-700 border border-slate-100">
                  <div className="bg-white p-4 rounded-xl shadow-sm text-army-green border border-slate-100"><UserGroupIcon className="h-7 w-7" /></div>
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
            <div className="bg-white p-10 rounded-3xl border border-slate-200 space-y-8 shadow-sm">
              <h3 className="text-2xl font-bold text-slate-900 border-b pb-6 flex items-center gap-3">
                <InboxStackIcon className="h-7 w-7 text-army-green" /> কেন্দ্র পরিচিতি
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-5 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-slate-500 font-bold text-sm uppercase tracking-wide">ভোট কক্ষ সংখ্যা</span>
                  <span className="font-bold text-2xl text-army-green">{toBengaliDigits(selectedCenter.boothCount)} টি</span>
                </div>
                <div className="flex justify-between items-center p-5 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-slate-500 font-bold text-sm uppercase tracking-wide">মোট ভোটার</span>
                  <span className="font-bold text-2xl text-army-green">{toBengaliDigits(selectedCenter.voterCount)} জন</span>
                </div>
                <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-slate-500 font-bold text-[11px] uppercase tracking-widest block mb-3">অবস্থান ও তলা</span>
                  <span className="font-bold text-slate-800 leading-relaxed text-lg">{selectedCenter.roomLocation}</span>
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
            <div className="space-y-4">
              {selectedCenter.importantPersons.map(p => (
                <div key={p.id} className="bg-white p-7 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-6 shadow-sm group">
                  <div className="flex-1">
                    <h4 className="font-bold text-2xl text-slate-900 group-hover:text-army-green transition-colors">{p.name}</h4>
                    <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-1.5">{p.designation}</p>
                    <div className="mt-4 flex items-center gap-2 text-army-green font-bold text-xl">
                      <PhoneIcon className="h-5 w-5 opacity-40" /> {p.mobile}
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <a href={`tel:${p.mobile}`} className="flex-1 sm:flex-none flex items-center justify-center gap-3 bg-army-green text-white font-bold px-8 py-4 rounded-xl hover:bg-army-green/90 transition-all shadow-md active:scale-95">
                      <PhoneIcon className="h-5 w-5" /> কল
                    </a>
                    <a href={`https://wa.me/${p.mobile.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" className="flex-1 sm:flex-none flex items-center justify-center gap-3 bg-emerald-600 text-white font-bold px-8 py-4 rounded-xl hover:bg-emerald-700 transition-all shadow-md active:scale-95">
                      <ChatBubbleLeftRightIcon className="h-5 w-5" /> মেসেজ
                    </a>
                  </div>
                </div>
              ))}
              {selectedCenter.importantPersons.length === 0 && (
                <div className="py-20 text-center text-slate-400 font-medium italic">কোন কর্মকর্তাদের তথ্য যোগ করা হয়নি</div>
              )}
            </div>
          </div>
        )}

        {view === 'ADMIN_LOGIN' && (
          <div className="max-w-sm mx-auto mt-20 bg-white p-12 rounded-[40px] border border-slate-200 shadow-xl animate-fadeIn text-center">
             <div className="bg-slate-50 w-20 h-20 rounded-3xl mx-auto mb-8 flex items-center justify-center border border-slate-100">
                <Cog6ToothIcon className="h-10 w-10 text-army-green" />
             </div>
             <h2 className="text-2xl font-bold mb-10 text-slate-900">অ্যাডমিন প্রবেশ</h2>
             <form onSubmit={handleAdminLogin} className="space-y-6">
               <input 
                 type="password" 
                 placeholder="পিন কোড দিন" 
                 className="w-full px-6 py-5 rounded-2xl border border-slate-200 focus:border-army-green outline-none text-center font-bold tracking-[0.5em] text-2xl bg-slate-50" 
                 value={inputAdminPassword} 
                 autoFocus
                 onChange={e => setInputAdminPassword(e.target.value)} 
               />
               {adminError && <p className="text-red-500 text-sm font-bold animate-pulse">{adminError}</p>}
               <button type="submit" className="w-full bg-army-green text-white py-5 rounded-2xl font-bold text-lg shadow-lg hover:shadow-army-green/20 active:scale-95 transition-all">লগইন</button>
             </form>
          </div>
        )}

        {view === 'ADMIN' && (
          <div className="space-y-8 animate-fadeIn pb-20">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold text-slate-900 tracking-tight">অ্যাডমিন প্যানেল</h2>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">সিস্টেম কন্ট্রোল সেন্টার</p>
              </div>
              <button onClick={syncCentralData} disabled={isSyncing} className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all border ${isSyncing ? 'bg-slate-100 text-slate-400' : 'bg-white border-slate-200 text-army-green hover:bg-slate-50'}`}>
                <ArrowDownTrayIcon className={`h-5 w-5 ${isSyncing ? 'animate-bounce' : ''}`} /> {isSyncing ? 'সিঙ্ক হচ্ছে...' : 'সার্ভার সিঙ্ক'}
              </button>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-2">মোট কেন্দ্র</p>
                <p className="text-4xl font-black text-slate-900">{toBengaliDigits(centers.length)}</p>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-2">মোট জনবল</p>
                <p className="text-4xl font-black text-slate-900">{toBengaliDigits(centers.reduce((a,b) => a + b.importantPersons.length, 0))}</p>
              </div>
            </div>

            <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-bold text-slate-800 flex items-center gap-3">
                  <MegaphoneIcon className="h-6 w-6 text-red-600" /> জরুরী যোগাযোগ সেটিংস
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-2">নাম</label>
                  <input placeholder="উদাঃ ক্যাম্প কমান্ডার" className="w-full p-4 rounded-xl border border-slate-100 font-bold focus:border-red-600 outline-none transition-all" value={tempEmergency.name} onChange={e => setTempEmergency({...tempEmergency, name: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-2">মোবাইল নম্বর</label>
                  <input placeholder="মোবাইল নম্বর" className="w-full p-4 rounded-xl border border-slate-100 font-bold focus:border-red-600 outline-none transition-all" value={tempEmergency.mobile} onChange={e => setTempEmergency({...tempEmergency, mobile: e.target.value})} />
                </div>
              </div>
              <button onClick={() => { setEmergencyContact(tempEmergency); showModal({ title: 'সফল', message: 'জরুরী যোগাযোগ নম্বর আপডেট করা হয়েছে।', type: 'SUCCESS' }); }} className="w-full bg-red-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-red-600/10 active:scale-95 transition-all">সংরক্ষণ করুন</button>
            </div>

            <div className="flex items-center justify-between pt-10">
              <h3 className="text-xl font-bold text-slate-800">ভোট কেন্দ্র পরিচালনা</h3>
              <button onClick={() => startEdit()} className="bg-army-green text-white px-8 py-4 rounded-2xl font-bold flex items-center gap-2 shadow-lg shadow-army-green/10 active:scale-95 transition-all text-sm">
                <PlusIcon className="h-6 w-6" /> নতুন কেন্দ্র যোগ করুন
              </button>
            </div>

            <div className="space-y-3">
              {centers.map(c => (
                <div key={c.id} className="bg-white p-6 rounded-2xl border border-slate-200 flex items-center justify-between group hover:border-army-green/20 transition-all">
                  <div className="flex items-center gap-4">
                    <span className="bg-slate-50 text-army-green font-black w-10 h-10 flex items-center justify-center rounded-xl text-lg border border-slate-100">{c.centerNumber}</span>
                    <span className="font-bold text-lg text-slate-700">{c.name}</span>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => startEdit(c)} className="p-3 bg-slate-50 text-army-green rounded-xl hover:bg-army-green hover:text-white transition-all"><PencilSquareIcon className="h-5 w-5" /></button>
                    <button onClick={() => { setCenters(prev => prev.filter(x => x.id !== c.id)); showModal({ title: 'মুছে ফেলা হয়েছে', message: 'কেন্দ্রটি তালিকা থেকে বাদ দেওয়া হয়েছে।', type: 'SUCCESS' }); }} className="p-3 bg-red-50 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition-all"><TrashIcon className="h-5 w-5" /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {view === 'SETTINGS' && (
          <div className="max-w-lg mx-auto animate-fadeIn space-y-6">
            <button onClick={goBack} className="flex items-center gap-2 text-slate-500 font-bold text-sm mb-4">
              <ArrowLeftIcon className="h-4 w-4" /> ফিরে যান
            </button>
            
            <div className="bg-white p-10 rounded-[32px] border border-slate-200 shadow-sm space-y-10">
              <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                <KeyIcon className="h-7 w-7 text-army-green" /> পাসওয়ার্ড পরিবর্তন
              </h2>
              
              <div className="space-y-8">
                <div className="space-y-4">
                  <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-2">ইউজার পাসওয়ার্ড</p>
                  <input 
                    type="password" 
                    placeholder="নতুন ইউজার পাসওয়ার্ড" 
                    className="w-full px-6 py-4 rounded-2xl border border-slate-100 bg-slate-50 font-bold text-center tracking-[0.2em]" 
                    value={newUserPass}
                    onChange={e => setNewUserPass(e.target.value)}
                  />
                  <button 
                    onClick={() => { if(!newUserPass) return; setUserPassword(newUserPass); setNewUserPass(''); showModal({ title: 'সফল', message: 'ইউজার পাসওয়ার্ড পরিবর্তিত হয়েছে।', type: 'SUCCESS' }); }}
                    className="w-full bg-army-green text-white py-4 rounded-2xl font-bold shadow-md active:scale-95 transition-all"
                  >
                    ইউজার পাসওয়ার্ড আপডেট করুন
                  </button>
                </div>

                <div className="h-px bg-slate-100 w-full"></div>

                <div className="space-y-4">
                  <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-2">অ্যাডমিন পিন কোড</p>
                  <input 
                    type="password" 
                    placeholder="নতুন অ্যাডমিন পিন" 
                    className="w-full px-6 py-4 rounded-2xl border border-slate-100 bg-slate-50 font-bold text-center tracking-[0.4em]" 
                    value={newAdminPass}
                    onChange={e => setNewAdminPass(e.target.value)}
                  />
                  <button 
                    onClick={() => { if(!newAdminPass) return; setAdminPassword(newAdminPass); setNewAdminPass(''); showModal({ title: 'সফল', message: 'অ্যাডমিন পিন কোড পরিবর্তিত হয়েছে।', type: 'SUCCESS' }); }}
                    className="w-full bg-slate-800 text-white py-4 rounded-2xl font-bold shadow-md active:scale-95 transition-all"
                  >
                    অ্যাডমিন পিন আপডেট করুন
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {view === 'EDIT_CENTER' && (
          <div className="max-w-2xl mx-auto pb-20 animate-fadeIn">
            <h2 className="text-2xl font-bold mb-10 text-slate-900">কেন্দ্র সম্পাদনা (নং {editCenter.centerNumber})</h2>
            <div className="bg-white p-10 rounded-[40px] border border-slate-200 space-y-8 shadow-xl">
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-2">কেন্দ্রের নাম</label>
                  <input placeholder="কেন্দ্রের নাম" className="w-full p-5 rounded-2xl border border-slate-100 font-bold bg-slate-50 focus:border-army-green outline-none transition-all" value={editCenter.name} onChange={e => setEditCenter({...editCenter, name: e.target.value})} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-2">কক্ষ সংখ্যা</label>
                    <input placeholder="কক্ষ সংখ্যা" className="w-full p-5 rounded-2xl border border-slate-100 font-bold bg-slate-50 focus:border-army-green outline-none" value={editCenter.boothCount} onChange={e => setEditCenter({...editCenter, boothCount: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-2">মোট ভোটার</label>
                    <input placeholder="মোট ভোটার" className="w-full p-5 rounded-2xl border border-slate-100 font-bold bg-slate-50 focus:border-army-green outline-none" value={editCenter.voterCount} onChange={e => setEditCenter({...editCenter, voterCount: e.target.value})} />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-2">অবস্থান বর্ণনা</label>
                  <input placeholder="অবস্থান ও তলা" className="w-full p-5 rounded-2xl border border-slate-100 font-bold bg-slate-50 focus:border-army-green outline-none" value={editCenter.roomLocation} onChange={e => setEditCenter({...editCenter, roomLocation: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-2">গুগল ম্যাপ লিংক</label>
                  <div className="flex gap-3">
                    <input placeholder="গুগল ম্যাপ লিংক" className="flex-1 p-5 rounded-2xl border border-slate-100 font-mono text-xs bg-slate-50 outline-none" value={editCenter.locationLink} onChange={e => setEditCenter({...editCenter, locationLink: e.target.value})} />
                    <button onClick={() => setShowMapPicker(true)} className="bg-army-green text-white p-5 rounded-2xl shadow-lg active:scale-95 transition-all"><MapIcon className="h-6 w-6" /></button>
                  </div>
                </div>
              </div>

              <div className="pt-10 border-t border-slate-100">
                <div className="flex items-center justify-between mb-8">
                  <h4 className="font-bold text-lg text-slate-800">কর্মকর্তাদের তথ্য</h4>
                  <button onClick={() => setEditCenter(prev => ({ ...prev, importantPersons: [...(prev.importantPersons || []), { id: Date.now().toString(), name: '', designation: '', mobile: '' }] }))} className="text-xs font-black text-army-green bg-slate-50 px-5 py-2.5 rounded-xl border border-slate-100 active:scale-95 transition-all">সদস্য যোগ করুন</button>
                </div>
                <div className="space-y-4">
                  {editCenter.importantPersons?.map(p => (
                    <div key={p.id} className="p-6 bg-slate-50 rounded-2xl relative border border-slate-100 group">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <input placeholder="নাম" className="p-4 rounded-xl border border-slate-100 bg-white font-bold outline-none" value={p.name} onChange={e => setEditCenter(prev => ({ ...prev, importantPersons: prev.importantPersons?.map(x => x.id === p.id ? { ...x, name: e.target.value } : x) }))} />
                        <input placeholder="পদবী" className="p-4 rounded-xl border border-slate-100 bg-white font-bold outline-none" value={p.designation} onChange={e => setEditCenter(prev => ({ ...prev, importantPersons: prev.importantPersons?.map(x => x.id === p.id ? { ...x, designation: e.target.value } : x) }))} />
                        <input placeholder="মোবাইল নম্বর" className="p-4 rounded-xl border border-slate-100 bg-white font-bold outline-none col-span-full" value={p.mobile} onChange={e => setEditCenter(prev => ({ ...prev, importantPersons: prev.importantPersons?.map(x => x.id === p.id ? { ...x, mobile: e.target.value } : x) }))} />
                      </div>
                      <button onClick={() => setEditCenter(prev => ({ ...prev, importantPersons: prev.importantPersons?.filter(x => x.id !== p.id) }))} className="absolute -top-3 -right-3 bg-white text-red-500 p-2.5 rounded-full border border-slate-100 shadow-sm opacity-0 group-hover:opacity-100 transition-all active:scale-90">
                        <XMarkIcon className="h-5 w-5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-4 pt-12">
                <button onClick={() => setView('ADMIN')} className="flex-1 py-5 bg-slate-100 text-slate-600 rounded-2xl font-bold active:scale-95 transition-all">বাতিল</button>
                <button onClick={saveCenter} className="flex-1 py-5 bg-army-green text-white rounded-2xl font-bold shadow-xl active:scale-95 transition-all">তথ্য সংরক্ষণ করুন</button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Bottom Nav for Mobile */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-slate-100 flex justify-around items-center h-20 z-50 md:hidden px-6 shadow-[0_-10px_30px_rgba(0,0,0,0.05)] rounded-t-3xl">
        <button onClick={goBack} className="flex flex-col items-center gap-1.5 text-slate-400 active:text-army-green transition-all">
          <ArrowLeftIcon className="h-6 w-6" />
          <span className="text-[9px] font-black uppercase tracking-[0.15em]">পিছনে</span>
        </button>
        <button onClick={goHome} className="flex flex-col items-center bg-army-green text-white p-4 -mt-12 rounded-[24px] shadow-2xl border-8 border-[#fdfdfd] active:scale-90 transition-all">
          <HomeIcon className="h-7 w-7" />
        </button>
        <button onClick={() => setIsSidebarOpen(true)} className="flex flex-col items-center gap-1.5 text-slate-400 active:text-army-green transition-all">
          <Bars3Icon className="h-6 w-6" />
          <span className="text-[9px] font-black uppercase tracking-[0.15em]">মেনু</span>
        </button>
      </nav>

      {/* SOS Modal Overlay */}
      {showSOS && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md animate-fadeIn" onClick={() => setShowSOS(false)}>
          <div className="bg-white w-full max-w-sm rounded-[48px] overflow-hidden shadow-2xl animate-pop" onClick={e => e.stopPropagation()}>
            <div className="bg-red-600 p-14 text-center text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10"><MegaphoneIcon className="h-40 w-40" /></div>
              <MegaphoneIcon className="h-20 w-20 mx-auto mb-8 animate-bounce relative z-10" />
              <h2 className="text-3xl font-black mb-1 relative z-10 tracking-tight">জরুরী সাহায্য</h2>
              <p className="text-[10px] opacity-70 uppercase tracking-[0.4em] font-black relative z-10">ক্যাম্প সরাসরি যোগাযোগ</p>
            </div>
            <div className="p-10 space-y-6">
               <div className="bg-slate-50 p-8 rounded-[32px] border border-slate-100 text-center">
                  <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3">{emergencyContact.name}</p>
                  <p className="font-black text-3xl text-slate-900 mb-8 tracking-tight">{emergencyContact.mobile}</p>
                  <div className="flex gap-4">
                    <a href={`tel:${emergencyContact.mobile}`} className="flex-1 bg-red-600 text-white p-5 rounded-2xl flex items-center justify-center shadow-lg active:scale-95 transition-all">
                      <PhoneIcon className="h-7 w-7" />
                    </a>
                    <a href={`https://wa.me/${emergencyContact.mobile.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" className="flex-1 bg-emerald-600 text-white p-5 rounded-2xl flex items-center justify-center shadow-lg active:scale-95 transition-all">
                      <ChatBubbleLeftRightIcon className="h-7 w-7" />
                    </a>
                  </div>
               </div>
               <button onClick={() => setShowSOS(false)} className="w-full py-4 text-slate-400 font-bold uppercase tracking-widest text-[10px] hover:text-slate-600 transition-colors">বন্ধ করুন</button>
            </div>
          </div>
        </div>
      )}

      {/* Map Picker Modal */}
      {showMapPicker && (
        <div className="fixed inset-0 z-[600] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white w-full max-w-2xl rounded-[40px] overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-6 bg-army-green text-white flex justify-between items-center border-b border-white/10">
                <h3 className="font-bold text-xl flex items-center gap-3"><MapPinIcon className="h-6 w-6 text-army-gold" /> ম্যাপ থেকে অবস্থান নির্ধারণ</h3>
                <button onClick={() => setShowMapPicker(false)} className="hover:rotate-90 transition-transform p-2"><XMarkIcon className="h-6 w-6" /></button>
            </div>
            <div className="p-6 bg-slate-50 border-b border-slate-200">
               <form onSubmit={handleMapSearch} className="flex gap-3">
                 <input type="text" className="flex-1 px-6 py-4 rounded-2xl border border-slate-200 shadow-sm font-bold text-sm focus:border-army-green outline-none" placeholder="জায়গার নাম লিখে খুঁজুন..." value={mapSearchTerm} onChange={e => setMapSearchTerm(e.target.value)} />
                 <button type="submit" className="bg-army-gold text-army-green px-8 py-4 rounded-2xl font-black shadow-md active:scale-95 transition-all">খুঁজুন</button>
               </form>
            </div>
            <div ref={mapContainerRef} className="flex-1 w-full min-h-[400px]"></div>
            <div className="p-8 bg-white border-t border-slate-100 flex gap-4">
              <button onClick={() => setShowMapPicker(false)} className="flex-1 py-5 bg-slate-100 text-slate-500 rounded-2xl font-bold active:scale-95 transition-all">বাতিল</button>
              <button onClick={handleMapConfirm} className="flex-1 py-5 bg-army-green text-white rounded-2xl font-bold shadow-xl active:scale-95 transition-all">অবস্থান নিশ্চিত করুন</button>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar Drawer */}
      <div className={`fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[200] transition-opacity duration-300 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={() => setIsSidebarOpen(false)}>
        <aside className={`fixed top-0 left-0 h-full w-80 bg-white shadow-2xl transition-transform duration-500 ease-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`} onClick={e => e.stopPropagation()}>
          <div className="p-10 bg-army-green text-white relative overflow-hidden h-60 flex flex-col justify-end">
            <div className="absolute top-0 left-0 p-4 opacity-5"><ShieldCheckIcon className="h-60 w-60" /></div>
            <div className="relative z-10">
              <div className="bg-white/10 p-4 rounded-2xl inline-block mb-6 border border-white/20 backdrop-blur-md">
                <ShieldCheckIcon className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold tracking-tight">ইপিজেড আর্মি ক্যাম্প</h2>
              <p className="text-[10px] opacity-60 font-black uppercase tracking-[0.3em] mt-1">Version 5.2 • Centralized</p>
            </div>
          </div>
          <nav className="p-6 space-y-2">
            <button onClick={goHome} className={`flex items-center gap-5 w-full p-5 rounded-2xl transition-all ${view === 'HOME' ? 'bg-army-green text-white font-bold shadow-lg shadow-army-green/20' : 'text-slate-600 hover:bg-slate-50 font-bold'}`}>
              <HomeIcon className="h-6 w-6" /> মূল পাতা
            </button>
            <button onClick={() => { isAdminLoggedIn ? setView('ADMIN') : setView('ADMIN_LOGIN'); setIsSidebarOpen(false); }} className={`flex items-center gap-5 w-full p-5 rounded-2xl transition-all ${view === 'ADMIN' ? 'bg-army-green text-white font-bold shadow-lg' : 'text-slate-600 hover:bg-slate-50 font-bold'}`}>
              <Cog6ToothIcon className="h-6 w-6" /> অ্যাডমিন কন্ট্রোল
            </button>
            <button onClick={() => { setView('SETTINGS'); setIsSidebarOpen(false); }} className={`flex items-center gap-5 w-full p-5 rounded-2xl transition-all ${view === 'SETTINGS' ? 'bg-army-green text-white font-bold shadow-lg' : 'text-slate-600 hover:bg-slate-50 font-bold'}`}>
              <KeyIcon className="h-6 w-6" /> পাসওয়ার্ড পরিবর্তন
            </button>
            
            <div className="h-px bg-slate-100 my-8 mx-4"></div>
            
            <button onClick={handleLogout} className="flex items-center gap-5 w-full p-5 rounded-2xl text-red-500 hover:bg-red-50 transition-all font-bold group">
              <ArrowRightOnRectangleIcon className="h-6 w-6 group-hover:translate-x-1 transition-transform" /> লগআউট
            </button>
          </nav>
        </aside>
      </div>

      {/* Alerts Modal */}
      {modal.isOpen && (
        <div className="fixed inset-0 z-[3000] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white w-full max-w-xs rounded-[40px] p-10 text-center animate-pop border border-slate-100 shadow-2xl">
            <div className="mb-6 flex justify-center">
              {modal.type === 'SUCCESS' && <CheckCircleIcon className="h-16 w-16 text-emerald-500" />}
              {modal.type === 'WARNING' && <ExclamationCircleIcon className="h-16 w-16 text-amber-500" />}
              {modal.type === 'DANGER' && <ExclamationCircleIcon className="h-16 w-16 text-red-500" />}
              {modal.type === 'INFO' && <InformationCircleIcon className="h-16 w-16 text-blue-500" />}
            </div>
            <h3 className="text-2xl font-black mb-3 text-slate-900">{modal.title}</h3>
            <p className="text-slate-500 font-medium mb-10 leading-relaxed text-sm">{modal.message}</p>
            <button onClick={modal.onClose} className="w-full bg-army-green text-white py-5 rounded-2xl font-bold shadow-lg active:scale-95 transition-all text-lg">ঠিক আছে</button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fadeIn { animation: fadeIn 0.4s ease-out forwards; }
        @keyframes pop { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        .animate-pop { animation: pop 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
        * { -webkit-tap-highlight-color: transparent; }
        body { font-family: 'Hind Siliguri', sans-serif; background-color: #fdfdfd; }
        input::placeholder { color: #cbd5e0; font-weight: 500; tracking: normal; }
      `}</style>
    </div>
  );
};

export default App;
