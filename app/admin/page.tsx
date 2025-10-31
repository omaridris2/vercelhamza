'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DndContext, closestCorners, DragEndEvent } from '@dnd-kit/core';
import { supabase } from '@/lib/supabaseClient';

import NewJobForm from '../components/NewJobForm';
import NewCodeForm from '../components/NewCodeForm';
import NewUserForm from '../components/NewUserForm';
import AddPrintForm from '../components/NewPrintForm';
import DiscountCodesTable from '../components/DiscountCodesTable';
import Timeline from '../components/TimeLIne';
import UserTable from '../components/UsersMenu';
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

const AdminTimelinePage = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  
  const TICKS = Array.from({ length: 24 });
  const [activeSection, setActiveSection] = useState<'dashboard' | 'printing-types' | 'discount-codes' | 'user-accounts' | 'settings' | 'roland' | 'digital' | 'sign' | 'laser' | 'wood' | 'reprint' | 'uv'>('dashboard');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const [profilesLoading, setProfilesLoading] = useState(true);
  const [profiles, setProfiles] = useState<Profile[]>([]);

  const [showMenu, setShowMenu] = useState(false);
  const [showCodeMenu, setShowcodeMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showPrintMenu, setShowPrintMenu] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

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

      if (error || profileData?.role !== 'Admin') {
        router.push('/');
        return;
      }

      setProfile(profileData);
      setLoading(false);
    };

    fetchProfile();
  }, [router]);

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
                {profile?.name || 'Admin'}
              </div>
              <div className="text-sm text-gray-600">
                Administrator
              </div>
            </div>

            

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
        <div className={`fixed left-0 top-0 h-full w-80 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out overflow-y-auto ${
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
              <div className="pt-4 pb-2">
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-4">Management</div>
              </div>

              

              <button
                onClick={() => handleSectionChange('discount-codes')}
                className={`w-full text-left p-4 rounded-lg transition-all duration-200 ${
                  activeSection === 'discount-codes' 
                    ? 'bg-[#636255] text-white shadow-lg' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <div className="font-semibold">Discount Codes</div>
                <div className="text-sm opacity-80">Generate and manage codes</div>
              </button>

              <button
                onClick={() => handleSectionChange('user-accounts')}
                className={`w-full text-left p-4 rounded-lg transition-all duration-200 ${
                  activeSection === 'user-accounts' 
                    ? 'bg-[#636255] text-white shadow-lg' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <div className="font-semibold">User Accounts</div>
                <div className="text-sm opacity-80">Manage user profiles</div>
              </button>
              

              
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

              <div className="pt-4 pb-2">
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-4">Product Types</div>
              </div>

              <button
                onClick={() => handleSectionChange('roland')}
                className={`w-full text-left p-4 rounded-lg transition-all duration-200 ${
                  activeSection === 'roland' 
                    ? 'bg-[#636255] text-white shadow-lg' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <div className="font-semibold">Roland</div>
                <div className="text-sm opacity-80">Roland products</div>
              </button>

              <button
                onClick={() => handleSectionChange('digital')}
                className={`w-full text-left p-4 rounded-lg transition-all duration-200 ${
                  activeSection === 'digital' 
                    ? 'bg-[#636255] text-white shadow-lg' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <div className="font-semibold">Digital</div>
                <div className="text-sm opacity-80">Digital products</div>
              </button>

              <button
                onClick={() => handleSectionChange('sign')}
                className={`w-full text-left p-4 rounded-lg transition-all duration-200 ${
                  activeSection === 'sign' 
                    ? 'bg-[#636255] text-white shadow-lg' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <div className="font-semibold">Sign</div>
                <div className="text-sm opacity-80">Sign products</div>
              </button>

              <button
                onClick={() => handleSectionChange('laser')}
                className={`w-full text-left p-4 rounded-lg transition-all duration-200 ${
                  activeSection === 'laser' 
                    ? 'bg-[#636255] text-white shadow-lg' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <div className="font-semibold">Laser</div>
                <div className="text-sm opacity-80">Laser products</div>
              </button>

              <button
                onClick={() => handleSectionChange('wood')}
                className={`w-full text-left p-4 rounded-lg transition-all duration-200 ${
                  activeSection === 'wood' 
                    ? 'bg-[#636255] text-white shadow-lg' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <div className="font-semibold">Wood</div>
                <div className="text-sm opacity-80">Wood products</div>
              </button>

             

              <button
                onClick={() => handleSectionChange('uv')}
                className={`w-full text-left p-4 rounded-lg transition-all duration-200 ${
                  activeSection === 'uv' 
                    ? 'bg-[#636255] text-white shadow-lg' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <div className="font-semibold">UV</div>
                <div className="text-sm opacity-80">UV products</div>
              </button>
              <button
              onClick={() => setShowLogoutConfirm(true)}
              className=" px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
              title="Logout"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Logout
            </button>

              
            </div>
          </div>
        </div>

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
              <Timeline 
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
              />
            </div>
          </div>
        )}

        {/* PRODUCT TYPE SECTIONS */}
        {activeSection === 'roland' && (
          <div className="rounded-2xl p-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-8">Roland Products</h2>
            <PrintTypesMenu filterType="Roland" />
          </div>
        )}

        {activeSection === 'digital' && (
          <div className="rounded-2xl p-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-8">Digital Products</h2>
            <PrintTypesMenu filterType="Digital" />
          </div>
        )}

        {activeSection === 'sign' && (
          <div className="rounded-2xl p-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-8">Sign Products</h2>
            <PrintTypesMenu filterType="Sign" />
          </div>
        )}

        {activeSection === 'laser' && (
          <div className="rounded-2xl p-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-8">Laser Products</h2>
            <PrintTypesMenu filterType="Laser" />
          </div>
        )}

        {activeSection === 'wood' && (
          <div className="rounded-2xl p-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-8">Wood Products</h2>
            <PrintTypesMenu filterType="Wood" />
          </div>
        )}

        {activeSection === 'reprint' && (
          <div className="rounded-2xl p-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-8">Reprint Products</h2>
            <PrintTypesMenu filterType="Reprint" />
          </div>
        )}

        {activeSection === 'uv' && (
          <div className="rounded-2xl p-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-8">UV Products</h2>
            <PrintTypesMenu filterType="UV" />
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

        {/* DISCOUNT CODES SECTION */}
        {activeSection === 'discount-codes' && (
          <div className="p-12">
            <div className='flex items-center justify-between mb-8'>
              <h2 className="text-2xl font-bold text-gray-900">Discount Codes</h2>
              <button onClick={handleAddCode} className="bg-[#636255] text-white px-20 py-2 rounded-lg hover:bg-yellow-500">Generate Code</button>
            </div>

            <DiscountCodesTable />
          </div>
        )}

        {activeSection === 'user-accounts' && (
          <div className="">
            <div className='flex items-center justify-between mb-8'>
              <h2 className="text-2xl font-bold text-gray-900">User Accounts</h2>
              <button onClick={handleAddUser} className="bg-[#636255] text-white px-20 py-2 rounded-lg hover:bg-yellow-500">Add User</button>
            </div>
            <UserTable 
              users={profiles} 
              loading={profilesLoading} 
              onDeleteUser={handleDeleteUser}
              onRefresh={refreshProfiles}
            />
          </div>
        )}
      </div>

      {showMenu && (
        <NewJobForm userId={profile?.id || "some-id"} />
      )}
      
      {showCodeMenu && (
        <NewCodeForm
          onClose={() => setShowcodeMenu(false)}
        />
      )}

      {showUserMenu && (
        <NewUserForm
          onClose={() => setShowUserMenu(false)}
          onSubmit={handleUserSubmit}
        />
      )}
    </div>
  );
};

export default AdminTimelinePage;