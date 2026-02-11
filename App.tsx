
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
  ArrowRightOnRectangleIcon,
  ExclamationCircleIcon,
  CheckCircleIcon,
  TriangleSolidIcon
} from '@heroicons/react/24/solid';

// Helper to convert English digits to Bengali digits
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
  confirmText?: string;
  cancelText?: string;
  showCancel?: boolean;
}

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

  // Persistence logic - Session State
  const [isLoggedIn, setIsLoggedIn] = useState(() => localStorage.getItem('app_is_logged_in') === 'true');
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(() => localStorage.getItem('app_is_admin_logged_in') === 'true');

  useEffect(() => {
    localStorage.setItem('voting_centers_data_v3', JSON.stringify(centers));
    localStorage.setItem('emergency_contact', JSON.stringify(emergencyContact));
    localStorage.setItem('app_user_password', userPassword);
    localStorage.setItem('app_admin_password', adminPassword);
    localStorage.setItem('app_is_logged_in', isLoggedIn.toString());
    localStorage.setItem('app_is_admin_logged_in', isAdminLoggedIn.toString());
  }, [centers, emergencyContact, userPassword, adminPassword, isLoggedIn, isAdminLoggedIn]);

  const [inputPassword, setInputPassword] = useState('');
  const [inputAdminPassword, setInputAdminPassword] = useState('');
  
  const [view, setView] = useState<ViewState>(() => {
    return isAdminLoggedIn ? 'ADMIN' : 'HOME';
  });
  const [selectedCenter, setSelectedCenter] = useState<VotingCenter | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState('');
  const [adminError, setAdminError] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showSOS, setShowSOS] = useState(false);

  // Modal State
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
      confirmText: props.confirmText || 'ঠিক আছে',
      cancelText: props.cancelText || 'বাতিল',
      showCancel: props.showCancel ?? false,
      onConfirm: props.onConfirm,
      onClose: () => setModal(prev => ({ ...prev, isOpen: false }))
    });
  };

  // Edit State
  const [editCenter, setEditCenter] = useState<Partial<VotingCenter>>({});
  const [tempEmergency, setTempEmergency] = useState<EmergencyContact>({ name: '', mobile: '' });
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
    showModal({
      title: 'লগআউট নিশ্চিতকরণ',
      message: 'আপনি কি নিশ্চিত যে আপনি অ্যাপ্লিকেশন থেকে লগআউট করতে চান?',
      type: 'WARNING',
      showCancel: true,
      confirmText: 'লগআউট',
      onConfirm: () => {
        setIsLoggedIn(false);
        setIsAdminLoggedIn(false);
        localStorage.removeItem('app_is_logged_in');
        localStorage.removeItem('app_is_admin_logged_in');
        setInputPassword('');
        setInputAdminPassword('');
        setView('HOME');
        setIsSidebarOpen(false);
        setModal(prev => ({ ...prev, isOpen: false }));
      }
    });
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
    showModal({
      title: 'ব্যাকআপ সফল',
      message: 'আপনার ডাটা ব্যাকআপ ফাইলটি ডাউনলোড করা হয়েছে।',
      type: 'SUCCESS'
    });
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
        showModal({
          title: 'ইমপোর্ট সফল',
          message: 'তথ্য সফলভাবে রিস্টোর করা হয়েছে!',
          type: 'SUCCESS'
        });
      } catch (err) {
        showModal({
          title: 'ত্রুটি',
          message: 'ভুল ফাইল ফরম্যাট! অনুগ্রহ করে সঠিক ব্যাকআপ ফাইল নির্বাচন করুন।',
          type: 'DANGER'
        });
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
    setSearchQuery('');
  };

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const deleteCenter = (id: string) => {
    showModal({
      title: 'মুছে ফেলার নিশ্চিতকরণ',
      message: 'আপনি কি নিশ্চিত যে এই কেন্দ্রটি তালিকা থেকে চিরতরে মুছে ফেলতে চান?',
      type: 'DANGER',
      showCancel: true,
      confirmText: 'মুছে ফেলুন',
      onConfirm: () => {
        setCenters(prevCenters => {
          const updated = prevCenters.filter(c => c.id !== id);
          return updated;
        });
        if (selectedCenter?.id === id) {
          setSelectedCenter(null);
        }
        setModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const startEdit = (center?: VotingCenter) => {
    if (center) {
      setEditCenter(JSON.parse(JSON.stringify(center)));
    } else {
      const nextNum = (centers.length + 1).toString().padStart(2, '0');
      setEditCenter({
        id: Date.now().toString(),
        centerNumber: toBengaliDigits(nextNum),
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
      showModal({
        title: 'অসম্পূর্ণ তথ্য',
        message: 'অনুগ্রহ করে কেন্দ্রের নাম এবং নম্বর প্রদান করুন।',
        type: 'WARNING'
      });
      return;
    }
    const finalCenter = {
      id: editCenter.id,
      centerNumber: editCenter.centerNumber,
      name: editCenter.name,
      boothCount: editCenter.boothCount || '',
      voterCount: editCenter.voterCount || '',
      roomLocation: editCenter.roomLocation || '',
      locationLink: editCenter.locationLink || '',
      importantPersons: editCenter.importantPersons || []
    } as VotingCenter;

    setCenters(prev => {
      const existsIndex = prev.findIndex(c => c.id === editCenter.id);
      if (existsIndex > -1) {
        const updated = [...prev];
        updated[existsIndex] = finalCenter;
        return updated;
      } else {
        return [...prev, finalCenter];
      }
    });
    
    showModal({
      title: 'সফলভাবে সংরক্ষিত',
      message: 'কেন্দ্রের তথ্য সফলভাবে আপডেট করা হয়েছে।',
      type: 'SUCCESS'
    });
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

  const saveEmergencyContact = () => {
    if (!tempEmergency.name || !tempEmergency.mobile) {
      showModal({
        title: 'ত্রুটি',
        message: 'অনুগ্রহ করে নাম এবং মোবাইল নম্বর উভয়ই পূরণ করুন।',
        type: 'WARNING'
      });
      return;
    }
    setEmergencyContact(tempEmergency);
    showModal({
      title: 'আপডেট সফল',
      message: 'জরুরী যোগাযোগ নম্বর সফলভাবে সেভ হয়েছে!',
      type: 'SUCCESS'
    });
  };

  useEffect(() => {
    if (view === 'ADMIN') {
      setTempEmergency(emergencyContact);
    }
  }, [view, emergencyContact]);

  // Modal Component for rendering
  const ModalPortal = () => {
    if (!modal.isOpen) return null;

    const typeIcons = {
      SUCCESS: <CheckCircleIcon className="h-16 w-16 text-emerald-500" />,
      WARNING: <ExclamationCircleIcon className="h-16 w-16 text-amber-500" />,
      DANGER: <ExclamationCircleIcon className="h-16 w-16 text-red-500" />,
      INFO: <InformationCircleIcon className="h-16 w-16 text-blue-500" />,
    };

    return (
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeInFast">
        <div className="bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl overflow-hidden animate-pop">
          <div className="p-8 text-center">
            <div className="flex justify-center mb-4">
              {typeIcons[modal.type]}
            </div>
            <h3 className="text-xl font-black text-black mb-2">{modal.title}</h3>
            <p className="text-gray-800 font-bold text-sm leading-relaxed mb-8">{modal.message}</p>
            
            <div className="flex flex-col gap-3">
              <button 
                onClick={modal.onConfirm || modal.onClose}
                className={`w-full py-4 rounded-2xl font-black text-white shadow-lg active:scale-95 transition-all ${
                  modal.type === 'DANGER' ? 'bg-red-600' : 
                  modal.type === 'SUCCESS' ? 'bg-emerald-600' :
                  modal.type === 'WARNING' ? 'bg-amber-600' : 'bg-army-green'
                }`}
              >
                {modal.confirmText}
              </button>
              {modal.showCancel && (
                <button 
                  onClick={modal.onClose}
                  className="w-full py-3 text-gray-800 font-black uppercase text-xs tracking-widest active:opacity-50 transition-all cursor-pointer"
                >
                  {modal.cancelText}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
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
            <h1 className="text-2xl font-black text-black mb-2">প্রবেশাধিকার</h1>
            <p className="text-gray-800 font-bold mb-8 uppercase tracking-widest text-[10px]">ইপিজেড আর্মি ক্যাম্প - ২০২৬</p>
            <form onSubmit={handleLogin} className="space-y-5">
              <input
                type="password"
                placeholder="পাসওয়ার্ড দিন"
                className="w-full px-4 py-4 rounded-2xl border-2 border-gray-400 focus:outline-none focus:border-army-green transition-all bg-gray-50 text-center text-xl font-black text-black cursor-text placeholder-gray-500"
                value={inputPassword}
                autoFocus
                onChange={(e) => setInputPassword(e.target.value)}
              />
              {error && <p className="text-red-700 text-xs font-black bg-red-50 py-3 rounded-xl border border-red-200">{error}</p>}
              <button
                type="submit"
                className="w-full bg-army-green hover:bg-green-900 text-white font-black py-4 rounded-2xl transition-all shadow-xl active:scale-95 text-lg cursor-pointer"
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
    <div className="min-h-screen pb-20 md:pb-8 flex flex-col bg-slate-50 overflow-x-hidden font-['Hind_Siliguri'] antialiased text-black">
      <ModalPortal />
      
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
               <a href={`tel:${emergencyContact.mobile}`} className="flex items-center justify-between p-4 bg-red-50 rounded-2xl border border-red-200 group transition-all active:scale-95">
                  <div>
                    <p className="text-[9px] font-black text-red-600 uppercase tracking-widest mb-1">{emergencyContact.name}</p>
                    <p className="font-black text-lg text-black">{emergencyContact.mobile}</p>
                  </div>
                  <div className="bg-red-600 p-3 rounded-xl text-white">
                    <PhoneIcon className="h-5 w-5" />
                  </div>
               </a>
               <button onClick={() => setShowSOS(false)} className="w-full py-2 text-gray-800 font-black uppercase tracking-widest text-[10px] cursor-pointer">বন্ধ করুন</button>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar Drawer */}
      <aside className={`fixed top-0 left-0 h-full w-72 bg-white z-[70] shadow-2xl transform transition-transform duration-300 ease-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-8 text-white relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #4b5320 0%, #2c3112 100%)' }}>
          <div className="relative z-10 text-white">
            <div className="flex justify-between items-start mb-6">
              <div className="bg-white/10 p-3 rounded-2xl backdrop-blur-2xl border border-white/20">
                   <ShieldCheckIcon className="h-8 w-8 text-white" />
              </div>
              <button onClick={toggleSidebar} className="p-2 hover:bg-white/10 rounded-full cursor-pointer">
                <XMarkIcon className="h-6 w-6 text-white" />
              </button>
            </div>
            <h2 className="text-2xl font-black mb-1">ইপিজেড আর্মি</h2>
            <p className="text-[9px] opacity-80 font-black uppercase tracking-widest">Dashboard v3.5</p>
          </div>
        </div>

        <nav className="p-4 space-y-1">
          <button onClick={goHome} className={`flex items-center gap-4 w-full p-4 rounded-xl transition-all cursor-pointer ${view === 'HOME' ? 'bg-army-green text-white font-black' : 'text-black hover:bg-gray-100 font-bold'}`}>
            <HomeIcon className="h-5 w-5" />
            <span className="text-sm">মূল পাতা</span>
          </button>
          
          <div className="border-t border-gray-100 my-4 pt-4">
            <p className="px-4 text-[9px] uppercase font-black text-black tracking-widest mb-2">নিরাপত্তা ও প্রশাসন</p>
            <button onClick={() => { isAdminLoggedIn ? setView('ADMIN') : setView('ADMIN_LOGIN'); setIsSidebarOpen(false); }} className={`flex items-center gap-4 w-full p-4 rounded-xl transition-all cursor-pointer ${view === 'ADMIN' ? 'bg-orange-600 text-white font-black' : 'text-black hover:bg-gray-100 font-bold'}`}>
              <Cog6ToothIcon className="h-5 w-5" />
              <span className="text-sm">অ্যাডমিন প্যানেল</span>
            </button>
            <button onClick={() => { exportData(); setIsSidebarOpen(false); }} className="flex items-center gap-4 w-full p-4 rounded-xl text-black hover:bg-gray-100 font-bold transition-all cursor-pointer">
              <ArrowDownTrayIcon className="h-5 w-5" />
              <span className="text-sm">ব্যাকআপ ডাটা</span>
            </button>
          </div>

          <div className="border-t border-gray-100 my-4 pt-4">
            <p className="px-4 text-[9px] uppercase font-black text-black tracking-widest mb-2">সেটিংস</p>
            <button onClick={() => { setView('SETTINGS'); setIsSidebarOpen(false); }} className={`flex items-center gap-4 w-full p-4 rounded-xl transition-all cursor-pointer ${view === 'SETTINGS' ? 'bg-blue-600 text-white font-black' : 'text-black hover:bg-gray-100 font-bold'}`}>
              <KeyIcon className="h-5 w-5" />
              <span className="text-sm">পাসওয়ার্ড পরিবর্তন</span>
            </button>
          </div>
          
          <button onClick={handleLogout} className="flex items-center gap-4 w-full p-4 rounded-xl text-red-700 hover:bg-red-50 transition-all font-black mt-8 cursor-pointer">
            <ArrowRightOnRectangleIcon className="h-5 w-5" />
            <span className="text-sm">লগআউট</span>
          </button>
        </nav>
      </aside>

      {/* Top Header */}
      <header className="bg-army-green text-white p-4 md:p-6 sticky top-0 z-50 shadow-lg border-b border-white/5 flex items-center justify-between">
        <div className="max-w-6xl mx-auto w-full flex items-center justify-between gap-4">
          <button onClick={toggleSidebar} className="p-2 hover:bg-white/10 rounded-xl transition-all flex-shrink-0 cursor-pointer">
            <Bars3Icon className="h-6 w-6 text-white" />
          </button>
          <div className="flex-1 text-center cursor-pointer" onClick={goHome}>
            <h1 className="text-base md:text-2xl font-black leading-tight tracking-tight text-white">ইপিজেড আর্মি ক্যাম্প</h1>
            <p className="text-[7px] md:text-[10px] opacity-80 uppercase tracking-widest font-black text-white">ত্রোয়োদশ সংসদ নির্বাচন ২০২৬</p>
          </div>
          <button onClick={() => setShowSOS(true)} className="p-2.5 bg-red-600 text-white rounded-xl shadow-md border border-red-500 flex-shrink-0 active:scale-95 cursor-pointer">
            <MegaphoneIcon className="h-5 w-5" />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl mx-auto w-full p-4 md:p-8 overflow-y-auto">
        {view === 'HOME' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-6 w-6 text-black" />
              </div>
              <input
                type="text"
                placeholder="নাম বা নম্বর দিয়ে খুঁজুন..."
                className="block w-full pl-16 pr-6 py-4 border-2 border-transparent rounded-2xl bg-white shadow-md focus:ring-4 focus:ring-army-green/5 outline-none text-lg font-black text-black cursor-text placeholder-gray-600"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <h2 className="text-[10px] font-black text-black uppercase tracking-widest flex items-center gap-3 col-span-full px-2 mb-2">
                <span className="bg-army-green w-6 h-1 rounded-full"></span>
                কেন্দ্রের তালিকা ({filteredCenters.length})
              </h2>
              {filteredCenters.map((center) => (
                <button
                  key={center.id}
                  onClick={() => navigateToDetails(center)}
                  className="flex flex-col gap-4 bg-white p-6 rounded-3xl shadow-sm border-2 border-transparent hover:border-army-green/10 text-left w-full active:scale-95 transition-all group cursor-pointer"
                >
                  <div className="bg-army-green/5 text-army-green font-black w-10 h-10 flex items-center justify-center rounded-xl text-lg transition-colors group-hover:bg-army-green group-hover:text-white">
                    {center.centerNumber}
                  </div>
                  <div>
                    <h3 className="font-black text-black text-lg leading-tight mb-1">{center.name}</h3>
                    <p className="text-[9px] text-gray-800 font-black uppercase tracking-widest"> বিস্তারিত তথ্য দেখুন</p>
                  </div>
                </button>
              ))}
              {filteredCenters.length === 0 && (
                <div className="col-span-full p-12 text-center text-gray-800 font-black flex flex-col items-center gap-4">
                  <ExclamationCircleIcon className="h-12 w-12 text-gray-300" />
                  <p>কোন তথ্য পাওয়া যায়নি!</p>
                </div>
              )}
            </div>
          </div>
        )}

        {view === 'SETTINGS' && (
          <div className="max-w-md mx-auto animate-fadeIn">
            <div className="bg-white p-8 rounded-3xl shadow-xl border-t-8 border-army-green">
              <h2 className="text-xl font-black mb-6 flex items-center gap-3 text-black">
                <KeyIcon className="h-6 w-6 text-army-green" />
                পাসওয়ার্ড পরিবর্তন
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-black text-black uppercase ml-1">নতুন পাসওয়ার্ড</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border-2 border-gray-400 focus:border-army-green outline-none font-black text-center cursor-text text-black placeholder-gray-500"
                    value={newPasswordValue}
                    onChange={(e) => setNewPasswordValue(e.target.value)}
                  />
                </div>
                <div className="flex gap-3">
                  <button onClick={goHome} className="flex-1 py-3 bg-slate-100 text-black rounded-xl font-black active:scale-95 cursor-pointer">বাতিল</button>
                  <button 
                    onClick={() => {
                      if (!newPasswordValue) {
                        showModal({ title: 'ত্রুটি', message: 'পাসওয়ার্ড প্রদান করুন!', type: 'WARNING' });
                        return;
                      }
                      setUserPassword(newPasswordValue);
                      setNewPasswordValue('');
                      showModal({ title: 'সাফল্য', message: 'পাসওয়ার্ড সফলভাবে পরিবর্তিত হয়েছে!', type: 'SUCCESS', onConfirm: goHome });
                    }}
                    className="flex-1 py-3 bg-army-green text-white rounded-xl font-black shadow-lg active:scale-95 cursor-pointer"
                  >
                    সেভ করুন
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {view === 'ADMIN_LOGIN' && (
          <div className="max-w-xs mx-auto mt-20 bg-white p-8 rounded-3xl shadow-xl border-t-8 border-orange-500 animate-fadeIn">
             <h2 className="text-xl font-black text-center mb-6 text-black">অ্যাডমিন কন্ট্রোল</h2>
             <form onSubmit={handleAdminLogin} className="space-y-4">
               <input type="password" placeholder="অ্যাডমিন পিন দিন" autoFocus className="w-full px-4 py-3 rounded-xl bg-slate-50 border-2 border-gray-400 focus:border-orange-500 outline-none text-center font-black cursor-text text-black placeholder-gray-500" value={inputAdminPassword} onChange={e => setInputAdminPassword(e.target.value)} />
               {adminError && <p className="text-red-700 text-[10px] text-center font-bold">{adminError}</p>}
               <button type="submit" className="w-full bg-orange-600 text-white py-3 rounded-xl font-black shadow-lg active:scale-95 cursor-pointer">প্রবেশ করুন</button>
             </form>
           </div>
        )}

        {view === 'ADMIN' && (
          <div className="space-y-6 animate-fadeIn pb-12">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-300">
                <p className="text-[10px] font-black text-black uppercase">মোট কেন্দ্র</p>
                <p className="text-3xl font-black text-black">{stats.totalCenters}</p>
              </div>
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-300">
                <p className="text-[10px] font-black text-black uppercase">মোট সদস্য</p>
                <p className="text-3xl font-black text-black">{stats.totalPersonnel}</p>
              </div>
              <button onClick={exportData} className="bg-white p-4 rounded-2xl shadow-sm border border-orange-200 flex items-center justify-between group active:scale-95 transition-all cursor-pointer">
                <span className="text-sm font-black text-orange-800">ব্যাকআপ</span>
                <ArrowDownTrayIcon className="h-6 w-6 text-orange-500 group-hover:text-orange-800 transition-colors" />
              </button>
              <button onClick={() => fileInputRef.current?.click()} className="bg-white p-4 rounded-2xl shadow-sm border border-blue-200 flex items-center justify-between group active:scale-95 transition-all cursor-pointer">
                <span className="text-sm font-black text-blue-800">রিস্টোর</span>
                <ArrowUpTrayIcon className="h-6 w-6 text-blue-500 group-hover:text-blue-800 transition-colors" />
                <input type="file" ref={fileInputRef} onChange={importData} className="hidden" accept=".json" />
              </button>
            </div>

            <div className="bg-white p-6 rounded-3xl shadow-sm border border-red-200 space-y-4">
              <h2 className="text-lg font-black text-black flex items-center gap-3">
                <MegaphoneIcon className="h-6 w-6 text-red-600" />
                জরুরী যোগাযোগ সেটিংস
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-black">
                <div>
                  <label className="text-[10px] font-black text-black uppercase ml-1">দায়িত্বপ্রাপ্তর নাম</label>
                  <input 
                    type="text" 
                    className="w-full px-4 py-2 rounded-xl bg-slate-50 border-2 border-gray-300 focus:border-red-600 outline-none font-bold cursor-text text-black" 
                    value={tempEmergency.name} 
                    onChange={e => setTempEmergency({...tempEmergency, name: e.target.value})} 
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-black uppercase ml-1">মোবাইল নম্বর</label>
                  <input 
                    type="text" 
                    className="w-full px-4 py-2 rounded-xl bg-slate-50 border-2 border-gray-300 focus:border-red-600 outline-none font-bold cursor-text text-black" 
                    value={tempEmergency.mobile} 
                    onChange={e => setTempEmergency({...tempEmergency, mobile: e.target.value})} 
                  />
                </div>
              </div>
              <button onClick={saveEmergencyContact} className="bg-red-600 text-white px-6 py-2 rounded-xl font-black shadow-md hover:bg-red-700 active:scale-95 transition-all cursor-pointer">
                জরুরী নম্বর সেভ করুন
              </button>
            </div>

            <div className="flex flex-col md:flex-row md:items-center justify-between bg-white p-6 rounded-3xl shadow-sm gap-4 border border-slate-200">
              <h2 className="text-xl font-black text-black">কেন্দ্র ব্যবস্থাপনা</h2>
              <button onClick={() => startEdit()} className="bg-army-green text-white px-6 py-3 rounded-xl font-black flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all cursor-pointer">
                <PlusIcon className="h-5 w-5" /> নতুন কেন্দ্র যোগ করুন
              </button>
            </div>

            <div className="bg-white rounded-3xl shadow-sm overflow-hidden border border-slate-300">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm min-w-[500px]">
                  <thead className="bg-slate-50 border-b border-slate-300">
                    <tr className="text-black">
                      <th className="px-6 py-4 font-black uppercase text-[10px] w-20">নং</th>
                      <th className="px-6 py-4 font-black uppercase text-[10px]">কেন্দ্রের নাম</th>
                      <th className="px-6 py-4 font-black uppercase text-[10px] text-right">অ্যাকশন</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-black">
                    {centers.map(c => (
                      <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 font-black text-army-green text-base">{c.centerNumber}</td>
                        <td className="px-6 py-4 font-bold">{c.name}</td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button onClick={() => startEdit(c)} className="p-2 text-blue-800 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors cursor-pointer border border-blue-200 shadow-sm">
                              <PencilSquareIcon className="h-5 w-5" />
                            </button>
                            <button onClick={() => deleteCenter(c.id)} className="p-2 text-red-700 bg-red-50 rounded-lg hover:bg-red-100 transition-colors cursor-pointer border border-red-200 shadow-sm">
                              <TrashIcon className="h-5 w-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {centers.length === 0 && (
                      <tr>
                        <td colSpan={3} className="px-6 py-12 text-center text-gray-800 font-bold italic">কোন কেন্দ্র যোগ করা হয়নি</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {view === 'EDIT_CENTER' && (
          <div className="max-w-2xl mx-auto animate-fadeIn pb-12">
            <div className="bg-white p-8 rounded-3xl shadow-xl border-t-8 border-army-green">
              <h2 className="text-2xl font-black mb-8 text-black flex items-center justify-between">
                <span>{centers.some(c => c.id === editCenter.id) ? 'কেন্দ্র তথ্য সংশোধন' : 'নতুন কেন্দ্র যোগ'}</span>
                <span className="text-sm bg-army-green/10 text-army-green px-3 py-1 rounded-lg font-black">কেন্দ্র নং: {editCenter.centerNumber}</span>
              </h2>
              <div className="space-y-6 text-black">
                <div>
                  <label className="text-[10px] font-black text-black uppercase ml-1">কেন্দ্রের নাম</label>
                  <input 
                    type="text" 
                    placeholder="যেমন: পতেঙ্গা উচ্চ বিদ্যালয়" 
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border-2 border-gray-400 focus:border-army-green outline-none font-black cursor-text text-black placeholder-gray-500" 
                    value={editCenter.name || ''} 
                    onChange={e => setEditCenter({ ...editCenter, name: e.target.value })} 
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black text-black uppercase ml-1">ভোট কক্ষ সংখ্যা</label>
                    <input placeholder="যেমন: ১০" className="w-full px-4 py-3 rounded-xl bg-slate-50 border-2 border-gray-400 focus:border-army-green outline-none font-bold cursor-text text-black placeholder-gray-500" value={editCenter.boothCount || ''} onChange={e => setEditCenter({ ...editCenter, boothCount: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-black uppercase ml-1">মোট ভোটার সংখ্যা</label>
                    <input placeholder="যেমন: ৫০০০" className="w-full px-4 py-3 rounded-xl bg-slate-50 border-2 border-gray-400 focus:border-army-green outline-none font-bold cursor-text text-black placeholder-gray-500" value={editCenter.voterCount || ''} onChange={e => setEditCenter({ ...editCenter, voterCount: e.target.value })} />
                  </div>
                </div>
                
                <div>
                  <label className="text-[10px] font-black text-black uppercase ml-1">অবস্থান ও তলা</label>
                  <input placeholder="যেমন: ২য় তলা, দক্ষিণ ভবন" className="w-full px-4 py-3 rounded-xl bg-slate-50 border-2 border-gray-400 focus:border-army-green outline-none font-bold cursor-text text-black placeholder-gray-500" value={editCenter.roomLocation || ''} onChange={e => setEditCenter({ ...editCenter, roomLocation: e.target.value })} />
                </div>

                <div>
                  <label className="text-[10px] font-black text-black uppercase ml-1">গুগল ম্যাপ লিংক</label>
                  <input placeholder="URL পেস্ট করুন" className="w-full px-4 py-3 rounded-xl bg-slate-50 border-2 border-gray-400 focus:border-army-green outline-none font-mono text-xs cursor-text text-black placeholder-gray-500" value={editCenter.locationLink || ''} onChange={e => setEditCenter({ ...editCenter, locationLink: e.target.value })} />
                </div>

                <div className="border-t border-slate-300 pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-black text-lg text-black">দায়িত্বপ্রাপ্ত ব্যক্তিবর্গ</h3>
                    <button onClick={addPersonToEdit} className="text-blue-800 bg-blue-50 px-4 py-1.5 rounded-xl text-xs font-black flex items-center gap-1 active:scale-95 transition-all cursor-pointer border border-blue-300">
                      <PlusIcon className="h-4 w-4" /> সদস্য যোগ করুন
                    </button>
                  </div>
                  <div className="space-y-4">
                    {(editCenter.importantPersons || []).map(p => (
                      <div key={p.id} className="p-5 bg-slate-50 rounded-2xl relative border border-gray-300 shadow-sm">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <input placeholder="নাম" className="bg-white px-4 py-2 rounded-xl border border-gray-400 text-sm font-bold cursor-text text-black placeholder-gray-500" value={p.name} onChange={e => updatePersonInEdit(p.id, 'name', e.target.value)} />
                          <input placeholder="পদবী" className="bg-white px-4 py-2 rounded-xl border border-gray-400 text-sm font-bold cursor-text text-black placeholder-gray-500" value={p.designation} onChange={e => updatePersonInEdit(p.id, 'designation', e.target.value)} />
                          <input placeholder="মোবাইল নম্বর" className="bg-white px-4 py-2 rounded-xl border border-gray-400 text-sm font-bold col-span-1 md:col-span-2 cursor-text text-black placeholder-gray-500" value={p.mobile} onChange={e => updatePersonInEdit(p.id, 'mobile', e.target.value)} />
                        </div>
                        <button onClick={() => removePersonFromEdit(p.id)} className="absolute -top-2 -right-2 bg-red-600 text-white p-1.5 rounded-full shadow-lg active:scale-90 cursor-pointer"><XMarkIcon className="h-4 w-4" /></button>
                      </div>
                    ))}
                    {(editCenter.importantPersons || []).length === 0 && (
                      <p className="text-center text-gray-800 text-xs py-4 font-bold italic">কোন সদস্য যোগ করা হয়নি</p>
                    )}
                  </div>
                </div>

                <div className="flex gap-4 pt-6">
                  <button onClick={() => setView('ADMIN')} className="flex-1 py-4 bg-slate-100 text-black rounded-2xl font-black active:scale-95 transition-all cursor-pointer shadow-sm">বাতিল</button>
                  <button onClick={saveCenter} className="flex-1 py-4 bg-army-green text-white rounded-2xl font-black shadow-lg active:scale-95 transition-all cursor-pointer">তথ্য সংরক্ষণ করুন</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {view === 'CENTER_DETAILS' && selectedCenter && (
          <div className="space-y-6 animate-fadeIn max-w-lg mx-auto pb-12">
            <div className="bg-white rounded-3xl p-8 shadow-xl border border-slate-300 text-center relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-5">
                <ShieldCheckIcon className="h-32 w-32 text-army-green" />
              </div>
              <div className="bg-army-green text-white px-4 py-1 rounded-lg text-[10px] font-black inline-block mb-4 relative z-10">কেন্দ্র নং {selectedCenter.centerNumber}</div>
              <h2 className="text-2xl font-black text-black mb-8 relative z-10 leading-tight">{selectedCenter.name}</h2>
              <div className="grid grid-cols-1 gap-4 relative z-10">
                <button onClick={() => setView('CENTER_INFO')} className="flex items-center gap-4 p-5 rounded-2xl bg-blue-50/50 border border-blue-200 text-left active:scale-95 transition-all cursor-pointer shadow-sm">
                  <div className="bg-blue-600 p-3 rounded-xl text-white shadow-md"><InformationCircleIcon className="h-6 w-6" /></div>
                  <div><h4 className="font-black text-blue-950">ভোটকেন্দ্র তথ্য</h4><p className="text-[10px] text-blue-800 font-black">বিস্তারিত বিবরণ</p></div>
                </button>
                <a href={selectedCenter.locationLink} target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 p-5 rounded-2xl bg-rose-50/50 border border-rose-200 text-left active:scale-95 transition-all cursor-pointer shadow-sm">
                  <div className="bg-rose-600 p-3 rounded-xl text-white shadow-md"><MapPinIcon className="h-6 w-6" /></div>
                  <div><h4 className="font-black text-rose-950">অবস্থান ম্যাপ</h4><p className="text-[10px] text-rose-800 font-black">গুগল ম্যাপে দেখুন</p></div>
                </a>
                <button onClick={() => setView('PERSONS')} className="flex items-center gap-4 p-5 rounded-2xl bg-emerald-50/50 border border-emerald-200 text-left active:scale-95 transition-all cursor-pointer shadow-sm">
                  <div className="bg-army-green p-3 rounded-xl text-white shadow-md"><UserGroupIcon className="h-6 w-6" /></div>
                  <div><h4 className="font-black text-emerald-950">যোগাযোগ</h4><p className="text-[10px] text-emerald-800 font-black">ব্যক্তিবর্গ ও নম্বর</p></div>
                </button>
              </div>
            </div>
          </div>
        )}

        {view === 'CENTER_INFO' && selectedCenter && (
          <div className="animate-fadeIn space-y-4 max-w-lg mx-auto pb-12">
            <div className="bg-white rounded-3xl p-8 shadow-lg border border-slate-300 text-black">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-xl font-black text-black">কেন্দ্রের তথ্যাদি</h2>
                <button onClick={goBack} className="text-gray-800 p-1 hover:text-black transition-colors cursor-pointer"><XMarkIcon className="h-6 w-6" /></button>
              </div>
              <div className="space-y-6">
                <div className="flex items-center gap-5 p-4 bg-slate-50 rounded-2xl border border-slate-300 shadow-sm">
                  <div className="p-3 bg-blue-100 rounded-xl"><InboxStackIcon className="h-6 w-6 text-blue-600" /></div>
                  <div><p className="text-[10px] font-black text-black uppercase tracking-widest">ভোট কক্ষের সংখ্যা</p><p className="font-black text-xl text-black">{selectedCenter.boothCount || 'N/A'}</p></div>
                </div>
                <div className="flex items-center gap-5 p-4 bg-slate-50 rounded-2xl border border-slate-300 shadow-sm">
                  <div className="p-3 bg-emerald-100 rounded-xl"><UserGroupIcon className="h-6 w-6 text-emerald-600" /></div>
                  <div><p className="text-[10px] font-black text-black uppercase tracking-widest">মোট ভোটার</p><p className="font-black text-xl text-black">{selectedCenter.voterCount || 'N/A'}</p></div>
                </div>
                <div className="flex items-center gap-5 p-4 bg-slate-50 rounded-2xl border border-slate-300 shadow-sm">
                  <div className="p-3 bg-rose-100 rounded-xl"><BuildingOfficeIcon className="h-6 w-6 text-rose-600" /></div>
                  <div><p className="text-[10px] font-black text-black uppercase tracking-widest">অবস্থান ও তলা</p><p className="font-black text-xl text-black leading-tight">{selectedCenter.roomLocation || 'N/A'}</p></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {view === 'PERSONS' && selectedCenter && (
          <div className="animate-fadeIn space-y-4 max-w-lg mx-auto pb-12">
            <div className="flex items-center justify-between mb-6 px-2 text-black">
              <h2 className="text-xl font-black text-black">যোগাযোগের তালিকা</h2>
              <button onClick={goBack} className="text-gray-800 p-1 hover:text-black transition-colors cursor-pointer"><XMarkIcon className="h-6 w-6" /></button>
            </div>
            <div className="space-y-4">
              {selectedCenter.importantPersons.map((p) => (
                <div key={p.id} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-300 flex items-center justify-between gap-4">
                  <div className="flex-1 text-black">
                    <h3 className="font-black text-black text-lg leading-tight">{p.name}</h3>
                    <p className="text-[10px] text-gray-900 font-black uppercase tracking-widest mt-0.5">{p.designation}</p>
                    <p className="mt-2 text-army-green font-black text-lg">{p.mobile}</p>
                  </div>
                  <div className="flex gap-2">
                    <a href={`tel:${p.mobile}`} className="p-3 bg-blue-600 text-white rounded-xl shadow-md active:scale-90 transition-transform cursor-pointer"><PhoneIcon className="h-5 w-5" /></a>
                    <a href={`https://wa.me/${p.mobile.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" className="p-3 bg-emerald-600 text-white rounded-xl shadow-md active:scale-90 transition-transform cursor-pointer"><ChatBubbleLeftRightIcon className="h-5 w-5" /></a>
                  </div>
                </div>
              ))}
              {selectedCenter.importantPersons.length === 0 && (
                <p className="text-center py-10 text-gray-800 font-bold italic">কোন যোগাযোগ নম্বর পাওয়া যায়নি</p>
              )}
            </div>
          </div>
        )}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-300 shadow-xl px-4 py-3 flex justify-between items-center z-50 md:hidden h-16">
        <button onClick={goBack} className="flex-1 flex flex-col items-center text-gray-800 active:text-army-green transition-all cursor-pointer">
          <ArrowLeftIcon className="h-6 w-6" />
          <span className="text-[8px] font-black mt-1 uppercase">পিছনে</span>
        </button>
        
        <div className="flex-1 flex justify-center -mt-8 relative z-[60]">
          <button onClick={goHome} className="bg-army-green text-white p-4 rounded-2xl shadow-xl border-4 border-slate-50 active:scale-95 transition-all cursor-pointer">
            <HomeIcon className="h-7 w-7" />
          </button>
        </div>

        <button onClick={toggleSidebar} className="flex-1 flex flex-col items-center text-gray-800 active:text-army-green transition-all cursor-pointer">
          <Bars3Icon className="h-6 w-6" />
          <span className="text-[8px] font-black mt-1 uppercase">মেনু</span>
        </button>
      </nav>

      <footer className="hidden md:block text-center py-10 text-black text-[9px] font-black uppercase tracking-[0.4em] border-t border-slate-300 mt-auto">
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
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeInFast { from { opacity: 0; } to { opacity: 1; } }
        @keyframes pop { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        .animate-fadeIn { animation: fadeIn 0.3s ease-out forwards; }
        .animate-fadeInFast { animation: fadeInFast 0.2s ease-out forwards; }
        .animate-pop { animation: pop 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
        body { -webkit-tap-highlight-color: transparent; background-color: #f8fafc; color: #000000; }
        * { box-sizing: border-box; }
        input::placeholder { font-weight: 700; color: #475569; opacity: 1; }
        main::-webkit-scrollbar { width: 0; height: 0; }
        .cursor-text { cursor: text !important; }
        .cursor-pointer { cursor: pointer !important; }
        label { color: #000000 !important; font-weight: 900 !important; }
      `}</style>
    </div>
  );
};

export default App;
