import React, { useState, useEffect, useMemo } from 'react';
import { 
  Shield, Moon, Sun, Clock, Search, Filter, 
  FileText, Download, CheckCircle2, AlertCircle, X,
  ChevronRight, FileDown, BookOpen, Lock, Users, Activity,
  Briefcase, Gavel, Scale, Plus, Edit, Trash2, Upload, Eye, EyeOff,
  LogOut, ArrowUpDown, ListOrdered, BarChart3, History, User, Settings, Pin
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, signInWithCustomToken } from 'firebase/auth';
import { getFirestore, collection, onSnapshot, doc, setDoc, deleteDoc } from 'firebase/firestore';

// ==========================================
// FIREBASE SETUP
// ==========================================
let app, auth, db, appId = 'default-app-id';
try {
  const firebaseConfig = JSON.parse(typeof __firebase_config !== 'undefined' ? __firebase_config : '{}');
  apiKey: "AIzaSyCQ4sey3h0wOjv0tNBRZpccA45uoThtPnY",
  authDomain: "satu-sop-3b737.firebaseapp.com",
  projectId: "satu-sop-3b737",
  storageBucket: "satu-sop-3b737.firebasestorage.app",
  messagingSenderId: "613797693533",
  appId: "1:613797693533:web:57a324c1f8bf98e33d65b4"
}

// ==========================================
// MOCK DATA: DAFTAR SOP LAPAS
// ==========================================

const MOCK_SOP_DATA = [
  {
    id: "SOP-KMN-01",
    title: "SOP Penggeledahan Kamar Hunian",
    category: "Keamanan",
    date: "2024-01-15",
    version: "1.2",
    description: "Prosedur standar operasional dalam melaksanakan penggeledahan rutin maupun insidentil pada blok dan kamar hunian Warga Binaan Pemasyarakatan untuk mencegah gangguan keamanan dan ketertiban.",
    icon: "Lock",
    updatedBy: "Sistem",
    history: [
      { version: "1.0", date: "2023-05-10", updatedBy: "Admin Lama", description: "Pembuatan SOP awal penggeledahan." },
      { version: "1.1", date: "2023-10-20", updatedBy: "Sistem", description: "Pembaruan aturan penggeledahan insidentil." }
    ]
  },
  {
    id: "SOP-KMN-02",
    title: "SOP Pengawalan Narapidana Sidang",
    category: "Keamanan",
    date: "2024-02-10",
    version: "2.0",
    description: "Tata cara pengeluaran, pengawalan, hingga pengembalian narapidana/tahanan yang akan mengikuti proses persidangan di Pengadilan.",
    icon: "Gavel",
    updatedBy: "Sistem",
    history: []
  },
  {
    id: "SOP-PBN-01",
    title: "SOP Pengusulan Remisi",
    category: "Pembinaan",
    date: "2023-11-20",
    version: "3.1",
    description: "Alur kerja pengusulan pengurangan masa pidana (Remisi) bagi Narapidana dan Anak Pidana yang telah memenuhi syarat administratif dan substantif.",
    icon: "BookOpen",
    updatedBy: "Sistem",
    history: []
  },
  {
    id: "SOP-PBN-02",
    title: "SOP Pelaksanaan Asimilasi",
    category: "Pembinaan",
    date: "2024-03-05",
    version: "1.5",
    description: "Prosedur pengurusan dan pelaksanaan program Asimilasi di rumah bagi WBP sesuai dengan peraturan perundang-undangan yang berlaku.",
    icon: "Users",
    updatedBy: "Sistem",
    history: []
  },
  {
    id: "SOP-PRW-01",
    title: "SOP Pelayanan Kesehatan Poliklinik",
    category: "Perawatan",
    date: "2024-01-05",
    version: "2.2",
    description: "Standar pelayanan kesehatan tingkat pertama di Poliklinik Lapas bagi WBP yang mengalami keluhan sakit atau membutuhkan pemeriksaan rutin.",
    icon: "Activity",
    updatedBy: "Sistem",
    history: []
  },
  {
    id: "SOP-PRW-02",
    title: "SOP Penerimaan dan Penyajian Bahan Makanan",
    category: "Perawatan",
    date: "2023-12-10",
    version: "1.0",
    description: "Prosedur pengawasan penerimaan bahan makanan mentah dari pihak ketiga (Bama) hingga proses pengolahan dan distribusi ke kamar hunian.",
    icon: "Scale",
    updatedBy: "Sistem",
    history: []
  },
  {
    id: "SOP-TU-01",
    title: "SOP Penerimaan Tahanan Baru",
    category: "Tata Usaha",
    date: "2024-04-01",
    version: "4.0",
    description: "Langkah-langkah registrasi, pemeriksaan berkas, pemeriksaan kesehatan awal, hingga penempatan kamar mapenaling bagi tahanan yang baru dikirim oleh pihak penahan.",
    icon: "Briefcase",
    updatedBy: "Sistem",
    history: []
  },
  {
    id: "SOP-TU-02",
    title: "SOP Layanan Kunjungan Tatap Muka",
    category: "Tata Usaha",
    date: "2024-02-28",
    version: "3.0",
    description: "Tata tertib dan prosedur layanan kunjungan langsung bagi keluarga WBP, meliputi pendaftaran, pemeriksaan barang, hingga pelaksanaan kunjungan.",
    icon: "Users",
    updatedBy: "Sistem",
    history: []
  }
];

// ==========================================
// FUNGSI HELPER GLOBAL
// ==========================================
const formatLiveTime = (date) => {
  const optionsDate = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
  const optionsTime = { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false };
  return `${new Intl.DateTimeFormat('id-ID', optionsDate).format(date)} - ${new Intl.DateTimeFormat('id-ID', optionsTime).format(date)} WITA`;
};

const formatDateIndo = (dateStr) => {
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric', month: 'long', year: 'numeric'
  }).format(new Date(dateStr));
};

const getBadgeInfo = (dateStr, history) => {
  const diffTime = Math.abs(new Date() - new Date(dateStr));
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  if (diffDays <= 7) return history?.length > 0 ? 'UPDATE' : 'BARU';
  return null;
};

// ==========================================
// KOMPONEN UTAMA
// ==========================================
export default function App() {
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('darkMode') !== 'false');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [toast, setToast] = useState(null);
  
  // State Data SOP
  const [sops, setSops] = useState(MOCK_SOP_DATA);
  const [selectedSOP, setSelectedSOP] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  const [fbUser, setFbUser] = useState(null);

  // State Manajemen Admin (Auth)
  const [adminUser, setAdminUser] = useState(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [loginCreds, setLoginCreds] = useState({ username: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const isAdmin = adminUser !== null;

  // State Pengaturan & Kategori
  const [adminCreds, setAdminCreds] = useState(() => {
    const saved = localStorage.getItem('satuSopAdminCreds');
    return saved ? JSON.parse(saved) : { username: 'admin', password: 'password', recoveryWa: '6281234567890' };
  });
  const [customCategories, setCustomCategories] = useState(() => {
    const saved = localStorage.getItem('satuSopCategories');
    return saved ? JSON.parse(saved) : ["Keamanan", "Pembinaan", "Perawatan", "Tata Usaha"];
  });
  const [showSettings, setShowSettings] = useState(false);
  const [showSettingsPassword, setShowSettingsPassword] = useState(false);
  const [settingsForm, setSettingsForm] = useState(adminCreds);
  const [newCategory, setNewCategory] = useState('');

  // State Form SOP
  const [showSopForm, setShowSopForm] = useState(false);
  const [editingSop, setEditingSop] = useState(null);
  const [formData, setFormData] = useState({
    title: '', category: customCategories[0] || '', version: '1.0', description: '', date: new Date().toISOString().split('T')[0], file: null
  });

  // State Modal Konfirmasi Custom
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, message: '', onConfirm: null });
  const [promptDialog, setPromptDialog] = useState({ isOpen: false, message: '', value: '', onConfirm: null });

  // State Filtering, Sorting, Pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [sortBy, setSortBy] = useState('Terbaru');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // FIREBASE AUTH & FETCH DATA
  useEffect(() => {
    if (!auth) return;
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (e) { console.error("Firebase Auth Error:", e); }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, setFbUser);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!fbUser || !db) return;
    const sopsRef = collection(db, 'artifacts', appId, 'public', 'data', 'sops');
    const unsubscribe = onSnapshot(sopsRef, (snapshot) => {
      const fetchedSops = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      if (fetchedSops.length > 0) {
        setSops(fetchedSops);
      } else {
        // First time setup: populate Firestore with Mock Data
        MOCK_SOP_DATA.forEach(mockSop => {
          setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'sops', mockSop.id), mockSop);
        });
      }
    }, (error) => console.error("Firestore Error:", error));
    return () => unsubscribe();
  }, [fbUser]);

  useEffect(() => {
    if (isDarkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
    localStorage.setItem('darkMode', isDarkMode);
  }, [isDarkMode]);

  // Efek Jam Live
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Reset Halaman ke-1 setiap kali filter/search berubah
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategory, sortBy, itemsPerPage]);

  // Filter & Sort Logika
  const filteredAndSortedSOPs = useMemo(() => {
    // 1. Filter
    let result = sops.filter(sop => {
      const matchCategory = selectedCategory === 'Semua' || sop.category === selectedCategory;
      const searchLower = searchTerm.toLowerCase();
      const matchSearch = sop.title.toLowerCase().includes(searchLower) || 
                          sop.id.toLowerCase().includes(searchLower) ||
                          sop.description.toLowerCase().includes(searchLower);
      return matchCategory && matchSearch;
    });

    // 2. Sort
    switch(sortBy) {
      case 'Terlama':
        result.sort((a, b) => new Date(a.date) - new Date(b.date));
        break;
      case 'A-Z':
        result.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'Z-A':
        result.sort((a, b) => b.title.localeCompare(a.title));
        break;
      case 'Terbaru':
      default:
        result.sort((a, b) => new Date(b.date) - new Date(a.date));
        break;
    }

    // 3. Pin Sort (Pinned always on top)
    result.sort((a, b) => (b.isPinned === true ? 1 : 0) - (a.isPinned === true ? 1 : 0));

    return result;
  }, [searchTerm, selectedCategory, sortBy, sops]);

  // Pagination Logika
  const totalPages = Math.ceil(filteredAndSortedSOPs.length / itemsPerPage);
  const paginatedSOPs = filteredAndSortedSOPs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Fungsi Autentikasi
  const handleLogin = (e) => {
    e.preventDefault();
    if (loginCreds.username === adminCreds.username && loginCreds.password === adminCreds.password) {
      setAdminUser({ username: 'Administrator' });
      setShowLoginModal(false);
      setLoginCreds({ username: '', password: '' });
      showToast('Berhasil Login sebagai Admin!');
    } else {
      showToast('Username atau Password salah!', 'error');
    }
  };

  const handleLupaPassword = () => {
    const text = `*PENGINGAT SISTEM SATU SOP*%0A%0AUsername: ${adminCreds.username}%0APassword: ${adminCreds.password}%0A%0ASimpan pesan ini sebagai pengingat akses Admin.`;
    window.open(`https://wa.me/${adminCreds.recoveryWa}?text=${text}`, '_blank');
    showToast('Membuka WhatsApp untuk mengirim pengingat...');
  };

  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  const handleDownload = (sop) => {
    showToast(`Mengunduh dokumen: ${sop.title}`);
    let fileUrl;
    if (sop.file instanceof File) {
      fileUrl = URL.createObjectURL(sop.file);
    } else {
      const blob = new Blob([`%PDF-1.4\n%File PDF Dummy untuk ${sop.title}\n`], { type: 'application/pdf' });
      fileUrl = URL.createObjectURL(blob);
    }

    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = `${sop.id}_${sop.title.replace(/\s+/g, '_')}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setTimeout(() => URL.revokeObjectURL(fileUrl), 1000);
    setTimeout(() => { setSelectedSOP(null); setShowHistory(false); }, 1000);
  };

  const handleView = (sop) => {
    let fileUrl;
    if (sop.file instanceof File) {
      fileUrl = URL.createObjectURL(sop.file);
    } else {
      const blob = new Blob([`%PDF-1.4\n%File PDF Dummy untuk ${sop.title}\n`], { type: 'application/pdf' });
      fileUrl = URL.createObjectURL(blob);
    }
    window.open(fileUrl, '_blank');
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validasi Ukuran File (Maksimal 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB in bytes
      if (file.size > maxSize) {
        showToast("Gagal! Ukuran file maksimal adalah 5MB.", "error");
        e.target.value = null; // reset input
        setFormData({ ...formData, file: null });
      } else {
        setFormData({ ...formData, file });
      }
    }
  };

  const handleTogglePin = async (id, e) => {
    e.stopPropagation();
    const sop = sops.find(s => s.id === id);
    if (!sop) return;
    
    if (db && fbUser) {
      await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'sops', id), { ...sop, isPinned: !sop.isPinned }, { merge: true });
    } else {
      setSops(prev => prev.map(s => s.id === id ? { ...s, isPinned: !s.isPinned } : s));
    }
    showToast("Status pin SOP berhasil diperbarui!");
  };

  // Handler Simpan / Edit SOP (Versioning & Audit Trail)
  const handleSaveSop = async (e) => {
    e.preventDefault();
    if (editingSop) {
      // Buat riwayat lama
      const oldState = {
        version: editingSop.version,
        date: editingSop.date,
        updatedBy: editingSop.updatedBy,
        description: editingSop.description
      };

      const updatedSop = {
        ...editingSop,
        ...formData,
        updatedBy: adminUser.username,
        history: [oldState, ...(editingSop.history || [])]
      };
      delete updatedSop.file; // Menghindari error serialisasi pada firebase

      if (db && fbUser) {
        await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'sops', updatedSop.id), updatedSop);
      } else {
        setSops(sops.map(s => s.id === editingSop.id ? updatedSop : s));
      }
      showToast("Data SOP & Riwayat Revisi berhasil diperbarui!");
    } else {
      // SOP Baru
      const newId = `SOP-${formData.category.substring(0,3).toUpperCase()}-${Math.floor(Math.random()*100)}`;
      const newSop = { 
        ...formData, 
        id: newId, 
        icon: "FileText",
        updatedBy: adminUser.username,
        history: [],
        isPinned: false
      };
      delete newSop.file; // Menghindari error serialisasi pada firebase

      if (db && fbUser) {
        await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'sops', newId), newSop);
      } else {
        setSops([newSop, ...sops]);
      }
      showToast("SOP Baru berhasil diupload!");
    }
    setShowSopForm(false);
  };

  const handleDeleteSop = (id, e) => {
    e.stopPropagation();
    setConfirmDialog({
      isOpen: true,
      message: "Apakah Anda yakin ingin menghapus SOP ini dari direktori secara permanen?",
      onConfirm: async () => {
        if (db && fbUser) {
          await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'sops', id));
        } else {
          setSops(prev => prev.filter(s => s.id !== id));
        }
        showToast("Dokumen SOP berhasil dihapus!");
      }
    });
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#0b1120] text-slate-950 dark:text-slate-100 transition-colors duration-500 font-sans selection:bg-emerald-500/30 overflow-x-hidden relative">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@200;400;600;800&display=swap');
        * { font-family: 'Plus Jakarta Sans', sans-serif; }
        
        button, select, label[for], input[type="checkbox"] { 
          cursor: pointer !important; 
        }
        
        .glass-card { 
          background: rgba(255, 255, 255, 0.65); 
          backdrop-filter: blur(24px); 
          -webkit-backdrop-filter: blur(24px);
          border: 1px solid rgba(148, 163, 184, 0.4); 
          box-shadow: 0 25px 50px -12px rgba(0,0,0,0.05), 0 0 0 1px rgba(0,0,0,0.02) inset; 
        }
        .dark .glass-card { 
          background: rgba(15, 23, 42, 0.5); 
          border: 1px solid rgba(255, 255, 255, 0.08); 
          box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.02) inset; 
        }
        
        .btn-3d { 
          transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); 
          box-shadow: 0 6px 0 rgba(16, 185, 129, 0.6), 0 15px 20px rgba(16, 185, 129, 0.3); 
        }
        .btn-3d:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 0 rgba(16, 185, 129, 0.6), 0 20px 25px rgba(16, 185, 129, 0.4);
        }
        .btn-3d:active { 
          transform: translateY(4px); 
          box-shadow: 0 2px 0 rgba(16, 185, 129, 0.6), 0 5px 10px rgba(16, 185, 129, 0.2); 
        }
        
        .btn-3d-blue { 
          transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); 
          box-shadow: 0 6px 0 rgba(37, 99, 235, 0.6), 0 15px 20px rgba(37, 99, 235, 0.3); 
        }
        .btn-3d-blue:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 0 rgba(37, 99, 235, 0.6), 0 20px 25px rgba(37, 99, 235, 0.4);
        }
        .btn-3d-blue:active { 
          transform: translateY(4px); 
          box-shadow: 0 2px 0 rgba(37, 99, 235, 0.6), 0 5px 10px rgba(37, 99, 235, 0.2); 
        }

        .premium-input {
          background: rgba(255, 255, 255, 0.8);
          border: 1px solid rgba(148, 163, 184, 0.6);
          box-shadow: inset 0 2px 4px rgba(0,0,0,0.02);
        }
        .dark .premium-input {
          background: rgba(15, 23, 42, 0.6);
          border: 1px solid rgba(51, 65, 85, 0.5);
          box-shadow: inset 0 2px 4px rgba(0,0,0,0.2);
        }
        .premium-input:focus {
          border-color: #10b981;
          box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.15), inset 0 2px 4px rgba(0,0,0,0.02);
          background: #ffffff;
        }
        .dark .premium-input:focus {
          border-color: #10b981;
          box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.15), inset 0 2px 4px rgba(0,0,0,0.2);
          background: #0f172a;
        }

        ::-webkit-scrollbar { width: 8px; height: 8px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        .dark ::-webkit-scrollbar-thumb { background: #334155; }
        ::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
        .dark ::-webkit-scrollbar-thumb:hover { background: #475569; }
      `}</style>

      {/* DYNAMIC BACKGROUND BLOBS */}
      <div className="fixed top-[-10%] left-[-10%] w-[50vw] h-[50vw] max-w-[600px] max-h-[600px] bg-emerald-400/20 dark:bg-emerald-600/10 rounded-full blur-[100px] -z-10 animate-pulse pointer-events-none mix-blend-multiply dark:mix-blend-lighten" style={{animationDuration: '8s'}}></div>
      <div className="fixed bottom-[-10%] right-[-5%] w-[60vw] h-[60vw] max-w-[700px] max-h-[700px] bg-blue-400/20 dark:bg-blue-600/10 rounded-full blur-[120px] -z-10 animate-pulse pointer-events-none mix-blend-multiply dark:mix-blend-lighten" style={{animationDuration: '10s'}}></div>
      <div className="fixed top-[40%] left-[60%] w-[30vw] h-[30vw] max-w-[400px] max-h-[400px] bg-purple-400/10 dark:bg-purple-600/10 rounded-full blur-[80px] -z-10 animate-pulse pointer-events-none mix-blend-multiply dark:mix-blend-lighten" style={{animationDuration: '12s'}}></div>

      {/* GLOBAL TOAST */}
      {toast && (
        <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-[300] px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-top-10 fade-in duration-300 backdrop-blur-md border ${toast.type === 'error' ? 'bg-rose-600/90 border-rose-500 text-white' : 'bg-emerald-600/90 border-emerald-500 text-white'}`}>
          {toast.type === 'error' ? <AlertCircle size={22}/> : <CheckCircle2 size={22}/>}
          <span className="text-xs font-bold uppercase tracking-widest text-white">{toast.message}</span>
        </div>
      )}

      {/* HEADER GLOBAL */}
      <header className="fixed top-0 left-0 right-0 z-50 px-6 py-4 flex justify-between items-center pointer-events-none transition-all">
        <div className="glass-card px-5 py-3 rounded-2xl pointer-events-auto flex items-center gap-3 shadow-lg hover:shadow-xl transition-shadow">
          <div className="flex items-center gap-1">
            {isAdmin && (
              <button onClick={() => { setSettingsForm(adminCreds); setShowSettings(true); }} className="p-1.5 rounded-xl bg-blue-100 dark:bg-blue-900/40 hover:bg-blue-200 transition-all" title="Pengaturan Sistem">
                <Settings className="text-blue-600 dark:text-blue-500" size={20}/>
              </button>
            )}
            <button onClick={() => isAdmin ? handleLogout() : setShowLoginModal(true)} className={`p-1.5 rounded-xl transition-all ${isAdmin ? 'bg-rose-100 dark:bg-rose-900/40 hover:bg-rose-200' : 'bg-emerald-100 dark:bg-emerald-900/40 hover:bg-emerald-200'}`} title={isAdmin ? "Keluar Mode Admin" : "Login Admin"}>
              {isAdmin ? <LogOut className="text-rose-600 dark:text-rose-500" size={20}/> : <Shield className="text-emerald-600 dark:text-emerald-400" size={20} />}
            </button>
          </div>
          <span className="font-black tracking-tighter text-[15px] bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 to-blue-600 dark:from-emerald-400 dark:to-blue-400">SATU SOP</span>
        </div>
        <div className="flex gap-3 pointer-events-auto items-center">
          <div className="hidden sm:flex items-center gap-2 px-4 py-2.5 glass-card rounded-full text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 mr-2 shadow-sm">
            <Clock size={14} className="text-blue-500" />
            {formatLiveTime(currentTime)}
          </div>
          <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-3.5 glass-card rounded-2xl hover:scale-105 hover:shadow-lg transition-all text-slate-600 dark:text-slate-300 border border-transparent hover:border-slate-300 dark:hover:border-slate-700">
            {isDarkMode ? <Sun size={18} className="text-amber-400"/> : <Moon size={18} className="text-indigo-600"/>}
          </button>
        </div>
      </header>

      {/* KONTEN UTAMA */}
      <main className="pt-32 pb-20 px-6 max-w-7xl mx-auto relative z-10 min-h-screen flex flex-col">
        
        {/* HERO SECTION */}
        <div className="text-center mb-16 animate-in slide-in-from-bottom-8 duration-700">
          <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-200/50 dark:border-emerald-800/30 shadow-sm mb-6">
            <div className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span></div>
            Dokumen Resmi Terpadu
          </div>
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter leading-[1.1] text-slate-900 dark:text-white mb-4">
            SATU SOP
          </h1>
          <h2 className="text-sm md:text-lg font-black tracking-widest text-emerald-600 dark:text-emerald-400 mb-6 uppercase">
            Sistem Akses Terpadu untuk Standar Operasional Prosedur
          </h2>
          <p className="max-w-2xl mx-auto text-sm md:text-base font-semibold text-slate-600 dark:text-slate-400 leading-relaxed mb-10">
            Pusat informasi dan dokumentasi seluruh pedoman kerja (SOP) yang berlaku di lingkungan Lembaga Pemasyarakatan Kelas IIB Kalabahi.
          </p>

          {/* DASHBOARD STATISTIK */}
          <div className="max-w-4xl mx-auto mb-10 animate-in fade-in zoom-in duration-500">
            <div className="glass-card p-6 md:p-8 rounded-[2.5rem] shadow-xl border border-emerald-500/20 relative overflow-hidden">
              <div className="flex flex-col md:flex-row gap-8 items-center relative z-10">
                {/* Total Stat */}
                <div className="text-center md:text-left md:pr-8 md:border-r border-slate-200 dark:border-slate-800 shrink-0">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Total Keseluruhan</p>
                    <div className="flex items-baseline justify-center md:justify-start gap-2">
                      <p className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-br from-emerald-600 to-blue-600 dark:from-emerald-400 dark:to-blue-400 leading-none">{sops.length}</p>
                      <p className="text-sm font-black text-slate-400 uppercase tracking-widest">SOP</p>
                    </div>
                    <p className="text-[10px] font-bold text-slate-400 mt-3 bg-slate-100 dark:bg-slate-800 inline-block px-3 py-1.5 rounded-lg">
                      Tersebar di {customCategories.length} Kategori
                    </p>
                  </div>
                  
                  {/* Category Breakdown (Mini Bar Chart) */}
                  <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[160px] overflow-y-auto pr-2">
                    {customCategories.map((cat, i) => {
                      const count = sops.filter(s => s.category === cat).length;
                      const percentage = sops.length > 0 ? Math.round((count / sops.length) * 100) : 0;
                      
                      // Dynamic colors for the chart
                      const colors = [
                        'bg-emerald-500 shadow-emerald-500/50', 
                        'bg-blue-500 shadow-blue-500/50', 
                        'bg-amber-500 shadow-amber-500/50', 
                        'bg-purple-500 shadow-purple-500/50', 
                        'bg-rose-500 shadow-rose-500/50', 
                        'bg-cyan-500 shadow-cyan-500/50'
                      ];
                      const colorClass = colors[i % colors.length];
                      
                      return (
                        <div key={cat} className="bg-white/60 dark:bg-slate-900/60 p-3.5 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 shadow-sm hover:shadow-md transition-shadow group">
                          <div className="flex justify-between items-end mb-2">
                            <span className="text-[10px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 truncate pr-2 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">{cat}</span>
                            <div className="flex items-baseline gap-1">
                              <span className="text-sm font-black text-slate-900 dark:text-white leading-none">{count}</span>
                              <span className="text-[9px] font-bold text-slate-400">({percentage}%)</span>
                            </div>
                          </div>
                          {/* Progress Bar */}
                          <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2 mt-1 overflow-hidden">
                            <div 
                              className={`h-full rounded-full shadow-sm ${colorClass} transition-all duration-1000 ease-out`} 
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

          {/* SEARCH, FILTER & SORTING BAR */}
          <div className="max-w-4xl mx-auto glass-card p-4 rounded-[2rem] flex flex-col md:flex-row gap-4 shadow-xl border border-white/40 dark:border-slate-700/50">
            <div className="relative flex-1">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input 
                type="text" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Cari nama, kode, atau deskripsi SOP..." 
                className="w-full pl-14 pr-6 py-4 bg-white/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-slate-900 dark:text-white"
              />
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative sm:w-40 shrink-0">
                 <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                 <select 
                   value={selectedCategory}
                   onChange={(e) => setSelectedCategory(e.target.value)}
                   className="w-full pl-10 pr-8 py-4 bg-white/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs font-bold uppercase tracking-wide outline-none appearance-none cursor-pointer transition-all text-slate-900 dark:text-white"
                 >
                   {['Semua', ...customCategories].map(cat => (
                     <option key={cat} value={cat}>{cat}</option>
                   ))}
                 </select>
                 <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none rotate-90" size={14}/>
              </div>

              <div className="relative sm:w-40 shrink-0">
                 <ArrowUpDown className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                 <select 
                   value={sortBy}
                   onChange={(e) => setSortBy(e.target.value)}
                   className="w-full pl-10 pr-8 py-4 bg-white/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs font-bold uppercase tracking-wide outline-none appearance-none cursor-pointer transition-all text-slate-900 dark:text-white"
                 >
                   <option value="Terbaru">Terbaru</option>
                   <option value="Terlama">Terlama</option>
                   <option value="A-Z">A-Z</option>
                   <option value="Z-A">Z-A</option>
                 </select>
                 <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none rotate-90" size={14}/>
              </div>
            </div>
          </div>

          {/* TOMBOL UPLOAD SOP (Khusus Admin) */}
          {isAdmin && (
            <div className="max-w-4xl mx-auto mt-6 flex justify-center animate-in fade-in zoom-in duration-500">
              <button 
                onClick={() => { 
                  setEditingSop(null); 
                  setFormData({ title: '', category: customCategories[0] || '', version: '1.0', description: '', date: new Date().toISOString().split('T')[0], file: null }); 
                  setShowSopForm(true); 
                }} 
                className="px-8 py-4 bg-emerald-600 text-white rounded-2xl font-black uppercase text-[11px] tracking-widest btn-3d flex items-center gap-3 shadow-emerald-600/30"
              >
                <Upload size={18} /> Upload SOP Baru
              </button>
            </div>
          )}
        </div>

        {/* SOP GRID */}
        {paginatedSOPs.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center animate-in fade-in duration-500 opacity-60 mt-10">
            <FileText size={80} className="text-slate-400 dark:text-slate-600 mb-6" />
            <h3 className="text-xl font-black text-slate-800 dark:text-slate-200 mb-2">SOP Tidak Ditemukan</h3>
            <p className="text-sm font-bold text-slate-500">Coba gunakan kata kunci atau filter yang berbeda.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in slide-in-from-bottom-12 duration-1000 delay-150 mb-10">
            {paginatedSOPs.map((sop, idx) => {
              return (
                <div 
                  key={sop.id} 
                  className="glass-card p-6 rounded-[2rem] border border-slate-300 dark:border-slate-700/50 shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 group flex flex-col h-full bg-white/60 dark:bg-slate-900/40 relative"
                  style={{ animationDelay: `${idx * 100}ms` }}
                >
                  {/* TOMBOL AKSI ADMIN */}
                  {isAdmin && (
                    <div className="absolute top-4 right-4 flex gap-2 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={(e) => handleTogglePin(sop.id, e)} className={`p-2.5 rounded-xl transition-all shadow-sm ${sop.isPinned ? 'bg-amber-500 text-white hover:bg-amber-600' : 'bg-amber-100 text-amber-600 hover:bg-amber-600 hover:text-white'}`} title={sop.isPinned ? "Lepas Sematan" : "Sematkan SOP"}><Pin size={14} className={sop.isPinned ? "fill-current" : ""}/></button>
                      <button onClick={(e) => { e.stopPropagation(); setEditingSop(sop); setFormData({...sop, file: null}); setShowSopForm(true); }} className="p-2.5 bg-blue-100 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-sm" title="Revisi / Edit"><Edit size={14}/></button>
                      <button onClick={(e) => handleDeleteSop(sop.id, e)} className="p-2.5 bg-rose-100 text-rose-600 rounded-xl hover:bg-rose-600 hover:text-white transition-all shadow-sm" title="Hapus Dokumen"><Trash2 size={14}/></button>
                    </div>
                  )}

                  <div className="flex justify-end items-start mb-6 pr-16 gap-2">
                    {sop.isPinned && (
                      <span className="px-2 py-1.5 bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 rounded-xl text-[9px] font-black uppercase tracking-widest border border-amber-200 dark:border-amber-800 flex items-center gap-1 shadow-sm"><Pin size={10} className="fill-current"/> Pinned</span>
                    )}
                    {(() => {
                      const badge = getBadgeInfo(sop.date, sop.history);
                      if (badge) {
                        return (
                          <span className={`px-2 py-1.5 text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-sm ${badge === 'BARU' ? 'bg-emerald-500' : 'bg-blue-500'}`}>
                            {badge}
                          </span>
                        );
                      }
                      return null;
                    })()}
                    <span className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl text-[9px] font-black uppercase tracking-widest border border-slate-200 dark:border-slate-700">
                      v{sop.version}
                    </span>
                  </div>
                  
                  <div className="flex-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-500 mb-2">{sop.category}</p>
                    <h3 className="text-lg font-black leading-snug text-slate-900 dark:text-white mb-3 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                      {sop.title}
                    </h3>
                    <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 line-clamp-3 leading-relaxed mb-4">
                      {sop.description}
                    </p>
                  </div>

                  <div className="pt-5 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between mt-auto">
                    <div className="text-[10px] font-bold text-slate-500 flex flex-col gap-1">
                      <span className="flex items-center gap-1.5"><Clock size={12}/> {formatDateIndo(sop.date)}</span>
                      {isAdmin && <span className="flex items-center gap-1.5 text-blue-500"><User size={12}/> {sop.updatedBy}</span>}
                    </div>
                    <button 
                      onClick={() => { setSelectedSOP(sop); setShowHistory(false); }}
                      className="p-2.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                      title="Lihat Detail"
                    >
                      <ChevronRight size={18} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* PAGINATION CONTROLS */}
        {filteredAndSortedSOPs.length > 0 && (
          <div className="mt-auto pt-6 flex flex-col sm:flex-row justify-between items-center gap-4 glass-card p-4 rounded-[2rem]">
             <div className="flex items-center gap-3">
               <ListOrdered size={18} className="text-slate-400"/>
               <span className="text-[11px] font-black uppercase tracking-widest text-slate-500">Tampilkan:</span>
               <select 
                 value={itemsPerPage} 
                 onChange={(e) => setItemsPerPage(Number(e.target.value))}
                 className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs font-bold outline-none cursor-pointer text-slate-800 dark:text-white"
               >
                 <option value={10}>10</option>
                 <option value={20}>20</option>
                 <option value={30}>30</option>
                 <option value={40}>40</option>
                 <option value={50}>50</option>
               </select>
             </div>
             
             <div className="flex items-center gap-3">
               <button 
                 disabled={currentPage === 1}
                 onClick={() => setCurrentPage(p => p - 1)}
                 className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-[10px] font-black uppercase tracking-widest disabled:opacity-50 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors flex items-center gap-1"
               >
                 <ChevronRight size={14} className="rotate-180"/> Prev
               </button>
               <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
                 Hal {currentPage} dari {totalPages || 1}
               </span>
               <button 
                 disabled={currentPage === totalPages || totalPages === 0}
                 onClick={() => setCurrentPage(p => p + 1)}
                 className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-[10px] font-black uppercase tracking-widest disabled:opacity-50 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors flex items-center gap-1"
               >
                 Next <ChevronRight size={14}/>
               </button>
             </div>
          </div>
        )}

      </main>

      {/* MODAL LOGIN ADMIN */}
      {showLoginModal && (
        <div className="fixed inset-0 z-[800] flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="glass-card p-10 rounded-[3rem] w-full max-w-sm shadow-2xl relative text-center border border-emerald-500/30 overflow-hidden">
            <button onClick={() => setShowLoginModal(false)} className="absolute top-6 right-6 p-2 text-slate-500 hover:text-rose-500 transition-colors"><X size={18}/></button>
            <Shield size={60} className="text-emerald-500 mx-auto mb-6 drop-shadow-md"/>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Login Admin</h2>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-8">Akses Kelola Direktori SOP</p>

            <form onSubmit={handleLogin} className="space-y-4 text-left">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">Username</label>
                <input type="text" value={loginCreds.username} onChange={e=>setLoginCreds({...loginCreds, username: e.target.value})} className="w-full px-5 py-4 bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:border-emerald-500 font-bold text-sm transition-all" placeholder="admin" required autoFocus/>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">Password</label>
                <div className="relative">
                  <input type={showPassword ? "text" : "password"} value={loginCreds.password} onChange={e=>setLoginCreds({...loginCreds, password: e.target.value})} className="w-full px-5 py-4 bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:border-emerald-500 font-black text-center tracking-[0.3em] text-sm transition-all" placeholder="password" required/>
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-emerald-500 transition-colors p-1" title={showPassword ? "Sembunyikan Password" : "Tampilkan Password"}>
                    {showPassword ? <EyeOff size={18}/> : <Eye size={18}/>}
                  </button>
                </div>
              </div>
              <button type="submit" className="w-full py-4 mt-2 bg-emerald-600 text-white rounded-2xl font-black uppercase text-[11px] tracking-widest btn-3d transition-colors">Masuk Sistem</button>
              <button type="button" onClick={handleLupaPassword} className="w-full py-3 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-emerald-600 transition-colors">Lupa Password?</button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DETAIL SOP & RIWAYAT */}
      {selectedSOP && (
        <div className="fixed inset-0 z-[600] flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setSelectedSOP(null)}>
          <div className="glass-card p-0 rounded-[3rem] w-full max-w-2xl shadow-[0_0_50px_rgba(16,185,129,0.15)] relative border border-emerald-500/30 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300" onClick={e => e.stopPropagation()}>
            
            {/* Modal Header */}
            <div className="p-8 pb-6 border-b border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 relative shrink-0">
              <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-emerald-400 to-blue-500"></div>
              <button onClick={() => setSelectedSOP(null)} className="absolute top-6 right-6 p-2 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-500 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 transition-colors">
                <X size={18}/>
              </button>
              
              <div className="flex items-center gap-4 mb-4">
                <div>
                  <span className="inline-block px-2.5 py-1 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-[9px] font-black uppercase tracking-widest mb-1.5 border border-slate-300 dark:border-slate-700">
                    {selectedSOP.id}
                  </span>
                  <p className="text-[11px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-500">{selectedSOP.category}</p>
                </div>
              </div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white leading-tight">{selectedSOP.title}</h2>
            </div>

            {/* Modal Body with TABS */}
            <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 shrink-0 px-8 pt-4">
               <button onClick={()=>setShowHistory(false)} className={`pb-3 px-4 text-xs font-black uppercase tracking-widest border-b-2 transition-all ${!showHistory ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400' : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>Informasi Dokumen</button>
               <button onClick={()=>setShowHistory(true)} className={`pb-3 px-4 text-xs font-black uppercase tracking-widest border-b-2 transition-all flex items-center gap-2 ${showHistory ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400' : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>
                 Jejak Audit & Revisi {selectedSOP.history && selectedSOP.history.length > 0 && <span className="bg-amber-500 text-white px-1.5 rounded-full text-[9px]">{selectedSOP.history.length}</span>}
               </button>
            </div>

            <div className="p-8 overflow-y-auto bg-white/30 dark:bg-slate-900/30 flex-1">
              {!showHistory ? (
                // TAB 1: INFO DOKUMEN
                <>
                  <div className="mb-8">
                    <h4 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-3 flex items-center gap-2"><FileText size={16}/> Deskripsi Prosedur</h4>
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 leading-relaxed bg-white/60 dark:bg-slate-950/40 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                      {selectedSOP.description}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
                      <p className="text-[10px] font-black uppercase text-slate-500 mb-1">Versi Dokumen</p>
                      <p className="text-lg font-black text-slate-900 dark:text-white">v{selectedSOP.version}</p>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
                      <p className="text-[10px] font-black uppercase text-slate-500 mb-1">Terakhir Diperbarui</p>
                      <p className="text-sm mt-1 font-black text-slate-900 dark:text-white">{formatDateIndo(selectedSOP.date)}</p>
                      <p className="text-[10px] mt-1 font-bold text-blue-500">Oleh: {selectedSOP.updatedBy}</p>
                    </div>
                  </div>
                </>
              ) : (
                // TAB 2: JEJAK AUDIT & RIWAYAT REVISI
                <div className="space-y-6">
                   <div className="relative pl-6 border-l-2 border-emerald-500/30 space-y-8">
                     {/* Versi Sekarang */}
                     <div className="relative">
                       <span className="absolute -left-[31px] top-1 w-4 h-4 bg-emerald-500 rounded-full border-4 border-white dark:border-slate-900 shadow-sm"></span>
                       <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-2xl border border-emerald-200 dark:border-emerald-800/50">
                         <div className="flex justify-between items-start mb-2">
                           <span className="px-2 py-1 bg-emerald-500 text-white text-[9px] font-black uppercase tracking-widest rounded-lg">Versi Saat Ini (v{selectedSOP.version})</span>
                           <span className="text-[10px] font-bold text-slate-500">{formatDateIndo(selectedSOP.date)}</span>
                         </div>
                         <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mt-2">Pembaruan oleh: <span className="font-bold text-slate-900 dark:text-white">{selectedSOP.updatedBy}</span></p>
                       </div>
                     </div>

                     {/* Riwayat Lama */}
                     {selectedSOP.history && selectedSOP.history.length > 0 ? (
                       selectedSOP.history.map((hist, i) => (
                         <div key={i} className="relative">
                           <span className="absolute -left-[31px] top-1 w-4 h-4 bg-slate-300 dark:bg-slate-600 rounded-full border-4 border-white dark:border-slate-900 shadow-sm"></span>
                           <div className="bg-white/60 dark:bg-slate-950/40 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
                             <div className="flex justify-between items-start mb-2">
                               <span className="text-[11px] font-black uppercase text-slate-600 dark:text-slate-400">Versi v{hist.version}</span>
                               <span className="text-[10px] font-bold text-slate-500">{formatDateIndo(hist.date)}</span>
                             </div>
                             <p className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">Dikelola oleh: {hist.updatedBy}</p>
                             <p className="text-[11px] italic text-slate-500 bg-slate-100 dark:bg-slate-900 p-2 rounded-lg mt-2">{hist.description}</p>
                           </div>
                         </div>
                       ))
                     ) : (
                       <p className="text-xs font-bold text-slate-500 ml-2">Belum ada riwayat revisi untuk dokumen ini.</p>
                     )}
                   </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 flex flex-col sm:flex-row gap-3 mt-auto shrink-0">
              <button onClick={() => setSelectedSOP(null)} className="flex-1 py-4 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-2xl font-black uppercase text-[11px] tracking-widest hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors">
                Tutup
              </button>
              <button onClick={() => handleView(selectedSOP)} className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-black uppercase text-[11px] tracking-widest btn-3d-blue flex items-center justify-center gap-2">
                <Eye size={18} /> Lihat Dokumen
              </button>
              <button onClick={() => handleDownload(selectedSOP)} className="flex-1 py-4 bg-emerald-600 text-white rounded-2xl font-black uppercase text-[11px] tracking-widest btn-3d flex items-center justify-center gap-2">
                <FileDown size={18} /> Unduh PDF
              </button>
            </div>
            
          </div>
        </div>
      )}

      {/* MODAL FORM TAMBAH/EDIT SOP */}
      {showSopForm && (
        <div className="fixed inset-0 z-[700] flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="glass-card p-0 rounded-[3rem] w-full max-w-2xl shadow-[0_0_50px_rgba(16,185,129,0.15)] relative border border-emerald-500/30 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300">
            
            <div className="p-8 pb-6 border-b border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 relative shrink-0">
              <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-emerald-400 to-blue-500"></div>
              <button onClick={() => setShowSopForm(false)} className="absolute top-6 right-6 p-2 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-500 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 transition-colors">
                <X size={18}/>
              </button>
              <div className="flex items-center gap-4 mb-2">
                <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-2xl flex items-center justify-center border border-emerald-200 dark:border-emerald-800/50">
                   {editingSop ? <Edit size={24} className="text-emerald-600 dark:text-emerald-400"/> : <Upload size={24} className="text-emerald-600 dark:text-emerald-400"/>}
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-900 dark:text-white leading-tight">{editingSop ? 'Revisi Dokumen SOP' : 'Upload SOP Baru'}</h2>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mt-1">Kelola Direktori Dokumen • Logged in: {adminUser?.username}</p>
                </div>
              </div>
            </div>

            <div className="p-8 overflow-y-auto bg-white/30 dark:bg-slate-900/30 flex-1">
              <form id="sopForm" onSubmit={handleSaveSop} className="space-y-5">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-800 dark:text-slate-400 ml-1">Judul SOP</label>
                  <input type="text" value={formData.title} onChange={e=>setFormData({...formData, title: e.target.value})} placeholder="Contoh: SOP Penggeledahan..." className="w-full px-5 py-4 premium-input rounded-2xl text-xs font-bold outline-none transition-all text-slate-900 dark:text-white" required />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-slate-800 dark:text-slate-400 ml-1">Kategori</label>
                    <select value={formData.category} onChange={e=>setFormData({...formData, category: e.target.value})} className="w-full px-5 py-4 premium-input rounded-2xl text-xs font-bold uppercase outline-none appearance-none cursor-pointer transition-all text-slate-900 dark:text-white" required>
                      {customCategories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-slate-800 dark:text-slate-400 ml-1">Versi / Revisi (Pembaruan)</label>
                    <input type="text" value={formData.version} onChange={e=>setFormData({...formData, version: e.target.value})} placeholder="Contoh: 1.0" className="w-full px-5 py-4 premium-input rounded-2xl text-xs font-bold outline-none transition-all text-slate-900 dark:text-white" required />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-slate-800 dark:text-slate-400 ml-1">Tanggal Berlaku</label>
                    <input type="date" value={formData.date} onChange={e=>setFormData({...formData, date: e.target.value})} className="w-full px-5 py-4 premium-input rounded-2xl text-xs font-bold outline-none transition-all text-slate-900 dark:text-white dark:[color-scheme:dark]" required />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-slate-800 dark:text-slate-400 ml-1">File Dokumen (PDF) <span className="text-rose-500 lowercase font-medium tracking-normal">*Max 5MB</span></label>
                    <div className="relative">
                      <input type="file" accept=".pdf" onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                      <div className={`w-full px-5 py-4 premium-input rounded-2xl text-xs font-bold transition-all flex items-center justify-between ${formData.file ? 'text-emerald-600 dark:text-emerald-400 border-emerald-500 bg-emerald-50/50' : 'text-slate-500 dark:text-slate-400'}`}>
                        <span className="truncate">{formData.file ? formData.file.name : 'Klik Untuk Pilih File PDF...'}</span>
                        <Upload size={16} />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-800 dark:text-slate-400 ml-1">Catatan Revisi / Deskripsi Prosedur</label>
                  <textarea value={formData.description} onChange={e=>setFormData({...formData, description: e.target.value})} rows={3} placeholder="Jelaskan perubahan versi ini atau deskripsi singkat..." className="w-full px-5 py-4 premium-input rounded-2xl text-xs font-bold outline-none transition-all resize-y text-slate-900 dark:text-white" required></textarea>
                </div>
              </form>
            </div>

            <div className="p-6 border-t border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 flex gap-3 mt-auto shrink-0">
              <button onClick={() => setShowSopForm(false)} className="flex-1 py-4 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-2xl font-black uppercase text-[11px] tracking-widest hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors">
                Batal
              </button>
              <button type="submit" form="sopForm" className="flex-[2] py-4 bg-blue-600 text-white rounded-2xl font-black uppercase text-[11px] tracking-widest btn-3d-blue flex items-center justify-center gap-2">
                <CheckCircle2 size={18} /> Simpan Data & Revisi
              </button>
            </div>
            
          </div>
        </div>
      )}

      {/* MODAL KONFIRMASI LOGOUT */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[800] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="glass-card p-8 rounded-3xl w-full max-w-sm shadow-2xl relative text-center border border-rose-500/30">
            <div className="w-16 h-16 bg-rose-100 dark:bg-rose-900/30 rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner">
              <AlertCircle size={32} className="text-rose-600 dark:text-rose-500"/>
            </div>
            <h3 className="text-lg font-black mb-2 text-slate-900 dark:text-white">Keluar Sesi Admin?</h3>
            <p className="text-sm font-bold text-slate-500 mb-8">Anda harus login kembali untuk masuk ke mode kelola direktori SOP.</p>
            
            <div className="flex gap-3">
              <button onClick={() => setShowLogoutConfirm(false)} className="flex-1 py-3 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors">Batal</button>
              <button onClick={() => { setAdminUser(null); setShowLogoutConfirm(false); showToast("Berhasil Keluar"); }} className="flex-1 py-3 bg-rose-600 text-white rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-rose-700 transition-colors shadow-md shadow-rose-600/20">Ya, Keluar</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PENGATURAN ADMIN */}
      {showSettings && (
        <div className="fixed inset-0 z-[900] flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="glass-card p-0 rounded-[3rem] w-full max-w-2xl shadow-[0_0_50px_rgba(59,130,246,0.15)] relative border border-blue-500/30 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300">
            <div className="p-8 pb-6 border-b border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 relative shrink-0">
              <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-400 to-indigo-500"></div>
              <button onClick={() => setShowSettings(false)} className="absolute top-6 right-6 p-2 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-500 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 transition-colors">
                <X size={18}/>
              </button>
              <div className="flex items-center gap-4 mb-2">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center border border-blue-200 dark:border-blue-800/50">
                   <Settings size={24} className="text-blue-600 dark:text-blue-400"/>
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-900 dark:text-white leading-tight">Pengaturan Sistem</h2>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mt-1">Kelola Kredensial & Kategori</p>
                </div>
              </div>
            </div>

            <div className="p-8 overflow-y-auto bg-white/30 dark:bg-slate-900/30 flex-1 space-y-8">
              {/* Seksi Akun */}
              <div>
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-4 flex items-center gap-2"><Shield size={16}/> Akun Admin & Pemulihan</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-slate-800 dark:text-slate-400 ml-1">Username Admin</label>
                    <input type="text" value={settingsForm.username} onChange={e=>setSettingsForm({...settingsForm, username: e.target.value})} className="w-full px-4 py-3 premium-input rounded-xl text-xs font-bold outline-none transition-all text-slate-900 dark:text-white" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-slate-800 dark:text-slate-400 ml-1">Password Admin</label>
                    <div className="relative">
                      <input type={showSettingsPassword ? "text" : "password"} value={settingsForm.password} onChange={e=>setSettingsForm({...settingsForm, password: e.target.value})} className="w-full px-4 py-3 premium-input rounded-xl text-xs font-bold outline-none transition-all text-slate-900 dark:text-white" />
                      <button type="button" onClick={() => setShowSettingsPassword(!showSettingsPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-500 transition-colors p-1" title={showSettingsPassword ? "Sembunyikan Password" : "Tampilkan Password"}>
                        {showSettingsPassword ? <EyeOff size={16}/> : <Eye size={16}/>}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-[10px] font-black uppercase text-slate-800 dark:text-slate-400 ml-1">Nomor WA Pemulihan (Format: 628...)</label>
                    <input type="number" value={settingsForm.recoveryWa} onChange={e=>setSettingsForm({...settingsForm, recoveryWa: e.target.value})} placeholder="628..." className="w-full px-4 py-3 premium-input rounded-xl text-xs font-bold outline-none transition-all text-slate-900 dark:text-white" />
                  </div>
                </div>
              </div>

              <hr className="border-slate-200 dark:border-slate-800"/>

              {/* Seksi Kategori */}
              <div>
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-4 flex items-center gap-2"><ListOrdered size={16}/> Kelola Kategori SOP</h3>
                <form onSubmit={(e) => {
                  e.preventDefault();
                  const trimmed = newCategory.trim();
                  if(!trimmed) return;
                  if(customCategories.some(c => c.toLowerCase() === trimmed.toLowerCase())) { showToast('Kategori sudah ada!', 'error'); return; }
                  const updated = [...customCategories, trimmed];
                  setCustomCategories(updated);
                  localStorage.setItem('satuSopCategories', JSON.stringify(updated));
                  setNewCategory('');
                  showToast('Kategori ditambahkan!');
                }} className="flex gap-2 mb-4">
                  <input type="text" value={newCategory} onChange={e=>setNewCategory(e.target.value)} placeholder="Nama kategori baru..." className="flex-1 px-4 py-3 premium-input rounded-xl text-xs font-bold outline-none transition-all text-slate-900 dark:text-white" />
                  <button type="submit" className="px-4 py-3 bg-emerald-100 text-emerald-600 hover:bg-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-400 rounded-xl transition-colors shrink-0">
                    <Plus size={18}/>
                  </button>
                </form>
                <div className="flex flex-wrap gap-2">
                  {customCategories.map(cat => (
                    <div key={cat} className="flex items-center gap-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-lg shadow-sm">
                      <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">{cat}</span>
                      <button onClick={() => {
                        setPromptDialog({
                          isOpen: true,
                          message: "Ubah nama kategori:",
                          value: cat,
                          onConfirm: (newName) => {
                            if(newName && newName.trim() !== "" && newName !== cat) {
                              const trimmed = newName.trim();
                              if(customCategories.some(c => c.toLowerCase() === trimmed.toLowerCase())) {
                                showToast('Kategori sudah ada!', 'error');
                                return;
                              }
                              const updated = customCategories.map(c => c === cat ? trimmed : c);
                              setCustomCategories(updated);
                              localStorage.setItem('satuSopCategories', JSON.stringify(updated));
                              setSops(prev => prev.map(s => s.category === cat ? { ...s, category: trimmed } : s));
                              if (selectedCategory === cat) setSelectedCategory(trimmed);
                              showToast('Kategori berhasil diubah!');
                            }
                          }
                        });
                      }} className="ml-1 text-blue-500 hover:text-blue-600 p-1 rounded transition-colors"><Edit size={12}/></button>
                      <button onClick={() => {
                        setConfirmDialog({
                          isOpen: true,
                          message: `Hapus kategori "${cat}"?`,
                          onConfirm: () => {
                            const updated = customCategories.filter(c => c !== cat);
                            setCustomCategories(updated);
                            localStorage.setItem('satuSopCategories', JSON.stringify(updated));
                            if (selectedCategory === cat) setSelectedCategory('Semua');
                            showToast('Kategori dihapus!');
                          }
                        });
                      }} className="text-rose-500 hover:text-rose-600 p-1 rounded transition-colors"><Trash2 size={12}/></button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 flex gap-3 mt-auto shrink-0">
              <button onClick={() => setShowSettings(false)} className="flex-1 py-4 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-2xl font-black uppercase text-[11px] tracking-widest hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors">
                Batal
              </button>
              <button onClick={() => {
                setAdminCreds(settingsForm);
                localStorage.setItem('satuSopAdminCreds', JSON.stringify(settingsForm));
                showToast('Pengaturan Akun Berhasil Disimpan!');
                setShowSettings(false);
              }} className="flex-[2] py-4 bg-blue-600 text-white rounded-2xl font-black uppercase text-[11px] tracking-widest btn-3d-blue flex items-center justify-center gap-2">
                <CheckCircle2 size={18} /> Simpan Pengaturan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL KONFIRMASI GENERIC */}
      {confirmDialog.isOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="glass-card p-8 rounded-3xl w-full max-w-sm shadow-2xl relative text-center border border-rose-500/30">
            <div className="w-16 h-16 bg-rose-100 dark:bg-rose-900/30 rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner">
              <AlertCircle size={32} className="text-rose-600 dark:text-rose-500"/>
            </div>
            <h3 className="text-lg font-black mb-2 text-slate-900 dark:text-white">Konfirmasi</h3>
            <p className="text-sm font-bold text-slate-500 mb-8">{confirmDialog.message}</p>
            
            <div className="flex gap-3">
              <button onClick={() => setConfirmDialog({ isOpen: false, message: '', onConfirm: null })} className="flex-1 py-3 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors">Batal</button>
              <button onClick={() => { confirmDialog.onConfirm(); setConfirmDialog({ isOpen: false, message: '', onConfirm: null }); }} className="flex-1 py-3 bg-rose-600 text-white rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-rose-700 transition-colors shadow-md shadow-rose-600/20">Ya, Lanjutkan</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PROMPT GENERIC */}
      {promptDialog.isOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="glass-card p-8 rounded-3xl w-full max-w-sm shadow-2xl relative text-center border border-blue-500/30">
            <h3 className="text-lg font-black mb-4 text-slate-900 dark:text-white">{promptDialog.message}</h3>
            <input type="text" value={promptDialog.value} onChange={e => setPromptDialog({...promptDialog, value: e.target.value})} className="w-full px-4 py-3 premium-input rounded-xl text-sm font-bold outline-none transition-all text-slate-900 dark:text-white mb-6" autoFocus />
            
            <div className="flex gap-3">
              <button onClick={() => setPromptDialog({ isOpen: false, message: '', value: '', onConfirm: null })} className="flex-1 py-3 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors">Batal</button>
              <button onClick={() => { promptDialog.onConfirm(promptDialog.value); setPromptDialog({ isOpen: false, message: '', value: '', onConfirm: null }); }} className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-blue-700 transition-colors shadow-md shadow-blue-600/20">Simpan</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
