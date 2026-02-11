
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
      <div className="min-h-screen flex items-center justify-center bg-slate-200 p-6 font-['Hind_Siliguri']">
        <div className="max-w-md w-full bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border-t-8 border-army-green animate-fadeIn">
          <div className="p-10 text-center">
            <div className="mb-8 flex justify-center">
              <div className="bg-army-green p-6 rounded-[2rem] shadow-xl ring-8 ring-army-green/10">
                <LockClosedIcon className="h-12 w-12 text-white" />
              </div>
            </div>
            <h1 className="text-3xl font-black text-gray-800 mb-2">প্রবেশাধিকার</h1>
            <p className="text-gray-400 font-bold mb-10 uppercase tracking-widest text-xs">ইপিজেড আর্মি ক্যাম্প - ২০২৬</p>
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="relative">
                <input
                  type="password"
                  placeholder="পাসওয়ার্ড দিন"
                  className="w-full px-6 py-5 rounded-3xl border-2 border-gray-100 focus:outline-none focus:border-army-green transition-all bg-gray-50 text-center text-2xl font-black text-gray-800 placeholder:text-gray-300 placeholder:font-bold"
                  value={inputPassword}
                  autoFocus
                  onChange={(e) => setInputPassword(e.target.value)}
                />
              </div>
              {error && <p className="text-red-600 text-sm font-black bg-red-50 py-3 rounded-2xl border border-red-100">{error}</p>}
              <button
                type="submit"
                className="w-full bg-army-green hover:bg-green-900 text-white font-black py-5 rounded-3xl transition-all shadow-xl shadow-army-green/30 active:scale-95 text-xl tracking-tight"
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
    <div className="min-h-screen pb-24 md:pb-8 flex flex-col bg-slate-50 overflow-x-hidden font-['Hind_Siliguri'] antialiased">
      {/* SOS Modal */}
      {showSOS && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md animate-fadeInFast">
          <div className="bg-white w-full max-w-sm rounded-[3rem] overflow-hidden shadow-2xl border-2 border-red-100">
            <div className="bg-red-600 p-10 text-center text-white">
              <MegaphoneIcon className="h-20 w-20 mx-auto mb-6 animate-bounce" />
              <h2 className="text-3xl font-black uppercase tracking-tighter mb-2">জরুরী যোগাযোগ</h2>
              <p className="text-sm opacity-80 font-bold">সরাসরি কল করুন</p>
            </div>
            <div className="p-10 space-y-6">
               <a href={`tel:${emergencyContact.mobile}`} className="flex items-center justify-between p-6 bg-red-50 rounded-3xl border-2 border-red-100 hover:bg-red-100 transition-colors group">
                  <div>
                    <p className="text-[10px] font-black text-red-600 uppercase tracking-widest mb-1">{emergencyContact.name}</p>
                    <p className="font-black text-xl text-gray-800">{emergencyContact.mobile}</p>
                  </div>
                  <div className="bg-red-600 p-4 rounded-2xl text-white shadow-lg group-active:scale-90 transition-transform">
                    <PhoneIcon className="h-7 w-7" />
                  </div>
               </a>
               <button 
                onClick={() => setShowSOS(false)}
                className="w-full py-2 text-gray-400 font-black hover:text-gray-600 uppercase tracking-widest text-xs"
               >
                 বন্ধ করুন
               </button>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] transition-opacity animate-fadeInFast"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar Drawer */}
      <aside className={`fixed top-0 left-0 h-full w-80 bg-white z-[70] shadow-2xl transform transition-transform duration-500 ease-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        {/* Sidebar Header with Fixed Background Color */}
        <div 
          className="p-10 text-white relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #4b5320 0%, #2c3112 100%)' }}
        >
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <ShieldCheckIcon className="h-40 w-40" />
          </div>
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-10">
              {/* Logo Crest */}
              <div className="bg-white/10 p-4 rounded-[2rem] shadow-2xl backdrop-blur-2xl border border-white/30 flex items-center justify-center relative group">
                <div className="absolute inset-0 bg-yellow-400/20 rounded-[2rem] blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative">
                   <ShieldCheckIcon className="h-10 w-10 text-white" />
                   <div className="absolute -top-1 -right-1 bg-yellow-400 rounded-full p-1 shadow-lg ring-2 ring-[#4b5320]">
                      <StarIcon className="h-3 w-3 text-[#4b5320]" />
                   </div>
                </div>
              </div>
              <button onClick={toggleSidebar} className="p-2 hover:bg-white/10 rounded-full transition-colors active:scale-90">
                <XMarkIcon className="h-8 w-8 text-white" />
              </button>
            </div>
            <h2 className="text-3xl font-black leading-none mb-2 tracking-tighter text-white">ইপিজেড আর্মি</h2>
            <p className="text-[10px] opacity-80 font-black uppercase tracking-[0.3em] text-white">Command Dashboard v3.0</p>
          </div>
        </div>

        <nav className="p-6 space-y-2">
          <button 
            onClick={goHome}
            className={`flex items-center gap-5 w-full p-5 rounded-[1.5rem] transition-all ${view === 'HOME' ? 'bg-[#4b5320] text-white font-black shadow-xl shadow-[#4b5320]/30' : 'text-gray-500 hover:bg-gray-100 font-bold'}`}
          >
            <HomeIcon className="h-6 w-6" />
            <span>মূল পাতা</span>
          </button>
          
          <div className="border-t border-gray-100 my-6 pt-6">
            <p className="px-5 text-[10px] uppercase font-black text-gray-300 tracking-[0.3em] mb-4">নিরাপত্তা ও প্রশাসন</p>
            <button 
              onClick={() => {
                if(isAdminLoggedIn) setView('ADMIN');
                else setView('ADMIN_LOGIN');
                setIsSidebarOpen(false);
              }}
              className={`flex items-center gap-5 w-full p-5 rounded-[1.5rem] transition-all ${view === 'ADMIN' ? 'bg-orange-600 text-white font-black shadow-xl shadow-orange-600/30' : 'text-gray-500 hover:bg-gray-100 font-bold'}`}
            >
              <Cog6ToothIcon className="h-6 w-6" />
              <span>অ্যাডমিন প্যানেল</span>
            </button>
            <button 
              onClick={() => {
                exportData();
                setIsSidebarOpen(false);
              }}
              className="flex items-center gap-5 w-full p-5 rounded-[1.5rem] text-gray-500 hover:bg-gray-100 font-bold transition-all"
            >
              <ArrowDownTrayIcon className="h-6 w-6" />
              <span>ব্যাকআপ ডাটা</span>
            </button>
          </div>

          <div className="border-t border-gray-100 my-6 pt-6">
            <p className="px-5 text-[10px] uppercase font-black text-gray-300 tracking-[0.3em] mb-4">সেটিংস</p>
            <button 
               onClick={() => {
                 setView('SETTINGS');
                 setIsSidebarOpen(false);
               }}
               className="flex items-center gap-5 w-full p-5 rounded-[1.5rem] text-gray-500 hover:bg-gray-100 font-bold transition-all"
            >
              <KeyIcon className="h-6 w-6" />
              <span>পাসওয়ার্ড পরিবর্তন</span>
            </button>
          </div>
          
          <button 
            onClick={handleLogout}
            className="flex items-center gap-5 w-full p-5 rounded-[1.5rem] text-red-600 hover:bg-red-50 transition-all font-black mt-12 border-2 border-red-50"
          >
            <ArrowRightOnRectangleIcon className="h-6 w-6" />
            <span>লগআউট</span>
          </button>
        </nav>
      </aside>

      {/* Top Navigation Bar */}
      <header className="bg-army-green text-white p-5 md:p-8 sticky top-0 z-50 shadow-2xl shadow-army-green/10 border-b border-white/5">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <button 
            onClick={toggleSidebar}
            className="p-3 -ml-2 hover:bg-white/10 rounded-2xl transition-all active:scale-90"
          >
            <Bars3Icon className="h-8 w-8 text-white" />
          </button>
          
          <div className="flex-1 text-center cursor-pointer px-4" onClick={goHome}>
            <h1 className="text-xl md:text-3xl font-black leading-tight tracking-tighter drop-shadow-lg">ইপিজেড আর্মি ক্যাম্প</h1>
            <p className="text-[10px] md:text-xs opacity-80 uppercase tracking-[0.4em] font-black mt-1">ত্রোয়োদশ সংসদ নির্বাচন ২০২৬</p>
          </div>

          <button 
            onClick={() => setShowSOS(true)}
            className="p-3 -mr-2 bg-red-600/20 text-red-400 hover:bg-red-600 hover:text-white rounded-2xl transition-all active:scale-90 border border-red-600/20"
          >
            <MegaphoneIcon className="h-8 w-8" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl mx-auto w-full p-5 md:p-12">
        {view === 'HOME' && (
          <div className="space-y-10">
            {/* Search Bar */}
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-8 flex items-center pointer-events-none transition-colors">
                <MagnifyingGlassIcon className="h-8 w-8 text-gray-300 group-focus-within:text-army-green" />
              </div>
              <input
                type="text"
                placeholder="ভোটকেন্দ্র, নম্বর বা নাম লিখে খুঁজুন..."
                className="block w-full pl-20 pr-8 py-7 border-none rounded-[2.5rem] bg-white placeholder-gray-300 focus:outline-none focus:ring-[12px] focus:ring-army-green/5 shadow-2xl shadow-slate-200 transition-all text-2xl font-black text-gray-800"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.4em] flex items-center gap-4 mb-2 col-span-full px-4">
                <span className="bg-army-green w-10 h-1.5 rounded-full inline-block"></span>
                কেন্দ্রের তালিকা ({filteredCenters.length})
              </h2>
              {filteredCenters.length > 0 ? (
                filteredCenters.map((center) => (
                  <button
                    key={center.id}
                    onClick={() => navigateToDetails(center)}
                    className="flex flex-col gap-6 bg-white p-10 rounded-[3rem] shadow-sm border-4 border-transparent hover:border-army-green/10 hover:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.1)] transition-all group active:scale-[0.98] text-left w-full relative overflow-hidden"
                  >
                    <div className="absolute -top-10 -right-10 p-12 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity rotate-12">
                      <IdentificationIcon className="h-48 w-48 text-army-green" />
                    </div>
                    <div className="bg-army-green/5 text-army-green font-black w-16 h-16 flex items-center justify-center rounded-[1.5rem] group-hover:bg-army-green group-hover:text-white transition-all text-3xl shadow-inner border-2 border-army-green/5">
                      {center.centerNumber}
                    </div>
                    <div>
                      <h3 className="font-black text-gray-800 text-2xl group-hover:text-army-green transition-colors leading-none mb-3 tracking-tight">{center.name}</h3>
                      <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em]">বিস্তারিত তথ্য ও কমান্ড</p>
                    </div>
                  </button>
                ))
              ) : (
                <div className="bg-white rounded-[4rem] p-24 text-center shadow-inner col-span-full border-4 border-dashed border-slate-100">
                  <div className="bg-slate-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-8">
                    <MagnifyingGlassIcon className="h-12 w-12 text-slate-200" />
                  </div>
                  <p className="text-slate-300 font-black text-3xl tracking-tighter">তথ্য খুঁজে পাওয়া যায়নি</p>
                  <button onClick={() => setSearchQuery('')} className="mt-8 text-army-green font-black text-sm px-12 py-4 bg-army-green/5 rounded-3xl hover:bg-army-green hover:text-white transition-all active:scale-95">সার্চ রিসেট করুন</button>
                </div>
              )}
            </div>
          </div>
        )}

        {view === 'SETTINGS' && (
           <div className="max-w-lg mx-auto animate-fadeIn">
              <div className="bg-white p-12 rounded-[3.5rem] shadow-2xl border-t-8 border-army-green relative">
                 <h2 className="text-3xl font-black text-gray-800 mb-8 tracking-tighter flex items-center gap-4">
                   <div className="p-3 bg-army-green/10 rounded-2xl text-army-green">
                     <KeyIcon className="h-8 w-8" />
                   </div>
                   পাসওয়ার্ড পরিবর্তন
                 </h2>
                 <div className="space-y-6">
                    <div>
                       <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 ml-2">নতুন পাসওয়ার্ড</label>
                       <input 
                          type="password"
                          className="w-full px-6 py-5 rounded-3xl bg-slate-50 border-4 border-transparent focus:border-army-green outline-none transition-all font-black text-xl text-center"
                          value={newPasswordValue}
                          onChange={(e) => setNewPasswordValue(e.target.value)}
                       />
                    </div>
                    <div className="flex gap-4 pt-4">
                       <button 
                          onClick={() => { setView('HOME'); setNewPasswordValue(''); }}
                          className="flex-1 py-5 rounded-3xl bg-slate-100 text-slate-400 font-black"
                       >
                         বাতিল
                       </button>
                       <button 
                          onClick={() => {
                            if (!newPasswordValue) return alert('পাসওয়ার্ড দিন!');
                            setUserPassword(newPasswordValue);
                            setNewPasswordValue('');
                            alert('পাসওয়ার্ড সফলভাবে পরিবর্তন হয়েছে!');
                            setView('HOME');
                          }}
                          className="flex-[2] py-5 rounded-3xl bg-army-green text-white font-black shadow-xl shadow-army-green/20"
                       >
                         সেভ করুন
                       </button>
                    </div>
                 </div>
              </div>
           </div>
        )}

        {view === 'ADMIN_LOGIN' && (
          <div className="max-w-lg mx-auto mt-24 animate-fadeIn">
            <div className="bg-white p-12 rounded-[4rem] shadow-2xl border-t-[12px] border-orange-500 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-12 opacity-[0.02]">
                <Cog6ToothIcon className="h-48 w-48 text-orange-500" />
              </div>
              <div className="flex justify-center mb-10">
                <div className="bg-orange-100 p-6 rounded-[2rem] text-orange-600 shadow-xl shadow-orange-500/10">
                   <Cog6ToothIcon className="h-14 w-14" />
                </div>
              </div>
              <h2 className="text-4xl font-black text-center mb-10 text-gray-800 tracking-tighter">অ্যাডমিন কন্ট্রোল</h2>
              <form onSubmit={handleAdminLogin} className="space-y-8">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.4em] mb-4 ml-2 text-center">সিকিউরিটি কি</label>
                  <input
                    type="password"
                    autoFocus
                    className="w-full px-8 py-6 rounded-3xl bg-slate-50 border-4 border-transparent focus:border-orange-500 focus:bg-white outline-none transition-all text-center text-4xl font-black tracking-[0.2em] text-gray-800"
                    value={inputAdminPassword}
                    onChange={(e) => setInputAdminPassword(e.target.value)}
                  />
                </div>
                {adminError && <p className="text-red-600 text-sm font-black text-center bg-red-50 py-4 rounded-3xl border-2 border-red-100">{adminError}</p>}
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={goHome}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-500 font-black py-6 rounded-3xl transition-all text-lg"
                  >
                    বাতিল
                  </button>
                  <button
                    type="submit"
                    className="flex-[2] bg-orange-600 hover:bg-orange-700 text-white font-black py-6 rounded-3xl transition-all shadow-2xl shadow-orange-600/30 active:scale-95 text-xl"
                  >
                    লগইন
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {view === 'ADMIN' && (
          <div className="space-y-10 animate-fadeIn">
            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 group hover:shadow-xl transition-all">
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 bg-army-green/10 rounded-2xl text-army-green">
                    <IdentificationIcon className="h-6 w-6" />
                  </div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">মোট কেন্দ্র</p>
                </div>
                <p className="text-5xl font-black text-gray-800 tracking-tighter">{stats.totalCenters}</p>
              </div>
              <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 group hover:shadow-xl transition-all">
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 bg-blue-100 rounded-2xl text-blue-600">
                    <UserGroupIcon className="h-6 w-6" />
                  </div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">মোট কর্মকর্তা</p>
                </div>
                <p className="text-5xl font-black text-gray-800 tracking-tighter">{stats.totalPersonnel}</p>
              </div>
              <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex items-center justify-between group cursor-pointer hover:bg-orange-500 transition-all hover:shadow-2xl shadow-orange-500/20" onClick={exportData}>
                <div>
                  <p className="text-[10px] font-black text-gray-400 group-hover:text-white uppercase tracking-widest mb-1 transition-colors">এক্সপোর্ট</p>
                  <p className="text-xl font-black text-orange-600 group-hover:text-white transition-colors">ব্যাকআপ ফাইল</p>
                </div>
                <ArrowDownTrayIcon className="h-10 w-10 text-orange-100 group-hover:text-white/40 transition-all" />
              </div>
              <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex items-center justify-between group cursor-pointer hover:bg-blue-600 transition-all hover:shadow-2xl shadow-blue-600/20" onClick={() => fileInputRef.current?.click()}>
                <div>
                  <p className="text-[10px] font-black text-gray-400 group-hover:text-white uppercase tracking-widest mb-1 transition-colors">ইমপোর্ট</p>
                  <p className="text-xl font-black text-blue-600 group-hover:text-white transition-colors">রিস্টোর ডাটা</p>
                </div>
                <ArrowUpTrayIcon className="h-10 w-10 text-blue-100 group-hover:text-white/40 transition-all" />
                <input type="file" ref={fileInputRef} onChange={importData} className="hidden" accept=".json" />
              </div>
            </div>

            {/* Emergency & Admin Password Panel */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
               {/* Emergency Contact Edit */}
               <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-100">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="p-3 bg-red-100 rounded-2xl text-red-600">
                       <MegaphoneIcon className="h-8 w-8" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-black text-gray-800 tracking-tighter">জরুরী যোগাযোগ এডিট</h3>
                      <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">এসওএস মোড সেটিংস</p>
                    </div>
                  </div>
                  <div className="space-y-6">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                           <label className="text-[10px] font-black text-gray-400 uppercase ml-2 mb-2 block">নাম/পদবী</label>
                           <input 
                              className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-red-500 outline-none font-black text-gray-800 transition-all"
                              value={emergencyContact.name}
                              onChange={(e) => setEmergencyContact({ ...emergencyContact, name: e.target.value })}
                           />
                        </div>
                        <div>
                           <label className="text-[10px] font-black text-gray-400 uppercase ml-2 mb-2 block">মোবাইল</label>
                           <input 
                              className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-red-500 outline-none font-mono font-black text-gray-800 transition-all"
                              value={emergencyContact.mobile}
                              onChange={(e) => setEmergencyContact({ ...emergencyContact, mobile: e.target.value })}
                           />
                        </div>
                     </div>
                  </div>
               </div>

               {/* Admin Password Edit */}
               <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-100">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="p-3 bg-orange-100 rounded-2xl text-orange-600">
                       <KeyIcon className="h-8 w-8" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-black text-gray-800 tracking-tighter">অ্যাডমিন পাসওয়ার্ড</h3>
                      <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">সিকিউরিটি সেটিংস</p>
                    </div>
                  </div>
                  <div className="space-y-6">
                    <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase ml-2 mb-2 block">নতুন অ্যাডমিন পাসওয়ার্ড</label>
                        <input 
                           type="password"
                           placeholder="নতুন পাসওয়ার্ড দিন..."
                           className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-orange-500 outline-none font-black text-gray-800 transition-all text-center tracking-[0.2em]"
                           onChange={(e) => setNewPasswordValue(e.target.value)}
                           value={newPasswordValue}
                        />
                    </div>
                    <button 
                       onClick={() => {
                         if (!newPasswordValue) return alert('পাসওয়ার্ড দিন!');
                         setAdminPassword(newPasswordValue);
                         setNewPasswordValue('');
                         alert('অ্যাডমিন পাসওয়ার্ড পরিবর্তন হয়েছে!');
                       }}
                       className="w-full py-4 rounded-2xl bg-orange-600 text-white font-black shadow-lg shadow-orange-600/20 active:scale-95 transition-all"
                    >
                      আপডেট করুন
                    </button>
                  </div>
               </div>
            </div>

            {/* Dashboard Header */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6 bg-white p-10 rounded-[3.5rem] shadow-sm border border-slate-100">
              <div className="flex items-center gap-6">
                <div className="bg-orange-600 p-5 rounded-[1.5rem] text-white shadow-2xl shadow-orange-600/30">
                  <AdjustmentsHorizontalIcon className="h-10 w-10" />
                </div>
                <div>
                  <h2 className="text-3xl font-black text-gray-800 tracking-tighter leading-none mb-2">ভোটকেন্দ্র ব্যবস্থাপনা</h2>
                  <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.3em]">সিস্টেম অপারেশন ও কেন্দ্র ম্যানেজমেন্ট</p>
                </div>
              </div>
              <button 
                onClick={() => startEdit()}
                className="w-full sm:w-auto flex items-center justify-center gap-4 bg-army-green text-white px-12 py-5 rounded-[1.5rem] font-black hover:bg-green-900 transition-all shadow-2xl shadow-army-green/40 active:scale-95 text-lg"
              >
                <PlusIcon className="h-7 w-7" />
                নতুন কেন্দ্র
              </button>
            </div>

            <div className="bg-white rounded-[3.5rem] shadow-sm border border-slate-100 overflow-hidden">
               <div className="overflow-x-auto">
                 <table className="w-full text-left">
                   <thead className="bg-slate-50 border-b-4 border-slate-100">
                     <tr>
                       <th className="px-10 py-8 text-[10px] font-black text-gray-300 uppercase tracking-[0.4em]">নম্বর</th>
                       <th className="px-10 py-8 text-[10px] font-black text-gray-300 uppercase tracking-[0.4em]">ভোটকেন্দ্রের নাম</th>
                       <th className="px-10 py-8 text-[10px] font-black text-gray-300 uppercase tracking-[0.4em] text-right">অ্যাকশন</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y-2 divide-slate-100">
                     {centers.map(c => (
                       <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
                         <td className="px-10 py-7 font-black text-army-green text-2xl tracking-tighter">{c.centerNumber}</td>
                         <td className="px-10 py-7 font-black text-gray-800 text-lg">{c.name}</td>
                         <td className="px-10 py-7 text-right">
                           <div className="flex justify-end gap-4">
                             <button 
                               onClick={() => startEdit(c)}
                               className="p-4 text-blue-600 bg-blue-50 hover:bg-blue-600 hover:text-white rounded-2xl transition-all shadow-sm active:scale-90"
                             >
                               <PencilSquareIcon className="h-6 w-6" />
                             </button>
                             <button 
                               onClick={() => deleteCenter(c.id)}
                               className="p-4 text-red-600 bg-red-50 hover:bg-red-600 hover:text-white rounded-2xl transition-all shadow-sm active:scale-90"
                             >
                               <TrashIcon className="h-6 w-6" />
                             </button>
                           </div>
                         </td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>
            </div>
          </div>
        )}

        {view === 'EDIT_CENTER' && (
          <div className="max-w-4xl mx-auto animate-fadeIn space-y-8">
            <div className="bg-white p-10 md:p-16 rounded-[4rem] shadow-2xl border-t-[12px] border-army-green relative overflow-hidden">
              <div className="absolute top-0 right-0 p-16 opacity-[0.02]">
                <IdentificationIcon className="h-64 w-64 text-army-green" />
              </div>
              <div className="flex items-center gap-6 mb-12 border-b-4 border-slate-50 pb-10">
                 <div className="bg-army-green/5 p-5 rounded-[1.5rem] text-army-green shadow-inner">
                    <PencilSquareIcon className="h-10 w-10" />
                 </div>
                 <h2 className="text-4xl font-black text-gray-800 tracking-tighter">কেন্দ্র তথ্য এডিট</h2>
              </div>
              
              <div className="space-y-10">
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-10">
                  <div className="sm:col-span-1">
                    <label className="block text-[10px] font-black text-gray-300 uppercase tracking-widest mb-3 ml-2">কেন্দ্র নম্বর</label>
                    <input
                      type="text"
                      className="w-full px-8 py-6 rounded-3xl bg-slate-50 border-4 border-transparent focus:border-army-green outline-none transition-all font-black text-3xl text-center text-gray-800"
                      value={editCenter.centerNumber || ''}
                      onChange={e => setEditCenter({ ...editCenter, centerNumber: e.target.value })}
                    />
                  </div>
                  <div className="sm:col-span-3">
                    <label className="block text-[10px] font-black text-gray-300 uppercase tracking-widest mb-3 ml-2">ভোটকেন্দ্রের পূর্ণ নাম</label>
                    <input
                      type="text"
                      className="w-full px-8 py-6 rounded-3xl bg-slate-50 border-4 border-transparent focus:border-army-green outline-none transition-all font-black text-2xl text-gray-800"
                      value={editCenter.name || ''}
                      onChange={e => setEditCenter({ ...editCenter, name: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-10 border-2 border-slate-50 p-10 rounded-[2.5rem] bg-slate-50/30">
                  <div className="col-span-full mb-2">
                    <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                      <InboxStackIcon className="h-4 w-4" />
                      ভোটকেন্দ্রের তথ্যাদি
                    </h3>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-300 uppercase tracking-widest mb-3 ml-2">ভোট কক্ষের সংখ্যা</label>
                    <input
                      type="text"
                      placeholder="উদাঃ ১০"
                      className="w-full px-6 py-5 rounded-2xl bg-white border-2 border-slate-100 focus:border-army-green outline-none transition-all font-bold text-lg"
                      value={editCenter.boothCount || ''}
                      onChange={e => setEditCenter({ ...editCenter, boothCount: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-300 uppercase tracking-widest mb-3 ml-2">মোট ভোটার সংখ্যা</label>
                    <input
                      type="text"
                      placeholder="উদাঃ ৪০০০"
                      className="w-full px-6 py-5 rounded-2xl bg-white border-2 border-slate-100 focus:border-army-green outline-none transition-all font-bold text-lg"
                      value={editCenter.voterCount || ''}
                      onChange={e => setEditCenter({ ...editCenter, voterCount: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-300 uppercase tracking-widest mb-3 ml-2">অবস্থান/তলা</label>
                    <input
                      type="text"
                      placeholder="উদাঃ প্রধান ভবন, ২য় তলা"
                      className="w-full px-6 py-5 rounded-2xl bg-white border-2 border-slate-100 focus:border-army-green outline-none transition-all font-bold text-lg"
                      value={editCenter.roomLocation || ''}
                      onChange={e => setEditCenter({ ...editCenter, roomLocation: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-gray-300 uppercase tracking-widest mb-3 ml-2">গুগল ম্যাপ ইউআরএল</label>
                  <input
                    type="url"
                    className="w-full px-8 py-6 rounded-3xl bg-slate-50 border-4 border-transparent focus:border-army-green outline-none transition-all font-mono text-sm text-blue-600 font-bold"
                    value={editCenter.locationLink || ''}
                    onChange={e => setEditCenter({ ...editCenter, locationLink: e.target.value })}
                  />
                </div>

                <div className="space-y-8 pt-12 border-t-4 border-slate-50">
                   <div className="flex items-center justify-between">
                     <h3 className="text-2xl font-black text-gray-800 tracking-tight">ব্যাক্তিবর্গ ও যোগাযোগ</h3>
                     <button 
                        onClick={addPersonToEdit}
                        className="flex items-center gap-3 bg-blue-600 text-white px-8 py-4 rounded-[1.2rem] font-black text-sm hover:bg-blue-700 transition-all shadow-xl shadow-blue-600/20 active:scale-95"
                     >
                       <PlusIcon className="h-5 w-5" />
                       নতুন ব্যক্তি
                     </button>
                   </div>

                   <div className="grid grid-cols-1 gap-8">
                     {editCenter.importantPersons?.map((p) => (
                       <div key={p.id} className="p-10 bg-slate-50 rounded-[2.5rem] border-2 border-slate-100 relative group animate-fadeIn shadow-inner">
                         <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                           <div>
                             <label className="text-[10px] font-black text-gray-400 uppercase ml-2 mb-2 block">নাম</label>
                             <input 
                               placeholder="পূর্ণ নাম"
                               className="w-full px-6 py-4 rounded-2xl border-2 border-transparent focus:border-army-green outline-none font-black text-gray-800 transition-all shadow-sm"
                               value={p.name}
                               onChange={e => updatePersonInEdit(p.id, 'name', e.target.value)}
                             />
                           </div>
                           <div>
                             <label className="text-[10px] font-black text-gray-400 uppercase ml-2 mb-2 block">পদবী</label>
                             <input 
                               placeholder="র‍্যাঙ্ক/পদবী"
                               className="w-full px-6 py-4 rounded-2xl border-2 border-transparent focus:border-army-green outline-none font-black text-gray-800 transition-all shadow-sm"
                               value={p.designation}
                               onChange={e => updatePersonInEdit(p.id, 'designation', e.target.value)}
                             />
                           </div>
                           <div>
                             <label className="text-[10px] font-black text-gray-400 uppercase ml-2 mb-2 block">মোবাইল</label>
                             <input 
                               placeholder="০১৭..."
                               className="w-full px-6 py-4 rounded-2xl border-2 border-transparent focus:border-army-green outline-none font-mono font-black text-lg text-gray-800 transition-all shadow-sm"
                               value={p.mobile}
                               onChange={e => updatePersonInEdit(p.id, 'mobile', e.target.value)}
                             />
                           </div>
                         </div>
                         <button 
                           onClick={() => removePersonFromEdit(p.id)}
                           className="absolute -top-4 -right-4 bg-red-600 text-white p-3 rounded-2xl shadow-2xl hover:bg-red-700 transition-all active:scale-90"
                         >
                           <XMarkIcon className="h-6 w-6" />
                         </button>
                       </div>
                     ))}
                   </div>
                </div>

                <div className="flex gap-6 pt-12">
                  <button
                    onClick={() => setView('ADMIN')}
                    className="flex-1 bg-slate-100 text-slate-400 font-black py-7 rounded-[2rem] transition-all hover:bg-slate-200 text-lg"
                  >
                    বাতিল করুন
                  </button>
                  <button
                    onClick={saveCenter}
                    className="flex-[2] bg-army-green text-white font-black py-7 rounded-[2rem] transition-all hover:bg-green-900 shadow-2xl shadow-army-green/40 active:scale-95 text-2xl tracking-tight"
                  >
                    তথ্য সেভ করুন
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {view === 'CENTER_DETAILS' && selectedCenter && (
          <div className="space-y-10 animate-fadeIn max-w-5xl mx-auto">
            <div className="bg-white rounded-[4rem] p-12 md:p-20 shadow-2xl shadow-slate-200 border-2 border-slate-50 mb-10 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-16 opacity-[0.03]">
                 <IdentificationIcon className="h-96 w-96 rotate-12" />
              </div>
              <div className="relative z-10">
                <div className="flex items-center gap-4 mb-10">
                  <span className="bg-army-green text-white px-8 py-3 rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.4em] shadow-xl shadow-army-green/20 border border-white/10">
                    কেন্দ্র নং {selectedCenter.centerNumber}
                  </span>
                </div>
                <h2 className="text-4xl md:text-6xl font-black text-gray-800 mb-12 leading-[1.05] tracking-tighter drop-shadow-sm">{selectedCenter.name}</h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <button
                    onClick={() => setView('CENTER_INFO')}
                    className="group flex items-center md:flex-col md:items-start md:justify-between gap-8 p-10 rounded-[3rem] bg-blue-50/50 text-blue-900 hover:bg-blue-600 hover:text-white transition-all active:scale-95 border-2 border-blue-100 shadow-sm"
                  >
                    <div className="bg-blue-600 p-6 rounded-[1.5rem] text-white shadow-xl group-hover:bg-white group-hover:text-blue-600 transition-all group-hover:shadow-2xl">
                      <InformationCircleIcon className="h-10 w-10" />
                    </div>
                    <div>
                      <h4 className="font-black text-2xl leading-none mb-3 tracking-tight">ভোটকেন্দ্র তথ্য</h4>
                      <p className="text-[10px] opacity-60 font-black uppercase tracking-[0.2em]">বিস্তারিত বিবরণ</p>
                    </div>
                  </button>

                  <a
                    href={selectedCenter.locationLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center md:flex-col md:items-start md:justify-between gap-8 p-10 rounded-[3rem] bg-rose-50/50 text-rose-900 hover:bg-rose-600 hover:text-white transition-all active:scale-95 border-2 border-rose-100 shadow-sm"
                  >
                    <div className="bg-rose-600 p-6 rounded-[1.5rem] text-white shadow-xl group-hover:bg-white group-hover:text-rose-600 transition-all group-hover:shadow-2xl">
                      <MapPinIcon className="h-10 w-10" />
                    </div>
                    <div>
                      <h4 className="font-black text-2xl leading-none mb-3 tracking-tight">অবস্থান ম্যাপ</h4>
                      <p className="text-[10px] opacity-60 font-black uppercase tracking-[0.2em]">গুগল ম্যাপে দেখুন</p>
                    </div>
                  </a>

                  <button
                    onClick={() => setView('PERSONS')}
                    className="group flex items-center md:flex-col md:items-start md:justify-between gap-8 p-10 rounded-[3rem] bg-emerald-50/50 text-emerald-900 hover:bg-army-green hover:text-white transition-all active:scale-95 border-2 border-emerald-100 shadow-sm"
                  >
                    <div className="bg-army-green p-6 rounded-[1.5rem] text-white shadow-xl group-hover:bg-white group-hover:text-army-green transition-all group-hover:shadow-2xl">
                      <UserGroupIcon className="h-10 w-10" />
                    </div>
                    <div>
                      <h4 className="font-black text-2xl leading-none mb-3 tracking-tight">যোগাযোগ</h4>
                      <p className="text-[10px] opacity-60 font-black uppercase tracking-[0.2em]">ব্যক্তিবর্গ ও নম্বর</p>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {view === 'CENTER_INFO' && selectedCenter && (
          <div className="animate-fadeIn max-w-4xl mx-auto">
            <div className="bg-white rounded-[4rem] p-12 md:p-20 shadow-2xl border-2 border-slate-50 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-20 opacity-[0.02]">
                <IdentificationIcon className="h-64 w-64 text-blue-600" />
              </div>
              <div className="flex items-center justify-between mb-16 relative z-10">
                <h2 className="text-4xl font-black text-gray-800 flex items-center gap-6 tracking-tighter leading-none">
                  <div className="p-4 bg-blue-100 rounded-[1.5rem] shadow-xl shadow-blue-500/10">
                    <InformationCircleIcon className="h-12 w-12 text-blue-600" />
                  </div>
                  কেন্দ্রের তথ্যাদি
                </h2>
                <button onClick={goBack} className="p-4 hover:bg-slate-100 rounded-full transition-all active:scale-90">
                  <XMarkIcon className="h-10 w-10 text-slate-300" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10 mb-10">
                <div className="bg-slate-50/50 p-8 rounded-[2.5rem] border-2 border-slate-100 flex items-center gap-6">
                   <div className="bg-white p-5 rounded-3xl shadow-sm text-blue-600">
                      <InboxStackIcon className="h-10 w-10" />
                   </div>
                   <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">ভোট কক্ষের সংখ্যা</p>
                      <p className="text-3xl font-black text-gray-800 tracking-tighter">{selectedCenter.boothCount || 'N/A'}</p>
                   </div>
                </div>
                <div className="bg-slate-50/50 p-8 rounded-[2.5rem] border-2 border-slate-100 flex items-center gap-6">
                   <div className="bg-white p-5 rounded-3xl shadow-sm text-emerald-600">
                      <UserGroupIcon className="h-10 w-10" />
                   </div>
                   <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">মোট ভোটার</p>
                      <p className="text-3xl font-black text-gray-800 tracking-tighter">{selectedCenter.voterCount || 'N/A'}</p>
                   </div>
                </div>
                <div className="bg-slate-50/50 p-8 rounded-[2.5rem] border-2 border-slate-100 flex items-center gap-6 md:col-span-2">
                   <div className="bg-white p-5 rounded-3xl shadow-sm text-rose-600">
                      <BuildingOfficeIcon className="h-10 w-10" />
                   </div>
                   <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">অবস্থান ও তলা</p>
                      <p className="text-3xl font-black text-gray-800 tracking-tighter leading-tight">{selectedCenter.roomLocation || 'তথ্য নেই'}</p>
                   </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {view === 'PERSONS' && selectedCenter && (
          <div className="space-y-8 animate-fadeIn max-w-4xl mx-auto">
            <div className="flex items-center justify-between px-10 mb-12">
              <h2 className="text-4xl font-black text-gray-800 flex items-center gap-6 tracking-tighter leading-none">
                <div className="p-4 bg-emerald-100 rounded-[1.5rem] shadow-xl shadow-emerald-500/10">
                   <UserGroupIcon className="h-12 w-12 text-army-green" />
                </div>
                যোগাযোগের তালিকা
              </h2>
              <button onClick={goBack} className="p-4 hover:bg-slate-100 rounded-full transition-all active:scale-90">
                <XMarkIcon className="h-10 w-10 text-slate-300" />
              </button>
            </div>
            
            {selectedCenter.importantPersons.length > 0 ? (
              selectedCenter.importantPersons.map((person) => (
                <div key={person.id} className="bg-white p-10 rounded-[3.5rem] shadow-sm border-2 border-slate-50 flex flex-col sm:flex-row items-center justify-between gap-10 transition-all hover:shadow-2xl hover:scale-[1.01] hover:border-army-green/10 group">
                  <div className="flex-1 text-center sm:text-left">
                    <h3 className="font-black text-gray-800 text-3xl leading-none mb-3 tracking-tight group-hover:text-army-green transition-colors">{person.name}</h3>
                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.3em] ml-1">{person.designation}</p>
                    <div className="mt-8">
                      <span className="text-army-green font-mono text-2xl font-black tracking-[0.1em] bg-army-green/5 px-8 py-3 rounded-[1.5rem] border-2 border-army-green/5 inline-block shadow-inner">
                        {person.mobile}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-5">
                    <a
                      href={`tel:${person.mobile}`}
                      className="p-7 bg-blue-600 text-white rounded-[2rem] hover:bg-blue-700 transition-all shadow-2xl shadow-blue-600/30 active:scale-90"
                      title="কল করুন"
                    >
                      <PhoneIcon className="h-8 w-8" />
                    </a>
                    <a
                      href={`https://wa.me/${person.mobile.replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-7 bg-emerald-500 text-white rounded-[2rem] hover:bg-emerald-600 transition-all shadow-2xl shadow-emerald-500/30 active:scale-90"
                      title="হোয়াটসএ্যাপ"
                    >
                      <ChatBubbleLeftRightIcon className="h-8 w-8" />
                    </a>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-32 bg-white rounded-[4rem] border-4 border-dashed border-slate-50">
                 <div className="bg-slate-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-8 opacity-20">
                    <UserGroupIcon className="h-12 w-12 text-gray-400" />
                 </div>
                 <p className="text-slate-200 font-black text-2xl">যোগাযোগের তথ্য নেই</p>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Floating Emergency Button */}
      {view === 'HOME' && (
        <button 
          onClick={() => setShowSOS(true)}
          className="fixed right-8 bottom-36 sm:bottom-12 z-40 bg-red-600 text-white p-7 rounded-full shadow-[0_25px_50px_-12px_rgba(220,38,38,0.5)] hover:scale-110 active:scale-90 transition-all ring-[16px] ring-red-600/10 border-4 border-white animate-pulse"
        >
          <MegaphoneIcon className="h-10 w-10" />
        </button>
      )}

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-2xl border-t-2 border-slate-50 shadow-[0_-20px_50px_rgba(0,0,0,0.08)] px-12 py-5 flex justify-around items-center z-50 sm:hidden">
        <button
          onClick={goBack}
          className="flex flex-col items-center gap-2 text-slate-300 hover:text-army-green transition-all active:scale-90"
        >
          <ArrowLeftIcon className="h-8 w-8" />
          <span className="text-[9px] font-black uppercase tracking-widest">পিছনে</span>
        </button>
        
        <button
          onClick={goHome}
          className="flex flex-col items-center gap-1 -mt-20 bg-army-green text-white p-7 rounded-[2.5rem] shadow-[0_20px_40px_rgba(75,83,32,0.4)] border-8 border-white transition-all hover:scale-110 active:scale-95 ring-[16px] ring-army-green/5"
        >
          <HomeIcon className="h-9 w-9" />
        </button>

        <button
          onClick={toggleSidebar}
          className="flex flex-col items-center gap-2 text-slate-300 hover:text-army-green transition-all active:scale-90"
        >
          <Bars3Icon className="h-8 w-8" />
          <span className="text-[9px] font-black uppercase tracking-widest">মেনু</span>
        </button>
      </nav>

      <footer className="hidden sm:block text-center py-20 text-slate-200 text-[10px] font-black uppercase tracking-[0.5em] mt-20 border-t-2 border-slate-50">
        EPZ ARMY SECURITY DASHBOARD • STRATEGIC OPS 2026 • CONFIDENTIAL
      </footer>

      <style>{`
        @font-face {
          font-family: 'Hind Siliguri';
          font-style: normal;
          font-weight: 400;
          font-display: swap;
          src: url(https://fonts.gstatic.com/s/hindsiliguri/v12/ijwbRE69Lv_n96G8UuE-P1u9o9id772V.woff2) format('woff2');
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeInFast {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fadeIn {
          animation: fadeIn 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .animate-fadeInFast {
          animation: fadeInFast 0.4s ease-out forwards;
        }
        input, textarea, button {
          -webkit-tap-highlight-color: transparent;
        }
        ::selection {
          background-color: #4b5320;
          color: white;
        }
        input[type="password"] {
          -webkit-text-security: disc;
          text-security: disc;
        }
        .rotate-135 { transform: rotate(135deg); }
      `}</style>
    </div>
  );
};

export default App;
