'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DragEndEvent } from '@dnd-kit/core';
import { supabase } from '@/lib/supabaseClient';

import AddPrintForm from '../components/NewPrintForm';
import TimeLineO from '../components/TimeLineO';
import PrintTypesMenu from '../components/PrintTypesMenu';

type DiscountCode = {
  id: string;
  title: string;
  type: string;
  mode: string;
  expirationDate: number;
  createdAt: Date;
};

type User = {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: Date;
};

type Profile = {
  id: string;
  name: string | null;
  email: string;
  role: string | null;
  type: string | null;
  created_at: string;
};

type PrintType = {
  id: string;
  name: string;
  description: string;
  createdAt: Date;
};

interface UserTableProps {
  users: Profile[];
  loading: boolean;
  onDeleteUser: (userId: string) => Promise<void>;
  onRefresh: () => Promise<void>;
}

const Operator = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);

  const TICKS = Array.from({ length: 24 });
  const [activeSection, setActiveSection] = useState<'dashboard' | 'printing-types' | 'settings'>('dashboard');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const [profilesLoading, setProfilesLoading] = useState(true);
  const [profiles, setProfiles] = useState<Profile[]>([]);

  const [showMenu, setShowMenu] = useState(false);
  const [showCodeMenu, setShowcodeMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showPrintMenu, setShowPrintMenu] = useState(false);

  const [cubes, setCubes] = useState<{
    id: string;
    tickId: string | null;
    title: string;
    size: string;
    type: string;
    completed: boolean;
  }[]>([]);

  const [discountCodes, setDiscountCodes] = useState<DiscountCode[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [assignedUsers, setAssignedUsers] = useState<{[key: string]: string | null}>({});
  const [printTypes, setPrintTypes] = useState<PrintType[]>([]);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Authentication check - same as Designer page
  useEffect(() => {
    const fetchProfile = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.push('/.');
        return;
      }

      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('id, name, email, role, type, created_at')
        .eq('id', session.user.id)
        .single();

      if (error || profileData?.role !== 'Operator') {
        router.push('/');
        return;
      }

      setProfile(profileData);
      setLoading(false);
    };

    fetchProfile();
  }, [router]);

  // Fetch profiles data on component mount
  useEffect(() => {
    const fetchProfiles = async () => {
      setProfilesLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, email, role, type, created_at');
      
      if (error) {
        console.error('⚠️ Error fetching users:', error);
      } else {
        setProfiles(data || []);
      }
      setProfilesLoading(false);
    };

    if (!loading) {
      fetchProfiles();
    }
  }, [loading]);

  const refreshProfiles = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, name, email, role, type, created_at');
    
    if (error) {
      console.error('⚠️ Error fetching users:', error);
    } else {
      setProfiles(data || []);
    }
  };

  const handleComplete = (id: string) => {
    setCubes(prev =>
      prev.map(cube =>
        cube.id === id ? { ...cube, completed: true } : cube
      )
    );
  };

  const handleAddJob = () => {
    setShowMenu(true);
  };

  const handleAddCode = () => {
    setShowcodeMenu(true);
  };

  const handleAddUser = () => {
    setShowUserMenu(true);
  };

  const deleteCube = (id: string) => {
    setCubes(prev => prev.filter(cube => cube.id !== id));
  };

  const deleteDiscountCode = (id: string) => {
    setDiscountCodes(prev => prev.filter(code => code.id !== id));
  };

  const deleteUser = (id: string) => {
    setUsers(prev => prev.filter(user => user.id !== id));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { over, active } = event;

    if (over) {
      setCubes(prev =>
        prev.map(cube =>
          cube.id === active.id
            ? { ...cube, tickId: over.id.toString() }
            : cube
        )
      );
    }
  };

  const handleUserSubmit = async (newUser: { 
    id: string; 
    name: string; 
    email: string; 
    role: string;
    type?: string | null;
  }) => {
    const userWithDate: User = {
      ...newUser,
      createdAt: new Date()
    };
    setUsers(prev => [...prev, userWithDate]);
    
    await refreshProfiles();
  };

  const handleAssignUser = (cubeId: string, userId: string | null) => {
    setAssignedUsers(prev => ({
      ...prev,
      [cubeId]: userId
    }));
  };

  const handleJobSubmit = (jobData: { 
    id: string;
    title: string; 
    size: string;
    type: string;
  }) => {
    const newCube = {
      ...jobData,
      tickId: null,
      completed: false
    };
    setCubes(prev => [...prev, newCube]);
    setShowMenu(false);
  };

  const handlePrintTypeSubmit = (data: Omit<PrintType, 'createdAt'>) => {
    const newPrintType = {
      ...data,
      createdAt: new Date()
    };
    setPrintTypes(prev => [...prev, newPrintType]);
  };

  const formatExpirationTime = (hour: number) => {
    return `${hour.toString().padStart(2, '0')}:00`;
  };

  const formatCreatedDate = (date: Date) => {
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  const handleSectionChange = (section: typeof activeSection) => {
    setActiveSection(section);
    setIsDrawerOpen(false);
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);

      if (error) {
        throw error;
      }

      setProfiles(prevProfiles => 
        prevProfiles.filter(profile => profile.id !== userId)
      );

    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  const confirmLogout = () => {
    setShowLogoutConfirm(false);
    handleLogout();
  };

  // Loading state - same as Designer page
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-yellow-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f8f8f9] to-[#f8f8f9] p-6 relative">
      <div className="max-w-screen-xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <button
            onClick={() => setIsDrawerOpen(true)}
            className="flex flex-row gap-1 p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
          </button>

          <div className="flex items-center gap-4">
            
            <div className="text-right">
              <div className="text-lg font-bold text-gray-800">
                {profile?.name || 'Operator'}
              </div>
              {profile?.type && (
                <div className="text-sm text-gray-600">
                  {profile.type} Operator
                </div>
              )}
            </div>

            <button
              onClick={() => setShowLogoutConfirm(true)}
              className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
              title="Logout"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Logout
            </button>

            <img
              src="/logo.svg"
              alt="Logo"
              width={120}
              height={120}
              className="mb-0"
            />
          </div>
        </div>
        
        {/* Left Drawer */}
        <div className={`fixed left-0 top-0 h-full w-80 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${
          isDrawerOpen ? 'translate-x-0' : '-translate-x-full'
        }`}>
          <div className="p-6">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-xl font-bold text-gray-900">Navigation</h2>
              <button
                onClick={() => setIsDrawerOpen(false)}
                className="text-gray-500 hover:text-gray-700 transition-colors duration-200"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-3">
              <button
                onClick={() => handleSectionChange('dashboard')}
                className={`w-full text-left p-4 rounded-lg transition-all duration-200 ${
                  activeSection === 'dashboard' 
                    ? 'bg-[#636255] text-white shadow-lg' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <div className="font-semibold">Dashboard</div>
                <div className="text-sm opacity-80">Overview and timeline</div>
              </button>

              <button
                onClick={() => handleSectionChange('printing-types')}
                className={`w-full text-left p-4 rounded-lg transition-all duration-200 ${
                  activeSection === 'printing-types' 
                    ? 'bg-[#636255] text-white shadow-lg' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <div className="font-semibold">Printing Types</div>
                <div className="text-sm opacity-80">Manage print categories</div>
              </button>
            </div>
          </div>
        </div>

        {/* Overlay */}
        {isDrawerOpen && (
          <div 
            className={`fixed inset-0 bg-black z-40 transition-opacity duration-300 ease-in-out ${
              isDrawerOpen ? 'opacity-50' : 'opacity-0'
            }`}
            onClick={() => setIsDrawerOpen(false)}
          ></div>
        )}

        {/* Logout Confirmation Modal */}
        {showLogoutConfirm && (
          <>
            <div 
              className="fixed inset-0 bg-black bg-opacity-50 z-50 transition-opacity duration-200"
              onClick={() => setShowLogoutConfirm(false)}
            ></div>
            <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl shadow-2xl z-50 p-8 max-w-md w-full mx-4">
              <div className="text-center">
                <div className="mb-4 flex justify-center">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Logout Confirmation</h3>
                <p className="text-gray-600 mb-8">Are you sure you want to logout?</p>
                
                <div className="flex gap-4">
                  <button
                    onClick={() => setShowLogoutConfirm(false)}
                    className="flex-1 px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmLogout}
                    className="flex-1 px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors"
                  >
                    Logout
                  </button>
                </div>
              </div>
            </div>
          </>
        )}

        {/* DASHBOARD SECTION */}
        {activeSection === 'dashboard' && (
          <div className="">
            <div>
              <TimeLineO 
                users={profiles.map(profile => ({
                  id: profile.id,
                  name: profile.name || '',
                  email: profile.email,
                  role: profile.role || 'user',
                  type: profile.type || null,
                  createdAt: new Date(profile.created_at)
                }))}
                assignedUsers={assignedUsers}
                onAssignUser={handleAssignUser}
                currentOperatorType={profile?.type || null}
              />
            </div>
          </div>
        )}

        {activeSection === 'printing-types' && (
          <div className="rounded-2xl p-12">
            <div className='flex items-center justify-between mb-8'>
              <h2 className="text-2xl font-bold text-gray-900">Printing Types</h2>
              <button 
                onClick={() => setShowPrintMenu(true)} 
                className="bg-[#636255] text-white px-20 py-2 rounded-lg hover:bg-yellow-500"
              >
                Add Print Type
              </button>
            </div>
            <PrintTypesMenu />
            
            {showPrintMenu && (
              <AddPrintForm
                onClose={() => setShowPrintMenu(false)}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Operator;