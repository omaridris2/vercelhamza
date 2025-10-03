'use client';

import React, { useState, useEffect } from 'react';
import { DndContext, closestCorners, DragEndEvent } from '@dnd-kit/core';
import { supabase } from '@/lib/supabaseClient'

import NewJobForm from '../components/NewJobForm';
import NewCodeForm from '../components/NewCodeForm';
import NewUserForm from '../components/NewUserForm';
import AddPrintForm from '../components/NewPrintForm';

import  Timeline  from '../components/TimeLIne';

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

// Add this type to match your UserTable component
type Profile = {
  id: string;
  name: string | null;
  email: string;
  role: string | null;
  created_at: string;
};

// Add this with your other state declarations
type PrintType = {
  id: string;
  name: string;
  description: string;
  createdAt: Date;
};

const AdminTimelinePage = () => {
  const TICKS = Array.from({ length: 24 });
  const [activeSection, setActiveSection] = useState<'dashboard' | 'printing-types' | 'discount-codes' | 'user-accounts' | 'settings'>('dashboard');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Add loading state for profiles
  const [profilesLoading, setProfilesLoading] = useState(true);
  const [profiles, setProfiles] = useState<Profile[]>([]);

  const handleComplete = (id: string) => {
    setCubes(prev =>
      prev.map(cube =>
        cube.id === id ? { ...cube, completed: true } : cube
      )
    );
  };

  //For the menus
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

  // Add discount codes state
  const [discountCodes, setDiscountCodes] = useState<DiscountCode[]>([]);

  // Add users state
  const [users, setUsers] = useState<User[]>([]);

  // New state for assigned users
  const [assignedUsers, setAssignedUsers] = useState<{[key: string]: string | null}>({});

  // Add state for print types
  const [printTypes, setPrintTypes] = useState<PrintType[]>([]);

  // Fetch profiles data on component mount
  useEffect(() => {
    const fetchProfiles = async () => {
      setProfilesLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, email, role, created_at');
      
      if (error) {
        console.error('⚠️ Error fetching users:', error);
      } else {
        setProfiles(data || []);
      }
      setProfilesLoading(false);
    };

    fetchProfiles();
  }, []);

  // Function to refresh profiles (call this when you add a new user)
  const refreshProfiles = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, name, email, role, created_at');
    
    if (error) {
      console.error('⚠️ Error fetching users:', error);
    } else {
      setProfiles(data || []);
    }
  };

  // Add a new job cube
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

  // Delete discount code
  const deleteDiscountCode = (id: string) => {
    setDiscountCodes(prev => prev.filter(code => code.id !== id));
  };

  // Delete user
  const deleteUser = (id: string) => {
    setUsers(prev => prev.filter(user => user.id !== id));
  };

  // When a cube is dropped
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

  // Handle new discount code submission
  const handleCodeSubmit = (newCode: { id: string; title: string; type: string; mode: string; expirationDate: number }) => {
    const codeWithDate: DiscountCode = {
      ...newCode,
      createdAt: new Date()
    };
    setDiscountCodes(prev => [...prev, codeWithDate]);
  };

  // Handle new user submission - now also refresh profiles
  const handleUserSubmit = async (newUser: { id: string; name: string; email: string; role: string }) => {
    const userWithDate: User = {
      ...newUser,
      createdAt: new Date()
    };
    setUsers(prev => [...prev, userWithDate]);
    
    // Refresh profiles data after adding new user
    await refreshProfiles();
  };

  // Handle user assignment to cube
  const handleAssignUser = (cubeId: string, userId: string | null) => {
    setAssignedUsers(prev => ({
      ...prev,
      [cubeId]: userId
    }));
  };

  // Add this with your other handler functions
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

  // Add this with your other handler functions
  const handlePrintTypeSubmit = (data: Omit<PrintType, 'createdAt'>) => {
    const newPrintType = {
      ...data,
      createdAt: new Date()
    };
    setPrintTypes(prev => [...prev, newPrintType]);
  };

  // Format expiration time
  const formatExpirationTime = (hour: number) => {
    return `${hour.toString().padStart(2, '0')}:00`;
  };

  // Format created date
  const formatCreatedDate = (date: Date) => {
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  const getSectionTitle = () => {
    switch (activeSection) {
      case 'dashboard': return 'Dashboard';
      case 'printing-types': return 'Printing Types';
      case 'discount-codes': return 'Discount Codes';
      case 'user-accounts': return 'User Accounts';
      case 'settings': return 'Settings';
      default: return 'Dashboard';
    }
  };

  const handleSectionChange = (section: typeof activeSection) => {
    setActiveSection(section);
    setIsDrawerOpen(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f8f8f9] to-[#f8f8f9] p-6 relative">
      <div className="max-w-screen-xl mx-auto">
        {/* Header */}
        <div className="    mb-8   flex justify-between items-center">
          {/* Three dots*/}
          <button
            onClick={() => setIsDrawerOpen(true)}
            className="flex flex-row gap-1 p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
          </button>
          
          <div className="w-8"></div> {/* Spacer for centering */}
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
        onClick={() => handleSectionChange('settings')}
        className={`w-full text-left p-4 rounded-lg transition-all duration-200 ${
          activeSection === 'settings' 
            ? 'bg-[#636255] text-white shadow-lg' 
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        }`}
      >
        <div className="font-semibold">Settings</div>
        <div className="text-sm opacity-80">System configuration</div>
      </button>
    </div>
  </div>
</div>

{/* Overlay - Only render when drawer is open with fade animation */}
{isDrawerOpen && (
  <div 
    className={`fixed inset-0 bg-black z-40 transition-opacity duration-300 ease-in-out ${
      isDrawerOpen ? 'opacity-50' : 'opacity-0'
    }`}
    onClick={() => setIsDrawerOpen(false)}
  ></div>
)}

        {/* DASHBOARD SECTION */}
        {activeSection === 'dashboard' && (
          <div className="">
           <div>
            <Timeline 
            users={users} 
            assignedUsers={assignedUsers}
            onAssignUser={handleAssignUser}
             />
          </div>
          </div>
        )}

        {activeSection === 'printing-types' && (
          <div className=" rounded-2xl  p-12 ">
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
          <div className="bg-white rounded-2xl shadow-xl p-12 border border-yellow-200">
            <div className='flex items-center justify-between mb-8'>
              <h2 className="text-2xl font-bold text-gray-900">Discount Codes</h2>
              <button onClick={handleAddCode} className="bg-[#636255] text-white px-20 py-2 rounded-lg hover:bg-yellow-500">Generate Code</button>
            </div>

            {/* Statistics */}
            <div className="flex gap-8 mb-8">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-gray-900">{discountCodes.length}</div>
                <div className="text-sm text-gray-600">Total Codes</div>
              </div>
              
            </div>

            {/* Discount Codes Table */}
            {discountCodes.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border border-gray-300 px-4 py-3 text-left font-semibold">Code</th>
                      <th className="border border-gray-300 px-4 py-3 text-left font-semibold">Type</th>
                      <th className="border border-gray-300 px-4 py-3 text-left font-semibold">Mode</th>
                      <th className="border border-gray-300 px-4 py-3 text-left font-semibold">Expires At</th>
                      <th className="border border-gray-300 px-4 py-3 text-left font-semibold">Created</th>
                      <th className="border border-gray-300 px-4 py-3 text-left font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {discountCodes.map((code) => (
                      <tr key={code.id} className="hover:bg-gray-50">
                        <td className="border border-gray-300 px-4 py-3 font-mono font-semibold">{code.title}</td>
                        <td className="border border-gray-300 px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            code.type === 'Fixed' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {code.type}
                          </span>
                        </td>
                        <td className="border border-gray-300 px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            code.mode === 'Auto' 
                              ? 'bg-purple-100 text-purple-800' 
                              : 'bg-orange-100 text-orange-800'
                          }`}>
                            {code.mode}
                          </span>
                        </td>
                        <td className="border border-gray-300 px-4 py-3">{formatExpirationTime(code.expirationDate)}</td>
                        <td className="border border-gray-300 px-4 py-3 text-sm text-gray-600">{formatCreatedDate(code.createdAt)}</td>
                        <td className="border border-gray-300 px-4 py-3">
                          <button 
                            onClick={() => deleteDiscountCode(code.id)}
                            className="text-red-600 hover:text-red-800 text-sm font-medium"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <div className="text-lg">No discount codes created yet</div>
                <div className="text-sm mt-2">Click &quot;Generate Code&quot; to create your first discount code</div>
              </div>
            )}
          </div>
        )}

        {activeSection === 'user-accounts' && (
          <div className="">
            <div className='flex items-center justify-between mb-8'>
              <h2 className="text-2xl font-bold text-gray-900">User Accounts</h2>
              <button onClick={handleAddUser} className="bg-[#636255] text-white px-20 py-2 rounded-lg hover:bg-yellow-500">Add User</button>
            </div>
            <UserTable users={profiles} loading={profilesLoading} />

          </div>
        )}

        {activeSection === 'settings' && (
          <div className="bg-white rounded-2xl shadow-xl p-12 border border-yellow-200">
            <h2 className="text-2xl font-bold text-gray-900 mb-10">Settings</h2>
            <div className="text-lg text-gray-600">System settings coming soon...</div>
          </div>
        )}
      </div>

      {showMenu && (
        <NewJobForm
          
          onSubmit={handleJobSubmit}
        />
      )}
      
      {showCodeMenu && (
        <NewCodeForm
          onClose={() => setShowcodeMenu(false)}
          onSubmit={handleCodeSubmit}
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