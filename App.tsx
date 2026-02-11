
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
  const [tempEmergency, setTempEmergency] = useState<EmergencyContact>({ name: '', mobile: '' });
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
    
    showModal({ title: 'সফলভাবে সংরক্ষিত', message: 'কেন্দ্রের তথ্য সফলভাবে আপডেট করা হয়েছে।', type: 'SUCCESS' });
    setView('ADMIN');
  };

  // Helper functions for Person editing
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

  useEffect(() => {
    if (showMapPicker && mapContainerRef.current && (window as any).google) {
      const google = (window as any).google;
      const patengaPos = { lat: 22.2513, lng: 91.7915 };
      let initialPos = patengaPos;
      const coordMatch = editCenter.locationLink?.match(/q=([\d.]+),([\d.]+)/);
      if (coordMatch) initialPos = { lat: parseFloat(coordMatch[1]), lng: parseFloat(coordMatch[2]) };

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

  const saveEmergencyContact = () => {
    if (!tempEmergency.name || !tempEmergency.mobile) {
      showModal({ title: 'ত্রুটি', message: 'অনুগ্রহ করে নাম এবং মোবাইল নম্বর উভয়ই পূরণ করুন।', type: 'WARNING' });
      return;
    }
    setEmergencyContact(tempEmergency);
    showModal({ title: 'আপডেট সফল', message: 'জরুরী যোগাযোগ নম্বর সফলভাবে সেভ হয়েছে!', type: 'SUCCESS' });
  };

  useEffect(() => { if (view === 'ADMIN') setTempEmergency(emergencyContact); }, [view, emergencyContact]);

  const ModalPortal = () => {
    if (!modal.isOpen) return null;
    const icons = {
      SUCCESS: <CheckCircleIcon className="h-16 w-16 text-emerald-600" />,
      WARNING: <ExclamationCircleIcon className="h-16 w-16 text-amber-500" />,
      DANGER: <ExclamationCircleIcon className="h-16 w-16 text-red-600" />,
      INFO: <InformationCircleIcon className="h-16 w-16 text-blue-600" />,
    };
    return (
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeInFast">
        <div className="bg-white w-full max-w-sm rounded-[30px] shadow-2xl overflow-hidden animate-pop p-8 text-center">
            <div className="flex justify-center mb-4">{icons[modal.type]}</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">{modal.title}</h3>
            <p className="text-gray-600 font-medium text-sm leading-relaxed mb-8">{modal.message}</p>
            <div className="flex flex-col gap-3">
              <button onClick={modal.onConfirm || modal.onClose} className={`w-full py-4 rounded-xl font-bold text-white shadow-lg active:scale-95 transition-all ${modal.type === 'DANGER' ? 'bg-red-600' : modal.type === 'SUCCESS' ? 'bg-emerald-600' : modal.type === 'WARNING' ? 'bg-amber-600' : 'bg-army-green'}`}>{modal.confirmText}</button>
              {modal.showCancel && <button onClick={modal.onClose} className="w-full py-3 text-gray-500 font-bold uppercase text-xs tracking-widest active:opacity-50"> {modal.cancelText} </button>}
            </div>
        </div>
      </div>
    );
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
        <div className="max-w-md w-full bg-white rounded-[40px] shadow-2xl overflow-hidden border-t-[10px] border-army-green animate-fadeIn">
          <div className="p-10 text-center">
            <div className="mb-8 flex justify-center">
              <div className="bg-army-green p-6 rounded-3xl shadow-xl">
                <ShieldCheckIcon className="h-12 w-12 text-army-gold" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">প্রবেশাধিকার</h1>
            <p className="text-gray-500 font-bold mb-10 text-xs tracking-widest uppercase">ইপিজেড আর্মি ক্যাম্প - ২০২৬</p>
            <form onSubmit={handleLogin} className="space-y-6">
              <input type="password" placeholder="পাসওয়ার্ড দিন" className="w-full px-4 py-5 rounded-2xl border-2 border-gray-200 focus:outline-none focus:border-army-green transition-all bg-gray-50 text-center text-2xl font-bold text-gray-900 tracking-widest" value={inputPassword} autoFocus onChange={(e) => setInputPassword(e.target.value)} />
              {error && <p className="text-red-600 text-xs font-bold bg-red-50 py-3 rounded-xl border border-red-100">{error}</p>}
              <button type="submit" className="w-full bg-army-green hover:bg-emerald-900 text-white font-bold py-5 rounded-2xl transition-all shadow-xl active:scale-95 text-lg">ভেরিফাই করুন</button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24 md:pb-10 flex flex-col bg-gray-100 font-['Hind_Siliguri'] text-gray-900">
      <ModalPortal />
      
      {showMapPicker && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <div className="bg-white w-full max-w-2xl rounded-[30px] overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-6 bg-army-green text-white flex justify-between items-center">
                <h3 className="font-bold flex items-center gap-2"><MapPinIcon className="h-6 w-6 text-army-gold" /> অবস্থান নির্বাচন করুন</h3>
                <button onClick={() => setShowMapPicker(false)} className="hover:rotate-90 transition-transform"><XMarkIcon className="h-7 w-7" /></button>
            </div>
            <div className="p-4 bg-gray-100">
               <form onSubmit={handleMapSearch} className="flex gap-2">
                 <input type="text" className="flex-1 px-4 py-3 rounded-xl border-2 border-gray-300 focus:border-army-green outline-none font-semibold" placeholder="জায়গার নাম লিখে খুঁজুন..." value={mapSearchTerm} onChange={e => setMapSearchTerm(e.target.value)} />
                 <button type="submit" className="bg-army-gold text-army-green px-6 py-3 rounded-xl font-bold shadow-md active:scale-95">খুঁজুন</button>
               </form>
            </div>
            <div ref={mapContainerRef} className="flex-1 w-full min-h-[400px]"></div>
            <div className="p-6 bg-white border-t flex gap-4">
              <button onClick={() => setShowMapPicker(false)} className="flex-1 py-4 bg-gray-200 text-gray-700 rounded-xl font-bold">বাতিল</button>
              <button onClick={handleMapConfirm} className="flex-1 py-4 bg-army-green text-white rounded-xl font-bold shadow-lg active:scale-95">অবস্থান নিশ্চিত করুন</button>
            </div>
          </div>
        </div>
      )}

      {showSOS && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fadeInFast">
          <div className="bg-white w-full max-w-xs rounded-[40px] overflow-hidden shadow-2xl border border-red-100">
            <div className="bg-red-600 p-10 text-center text-white">
              <MegaphoneIcon className="h-16 w-16 mx-auto mb-4 animate-bounce" />
              <h2 className="text-2xl font-bold mb-1">জরুরী যোগাযোগ</h2>
              <p className="text-[10px] opacity-80 font-bold uppercase tracking-wider">সরাসরি কল করুন</p>
            </div>
            <div className="p-8 space-y-4">
               <a href={`tel:${emergencyContact.mobile}`} className="flex items-center justify-between p-5 bg-red-50 rounded-3xl border border-red-100 group transition-all active:scale-95">
                  <div>
                    <p className="text-[10px] font-bold text-red-600 uppercase tracking-widest mb-1">{emergencyContact.name}</p>
                    <p className="font-bold text-xl text-gray-900">{emergencyContact.mobile}</p>
                  </div>
                  <div className="bg-red-600 p-4 rounded-2xl text-white shadow-lg shadow-red-200">
                    <PhoneIcon className="h-6 w-6" />
                  </div>
               </a>
               <button onClick={() => setShowSOS(false)} className="w-full py-2 text-gray-400 font-bold uppercase tracking-widest text-[10px] hover:text-gray-600">বন্ধ করুন</button>
            </div>
          </div>
        </div>
      )}

      <aside className={`fixed top-0 left-0 h-full w-80 bg-white z-[70] shadow-2xl transform transition-transform duration-300 ease-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-10 bg-army-green text-white relative overflow-hidden h-48 flex flex-col justify-end">
            <div className="absolute top-6 right-6">
                <button onClick={toggleSidebar} className="p-2 hover:bg-white/10 rounded-full transition-all"><XMarkIcon className="h-6 w-6" /></button>
            </div>
            <div>
                <div className="bg-army-gold inline-block p-3 rounded-2xl shadow-lg mb-3">
                    <ShieldCheckIcon className="h-6 w-6 text-army-green" />
                </div>
                <h2 className="text-2xl font-bold">ইপিজেড আর্মি</h2>
                <p className="text-[10px] opacity-60 font-bold tracking-widest uppercase">Dashboard v5.0</p>
            </div>
        </div>
        <nav className="p-6 space-y-2">
          <button onClick={goHome} className={`flex items-center gap-4 w-full p-4 rounded-xl transition-all ${view === 'HOME' ? 'bg-army-green text-white font-bold' : 'text-gray-600 hover:bg-gray-100 font-semibold'}`}>
            <HomeIcon className="h-5 w-5" /> <span className="text-sm">মূল পাতা</span>
          </button>
          <div className="pt-6">
            <p className="px-4 text-[10px] uppercase font-bold text-gray-400 tracking-widest mb-3">প্রশাসন</p>
            <button onClick={() => { isAdminLoggedIn ? setView('ADMIN') : setView('ADMIN_LOGIN'); setIsSidebarOpen(false); }} className={`flex items-center gap-4 w-full p-4 rounded-xl transition-all ${view === 'ADMIN' ? 'bg-army-green text-white font-bold' : 'text-gray-600 hover:bg-gray-100 font-semibold'}`}>
              <Cog6ToothIcon className="h-5 w-5" /> <span className="text-sm">অ্যাডমিন প্যানেল</span>
            </button>
            <button onClick={() => { exportData(); setIsSidebarOpen(false); }} className="flex items-center gap-4 w-full p-4 rounded-xl text-gray-600 hover:bg-gray-100 font-semibold transition-all">
              <ArrowDownTrayIcon className="h-5 w-5" /> <span className="text-sm">ব্যাকআপ ডাটা</span>
            </button>
          </div>
          <div className="pt-6">
            <p className="px-4 text-[10px] uppercase font-bold text-gray-400 tracking-widest mb-3">সেটিংস</p>
            <button onClick={() => { setView('SETTINGS'); setIsSidebarOpen(false); }} className={`flex items-center gap-4 w-full p-4 rounded-xl transition-all ${view === 'SETTINGS' ? 'bg-army-green text-white font-bold' : 'text-gray-600 hover:bg-gray-100 font-semibold'}`}>
              <KeyIcon className="h-5 w-5" /> <span className="text-sm">পাসওয়ার্ড পরিবর্তন</span>
            </button>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-4 w-full p-4 rounded-xl text-red-600 hover:bg-red-50 transition-all font-bold mt-10">
            <ArrowRightOnRectangleIcon className="h-5 w-5" /> <span className="text-sm">লগআউট</span>
          </button>
        </nav>
      </aside>

      <header className="bg-army-green text-white p-5 md:p-8 sticky top-0 z-50 shadow-xl flex items-center justify-between">
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between gap-4">
          <button onClick={toggleSidebar} className="p-3 hover:bg-white/10 rounded-xl transition-all flex-shrink-0">
            <Bars3Icon className="h-7 w-7" />
          </button>
          <div className="flex-1 text-center cursor-pointer" onClick={goHome}>
            <h1 className="text-xl md:text-3xl font-bold leading-tight tracking-tight text-white">ইপিজেড আর্মি ক্যাম্প</h1>
            <p className="text-[8px] md:text-[11px] opacity-80 uppercase tracking-widest font-bold">নির্বাচন ও গণভোট ২০২৬</p>
          </div>
          <button onClick={() => setShowSOS(true)} className="p-3.5 bg-red-600 text-white rounded-xl shadow-lg flex-shrink-0 active:scale-90 transition-all hover:bg-red-500">
            <MegaphoneIcon className="h-6 w-6" />
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full p-6 md:p-10">
        {view === 'HOME' && (
          <div className="space-y-10 animate-fadeIn">
            <div className="relative group max-w-2xl mx-auto">
              <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-6 w-6 text-gray-400 group-focus-within:text-army-green transition-colors" />
              </div>
              <input type="text" placeholder="কেন্দ্রের নাম বা নম্বর দিয়ে খুঁজুন..." className="block w-full pl-16 pr-8 py-5 border-2 border-gray-200 rounded-[25px] bg-white shadow-xl focus:ring-4 focus:ring-army-green/5 focus:border-army-green focus:outline-none text-lg font-bold text-gray-900 transition-all" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="col-span-full flex items-center gap-4 mb-2">
                 <div className="h-8 w-2 bg-army-gold rounded-full"></div>
                 <h2 className="text-xl font-bold text-gray-800 tracking-tight">ভোট কেন্দ্রের তালিকা ({toBengaliDigits(filteredCenters.length)})</h2>
              </div>
              {filteredCenters.map((center) => (
                <button key={center.id} onClick={() => navigateToDetails(center)} className="army-card p-8 text-left group animate-fadeInUp">
                  <div className="flex justify-between items-start mb-6">
                    <div className="bg-army-green text-army-gold font-bold w-12 h-12 flex items-center justify-center rounded-2xl text-xl transition-all duration-300">
                        {center.centerNumber}
                    </div>
                    <MapIcon className="h-6 w-6 text-gray-300 group-hover:text-army-green transition-colors" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-xl leading-snug mb-1 group-hover:text-army-green transition-colors">{center.name}</h3>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest group-hover:text-army-green transition-all">বিস্তারিত দেখুন</p>
                  </div>
                </button>
              ))}
              {filteredCenters.length === 0 && (
                <div className="col-span-full p-20 text-center bg-white rounded-[30px] border-2 border-dashed border-gray-200 text-gray-400 font-bold flex flex-col items-center gap-4">
                  <ExclamationCircleIcon className="h-16 w-16 opacity-30" />
                  <p>দুঃখিত, কোনো তথ্য পাওয়া যায়নি!</p>
                </div>
              )}
            </div>
          </div>
        )}

        {view === 'CENTER_DETAILS' && selectedCenter && (
          <div className="space-y-8 animate-fadeIn max-w-2xl mx-auto">
            <button onClick={goBack} className="flex items-center gap-2 text-gray-500 font-bold hover:text-army-green transition-all group">
                <ArrowLeftIcon className="h-5 w-5 group-hover:-translate-x-1 transition-transform" /> ফিরে যান
            </button>
            <div className="bg-white rounded-[40px] p-10 shadow-2xl border-t-[12px] border-army-green text-center relative overflow-hidden">
              <div className="inline-flex items-center gap-2 bg-army-green text-army-gold px-5 py-2 rounded-full text-xs font-bold mb-6">
                <BuildingOfficeIcon className="h-4 w-4" /> কেন্দ্র নং {selectedCenter.centerNumber}
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-8 leading-tight">{selectedCenter.name}</h2>
              <div className="mb-8 rounded-[30px] overflow-hidden border-8 border-gray-100 relative bg-gray-200 aspect-video group shadow-inner">
                {getMapEmbedUrl(selectedCenter.locationLink) ? (
                   <iframe title="Location" className="w-full h-full border-none transition-transform duration-700 group-hover:scale-110" src={getMapEmbedUrl(selectedCenter.locationLink)!} allowFullScreen loading="lazy"></iframe>
                ) : (
                   <div className="w-full h-full flex flex-col items-center justify-center font-bold text-gray-400 gap-3">
                     <ExclamationCircleIcon className="h-12 w-12 opacity-30" /> মানচিত্রের অবস্থান নেই
                   </div>
                )}
              </div>
              <div className="grid grid-cols-1 gap-4">
                <button onClick={() => setView('CENTER_INFO')} className="flex items-center gap-5 p-6 rounded-3xl bg-gray-50 border-2 border-transparent hover:border-army-green transition-all group active:scale-[0.98]">
                  <div className="bg-army-green p-4 rounded-2xl text-army-gold shadow-lg transition-all"><InformationCircleIcon className="h-7 w-7" /></div>
                  <div className="flex-1 text-left">
                    <h4 className="font-bold text-gray-900 text-lg">ভোটকেন্দ্রের তথ্যাদি</h4>
                    <p className="text-xs text-gray-500 font-bold tracking-wide uppercase">বিবরণ ও বিবরণী</p>
                  </div>
                  <ArrowLeftIcon className="h-5 w-5 rotate-180 text-gray-300 group-hover:text-army-green" />
                </button>
                <a href={selectedCenter.locationLink} target="_blank" rel="noopener noreferrer" className="flex items-center gap-5 p-6 rounded-3xl bg-gray-50 border-2 border-transparent hover:border-army-green transition-all group active:scale-[0.98]">
                  <div className="bg-army-green p-4 rounded-2xl text-army-gold shadow-lg"><MapPinIcon className="h-7 w-7" /></div>
                  <div className="flex-1 text-left">
                    <h4 className="font-bold text-gray-900 text-lg">ভোটকেন্দ্রের অবস্থান</h4>
                    <p className="text-xs text-gray-500 font-bold tracking-wide uppercase">গুগল ম্যাপে নেভিগেশন</p>
                  </div>
                  <ArrowLeftIcon className="h-5 w-5 rotate-180 text-gray-300 group-hover:text-army-green" />
                </a>
                <button onClick={() => setView('PERSONS')} className="flex items-center gap-5 p-6 rounded-3xl bg-gray-50 border-2 border-transparent hover:border-army-green transition-all group active:scale-[0.98]">
                  <div className="bg-army-green p-4 rounded-2xl text-army-gold shadow-lg transition-all"><UserGroupIcon className="h-7 w-7" /></div>
                  <div className="flex-1 text-left">
                    <h4 className="font-bold text-gray-900 text-lg">গুরুত্বপুর্ণ ব্যক্তিবর্গ</h4>
                    <p className="text-xs text-gray-500 font-bold tracking-wide uppercase">নাম ও যোগাযোগ মাধ্যম</p>
                  </div>
                  <ArrowLeftIcon className="h-5 w-5 rotate-180 text-gray-300 group-hover:text-army-green" />
                </button>
              </div>
            </div>
          </div>
        )}

        {view === 'CENTER_INFO' && selectedCenter && (
          <div className="animate-fadeIn space-y-8 max-w-xl mx-auto pb-10">
            <button onClick={goBack} className="flex items-center gap-2 text-gray-500 font-bold hover:text-army-green transition-all group">
                <ArrowLeftIcon className="h-5 w-5" /> ফিরে যান
            </button>
            <div className="bg-white rounded-[40px] p-10 shadow-2xl border-t-[12px] border-army-green">
              <h2 className="text-2xl font-bold text-gray-900 mb-10">কেন্দ্রের তথ্যাদি</h2>
              <div className="space-y-6">
                <div className="flex items-center gap-6 p-6 bg-gray-50 rounded-[30px] border border-gray-100">
                  <div className="p-4 bg-army-green rounded-2xl shadow-sm text-army-gold"><InboxStackIcon className="h-8 w-8" /></div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">ভোট কক্ষের সংখ্যা</p>
                    <p className="font-bold text-2xl text-gray-900">{toBengaliDigits(selectedCenter.boothCount)} টি</p>
                  </div>
                </div>
                <div className="flex items-center gap-6 p-6 bg-gray-50 rounded-[30px] border border-gray-100">
                  <div className="p-4 bg-army-green rounded-2xl shadow-sm text-army-gold"><UserGroupIcon className="h-8 w-8" /></div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">মোট ভোটার</p>
                    <p className="font-bold text-2xl text-gray-900">{toBengaliDigits(selectedCenter.voterCount)} জন</p>
                  </div>
                </div>
                <div className="flex items-center gap-6 p-6 bg-gray-50 rounded-[30px] border border-gray-100">
                  <div className="p-4 bg-army-green rounded-2xl shadow-sm text-army-gold"><BuildingOfficeIcon className="h-8 w-8" /></div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">অবস্থান ও তলা</p>
                    <p className="font-bold text-xl text-gray-900 leading-tight">{selectedCenter.roomLocation}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {view === 'PERSONS' && selectedCenter && (
          <div className="animate-fadeIn space-y-8 max-w-xl mx-auto pb-10">
            <button onClick={goBack} className="flex items-center gap-2 text-gray-500 font-bold hover:text-army-green transition-all group">
                <ArrowLeftIcon className="h-5 w-5" /> ফিরে যান
            </button>
            <div className="space-y-5">
              <div className="flex items-center gap-4 mb-4 px-4">
                 <div className="h-8 w-2 bg-army-gold rounded-full"></div>
                 <h2 className="text-xl font-bold text-gray-800 tracking-tight">গুরুত্বপুর্ণ ব্যক্তিবর্গ</h2>
              </div>
              {selectedCenter.importantPersons.map((p) => (
                <div key={p.id} className="bg-white rounded-[30px] p-6 flex items-center justify-between gap-6 shadow-xl border-l-[10px] border-army-green group">
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900 text-xl mb-1 group-hover:text-army-green transition-colors">{p.name}</h3>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-3">{p.designation}</p>
                    <div className="inline-flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-xl font-bold text-army-green text-sm border border-gray-200">
                        {p.mobile}
                    </div>
                  </div>
                  <div className="flex flex-col gap-3">
                    <a href={`tel:${p.mobile}`} className="p-4 bg-army-green text-army-gold rounded-2xl shadow-lg active:scale-90 transition-all hover:bg-emerald-900">
                        <PhoneIcon className="h-6 w-6" />
                    </a>
                    <a href={`https://wa.me/${p.mobile.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" className="p-4 bg-army-gold text-army-green rounded-2xl shadow-sm active:scale-90 transition-all hover:brightness-110">
                        <ChatBubbleLeftRightIcon className="h-6 w-6" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {view === 'ADMIN_LOGIN' && (
          <div className="max-w-md mx-auto mt-20 bg-white p-10 rounded-[40px] shadow-2xl border-t-[10px] border-army-gold animate-fadeIn">
             <div className="text-center mb-10">
                <div className="bg-army-green p-6 inline-block rounded-3xl mb-4 shadow-xl">
                    <Cog6ToothIcon className="h-10 w-10 text-army-gold" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">অ্যাডমিন কন্ট্রোল</h2>
                <p className="text-gray-400 font-bold text-[10px] tracking-widest uppercase mt-1">সুরক্ষিত প্রবেশাধিকার</p>
             </div>
             <form onSubmit={handleAdminLogin} className="space-y-6">
               <input type="password" placeholder="পিন কোড দিন" autoFocus className="w-full px-6 py-5 rounded-2xl bg-gray-50 border-2 border-gray-200 focus:border-army-green outline-none text-center font-bold text-2xl tracking-widest text-gray-900" value={inputAdminPassword} onChange={e => setInputAdminPassword(e.target.value)} />
               {adminError && <p className="text-red-600 text-xs text-center font-bold bg-red-50 py-2 rounded-lg">{adminError}</p>}
               <button type="submit" className="w-full bg-army-green text-white py-5 rounded-2xl font-bold shadow-xl hover:bg-emerald-900 transition-all active:scale-95">লগইন করুন</button>
             </form>
           </div>
        )}

        {view === 'ADMIN' && (
          <div className="space-y-8 animate-fadeIn pb-20">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-army-green p-8 rounded-[30px] text-white shadow-xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-125 transition-transform"><BuildingOfficeIcon className="h-20 w-20" /></div>
                    <p className="text-[10px] font-bold text-army-gold uppercase tracking-[0.2em] mb-2">মোট কেন্দ্র</p>
                    <p className="text-4xl font-bold">{toBengaliDigits(stats.totalCenters)} টি</p>
                </div>
                <div className="bg-white p-8 rounded-[30px] text-gray-900 shadow-xl border-l-[10px] border-army-gold relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-125 transition-transform"><UserGroupIcon className="h-20 w-20" /></div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-2">মোট কর্মকর্তা</p>
                    <p className="text-4xl font-bold">{toBengaliDigits(stats.totalPersonnel)} জন</p>
                </div>
                {/* Enhanced Backup and Restore Buttons */}
                <button onClick={exportData} className="bg-white p-8 rounded-[30px] shadow-xl border border-gray-100 flex items-center justify-between group active:scale-95 transition-all hover:bg-gray-50">
                    <div className="text-left">
                        <span className="text-sm font-bold text-gray-700 block">ডাটা ব্যাকআপ</span>
                        <span className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">ডাউনলোড করুন</span>
                    </div>
                    <ArrowDownTrayIcon className="h-10 w-10 text-army-green group-hover:translate-y-1 transition-transform bg-army-green/5 p-2 rounded-xl" />
                </button>
                <button onClick={() => fileInputRef.current?.click()} className="bg-white p-8 rounded-[30px] shadow-xl border border-gray-100 flex items-center justify-between group active:scale-95 transition-all relative overflow-hidden hover:bg-gray-50">
                    <div className="text-left">
                        <span className="text-sm font-bold text-gray-700 block">ডাটা রিস্টোর</span>
                        <span className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">ফাইল আপলোড</span>
                    </div>
                    <ArrowUpTrayIcon className="h-10 w-10 text-blue-600 group-hover:-translate-y-1 transition-transform bg-blue-50 p-2 rounded-xl" />
                    <input type="file" ref={fileInputRef} onChange={importData} className="hidden" accept=".json" />
                </button>
            </div>

            <div className="bg-white p-10 rounded-[40px] shadow-xl border-l-[12px] border-army-green flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">কেন্দ্র ব্যবস্থাপনা</h2>
                    <p className="text-gray-400 font-bold text-xs uppercase tracking-wider mt-1">ভোট কেন্দ্র সমূহের ডাটাবেস</p>
                </div>
                <button onClick={() => startEdit()} className="bg-army-green hover:bg-emerald-900 text-white px-10 py-5 rounded-[20px] font-bold flex items-center justify-center gap-3 shadow-xl active:scale-95 transition-all">
                    <PlusIcon className="h-6 w-6 text-army-gold" /> নতুন কেন্দ্র যোগ করুন
                </button>
            </div>

            <div className="bg-white rounded-[30px] shadow-xl overflow-hidden border border-gray-100">
              <table className="w-full text-left">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-8 py-5 font-bold uppercase text-[10px] text-gray-400 tracking-widest w-24">নং</th>
                    <th className="px-8 py-5 font-bold uppercase text-[10px] text-gray-400 tracking-widest">কেন্দ্রের নাম</th>
                    <th className="px-8 py-5 font-bold uppercase text-[10px] text-gray-400 tracking-widest text-right">অ্যাকশন</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {centers.map(c => (
                    <tr key={c.id} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="px-8 py-6 font-bold text-army-green text-xl">{c.centerNumber}</td>
                      <td className="px-8 py-6 font-bold text-gray-800">{c.name}</td>
                      <td className="px-8 py-6">
                        <div className="flex justify-end gap-3">
                          <button onClick={() => startEdit(c)} className="p-3 text-army-green bg-gray-50 rounded-xl hover:bg-white hover:shadow-md transition-all active:scale-90 border border-transparent hover:border-army-green"><PencilSquareIcon className="h-5 w-5" /></button>
                          <button onClick={() => deleteCenter(c.id)} className="p-3 text-red-600 bg-red-50 rounded-xl hover:bg-white hover:shadow-md transition-all active:scale-90 border border-transparent hover:border-red-600"><TrashIcon className="h-5 w-5" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {view === 'EDIT_CENTER' && (
          <div className="max-w-3xl mx-auto animate-fadeIn pb-20">
            <div className="bg-white p-10 md:p-14 rounded-[40px] shadow-2xl border-t-[12px] border-army-green">
              <div className="flex items-center justify-between mb-12">
                <h2 className="text-3xl font-bold text-gray-900">কেন্দ্র সংশোধন</h2>
                <div className="bg-army-gold text-army-green px-5 py-2 rounded-2xl font-bold text-sm">নং: {editCenter.centerNumber}</div>
              </div>
              <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="col-span-full">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1 mb-2 block">কেন্দ্রের নাম</label>
                        <input type="text" className="w-full px-6 py-4 rounded-2xl bg-gray-50 border-2 border-gray-200 focus:border-army-green outline-none font-bold text-gray-900" value={editCenter.name || ''} onChange={e => setEditCenter({ ...editCenter, name: e.target.value })} />
                    </div>
                    <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1 mb-2 block">ভোট কক্ষ সংখ্যা</label>
                        <input className="w-full px-6 py-4 rounded-2xl bg-gray-50 border-2 border-gray-200 focus:border-army-green outline-none font-bold text-gray-900" value={editCenter.boothCount || ''} onChange={e => setEditCenter({ ...editCenter, boothCount: e.target.value })} />
                    </div>
                    <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1 mb-2 block">মোট ভোটার</label>
                        <input className="w-full px-6 py-4 rounded-2xl bg-gray-50 border-2 border-gray-200 focus:border-army-green outline-none font-bold text-gray-900" value={editCenter.voterCount || ''} onChange={e => setEditCenter({ ...editCenter, voterCount: e.target.value })} />
                    </div>
                    <div className="col-span-full">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1 mb-2 block">অবস্থান ও তলা</label>
                        <input className="w-full px-6 py-4 rounded-2xl bg-gray-50 border-2 border-gray-200 focus:border-army-green outline-none font-bold text-gray-900" value={editCenter.roomLocation || ''} onChange={e => setEditCenter({ ...editCenter, roomLocation: e.target.value })} />
                    </div>
                    <div className="col-span-full">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1 mb-2 block">গুগল ম্যাপ লিংক</label>
                        <div className="flex gap-3">
                            <input className="flex-1 px-6 py-4 rounded-2xl bg-gray-50 border-2 border-gray-200 focus:border-army-green outline-none font-mono text-xs text-gray-500" value={editCenter.locationLink || ''} onChange={e => setEditCenter({ ...editCenter, locationLink: e.target.value })} />
                            <button onClick={() => setShowMapPicker(true)} className="bg-army-green text-army-gold p-4 rounded-2xl shadow-lg active:scale-90 transition-all"><MapIcon className="h-7 w-7" /></button>
                        </div>
                    </div>
                </div>
                <div className="pt-10 border-t border-gray-100">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="font-bold text-xl text-gray-900">কর্মকর্তাদের তথ্য</h3>
                        <button onClick={addPersonToEdit} className="text-army-green bg-emerald-50 px-6 py-3 rounded-2xl text-xs font-bold hover:bg-army-green hover:text-white transition-all flex items-center gap-2 border border-emerald-100">
                            <PlusIcon className="h-4 w-4" /> কর্মকর্তা যোগ করুন
                        </button>
                    </div>
                    <div className="space-y-4">
                        {(editCenter.importantPersons || []).map(p => (
                            <div key={p.id} className="p-8 bg-gray-50 rounded-[30px] relative border border-gray-200 shadow-sm animate-fadeIn">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <input placeholder="নাম" className="bg-white px-5 py-3 rounded-xl border border-gray-200 font-bold" value={p.name} onChange={e => updatePersonInEdit(p.id, 'name', e.target.value)} />
                                    <input placeholder="পদবী" className="bg-white px-5 py-3 rounded-xl border border-gray-200 font-bold" value={p.designation} onChange={e => updatePersonInEdit(p.id, 'designation', e.target.value)} />
                                    <input placeholder="মোবাইল নম্বর" className="bg-white px-5 py-3 rounded-xl border border-gray-200 font-bold col-span-full" value={p.mobile} onChange={e => updatePersonInEdit(p.id, 'mobile', e.target.value)} />
                                </div>
                                <button onClick={() => removePersonFromEdit(p.id)} className="absolute -top-3 -right-3 bg-red-600 text-white p-2 rounded-full shadow-xl active:scale-90 transition-all"><XMarkIcon className="h-5 w-5" /></button>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="flex gap-4 pt-12">
                  <button onClick={() => setView('ADMIN')} className="flex-1 py-5 bg-gray-200 text-gray-700 rounded-3xl font-bold active:scale-95 transition-all">বাতিল</button>
                  <button onClick={saveCenter} className="flex-1 py-5 bg-army-green text-white rounded-3xl font-bold shadow-xl active:scale-95 transition-all hover:bg-emerald-900">সংরক্ষণ করুন</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {view === 'SETTINGS' && (
          <div className="max-w-md mx-auto animate-fadeIn">
            <div className="bg-white p-10 rounded-[40px] shadow-2xl border-t-[10px] border-army-green">
              <h2 className="text-2xl font-bold mb-8 flex items-center gap-3 text-gray-900">
                <KeyIcon className="h-7 w-7 text-army-gold" /> পাসওয়ার্ড পরিবর্তন
              </h2>
              <div className="space-y-6">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1 mb-2 block">নতুন পাসওয়ার্ড</label>
                  <input type="password" placeholder="••••••••" className="w-full px-6 py-4 rounded-2xl bg-gray-50 border-2 border-gray-200 focus:border-army-green outline-none font-bold text-center tracking-widest" value={newPasswordValue} onChange={(e) => setNewPasswordValue(e.target.value)} />
                </div>
                <div className="flex gap-4">
                  <button onClick={goHome} className="flex-1 py-4 bg-gray-200 text-gray-700 rounded-2xl font-bold active:scale-95">বাতিল</button>
                  <button onClick={() => { if (!newPasswordValue) return; setUserPassword(newPasswordValue); setNewPasswordValue(''); showModal({ title: 'সাফল্য', message: 'পাসওয়ার্ড পরিবর্তিত হয়েছে!', type: 'SUCCESS', onConfirm: goHome }); }} className="flex-1 py-4 bg-army-green text-white rounded-2xl font-bold shadow-xl active:scale-95">সেভ করুন</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-200 shadow-[0_-10px_30px_rgba(0,0,0,0.05)] px-8 py-4 flex justify-between items-center z-50 md:hidden h-20">
        <button onClick={goBack} className="flex flex-col items-center gap-1 text-gray-400 active:text-army-green transition-all">
          <ArrowLeftIcon className="h-7 w-7" /> <span className="text-[9px] font-bold uppercase tracking-widest">পিছনে</span>
        </button>
        <div className="relative -mt-16">
          <button onClick={goHome} className="bg-army-green text-army-gold p-5 rounded-[28px] shadow-2xl border-4 border-gray-100 active:scale-90 transition-all">
            <HomeIcon className="h-8 w-8" />
          </button>
        </div>
        <button onClick={toggleSidebar} className="flex flex-col items-center gap-1 text-gray-400 active:text-army-green transition-all">
          <Bars3Icon className="h-7 w-7" /> <span className="text-[9px] font-bold uppercase tracking-widest">মেনু</span>
        </button>
      </nav>

      <footer className="hidden md:block text-center py-12 text-gray-300 text-[10px] font-bold uppercase tracking-[0.5em] mt-auto">
        EPZ ARMY SECURITY SYSTEMS • MMXXVI
      </footer>

      <style>{`
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fadeInUp { animation: fadeInUp 0.5s ease-out forwards; }
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
