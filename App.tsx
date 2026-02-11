
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
} from '@heroicons/react/24/solid';

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
  const [centers, setCenters] = useState<VotingCenter[]>(() => {
    const saved = localStorage.getItem('voting_centers_data_v3');
    return saved ? JSON.parse(saved) : initialCenters;
  });

  const [emergencyContact, setEmergencyContact] = useState<EmergencyContact>(() => {
    const saved = localStorage.getItem('emergency_contact');
    return saved ? JSON.parse(saved) : { name: 'ক্যাম্প কমান্ডার', mobile: '01712345678' };
  });

  const [userPassword, setUserPassword] = useState(() => localStorage.getItem('app_user_password') || 'EPZArmy');
  const [adminPassword, setAdminPassword] = useState(() => localStorage.getItem('app_admin_password') || 'admin123');
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
  const [view, setView] = useState<ViewState>(() => isAdminLoggedIn ? 'ADMIN' : 'HOME');
  const [selectedCenter, setSelectedCenter] = useState<VotingCenter | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState('');
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
      confirmText: props.confirmText || 'ঠিক আছে',
      cancelText: props.cancelText || 'বাতিল',
      showCancel: props.showCancel ?? false,
      onConfirm: props.onConfirm,
      onClose: () => setModal(prev => ({ ...prev, isOpen: false }))
    });
  };

  const [editCenter, setEditCenter] = useState<Partial<VotingCenter>>({});
  const [tempEmergency, setTempEmergency] = useState<EmergencyContact>(emergencyContact);
  const [newPasswordValue, setNewPasswordValue] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const existingScript = document.getElementById('google-maps-script');
    if (!existingScript) {
      const script = document.createElement('script');
      script.id = 'google-maps-script';
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.API_KEY || ''}&libraries=places`;
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }
  }, []);

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
      message: 'ডাটা ব্যাকআপ ফাইলটি আপনার ডিভাইসে ডাউনলোড করা হয়েছে।',
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
          title: 'রিস্টোর সফল',
          message: 'তথ্য সফলভাবে অ্যাপ্লিকেশনে রিস্টোর করা হয়েছে!',
          type: 'SUCCESS'
        });
      } catch (err) {
        showModal({
          title: 'ত্রুটি',
          message: 'ভুল ফাইল ফরম্যাট! অনুগ্রহ করে সঠিক ব্যাকআপ ফাইল ব্যবহার করুন।',
          type: 'DANGER'
        });
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
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
          const filtered = prevCenters.filter(c => c.id !== id);
          return filtered.map((c, index) => ({
            ...c,
            centerNumber: toBengaliDigits((index + 1).toString().padStart(2, '0'))
          }));
        });
        if (selectedCenter?.id === id) setSelectedCenter(null);
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
      showModal({ title: 'অসম্পূর্ণ তথ্য', message: 'অনুগ্রহ করে কেন্দ্রের নাম এবং নম্বর প্রদান করুন।', type: 'WARNING' });
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
      let updated;
      if (existsIndex > -1) {
        updated = [...prev];
        updated[existsIndex] = finalCenter;
      } else {
        updated = [...prev, finalCenter];
      }
      return updated.map((c, index) => ({
        ...c,
        centerNumber: toBengaliDigits((index + 1).toString().padStart(2, '0'))
      }));
    });
    
    showModal({ title: 'সংরক্ষিত', message: 'কেন্দ্রের তথ্য সফলভাবে আপডেট করা হয়েছে।', type: 'SUCCESS' });
    setView('ADMIN');
  };

  const addPersonToEdit = () => {
    const newPerson: Person = {
      id: Date.now().toString(),
      name: '',
      designation: '',
      mobile: ''
    };
    setEditCenter(prev => ({
      ...prev,
      importantPersons: [...(prev.importantPersons || []), newPerson]
    }));
  };

  const updatePersonInEdit = (id: string, field: keyof Person, value: string) => {
    setEditCenter(prev => ({
      ...prev,
      importantPersons: (prev.importantPersons || []).map(p => 
        p.id === id ? { ...p, [field]: value } : p
      )
    }));
  };

  const removePersonFromEdit = (id: string) => {
    setEditCenter(prev => ({
      ...prev,
      importantPersons: (prev.importantPersons || []).filter(p => p.id !== id)
    }));
  };

  const handleEmergencySave = () => {
    if (!tempEmergency.name || !tempEmergency.mobile) {
      showModal({ title: 'ত্রুটি', message: 'নাম এবং মোবাইল নম্বর উভয়ই প্রয়োজন।', type: 'WARNING' });
      return;
    }
    setEmergencyContact(tempEmergency);
    showModal({ title: 'সাফল্য', message: 'জরুরী যোগাযোগ নম্বর আপডেট করা হয়েছে।', type: 'SUCCESS' });
  };

  useEffect(() => {
    if (showMapPicker && mapContainerRef.current && (window as any).google) {
      const google = (window as any).google;
      const initialPos = { lat: 22.2513, lng: 91.7915 }; // Default EPZ Area
      const mapOptions = { center: initialPos, zoom: 15, mapTypeControl: false, streetViewControl: false };
      gMapRef.current = new google.maps.Map(mapContainerRef.current, mapOptions);
      gMarkerRef.current = new google.maps.Marker({ position: initialPos, map: gMapRef.current, draggable: true, animation: google.maps.Animation.DROP });
      gMapRef.current.addListener('click', (e: any) => gMarkerRef.current.setPosition(e.latLng));
    }
  }, [showMapPicker]);

  const handleMapConfirm = () => {
    const pos = gMarkerRef.current.getPosition();
    const gMapsLink = `https://www.google.com/maps?q=${pos.lat()},${pos.lng()}`;
    setEditCenter({ ...editCenter, locationLink: gMapsLink });
    setShowMapPicker(false);
  };

  const handleMapSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mapSearchTerm || !(window as any).google) return;
    const google = (window as any).google;
    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ address: mapSearchTerm + ', Chattogram, Bangladesh' }, (results: any, status: any) => {
      if (status === 'OK' && results[0]) {
        const pos = results[0].geometry.location;
        gMapRef.current.setCenter(pos);
        gMapRef.current.setZoom(17);
        gMarkerRef.current.setPosition(pos);
      }
    });
  };

  const getMapEmbedUrl = (link: string) => {
    const match = link?.match(/q=([\d.]+),([\d.]+)/);
    return match ? `https://maps.google.com/maps?q=${match[1]},${match[2]}&hl=bn&z=15&output=embed` : null;
  };

  const ModalPortal = () => {
    if (!modal.isOpen) return null;
    const icons = {
      SUCCESS: <CheckCircleIcon className="h-16 w-16 text-emerald-500" />,
      WARNING: <ExclamationCircleIcon className="h-16 w-16 text-amber-500" />,
      DANGER: <ExclamationCircleIcon className="h-16 w-16 text-red-500" />,
      INFO: <InformationCircleIcon className="h-16 w-16 text-blue-500" />,
    };
    return (
      <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md animate-fadeIn">
        <div className="bg-white w-full max-w-sm rounded-[42px] shadow-2xl overflow-hidden animate-pop p-10 text-center border border-slate-100">
            <div className="flex justify-center mb-6">{icons[modal.type]}</div>
            <h3 className="text-2xl font-bold text-slate-900 mb-3 tracking-tight">{modal.title}</h3>
            <p className="text-slate-500 font-medium text-base leading-relaxed mb-10">{modal.message}</p>
            <div className="flex flex-col gap-4">
              <button onClick={modal.onConfirm || modal.onClose} className={`w-full py-5 rounded-2xl font-bold text-white btn-shadow active:scale-95 transition-all ${modal.type === 'DANGER' ? 'bg-red-600' : modal.type === 'SUCCESS' ? 'bg-emerald-600' : modal.type === 'WARNING' ? 'bg-amber-500' : 'bg-army-green'}`}>{modal.confirmText}</button>
              {modal.showCancel && <button onClick={modal.onClose} className="w-full py-3 text-slate-400 font-bold uppercase text-xs tracking-[0.2em] active:opacity-50"> বাতিল </button>}
            </div>
        </div>
      </div>
    );
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6 overflow-hidden">
        <div className="max-w-md w-full glass rounded-[60px] shadow-2xl border-t-[14px] border-army-green animate-fadeIn p-12 text-center overflow-hidden relative">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-army-gold/10 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-army-green/10 rounded-full blur-3xl"></div>
          <div className="relative z-10">
            <div className="mb-10 flex justify-center">
              <div className="bg-army-green p-9 rounded-[40px] shadow-2xl border-2 border-white/20">
                <ShieldCheckIcon className="h-16 w-16 text-army-gold" />
              </div>
            </div>
            <h1 className="text-3xl font-black text-slate-900 mb-2 tracking-tight">সুরক্ষিত প্রবেশ</h1>
            <p className="text-slate-400 font-bold mb-14 text-[11px] tracking-[0.5em] uppercase">ইপিজেড আর্মি ক্যাম্প</p>
            <form onSubmit={handleLogin} className="space-y-10">
              <div className="relative group">
                <LockClosedIcon className="h-6 w-6 text-slate-300 absolute left-8 top-1/2 -translate-y-1/2 group-focus-within:text-army-green transition-colors" />
                <input type="password" placeholder="পাসওয়ার্ড দিন" className="w-full pl-20 pr-8 py-6 rounded-[32px] border-2 border-slate-50 focus:outline-none focus:border-army-green transition-all bg-white shadow-inner text-center text-3xl font-black text-army-green tracking-[0.4em] placeholder:text-slate-200 placeholder:tracking-normal placeholder:font-bold placeholder:text-xl" value={inputPassword} autoFocus onChange={(e) => setInputPassword(e.target.value)} />
              </div>
              {error && <p className="text-red-500 text-sm font-bold animate-shake bg-red-50 py-4 rounded-2xl border border-red-100">{error}</p>}
              <button type="submit" className="w-full bg-army-green hover:bg-emerald-950 text-white font-black py-6 rounded-[32px] transition-all shadow-2xl active:scale-[0.98] text-xl btn-shadow border-b-4 border-emerald-950">ভেরিফাই করুন</button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-36 md:pb-24 flex flex-col bg-[#fdfdfd]">
      <ModalPortal />
      
      {showMapPicker && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xl animate-fadeIn">
          <div className="bg-white w-full max-w-2xl rounded-[50px] overflow-hidden shadow-2xl flex flex-col max-h-[92vh] border border-slate-200">
            <div className="p-8 bg-army-green text-white flex justify-between items-center border-b border-white/10">
                <h3 className="font-bold text-2xl flex items-center gap-4"><MapPinIcon className="h-8 w-8 text-army-gold" /> ম্যাপ অবস্থান</h3>
                <button onClick={() => setShowMapPicker(false)} className="hover:rotate-90 transition-all p-3 bg-white/10 rounded-full"><XMarkIcon className="h-8 w-8" /></button>
            </div>
            <div className="p-8 bg-slate-50 border-b">
               <form onSubmit={handleMapSearch} className="flex gap-4">
                 <input type="text" className="flex-1 px-8 py-5 rounded-[24px] border-2 border-slate-200 focus:border-army-green outline-none font-bold shadow-sm" placeholder="জায়গার নাম..." value={mapSearchTerm} onChange={e => setMapSearchTerm(e.target.value)} />
                 <button type="submit" className="bg-army-gold text-white px-10 py-5 rounded-[24px] font-bold shadow-lg active:scale-95 transition-all border-b-4 border-amber-700">খুঁজুন</button>
               </form>
            </div>
            <div ref={mapContainerRef} className="flex-1 w-full min-h-[400px]"></div>
            <div className="p-10 bg-white border-t flex gap-6">
              <button onClick={() => setShowMapPicker(false)} className="flex-1 py-6 bg-slate-100 text-slate-500 rounded-[24px] font-bold hover:bg-slate-200 transition-all">বাতিল</button>
              <button onClick={handleMapConfirm} className="flex-1 py-6 bg-army-green text-white rounded-[24px] font-bold shadow-2xl active:scale-95 transition-all border-b-4 border-emerald-950">নিশ্চিত করুন</button>
            </div>
          </div>
        </div>
      )}

      {showSOS && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-2xl animate-fadeIn">
          <div className="bg-white w-full max-w-sm rounded-[60px] overflow-hidden shadow-2xl border border-red-50 relative">
            <div className="bg-gradient-to-br from-red-600 to-red-800 p-14 text-center text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
              <div className="bg-white p-8 rounded-full inline-block mb-8 animate-bounce shadow-2xl border-4 border-red-400">
                <MegaphoneIcon className="h-20 w-20 text-red-600" />
              </div>
              <h2 className="text-4xl font-black mb-2 tracking-tight">জরুরী সাহায্য</h2>
              <p className="text-[12px] opacity-70 font-bold uppercase tracking-[0.5em]">সরাসরি কল দিন</p>
            </div>
            <div className="p-12 space-y-8">
               <a href={`tel:${emergencyContact.mobile}`} className="flex items-center justify-between p-8 bg-red-50 rounded-[40px] border-2 border-red-100 group transition-all active:scale-95 hover:bg-red-100 shadow-sm">
                  <div className="text-left">
                    <p className="text-[12px] font-bold text-red-600 uppercase tracking-widest mb-2">{emergencyContact.name}</p>
                    <p className="font-black text-3xl text-slate-900 tracking-tight">{emergencyContact.mobile}</p>
                  </div>
                  <div className="bg-red-600 p-6 rounded-[30px] text-white shadow-2xl shadow-red-200 group-hover:rotate-12 transition-transform border-b-4 border-red-800">
                    <PhoneIcon className="h-9 w-9" />
                  </div>
               </a>
               <button onClick={() => setShowSOS(false)} className="w-full py-5 text-slate-400 font-bold uppercase tracking-[0.3em] text-[12px] hover:text-slate-600 transition-colors">ফিরে যান</button>
            </div>
          </div>
        </div>
      )}

      <aside className={`fixed top-0 left-0 h-full w-80 bg-white z-[300] shadow-2xl transform transition-transform duration-500 cubic-bezier(0.4, 0, 0.2, 1) ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} border-r`}>
        <div className="p-12 bg-army-green text-white relative overflow-hidden h-64 flex flex-col justify-end">
            <div className="absolute top-10 right-10 z-20">
                <button onClick={toggleSidebar} className="p-4 hover:bg-white/20 rounded-full transition-all bg-white/10"><XMarkIcon className="h-7 w-7" /></button>
            </div>
            <div className="relative z-10">
                <div className="bg-army-gold inline-block p-5 rounded-[30px] shadow-2xl mb-5 border-2 border-white/20">
                    <ShieldCheckIcon className="h-8 w-8 text-white" />
                </div>
                <h2 className="text-3xl font-black tracking-tight">ইপিজেড আর্মি</h2>
                <p className="text-[11px] opacity-60 font-bold tracking-[0.3em] uppercase mt-1">Election Portal v6.0</p>
            </div>
            <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-army-gold/10 rounded-full blur-3xl"></div>
        </div>
        <nav className="p-10 space-y-4">
          <button onClick={goHome} className={`flex items-center gap-6 w-full p-6 rounded-3xl transition-all ${view === 'HOME' ? 'bg-army-green text-white font-black shadow-2xl shadow-army-green/30' : 'text-slate-600 hover:bg-slate-100 font-bold'}`}>
            <HomeIcon className="h-7 w-7" /> <span className="text-lg">মূল পাতা</span>
          </button>
          <div className="pt-10">
            <p className="px-6 text-[12px] uppercase font-black text-slate-400 tracking-[0.3em] mb-6">প্রশাসন</p>
            <button onClick={() => { isAdminLoggedIn ? setView('ADMIN') : setView('ADMIN_LOGIN'); setIsSidebarOpen(false); }} className={`flex items-center gap-6 w-full p-6 rounded-3xl transition-all ${view === 'ADMIN' ? 'bg-army-green text-white font-black shadow-2xl' : 'text-slate-600 hover:bg-slate-100 font-bold'}`}>
              <Cog6ToothIcon className="h-7 w-7" /> <span className="text-lg">অ্যাডমিন প্যানেল</span>
            </button>
            <button onClick={() => { exportData(); setIsSidebarOpen(false); }} className="flex items-center gap-6 w-full p-6 rounded-3xl text-slate-600 hover:bg-slate-100 font-bold transition-all">
              <ArrowDownTrayIcon className="h-7 w-7" /> <span className="text-lg">ডাটা ব্যাকআপ</span>
            </button>
          </div>
          <div className="pt-10">
            <p className="px-6 text-[12px] uppercase font-black text-slate-400 tracking-[0.3em] mb-6">সেটিংস</p>
            <button onClick={() => { setView('SETTINGS'); setIsSidebarOpen(false); }} className={`flex items-center gap-6 w-full p-6 rounded-3xl transition-all ${view === 'SETTINGS' ? 'bg-army-green text-white font-black shadow-2xl' : 'text-slate-600 hover:bg-slate-100 font-bold'}`}>
              <KeyIcon className="h-7 w-7" /> <span className="text-lg">পাসওয়ার্ড পরিবর্তন</span>
            </button>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-6 w-full p-6 rounded-3xl text-red-600 hover:bg-red-50 transition-all font-black mt-16 border-2 border-transparent hover:border-red-100 shadow-sm">
            <ArrowRightOnRectangleIcon className="h-7 w-7" /> <span className="text-lg">লগআউট</span>
          </button>
        </nav>
      </aside>

      <header className="bg-army-green text-white px-8 py-10 md:py-14 sticky top-0 z-[200] shadow-2xl flex items-center justify-between border-b border-white/5 glass bg-army-green/95">
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between gap-8">
          <button onClick={toggleSidebar} className="p-5 hover:bg-white/10 rounded-[24px] transition-all flex-shrink-0 bg-white/5 border border-white/10">
            <Bars3Icon className="h-9 w-9" />
          </button>
          <div className="flex-1 text-center cursor-pointer group" onClick={goHome}>
            <h1 className="text-3xl md:text-5xl font-black leading-tight tracking-tight text-white group-hover:text-army-gold transition-all">ইপিজেড আর্মি ক্যাম্প</h1>
            <p className="text-[10px] md:text-[13px] opacity-60 uppercase tracking-[0.5em] font-black mt-2">ত্রোয়োদশ জাতীয় সংসদ নির্বাচন ২০২৬</p>
          </div>
          <button onClick={() => setShowSOS(true)} className="p-5 bg-red-600 text-white rounded-[24px] shadow-2xl flex-shrink-0 active:scale-90 transition-all hover:bg-red-500 border-2 border-red-400 btn-shadow">
            <MegaphoneIcon className="h-8 w-8" />
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full p-8 md:p-16 overflow-x-hidden">
        {view === 'HOME' && (
          <div className="space-y-16 animate-fadeIn">
            <div className="relative group max-w-4xl mx-auto">
              <div className="absolute inset-y-0 left-0 pl-9 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-8 w-8 text-slate-300 group-focus-within:text-army-green transition-colors" />
              </div>
              <input type="text" placeholder="ভোট কেন্দ্রের নাম বা নম্বর দিন..." className="block w-full pl-20 pr-10 py-8 border-2 border-slate-50 rounded-[40px] bg-white shadow-2xl focus:ring-[12px] focus:ring-army-green/5 focus:border-army-green focus:outline-none text-2xl font-bold text-slate-900 transition-all placeholder:text-slate-200" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
              <div className="col-span-full flex items-center gap-6 mb-6 px-4">
                 <div className="h-12 w-3 bg-army-gold rounded-full shadow-lg"></div>
                 <h2 className="text-3xl font-black text-slate-800 tracking-tight">ভোট কেন্দ্র সমূহ ({toBengaliDigits(filteredCenters.length)})</h2>
              </div>
              {filteredCenters.map((center, idx) => (
                <button key={center.id} onClick={() => navigateToDetails(center)} className={`army-card p-12 text-left group animate-fadeInUp delay-${(idx % 3) * 100}`}>
                  <div className="flex justify-between items-start mb-10">
                    <div className="bg-army-green text-army-gold font-black w-16 h-16 flex items-center justify-center rounded-[24px] text-3xl shadow-xl transition-all group-hover:scale-110 border-2 border-white/20">
                        {center.centerNumber}
                    </div>
                    <MapIcon className="h-8 w-8 text-slate-100 group-hover:text-army-green transition-colors" />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900 text-3xl leading-snug mb-3 group-hover:text-army-green transition-colors">{center.name}</h3>
                    <div className="flex items-center gap-3 text-slate-300 font-black uppercase tracking-[0.2em] text-[11px] group-hover:text-army-gold transition-all">
                        <span>বিস্তারিত দেখুন</span>
                        <ArrowLeftIcon className="h-4 w-4 rotate-180" />
                    </div>
                  </div>
                </button>
              ))}
              {filteredCenters.length === 0 && (
                <div className="col-span-full p-28 text-center bg-white rounded-[60px] border-2 border-dashed border-slate-100 text-slate-300 font-black flex flex-col items-center gap-8 shadow-inner">
                  <ExclamationCircleIcon className="h-24 w-24 opacity-10" />
                  <p className="text-2xl tracking-tight">দুঃখিত, কোনো ফলাফল পাওয়া যায়নি!</p>
                </div>
              )}
            </div>
          </div>
        )}

        {view === 'CENTER_DETAILS' && selectedCenter && (
          <div className="space-y-12 animate-fadeIn max-w-4xl mx-auto pb-16">
            <button onClick={goBack} className="flex items-center gap-4 text-slate-400 font-black hover:text-army-green transition-all group p-3 bg-white rounded-full shadow-sm w-fit pr-6">
                <div className="p-2 bg-slate-50 rounded-full group-hover:-translate-x-1 transition-transform"><ArrowLeftIcon className="h-7 w-7" /></div> ফিরে যান
            </button>
            <div className="bg-white rounded-[60px] p-12 md:p-20 shadow-2xl border-t-[20px] border-army-green text-center relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-2 bg-army-gold/20"></div>
              <div className="inline-flex items-center gap-4 bg-army-green text-army-gold px-8 py-3.5 rounded-full text-[13px] font-black mb-10 shadow-lg border-2 border-white/10">
                <BuildingOfficeIcon className="h-6 w-6" /> কেন্দ্র নম্বর {selectedCenter.centerNumber}
              </div>
              <h2 className="text-4xl md:text-6xl font-black text-slate-900 mb-14 leading-tight tracking-tight">{selectedCenter.name}</h2>
              <div className="mb-14 rounded-[50px] overflow-hidden border-[12px] border-slate-50 relative bg-slate-100 aspect-video group shadow-2xl">
                {getMapEmbedUrl(selectedCenter.locationLink) ? (
                   <iframe title="Location" className="w-full h-full border-none transition-all duration-1000 group-hover:scale-105" src={getMapEmbedUrl(selectedCenter.locationLink)!} allowFullScreen loading="lazy"></iframe>
                ) : (
                   <div className="w-full h-full flex flex-col items-center justify-center font-black text-slate-300 gap-6">
                     <ExclamationCircleIcon className="h-20 w-20 opacity-10" /> 
                     <span className="text-lg tracking-widest uppercase">ম্যাপ লিংক অনুপস্থিত</span>
                   </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <button onClick={() => setView('CENTER_INFO')} className="flex flex-col items-center gap-6 p-10 rounded-[40px] bg-slate-50 border-2 border-transparent hover:border-army-green hover:bg-white transition-all group active:scale-[0.96] shadow-sm">
                  <div className="bg-army-green p-6 rounded-[28px] text-army-gold shadow-2xl group-hover:rotate-12 transition-transform border-b-4 border-emerald-950"><InformationCircleIcon className="h-10 w-10" /></div>
                  <div className="text-center">
                    <h4 className="font-black text-slate-900 text-2xl">ভোটকেন্দ্রের তথ্যাদি</h4>
                    <p className="text-[12px] text-slate-400 font-bold tracking-[0.2em] uppercase mt-2">কক্ষ ও ভোটার</p>
                  </div>
                </button>
                <a href={selectedCenter.locationLink} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-6 p-10 rounded-[40px] bg-slate-50 border-2 border-transparent hover:border-army-green hover:bg-white transition-all group active:scale-[0.96] shadow-sm">
                  <div className="bg-army-green p-6 rounded-[28px] text-army-gold shadow-2xl group-hover:rotate-12 transition-transform border-b-4 border-emerald-950"><MapPinIcon className="h-10 w-10" /></div>
                  <div className="text-center">
                    <h4 className="font-black text-slate-900 text-2xl">ম্যাপ অবস্থান</h4>
                    <p className="text-[12px] text-slate-400 font-bold tracking-[0.2em] uppercase mt-2">গুগল ম্যাপে দেখুন</p>
                  </div>
                </a>
                <button onClick={() => setView('PERSONS')} className="flex flex-col items-center gap-6 p-10 rounded-[40px] bg-slate-50 border-2 border-transparent hover:border-army-green hover:bg-white transition-all group active:scale-[0.96] shadow-sm">
                  <div className="bg-army-green p-6 rounded-[28px] text-army-gold shadow-2xl group-hover:rotate-12 transition-transform border-b-4 border-emerald-950"><UserGroupIcon className="h-10 w-10" /></div>
                  <div className="text-center">
                    <h4 className="font-black text-slate-900 text-2xl">গুরুত্বপুর্ণ ব্যক্তিবর্গ</h4>
                    <p className="text-[12px] text-slate-400 font-bold tracking-[0.2em] uppercase mt-2">নাম ও যোগাযোগ</p>
                  </div>
                </button>
              </div>
            </div>
          </div>
        )}

        {view === 'CENTER_INFO' && selectedCenter && (
          <div className="animate-fadeIn space-y-12 max-w-3xl mx-auto pb-16">
            <button onClick={goBack} className="flex items-center gap-4 text-slate-400 font-black hover:text-army-green transition-all group p-2">
                <ArrowLeftIcon className="h-7 w-7" /> ফিরে যান
            </button>
            <div className="bg-white rounded-[60px] p-14 shadow-2xl border-t-[20px] border-army-green relative overflow-hidden">
              <div className="absolute top-0 right-0 w-40 h-40 bg-army-green/5 rounded-full -mr-10 -mt-10"></div>
              <h2 className="text-4xl font-black text-slate-900 mb-14 flex items-center gap-5">
                <InformationCircleIcon className="h-12 w-12 text-army-green" /> ভোটকেন্দ্রের বিবরণ
              </h2>
              <div className="space-y-8">
                <div className="flex items-center gap-10 p-10 bg-slate-50 rounded-[48px] border border-slate-100 shadow-sm">
                  <div className="p-7 bg-army-green rounded-[30px] shadow-2xl text-army-gold border-b-4 border-emerald-950"><InboxStackIcon className="h-12 w-12" /></div>
                  <div>
                    <p className="text-[13px] font-black text-slate-400 uppercase tracking-[0.3em] mb-3">ভোট কক্ষের সংখ্যা</p>
                    <p className="font-black text-5xl text-slate-900 tracking-tight">{toBengaliDigits(selectedCenter.boothCount)} <span className="text-xl opacity-40 font-bold uppercase">টি</span></p>
                  </div>
                </div>
                <div className="flex items-center gap-10 p-10 bg-slate-50 rounded-[48px] border border-slate-100 shadow-sm">
                  <div className="p-7 bg-army-green rounded-[30px] shadow-2xl text-army-gold border-b-4 border-emerald-950"><UserGroupIcon className="h-12 w-12" /></div>
                  <div>
                    <p className="text-[13px] font-black text-slate-400 uppercase tracking-[0.3em] mb-3">মোট ভোটার সংখ্যা</p>
                    <p className="font-black text-5xl text-slate-900 tracking-tight">{toBengaliDigits(selectedCenter.voterCount)} <span className="text-xl opacity-40 font-bold uppercase">জন</span></p>
                  </div>
                </div>
                <div className="flex items-center gap-10 p-10 bg-slate-50 rounded-[48px] border border-slate-100 shadow-sm">
                  <div className="p-7 bg-army-green rounded-[30px] shadow-2xl text-army-gold border-b-4 border-emerald-950"><BuildingOfficeIcon className="h-12 w-12" /></div>
                  <div>
                    <p className="text-[13px] font-black text-slate-400 uppercase tracking-[0.3em] mb-3">অবস্থান ও ভবন</p>
                    <p className="font-black text-3xl text-slate-900 leading-tight tracking-tight">{selectedCenter.roomLocation}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {view === 'PERSONS' && selectedCenter && (
          <div className="animate-fadeIn space-y-12 max-w-3xl mx-auto pb-16">
            <button onClick={goBack} className="flex items-center gap-4 text-slate-400 font-black hover:text-army-green transition-all group p-2">
                <ArrowLeftIcon className="h-7 w-7" /> ফিরে যান
            </button>
            <div className="space-y-8">
              <div className="flex items-center gap-6 mb-10 px-8">
                 <div className="h-14 w-3.5 bg-army-gold rounded-full shadow-lg"></div>
                 <h2 className="text-4xl font-black text-slate-800 tracking-tight">গুরুত্বপুর্ণ ব্যক্তিবর্গ</h2>
              </div>
              {selectedCenter.importantPersons.map((p, idx) => (
                <div key={p.id} className={`bg-white rounded-[50px] p-10 flex flex-col sm:flex-row items-center justify-between gap-10 shadow-2xl border-l-[16px] border-army-green group animate-fadeInUp delay-${idx * 100}`}>
                  <div className="flex-1 text-center sm:text-left">
                    <h3 className="font-black text-slate-900 text-3xl mb-3 group-hover:text-army-green transition-all tracking-tight">{p.name}</h3>
                    <p className="text-[12px] text-slate-400 font-bold uppercase tracking-[0.4em] mb-7">{p.designation}</p>
                    <div className="inline-flex items-center gap-4 bg-slate-50 px-8 py-4 rounded-3xl font-black text-army-green text-2xl border-2 border-slate-100 shadow-inner group-hover:bg-white transition-colors">
                        <PhoneIcon className="h-7 w-7 opacity-30" /> {p.mobile}
                    </div>
                  </div>
                  <div className="flex gap-6">
                    <a href={`tel:${p.mobile}`} className="p-7 bg-army-green text-army-gold rounded-[32px] shadow-2xl active:scale-90 transition-all hover:bg-emerald-950 border-2 border-white/10 btn-shadow">
                        <PhoneIcon className="h-9 w-9" />
                    </a>
                    <a href={`https://wa.me/${p.mobile.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" className="p-7 bg-army-gold text-white rounded-[32px] shadow-xl active:scale-90 transition-all hover:brightness-110 border-2 border-white/10 btn-shadow border-b-4 border-amber-700">
                        <ChatBubbleLeftRightIcon className="h-9 w-9" />
                    </a>
                  </div>
                </div>
              ))}
              {selectedCenter.importantPersons.length === 0 && (
                <div className="p-20 text-center bg-white rounded-[50px] border-2 border-dashed border-slate-100 text-slate-300 font-black flex flex-col items-center gap-6">
                   <UserGroupIcon className="h-20 w-20 opacity-10" />
                   <p className="text-xl">কোনো তথ্য পাওয়া যায়নি!</p>
                </div>
              )}
            </div>
          </div>
        )}

        {view === 'ADMIN_LOGIN' && (
          <div className="max-w-lg mx-auto mt-24 bg-white p-14 rounded-[70px] shadow-2xl border-t-[16px] border-army-gold animate-fadeIn relative overflow-hidden">
             <div className="absolute -top-10 -right-10 w-40 h-40 bg-army-gold/10 rounded-full blur-3xl"></div>
             <div className="text-center mb-14 relative z-10">
                <div className="bg-army-green p-9 inline-block rounded-[42px] mb-8 shadow-2xl border-2 border-army-gold/40 relative">
                    <div className="absolute inset-0 bg-army-gold/10 animate-pulse rounded-[42px]"></div>
                    <Cog6ToothIcon className="h-16 w-16 text-army-gold relative z-10" />
                </div>
                <h2 className="text-4xl font-black text-slate-900 tracking-tight">অ্যাডমিন কন্ট্রোল</h2>
                <p className="text-slate-400 font-bold text-[11px] tracking-[0.5em] uppercase mt-3">সুরক্ষিত এক্সেস ভেরিফিকেশন</p>
             </div>
             <form onSubmit={handleAdminLogin} className="space-y-10 relative z-10">
               <div className="relative group">
                 <KeyIcon className="h-7 w-7 text-slate-200 absolute left-8 top-1/2 -translate-y-1/2 group-focus-within:text-army-gold transition-colors" />
                 <input type="password" placeholder="পিন কোড" autoFocus className="w-full px-10 py-7 rounded-[32px] bg-slate-50 border-2 border-slate-100 focus:border-army-gold outline-none text-center font-black text-4xl tracking-[0.5em] text-slate-900 shadow-inner placeholder:text-slate-200 placeholder:tracking-normal placeholder:font-bold placeholder:text-2xl" value={inputAdminPassword} onChange={e => setInputAdminPassword(e.target.value)} />
               </div>
               {adminError && <p className="text-red-500 text-sm text-center font-bold bg-red-50 py-4 rounded-3xl border border-red-100">{adminError}</p>}
               <button type="submit" className="w-full bg-army-green text-white py-7 rounded-[32px] font-black shadow-2xl hover:bg-emerald-950 transition-all active:scale-95 text-xl border-b-4 border-emerald-950">লগইন করুন</button>
             </form>
           </div>
        )}

        {view === 'ADMIN' && (
          <div className="space-y-16 animate-fadeIn pb-32">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                <div className="bg-army-green p-12 rounded-[50px] text-white shadow-2xl relative overflow-hidden group border-2 border-army-gold/20">
                    <div className="absolute -bottom-10 -right-10 h-44 w-44 bg-white/5 rounded-full blur-2xl group-hover:scale-150 transition-transform"></div>
                    <BuildingOfficeIcon className="absolute -bottom-8 -right-8 h-40 w-40 opacity-10 group-hover:scale-110 transition-all" />
                    <p className="text-[12px] font-black text-army-gold uppercase tracking-[0.3em] mb-4">মোট ভোট কেন্দ্র</p>
                    <p className="text-6xl font-black tracking-tighter">{toBengaliDigits(stats.totalCenters)} <span className="text-2xl font-bold opacity-60">টি</span></p>
                </div>
                <div className="bg-white p-12 rounded-[50px] text-slate-900 shadow-2xl border-l-[20px] border-army-gold relative overflow-hidden group border border-slate-100">
                    <UserGroupIcon className="absolute -bottom-8 -right-8 h-40 w-40 opacity-5 group-hover:scale-110 transition-all" />
                    <p className="text-[12px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4">মোট জনবল</p>
                    <p className="text-6xl font-black tracking-tighter">{toBengaliDigits(stats.totalPersonnel)} <span className="text-2xl font-bold opacity-60">জন</span></p>
                </div>
                <button onClick={exportData} className="bg-white p-10 rounded-[50px] shadow-2xl border border-slate-100 flex items-center justify-between group active:scale-95 transition-all hover:bg-slate-50 hover:border-army-green/20">
                    <div className="text-left">
                        <span className="text-2xl font-black text-slate-800 block tracking-tight">ব্যাকআপ</span>
                        <span className="text-[11px] text-slate-400 font-bold uppercase tracking-[0.2em]">ডাটা ডাউনলোড</span>
                    </div>
                    <div className="bg-army-green/5 p-5 rounded-[28px] group-hover:bg-army-green group-hover:text-white transition-all shadow-sm">
                      <ArrowDownTrayIcon className="h-10 w-10 text-army-green group-hover:text-white group-hover:translate-y-1 transition-all" />
                    </div>
                </button>
                <button onClick={() => fileInputRef.current?.click()} className="bg-white p-10 rounded-[50px] shadow-2xl border border-slate-100 flex items-center justify-between group active:scale-95 transition-all relative overflow-hidden hover:bg-slate-50 hover:border-blue-200">
                    <div className="text-left">
                        <span className="text-2xl font-black text-slate-800 block tracking-tight">রিস্টোর</span>
                        <span className="text-[11px] text-slate-400 font-bold uppercase tracking-[0.2em]">তথ্য আপলোড</span>
                    </div>
                    <div className="bg-blue-50 p-5 rounded-[28px] group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
                      <ArrowUpTrayIcon className="h-10 w-10 text-blue-600 group-hover:text-white group-hover:-translate-y-1 transition-all" />
                    </div>
                    <input type="file" ref={fileInputRef} onChange={importData} className="hidden" accept=".json" />
                </button>
            </div>

            {/* Emergency Contact Management Section */}
            <div className="bg-white p-12 md:p-16 rounded-[60px] shadow-2xl border-l-[20px] border-red-600 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-red-50 rounded-full blur-3xl opacity-50"></div>
                <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-12 relative z-10">
                    <div>
                        <h2 className="text-3xl font-black text-slate-900 flex items-center gap-5 tracking-tight">
                            <MegaphoneIcon className="h-10 w-10 text-red-600 animate-pulse" /> জরুরী যোগাযোগ পরিবর্তন
                        </h2>
                        <p className="text-slate-400 font-bold text-sm uppercase tracking-[0.2em] mt-3">SOS বাটনের জন্য সংরক্ষিত তথ্য</p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-6 flex-1 max-w-3xl">
                        <div className="flex-1 relative">
                          <UserGroupIcon className="h-5 w-5 text-slate-300 absolute left-6 top-1/2 -translate-y-1/2" />
                          <input type="text" placeholder="পদবী (উদাঃ ক্যাম্প কমান্ডার)" className="w-full pl-16 pr-6 py-5 rounded-[24px] border-2 border-slate-100 focus:border-red-600 outline-none font-bold bg-slate-50 shadow-inner" value={tempEmergency.name} onChange={e => setTempEmergency({ ...tempEmergency, name: e.target.value })} />
                        </div>
                        <div className="flex-1 relative">
                          <PhoneIcon className="h-5 w-5 text-slate-300 absolute left-6 top-1/2 -translate-y-1/2" />
                          <input type="text" placeholder="মোবাইল নম্বর" className="w-full pl-16 pr-6 py-5 rounded-[24px] border-2 border-slate-100 focus:border-red-600 outline-none font-bold bg-slate-50 shadow-inner" value={tempEmergency.mobile} onChange={e => setTempEmergency({ ...tempEmergency, mobile: e.target.value })} />
                        </div>
                        <button onClick={handleEmergencySave} className="bg-red-600 text-white px-10 py-5 rounded-[24px] font-black hover:bg-red-700 active:scale-95 transition-all shadow-2xl shadow-red-200 border-b-4 border-red-800 text-lg">সেভ করুন</button>
                    </div>
                </div>
            </div>

            <div className="bg-white p-12 md:p-16 rounded-[60px] shadow-2xl border-l-[20px] border-army-green flex flex-col md:flex-row md:items-center justify-between gap-10">
                <div>
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight">ভোট কেন্দ্র ডাটাবেস</h2>
                    <p className="text-slate-400 font-bold text-sm uppercase tracking-[0.2em] mt-3">নতুন কেন্দ্র যোগ বা তথ্য সংশোধন</p>
                </div>
                <button onClick={() => startEdit()} className="bg-army-green hover:bg-emerald-950 text-white px-12 py-6 rounded-[30px] font-black flex items-center justify-center gap-5 shadow-2xl shadow-army-green/30 active:scale-95 transition-all text-xl border-b-4 border-emerald-950">
                    <PlusIcon className="h-8 w-8 text-army-gold" /> নতুন কেন্দ্র যোগ
                </button>
            </div>

            <div className="bg-white rounded-[60px] shadow-2xl overflow-hidden border border-slate-100">
              <div className="overflow-x-auto">
                <table className="w-full text-left min-w-[700px]">
                  <thead className="bg-slate-50 border-b-2 border-slate-100">
                    <tr>
                      <th className="px-12 py-8 font-black uppercase text-[12px] text-slate-400 tracking-[0.3em] w-36">নম্বর</th>
                      <th className="px-12 py-8 font-black uppercase text-[12px] text-slate-400 tracking-[0.3em]">কেন্দ্রের নাম</th>
                      <th className="px-12 py-8 font-black uppercase text-[12px] text-slate-400 tracking-[0.3em] text-right">অ্যাকশন</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {centers.map(c => (
                      <tr key={c.id} className="hover:bg-slate-50/70 transition-colors group">
                        <td className="px-12 py-10 font-black text-army-green text-3xl">{c.centerNumber}</td>
                        <td className="px-12 py-10 font-black text-slate-800 text-2xl tracking-tight">{c.name}</td>
                        <td className="px-12 py-10">
                          <div className="flex justify-end gap-5">
                            <button onClick={() => startEdit(c)} className="p-5 text-army-green bg-slate-100 rounded-[24px] hover:bg-army-green hover:text-white hover:shadow-2xl transition-all active:scale-90 border-2 border-transparent"><PencilSquareIcon className="h-7 w-7" /></button>
                            <button onClick={() => deleteCenter(c.id)} className="p-5 text-red-600 bg-red-50 rounded-[24px] hover:bg-red-600 hover:text-white hover:shadow-2xl transition-all active:scale-90 border-2 border-transparent"><TrashIcon className="h-7 w-7" /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {centers.length === 0 && (
                <div className="p-20 text-center text-slate-300 font-black text-lg">কোনো কেন্দ্র পাওয়া যায়নি</div>
              )}
            </div>
          </div>
        )}

        {view === 'EDIT_CENTER' && (
          <div className="max-w-5xl mx-auto animate-fadeIn pb-32">
            <div className="bg-white p-12 md:p-20 rounded-[80px] shadow-2xl border-t-[24px] border-army-green relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-3 bg-army-gold/10"></div>
              <div className="flex flex-col sm:flex-row items-center justify-between mb-16 gap-8">
                <h2 className="text-5xl font-black text-slate-900 tracking-tighter">কেন্দ্র তথ্য সংশোধন</h2>
                <div className="bg-army-gold text-white px-10 py-4 rounded-[28px] font-black text-2xl shadow-xl border-b-4 border-amber-700">নং: {editCenter.centerNumber}</div>
              </div>
              <div className="space-y-12">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    <div className="col-span-full">
                        <label className="text-[12px] font-black text-slate-400 uppercase tracking-[0.3em] ml-4 mb-4 block">কেন্দ্রের নাম</label>
                        <input type="text" className="w-full px-10 py-6 rounded-[32px] bg-slate-50 border-2 border-slate-100 focus:border-army-green outline-none font-black text-slate-900 shadow-inner text-xl" value={editCenter.name || ''} onChange={e => setEditCenter({ ...editCenter, name: e.target.value })} />
                    </div>
                    <div>
                        <label className="text-[12px] font-black text-slate-400 uppercase tracking-[0.3em] ml-4 mb-4 block">ভোট কক্ষ সংখ্যা</label>
                        <input className="w-full px-10 py-6 rounded-[32px] bg-slate-50 border-2 border-slate-100 focus:border-army-green outline-none font-black text-slate-900 shadow-inner text-xl" value={editCenter.boothCount || ''} onChange={e => setEditCenter({ ...editCenter, boothCount: e.target.value })} />
                    </div>
                    <div>
                        <label className="text-[12px] font-black text-slate-400 uppercase tracking-[0.3em] ml-4 mb-4 block">মোট ভোটার সংখ্যা</label>
                        <input className="w-full px-10 py-6 rounded-[32px] bg-slate-50 border-2 border-slate-100 focus:border-army-green outline-none font-black text-slate-900 shadow-inner text-xl" value={editCenter.voterCount || ''} onChange={e => setEditCenter({ ...editCenter, voterCount: e.target.value })} />
                    </div>
                    <div className="col-span-full">
                        <label className="text-[12px] font-black text-slate-400 uppercase tracking-[0.3em] ml-4 mb-4 block">অবস্থান ও ভবন বর্ণনা</label>
                        <input className="w-full px-10 py-6 rounded-[32px] bg-slate-50 border-2 border-slate-100 focus:border-army-green outline-none font-black text-slate-900 shadow-inner text-xl" value={editCenter.roomLocation || ''} onChange={e => setEditCenter({ ...editCenter, roomLocation: e.target.value })} />
                    </div>
                    <div className="col-span-full">
                        <label className="text-[12px] font-black text-slate-400 uppercase tracking-[0.3em] ml-4 mb-4 block">গুগল ম্যাপ লিংক</label>
                        <div className="flex gap-6">
                            <input className="flex-1 px-10 py-6 rounded-[32px] bg-slate-50 border-2 border-slate-100 focus:border-army-green outline-none font-mono text-base text-slate-500 shadow-inner overflow-hidden" value={editCenter.locationLink || ''} onChange={e => setEditCenter({ ...editCenter, locationLink: e.target.value })} />
                            <button onClick={() => setShowMapPicker(true)} className="bg-army-green text-army-gold p-6 rounded-[32px] shadow-2xl active:scale-90 transition-all border-b-4 border-emerald-950 hover:bg-emerald-950"><MapIcon className="h-9 w-9" /></button>
                        </div>
                    </div>
                </div>
                <div className="pt-16 border-t-4 border-slate-50">
                    <div className="flex flex-col sm:flex-row items-center justify-between mb-12 gap-6">
                        <h3 className="font-black text-3xl text-slate-900 tracking-tight">কর্মকর্তাদের তালিকা</h3>
                        <button onClick={addPersonToEdit} className="text-army-green bg-emerald-50 px-10 py-5 rounded-[24px] text-[13px] font-black hover:bg-army-green hover:text-white transition-all flex items-center gap-4 border-2 border-emerald-100 shadow-md">
                            <PlusIcon className="h-6 w-6" /> কর্মকর্তা যোগ করুন
                        </button>
                    </div>
                    <div className="space-y-8">
                        {(editCenter.importantPersons || []).map((p, idx) => (
                            <div key={p.id} className="p-10 bg-slate-50 rounded-[50px] relative border-2 border-slate-100 shadow-xl animate-fadeInUp">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <input placeholder="নাম" className="bg-white px-8 py-5 rounded-[24px] border-2 border-slate-100 font-black focus:border-army-green outline-none shadow-sm text-lg" value={p.name} onChange={e => updatePersonInEdit(p.id, 'name', e.target.value)} />
                                    <input placeholder="পদবী" className="bg-white px-8 py-5 rounded-[24px] border-2 border-slate-100 font-black focus:border-army-green outline-none shadow-sm text-lg" value={p.designation} onChange={e => updatePersonInEdit(p.id, 'designation', e.target.value)} />
                                    <input placeholder="মোবাইল নম্বর" className="bg-white px-8 py-5 rounded-[24px] border-2 border-slate-100 font-black focus:border-army-green outline-none shadow-sm col-span-full text-lg" value={p.mobile} onChange={e => updatePersonInEdit(p.id, 'mobile', e.target.value)} />
                                </div>
                                <button onClick={() => removePersonFromEdit(p.id)} className="absolute -top-5 -right-5 bg-red-600 text-white p-4 rounded-full shadow-2xl hover:bg-red-700 active:scale-90 transition-all border-4 border-white"><XMarkIcon className="h-7 w-7" /></button>
                            </div>
                        ))}
                        {(!editCenter.importantPersons || editCenter.importantPersons.length === 0) && (
                          <p className="text-center text-slate-400 font-bold py-10">কোনো কর্মকর্তার তথ্য যোগ করা হয়নি</p>
                        )}
                    </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-8 pt-20">
                  <button onClick={() => setView('ADMIN')} className="flex-1 py-7 bg-slate-100 text-slate-500 rounded-[32px] font-black active:scale-95 transition-all text-xl hover:bg-slate-200">বাতিল</button>
                  <button onClick={saveCenter} className="flex-1 py-7 bg-army-green text-white rounded-[32px] font-black shadow-2xl active:scale-95 transition-all hover:bg-emerald-950 text-xl border-b-4 border-emerald-950">সংরক্ষণ করুন</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {view === 'SETTINGS' && (
          <div className="max-w-xl mx-auto animate-fadeIn mt-10">
            <div className="bg-white p-14 rounded-[70px] shadow-2xl border-t-[20px] border-army-green relative overflow-hidden">
              <div className="absolute top-0 right-0 w-40 h-40 bg-army-green/5 rounded-full blur-3xl"></div>
              <h2 className="text-3xl font-black mb-14 flex items-center gap-5 text-slate-900 tracking-tight">
                <KeyIcon className="h-12 w-12 text-army-gold bg-army-green p-3 rounded-[24px] border-b-4 border-emerald-950" /> পাসওয়ার্ড বদল
              </h2>
              <div className="space-y-10">
                <div>
                  <label className="text-[12px] font-black text-slate-400 uppercase tracking-[0.4em] ml-4 mb-4 block">নতুন পাসওয়ার্ড</label>
                  <input type="password" placeholder="••••••••" className="w-full px-10 py-7 rounded-[32px] bg-slate-50 border-2 border-slate-100 focus:border-army-green outline-none font-black text-center tracking-[0.5em] text-3xl shadow-inner" value={newPasswordValue} onChange={(e) => setNewPasswordValue(e.target.value)} />
                </div>
                <div className="flex gap-6">
                  <button onClick={goHome} className="flex-1 py-6 bg-slate-100 text-slate-500 rounded-[28px] font-bold active:scale-95 transition-all hover:bg-slate-200">বাতিল</button>
                  <button onClick={() => { if (!newPasswordValue) return; setUserPassword(newPasswordValue); setNewPasswordValue(''); showModal({ title: 'সাফল্য', message: 'পাসওয়ার্ডটি সফলভাবে পরিবর্তন করা হয়েছে!', type: 'SUCCESS', onConfirm: goHome }); }} className="flex-1 py-6 bg-army-green text-white rounded-[28px] font-black shadow-2xl active:scale-95 transition-all hover:bg-emerald-950 border-b-4 border-emerald-950">সংরক্ষণ করুন</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <div className="h-32 md:hidden"></div>

      <nav className="fixed bottom-0 left-0 right-0 glass backdrop-blur-2xl border-t-2 border-slate-50 shadow-[0_-20px_50px_rgba(0,0,0,0.1)] px-12 py-6 flex justify-between items-center z-[400] md:hidden h-28 rounded-t-[50px]">
        <button onClick={goBack} className="flex flex-col items-center gap-2 text-slate-300 active:text-army-green transition-all group">
          <ArrowLeftIcon className="h-9 w-9 group-active:-translate-x-2 transition-transform" /> 
          <span className="text-[11px] font-black uppercase tracking-[0.2em]">পিছনে</span>
        </button>
        <div className="relative -mt-24">
          <button onClick={goHome} className="bg-army-green text-army-gold p-7 rounded-[32px] shadow-2xl border-[10px] border-slate-50 active:scale-90 transition-all btn-shadow border-b-8 border-emerald-950">
            <HomeIcon className="h-10 w-10" />
          </button>
        </div>
        <button onClick={toggleSidebar} className="flex flex-col items-center gap-2 text-slate-300 active:text-army-green transition-all group">
          <Bars3Icon className="h-9 w-9 group-active:scale-110 transition-transform" /> 
          <span className="text-[11px] font-black uppercase tracking-[0.2em]">মেনু</span>
        </button>
      </nav>

      <footer className="hidden md:block text-center py-20 text-slate-200 text-[12px] font-black uppercase tracking-[0.8em] mt-auto">
        EPZ ARMY CAMP SECURITY SYSTEMS • MMXXVI
      </footer>

      <style>{`
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(40px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fadeInUp { animation: fadeInUp 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .animate-fadeIn { animation: fadeIn 0.5s ease-out; }
        @keyframes pop { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        .animate-pop { animation: pop 0.6s cubic-bezier(0.34, 1.56, 0.64, 1); }
        @keyframes shake { 0%, 100% { transform: translateX(0); } 20%, 60% { transform: translateX(-5px); } 40%, 80% { transform: translateX(5px); } }
        .animate-shake { animation: shake 0.5s ease-in-out; }
        * { -webkit-tap-highlight-color: transparent; }
        
        html, body {
            max-width: 100%;
            overflow-x: hidden;
            background: #fdfdfd;
        }
      `}</style>
    </div>
  );
};

export default App;
