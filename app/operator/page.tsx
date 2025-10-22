'use client';

import React, { useState, useEffect } from 'react';
import {DragEndEvent } from '@dnd-kit/core';
import { supabase } from '@/lib/supabaseClient'

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
  type: string | null;  // Add this line
  created_at: string;
};

// Add this with your other state declarations
type PrintType = {
  id: string;
  name: string;
  description: string;
  createdAt: Date;
};

const opreator = () => {
  const TICKS = Array.from({ length: 24 });
  const [activeSection, setActiveSection] = useState<'dashboard' | 'printing-types'  | 'settings'>('dashboard');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  
  interface UserTableProps {
  users: Profile[];
  loading: boolean;
  onDeleteUser: (userId: string) => Promise<void>;
  onRefresh: () => Promise<void>; // New prop
}

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
    .select('id, name, email, role, type, created_at');  // Add 'type' here
  
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
    .select('id, name, email, role, type, created_at');  // Add 'type' here
  
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
  

  // Handle new user submission - now also refresh profiles
  const handleUserSubmit = async (newUser: { 
  id: string; 
  name: string; 
  email: string; 
  role: string;
  type?: string | null;  // Add this line
}) => {
  const userWithDate: User = {
    ...newUser,
    createdAt: new Date()
  };
  setUsers(prev => [...prev, userWithDate]);
  
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

 

  const handleSectionChange = (section: typeof activeSection) => {
    setActiveSection(section);
    setIsDrawerOpen(false);
  };

  // Add this function inside the AdminTimelinePage component
  const handleDeleteUser = async (userId: string) => {
    try {
      // Delete the user from Supabase
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);

      if (error) {
        throw error;
      }

      // Update local state by removing the deleted user
      setProfiles(prevProfiles => 
        prevProfiles.filter(profile => profile.id !== userId)
      );

    } catch (error) {
      console.error('Error deleting user:', error);
      throw error; // Re-throw to be handled by the UserTable component
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f8f8f9] to-[#f8f8f9] p-6 relative">
      <div className="max-w-screen-xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
  {/* Left button */}
  <button
    onClick={() => setIsDrawerOpen(true)}
    className="flex flex-row gap-1 p-2 hover:bg-gray-100 rounded-lg transition-colors"
  >
    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
  </button>

  {/* Right logo */}
  <img
    src="/logo.svg"
    alt="Logo"
    width={120}
    height={120}
    className="mb-0"
  />
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
    <TimeLineO 
  users={profiles.map(profile => ({
    id: profile.id,
    name: profile.name || '',
    email: profile.email,
    role: profile.role || 'user',
    type: profile.type || null,  // Add this line
    createdAt: new Date(profile.created_at)
  }))}
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
       

        

     
      </div>

     


    </div>
  );
};

export default opreator;