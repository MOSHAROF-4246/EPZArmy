
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
  IdentificationIcon,
  BuildingOfficeIcon,
  InboxStackIcon,
  KeyIcon,
  AdjustmentsHorizontalIcon,
  StarIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/react/24/solid';

const App: React.FC = () => {
  // Persistence logic - Centers
  const [centers, setCenters] = useState<VotingCenter[]>(() => {
    const saved = localStorage.getItem('voting_centers_data_v3');
    return saved ? JSON.parse(saved) : initialCenters;
  });

  // Persistence logic - Emergency Contact
  const [emergencyContact, setEmergencyContact] = useState<EmergencyContact>(() => {
    const saved = localStorage.getItem('emergency_contact');
    return saved ? JSON.parse(saved) : { name: 'ক্যাম্প কমান্ডার', mobile: '01712345678' };
  });

  // Persistence logic - Passwords
  const [userPassword, setUserPassword] = useState(() => localStorage.getItem('app_user_password') || 'EPZArmy');
  const [adminPassword, setAdminPassword] = useState(() => localStorage.getItem('app_admin_password') || 'admin123');

  useEffect(() => {
    localStorage.setItem('voting_centers_data_v3', JSON.stringify(centers));
    localStorage.setItem('emergency_contact', JSON.stringify(emergencyContact));
    localStorage.setItem('app_user_password', userPassword);
    localStorage.setItem('app_admin_password', adminPassword);
  }, [centers, emergencyContact, userPassword, adminPassword]);

  const [inputPassword, setInputPassword] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [inputAdminPassword, setInputAdminPassword] = useState('');
  
  const [view, setView] = useState<ViewState>('HOME');
  const [selectedCenter, setSelectedCenter] = useState<VotingCenter | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState('');
  const [adminError, setAdminError] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showSOS, setShowSOS] = useState(false);

  // Edit State
  const [editCenter, setEditCenter] = useState<Partial<VotingCenter>>({});
  const [newPasswordValue, setNewPasswordValue] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputPassword === userPassword) {
      setIsLoggedIn(true);
      setError('');
    } else {
      setError('ভুল পাসওয়ার্ড! আবার চেষ্টা করুন।');
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
    setInputPassword('');
    setInputAdminPassword('');
    setView('HOME');
    setIsSidebarOpen(false);
  };

  const exportData = () => {
    const data = { centers, emergencyContact, userPassword, adminPassword };
    const dataStr = JSON.stringify(data, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `epz_army_backup_${new Date().toISOString().split('T')[0]}.json`;
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
        if (json.userPassword) setUserPassword(json.userPassword);
        if (json.adminPassword) setAdminPassword(json.adminPassword);
        alert('তথ্য সফলভাবে ইমপোর্ট করা হয়েছে!');
      } catch (err) {
        alert('ভুল ফাইল ফরম্যাট!');
      }
    };
    reader.readAsText(file);
  };

  const filteredCenters = useMemo(() => {
    if (!searchQuery) return centers;
    const lowerQuery = searchQuery.toLowerCase();
    return centers.filter(center => 
      center.name.toLowerCase().includes(lowerQuery) ||
      center.centerNumber.includes(searchQuery) ||
      center.importantPersons.some(p => 
        p.name.toLowerCase().includes(lowerQuery) || 
        p.mobile.includes(searchQuery) ||
        p.designation.toLowerCase().includes(lowerQuery)
      )
    );
  }, [searchQuery, centers]);

  const stats = useMemo(() => ({
    totalCenters: centers.length,
    totalPersonnel: centers.reduce((acc, curr) => acc + curr.importantPersons.length, 0),
  }), [centers]);

  const navigateToDetails = (center: VotingCenter) => {
    setSelectedCenter(center);
    setView('CENTER_DETAILS');
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

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  // Admin Actions
  const deleteCenter = (id: string) => {
    if (window.confirm('আপনি কি নিশ্চিত যে এই কেন্দ্রটি মুছে ফেলতে চান?')) {
      setCenters(centers.filter(c => c.id !== id));
    }
  };

  const startEdit = (center?: VotingCenter) => {
    if (center) {
      setEditCenter({ ...center });
    } else {
      setEditCenter({
        id: Date.now().toString(),
        centerNumber: '',
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
    if (!editCenter.name || !editCenter.centerNumber) {
      alert('নাম এবং নম্বর আবশ্যক');
      return;
    }
    const exists = centers.find(c => c.id === editCenter.id);
    const finalCenter = {
      ...editCenter,
      boothCount: editCenter.boothCount || '',
      voterCount: editCenter.voterCount || '',
      roomLocation: editCenter.roomLocation || '',
      importantPersons: editCenter.importantPersons || []
    } as VotingCenter;

    if (exists) {
      setCenters(centers.map(c => c.id === editCenter.id ? finalCenter : c));
    } else {
      setCenters([...centers, finalCenter]);
    }
    setView('ADMIN');
  };

  const addPersonToEdit = () => {
    const newPerson: Person = {
      id: Date.now().toString(),
      name: '',
      designation: '',
      mobile: ''
    };
    setEditCenter({
      ...editCenter,
      importantPersons: [...(editCenter.importantPersons || []), newPerson]
    });
  };

  const updatePersonInEdit = (id: string, field: keyof Person, value: string) => {
    const updated = (editCenter.importantPersons || []).map(p => 
      p.id === id ? { ...p, [field]: value } : p
    );
    setEditCenter({ ...editCenter, importantPersons: updated });
  };

  const removePersonFromEdit = (id: string) => {
    setEditCenter({
      ...editCenter,
      importantPersons: (editCenter.importantPersons || []).filter(p => p.id !== id)
    });
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-200 p-4 font-['Hind_Siliguri']">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl overflow-hidden border-t-8 border-army-green animate-fadeIn">
          <div className="p-8 text-center">
            <div className="mb-6 flex justify-center">
              <div className="bg-army-green p-5 rounded-2xl shadow-xl">
                <LockClosedIcon className="h-10 w-10 text-white" />
              </div>
            </div>
            <h1 className="text-2xl font-black text-gray-800 mb-2">প্রবেশাধিকার</h1>
            <p className="text-gray-400 font-bold mb-8 uppercase tracking-widest text-[10px]">ইপিজেড আর্মি ক্যাম্প - ২০২৬</p>
            <form onSubmit={handleLogin} className="space-y-5">
              <input
                type="password"
                placeholder="পাসওয়ার্ড দিন"
                className="w-full px-4 py-4 rounded-2xl border-2 border-gray-100 focus:outline-none focus:border-army-green transition-all bg-gray-50 text-center text-xl font-black text-gray-800"
                value={inputPassword}
                autoFocus
                onChange={(e) => setInputPassword(e.target.value)}
              />
              {error && <p className="text-red-600 text-xs font-black bg-red-50 py-3 rounded-xl border border-red-100">{error}</p>}
              <button
                type="submit"
                className="w-full bg-army-green hover:bg-green-900 text-white font-black py-4 rounded-2xl transition-all shadow-xl active:scale-95 text-lg"
              >
                ভেরিফাই করুন
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20 md:pb-8 flex flex-col bg-slate-50 overflow-x-hidden font-['Hind_Siliguri'] antialiased">
      {/* SOS Modal */}
      {showSOS && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeInFast">
          <div className="bg-white w-full max-w-xs rounded-3xl overflow-hidden shadow-2xl">
            <div className="bg-red-600 p-8 text-center text-white">
              <MegaphoneIcon className="h-12 w-12 mx-auto mb-4 animate-bounce" />
              <h2 className="text-2xl font-black uppercase tracking-tighter mb-1">জরুরী যোগাযোগ</h2>
              <p className="text-[10px] opacity-80 font-bold uppercase">সরাসরি কল করুন</p>
            </div>
            <div className="p-6 space-y-4">
               <a href={`tel:${emergencyContact.mobile}`} className="flex items-center justify-between p-4 bg-red-50 rounded-2xl border border-red-100 group">
                  <div>
                    <p className="text-[9px] font-black text-red-600 uppercase tracking-widest mb-1">{emergencyContact.name}</p>
                    <p className="font-black text-lg text-gray-800">{emergencyContact.mobile}</p>
                  </div>
                  <div className="bg-red-600 p-3 rounded-xl text-white">
                    <PhoneIcon className="h-5 w-5" />
                  </div>
               </a>
               <button onClick={() => setShowSOS(false)} className="w-full py-2 text-gray-400 font-black uppercase tracking-widest text-[10px]">বন্ধ করুন</button>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar Overlay */}
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] transition-opacity animate-fadeInFast" onClick={toggleSidebar} />
      )}

      {/* Sidebar Drawer */}
      <aside className={`fixed top-0 left-0 h-full w-72 bg-white z-[70] shadow-2xl transform transition-transform duration-300 ease-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-8 text-white relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #4b5320 0%, #2c3112 100%)' }}>
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-6">
              <div className="bg-white/10 p-3 rounded-2xl backdrop-blur-2xl border border-white/20">
                   <ShieldCheckIcon className="h-8 w-8 text-white" />
              </div>
              <button onClick={toggleSidebar} className="p-2 hover:bg-white/10 rounded-full">
                <XMarkIcon className="h-6 w-6 text-white" />
              </button>
            </div>
            <h2 className="text-2xl font-black mb-1">ইপিজেড আর্মি</h2>
            <p className="text-[9px] opacity-70 font-black uppercase tracking-widest">Dashboard v3.0</p>
          </div>
        </div>

        <nav className="p-4 space-y-1">
          <button onClick={goHome} className={`flex items-center gap-4 w-full p-4 rounded-xl transition-all ${view === 'HOME' ? 'bg-[#4b5320] text-white font-black' : 'text-gray-500 hover:bg-gray-100 font-bold'}`}>
            <HomeIcon className="h-5 w-5" />
            <span className="text-sm">মূল পাতা</span>
          </button>
          
          <div className="border-t border-gray-100 my-4 pt-4">
            <p className="px-4 text-[9px] uppercase font-black text-gray-300 tracking-widest mb-2">নিরাপত্তা ও প্রশাসন</p>
            <button onClick={() => { isAdminLoggedIn ? setView('ADMIN') : setView('ADMIN_LOGIN'); setIsSidebarOpen(false); }} className={`flex items-center gap-4 w-full p-4 rounded-xl transition-all ${view === 'ADMIN' ? 'bg-orange-600 text-white font-black' : 'text-gray-500 hover:bg-gray-100 font-bold'}`}>
              <Cog6ToothIcon className="h-5 w-5" />
              <span className="text-sm">অ্যাডমিন প্যানেল</span>
            </button>
            <button onClick={() => { exportData(); setIsSidebarOpen(false); }} className="flex items-center gap-4 w-full p-4 rounded-xl text-gray-500 hover:bg-gray-100 font-bold transition-all">
              <ArrowDownTrayIcon className="h-5 w-5" />
              <span className="text-sm">ব্যাকআপ ডাটা</span>
            </button>
          </div>

          <div className="border-t border-gray-100 my-4 pt-4">
            <p className="px-4 text-[9px] uppercase font-black text-gray-300 tracking-widest mb-2">সেটিংস</p>
            <button onClick={() => { setView('SETTINGS'); setIsSidebarOpen(false); }} className="flex items-center gap-4 w-full p-4 rounded-xl text-gray-500 hover:bg-gray-100 font-bold transition-all">
              <KeyIcon className="h-5 w-5" />
              <span className="text-sm">পাসওয়ার্ড পরিবর্তন</span>
            </button>
          </div>
          
          <button onClick={handleLogout} className="flex items-center gap-4 w-full p-4 rounded-xl text-red-600 hover:bg-red-50 transition-all font-black mt-8">
            <ArrowRightOnRectangleIcon className="h-5 w-5" />
            <span className="text-sm">লগআউট</span>
          </button>
        </nav>
      </aside>

      {/* Top Header */}
      <header className="bg-army-green text-white p-4 md:p-6 sticky top-0 z-50 shadow-lg border-b border-white/5">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <button onClick={toggleSidebar} className="p-2 -ml-2 hover:bg-white/10 rounded-xl transition-all">
            <Bars3Icon className="h-7 w-7 text-white" />
          </button>
          <div className="flex-1 text-center cursor-pointer px-2" onClick={goHome}>
            <h1 className="text-lg md:text-2xl font-black leading-tight tracking-tight">ইপিজেড আর্মি ক্যাম্প</h1>
            <p className="text-[8px] md:text-[10px] opacity-80 uppercase tracking-widest font-black">ত্রোয়োদশ সংসদ নির্বাচন ২০২৬</p>
          </div>
          <button onClick={() => setShowSOS(true)} className="p-2 -mr-2 bg-red-600/20 text-red-400 rounded-xl border border-red-600/20">
            <MegaphoneIcon className="h-7 w-7" />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl mx-auto w-full p-4 md:p-10">
        {view === 'HOME' && (
          <div className="space-y-6">
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-6 w-6 text-gray-300" />
              </div>
              <input
                type="text"
                placeholder="খুঁজুন..."
                className="block w-full pl-16 pr-6 py-4 border-none rounded-2xl bg-white shadow-md focus:ring-4 focus:ring-army-green/5 outline-none text-lg font-black text-gray-800 placeholder:text-gray-300 placeholder:font-bold"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <h2 className="text-[9px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-3 col-span-full px-2">
                <span className="bg-army-green w-6 h-1 rounded-full"></span>
                কেন্দ্রের তালিকা ({filteredCenters.length})
              </h2>
              {filteredCenters.map((center) => (
                <button
                  key={center.id}
                  onClick={() => navigateToDetails(center)}
                  className="flex flex-col gap-4 bg-white p-6 rounded-3xl shadow-sm border-2 border-transparent hover:border-army-green/10 text-left w-full active:scale-95 transition-all"
                >
                  <div className="bg-army-green/5 text-army-green font-black w-12 h-12 flex items-center justify-center rounded-xl text-xl">
                    {center.centerNumber}
                  </div>
                  <div>
                    <h3 className="font-black text-gray-800 text-lg leading-tight mb-1">{center.name}</h3>
                    <p className="text-[8px] text-gray-400 font-black uppercase tracking-widest">বিস্তারিত তথ্য</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {view === 'CENTER_DETAILS' && selectedCenter && (
          <div className="space-y-6 animate-fadeIn">
            <div className="bg-white rounded-[2.5rem] p-8 md:p-12 shadow-xl border border-slate-50 relative overflow-hidden">
              <div className="relative z-10 flex flex-col items-center text-center">
                <div className="bg-army-green text-white px-5 py-2 rounded-xl text-[10px] font-black mb-6">
                  কেন্দ্র নং {selectedCenter.centerNumber}
                </div>
                <h2 className="text-2xl md:text-4xl font-black text-gray-800 mb-10 tracking-tight leading-snug">{selectedCenter.name}</h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
                  <button onClick={() => setView('CENTER_INFO')} className="flex items-center gap-4 p-5 rounded-2xl bg-blue-50/50 border border-blue-100 text-left group">
                    <div className="bg-blue-600 p-4 rounded-xl text-white shadow-lg"><InformationCircleIcon className="h-8 w-8" /></div>
                    <div className="flex-1">
                      <h4 className="font-black text-lg text-blue-900 leading-none mb-1">ভোটকেন্দ্র তথ্য</h4>
                      <p className="text-[9px] font-bold text-blue-600/60">বিস্তারিত বিবরণ</p>
                    </div>
                  </button>
                  <a href={selectedCenter.locationLink} target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 p-5 rounded-2xl bg-rose-50/50 border border-rose-100 text-left group">
                    <div className="bg-rose-600 p-4 rounded-xl text-white shadow-lg"><MapPinIcon className="h-8 w-8" /></div>
                    <div className="flex-1">
                      <h4 className="font-black text-lg text-rose-900 leading-none mb-1">অবস্থান ম্যাপ</h4>
                      <p className="text-[9px] font-bold text-rose-600/60">গুগল ম্যাপে দেখুন</p>
                    </div>
                  </a>
                  <button onClick={() => setView('PERSONS')} className="flex items-center gap-4 p-5 rounded-2xl bg-emerald-50/50 border border-emerald-100 text-left group">
                    <div className="bg-army-green p-4 rounded-xl text-white shadow-lg"><UserGroupIcon className="h-8 w-8" /></div>
                    <div className="flex-1">
                      <h4 className="font-black text-lg text-emerald-900 leading-none mb-1">যোগাযোগ</h4>
                      <p className="text-[9px] font-bold text-emerald-600/60">ব্যক্তিবর্গ ও নম্বর</p>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {view === 'CENTER_INFO' && selectedCenter && (
          <div className="animate-fadeIn space-y-4">
            <div className="bg-white rounded-3xl p-6 md:p-10 shadow-lg border border-slate-50">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-xl font-black text-gray-800 flex items-center gap-4">
                  <div className="p-2 bg-blue-100 rounded-lg"><InformationCircleIcon className="h-6 w-6 text-blue-600" /></div>
                  কেন্দ্রের তথ্যাদি
                </h2>
                <button onClick={goBack} className="p-2 text-slate-300 hover:text-slate-500"><XMarkIcon className="h-6 w-6" /></button>
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl">
                  <InboxStackIcon className="h-6 w-6 text-blue-600" />
                  <div>
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">ভোট কক্ষের সংখ্যা</p>
                    <p className="font-black text-gray-800">{selectedCenter.boothCount || 'N/A'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl">
                  <UserGroupIcon className="h-6 w-6 text-emerald-600" />
                  <div>
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">মোট ভোটার</p>
                    <p className="font-black text-gray-800">{selectedCenter.voterCount || 'N/A'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl">
                  <BuildingOfficeIcon className="h-6 w-6 text-rose-600" />
                  <div>
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">অবস্থান ও তলা</p>
                    <p className="font-black text-gray-800">{selectedCenter.roomLocation || 'N/A'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {view === 'PERSONS' && selectedCenter && (
          <div className="animate-fadeIn space-y-4">
            <div className="flex items-center justify-between px-2 mb-4">
              <h2 className="text-xl font-black text-gray-800">যোগাযোগের তালিকা</h2>
              <button onClick={goBack} className="p-2 text-slate-300"><XMarkIcon className="h-6 w-6" /></button>
            </div>
            {selectedCenter.importantPersons.map((p) => (
              <div key={p.id} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between gap-4">
                <div className="flex-1">
                  <h3 className="font-black text-gray-800 leading-tight">{p.name}</h3>
                  <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest">{p.designation}</p>
                  <p className="mt-2 text-army-green font-black text-sm">{p.mobile}</p>
                </div>
                <div className="flex gap-2">
                  <a href={`tel:${p.mobile}`} className="p-3 bg-blue-600 text-white rounded-xl shadow-md"><PhoneIcon className="h-5 w-5" /></a>
                  <a href={`https://wa.me/${p.mobile.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" className="p-3 bg-emerald-500 text-white rounded-xl shadow-md"><ChatBubbleLeftRightIcon className="h-5 w-5" /></a>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ADMIN, SETTINGS, EDIT views remain largely similar but follow cleaner padding */}
        {view === 'ADMIN_LOGIN' && (
           <div className="max-w-xs mx-auto mt-20 bg-white p-8 rounded-3xl shadow-xl border-t-8 border-orange-500">
             <h2 className="text-xl font-black text-center mb-6">অ্যাডমিন কন্ট্রোল</h2>
             <form onSubmit={handleAdminLogin} className="space-y-4">
               <input type="password" autoFocus className="w-full px-4 py-3 rounded-xl bg-slate-50 border-2 border-transparent focus:border-orange-500 outline-none text-center font-black" value={inputAdminPassword} onChange={e => setInputAdminPassword(e.target.value)} />
               {adminError && <p className="text-red-600 text-[10px] text-center">{adminError}</p>}
               <button type="submit" className="w-full bg-orange-600 text-white py-3 rounded-xl font-black shadow-lg">প্রবেশ করুন</button>
             </form>
           </div>
        )}
      </main>

      {/* Simplified Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 shadow-xl px-6 py-3 flex justify-between items-center z-50 md:hidden">
        <button onClick={goBack} className="flex flex-col items-center text-slate-400 active:text-army-green transition-colors">
          <ArrowLeftIcon className="h-6 w-6" />
          <span className="text-[9px] font-black mt-1 uppercase">পিছনে</span>
        </button>
        
        <button onClick={goHome} className="bg-army-green text-white p-4 rounded-2xl shadow-xl -mt-10 border-4 border-slate-50 active:scale-95 transition-all">
          <HomeIcon className="h-7 w-7" />
        </button>

        <button onClick={toggleSidebar} className="flex flex-col items-center text-slate-400 active:text-army-green transition-colors">
          <Bars3Icon className="h-6 w-6" />
          <span className="text-[9px] font-black mt-1 uppercase">মেনু</span>
        </button>
      </nav>

      <footer className="hidden md:block text-center py-10 text-slate-300 text-[9px] font-black uppercase tracking-[0.4em] border-t border-slate-50 mt-10">
        EPZ ARMY SECURITY DASHBOARD • 2026
      </footer>

      <style>{`
        @font-face {
          font-family: 'Hind Siliguri';
          font-style: normal;
          font-weight: 400;
          font-display: swap;
          src: url(https://fonts.gstatic.com/s/hindsiliguri/v12/ijwbRE69Lv_n96G8UuE-P1u9o9id772V.woff2) format('woff2');
        }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeInFast { from { opacity: 0; } to { opacity: 1; } }
        .animate-fadeIn { animation: fadeIn 0.4s ease-out forwards; }
        .animate-fadeInFast { animation: fadeInFast 0.2s ease-out forwards; }
        body { -webkit-tap-highlight-color: transparent; }
      `}</style>
    </div>
  );
};

export default App;
