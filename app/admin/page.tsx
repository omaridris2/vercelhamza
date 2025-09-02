'use client';

import React, { useState } from 'react';
import { DndContext, closestCorners, DragEndEvent } from '@dnd-kit/core';

import DraggableCube from '../components/DraggableCube';
import DroppableTick from '../components/DroppableTick';
import NewJobForm from '../components/NewJobForm';
import NewCodeForm from '../components/NewCodeForm';
import NewUserForm from '../components/NewUserForm';
import NewJobForms from '../components/NewPrintForm';

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
  title: string;
  createdAt: Date;
};

const AdminTimelinePage = () => {
  const TICKS = Array.from({ length: 24 });
  const [activeSection, setActiveSection] = useState<'dashboard' | 'printing-types' | 'discount-codes' | 'user-accounts' | 'settings'>('dashboard');

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

  // Handle new user submission
  const handleUserSubmit = (newUser: { id: string; name: string; email: string; title: string }) => {
    const userWithDate: User = {
      ...newUser,
      createdAt: new Date()
    };
    setUsers(prev => [...prev, userWithDate]);
  };

  // Format expiration time
  const formatExpirationTime = (hour: number) => {
    return `${hour.toString().padStart(2, '0')}:00`;
  };

  // Format created date
  const formatCreatedDate = (date: Date) => {
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f8f8f9] to-[#f8f8f9] p-6">
      <div className="max-w-screen-xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 border border-yellow-200 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Job Timeline Admin</h1>
        </div>
        
        <div className='flex gap-6 mb-8'>
          <div
           onClick={() => setActiveSection('dashboard')}
           className={`bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-xl shadow-lg p-6 
           flex justify-center items-center w-1/5 h-16 text-lg font-semibold hover:from-gray-600 hover:to-gray-700 
           transition-all duration-200 cursor-pointer ${
             activeSection === 'dashboard' ? 'ring-4 ring-yellow-300' : ''
           }`}>
           Dashboard
          </div>

          <div
           onClick={() => setActiveSection('printing-types')}
           className={`bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-xl shadow-lg p-6 
           flex justify-center items-center w-1/5 h-16 text-lg font-semibold hover:from-gray-600 hover:to-gray-700 
           transition-all duration-200 cursor-pointer ${
             activeSection === 'printing-types' ? 'ring-4 ring-yellow-300' : ''
           }`}>
           Printing Types
          </div>

          <div
           onClick={() => setActiveSection('discount-codes')}
           className={`bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-xl shadow-lg p-6 
           flex justify-center items-center w-1/5 h-16 text-lg font-semibold hover:from-gray-600 hover:to-gray-700 
           transition-all duration-200 cursor-pointer ${
             activeSection === 'discount-codes' ? 'ring-4 ring-yellow-300' : ''
           }`}>
           Discount Codes
          </div>

          <div
           onClick={() => setActiveSection('user-accounts')}
           className={`bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-xl shadow-lg p-6 
           flex justify-center items-center w-1/5 h-16 text-lg font-semibold hover:from-gray-600 hover:to-gray-700 
           transition-all duration-200 cursor-pointer ${
             activeSection === 'user-accounts' ? 'ring-4 ring-yellow-300' : ''
           }`}>
           User Accounts
          </div>

          <div
           onClick={() => setActiveSection('settings')}
           className={`bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-xl shadow-lg p-6 
           flex justify-center items-center w-1/5 h-16 text-lg font-semibold hover:from-gray-600 hover:to-gray-700 
           transition-all duration-200 cursor-pointer ${
             activeSection === 'settings' ? 'ring-4 ring-yellow-300' : ''
           }`}>
           Settings
          </div>
        </div>

        {/* DASHBOARD SECTION */}
        {activeSection === 'dashboard' && (
          <div className="bg-white rounded-2xl shadow-xl p-12 border border-yellow-200">
            <div className='flex gap-199 mb-4'>
              <h2 className="text-2xl font-bold text-gray-900 ">Work Timeline</h2>
              <button onClick={handleAddJob} className="bg-[#636255] text-white px-20 py-2 rounded-lg hover:bg-yellow-500">Add Job</button>
            </div>
            
            <div className='flex gap-20 mb-20'>
              <div className="text-2xl mb-20">Total Tasks: {cubes.length}</div>
              <div className="text-2xl mb-20">Tasks Completed: {cubes.filter(c => c.completed).length}</div>
              <div className="text-2xl mb-20">Missed Tasks</div>
              <div className="text-2xl mb-20">In Progress:</div>
            </div>

            <DndContext onDragEnd={handleDragEnd} collisionDetection={closestCorners}>
              {/* Ticks (droppable) */}
              <div className="flex justify-between items-end h-32 w-full">
                {TICKS.map((_, i) => {
                  const tickId = `tick-${i}`;
                  const cubesInTick = cubes.filter(c => c.tickId === tickId);

                  return (
                    <DroppableTick key={tickId} id={tickId}>
                      {cubesInTick.map((cube, index) => (
                        <div 
                          key={cube.id} 
                          className="absolute"
                          style={{ bottom: `${20 + (index * 80)}px` }}
                        >
                          <DraggableCube key={cube.id} id={cube.id} title={cube.title} type={cube.type} completed={cube.completed}
                           onDelete={deleteCube} onComplete={handleComplete} />
                        </div>
                      ))}
                    </DroppableTick>
                  );
                })}
              </div>
                        
              {/* Horizontal Line */}
              <div className="h-1 w-full bg-black" />

              {/* Time Labels */}
              <div className="flex justify-between mt-2 w-full">
                {TICKS.map((_, i) => (
                  <div key={i} className="text-xs text-center w-4 font-bold">{i + 1}:00</div>
                ))}
              </div>

              {/* Unplaced Cubes */}
              <div className="flex gap-4 mt-8">
                {cubes.filter(c => c.tickId === null).map(cube => (
                  <DraggableCube key={cube.id} id={cube.id} title={cube.title} type={cube.type} completed={cube.completed}
                           onDelete={deleteCube} onComplete={handleComplete} />
                ))}
              </div>
            </DndContext>
          </div>
        )}

        {activeSection === 'printing-types' && (
          <div className="bg-white rounded-2xl shadow-xl p-12 border border-yellow-200">
            <div className='flex items-center justify-between mb-8'>
              <h2 className="text-2xl font-bold text-gray-900">Printing Types</h2>
              <button 
                onClick={() => setShowPrintMenu(true)} 
                className="bg-[#636255] text-white px-20 py-2 rounded-lg hover:bg-yellow-500"
              >
                Add Print Type
              </button>
            </div>
            <div className="text-lg text-gray-600">Printing types management coming soon...</div>
            
            {showPrintMenu && (
              <NewJobForms
                onClose={() => setShowPrintMenu(false)}
                onSubmit={(data) => {
                  // Handle the form submission here
                  setShowPrintMenu(false);
                }}
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
                <div className="text-sm mt-2">Click "Generate Code" to create your first discount code</div>
              </div>
            )}
          </div>
        )}

        {activeSection === 'user-accounts' && (
          <div className="bg-white rounded-2xl shadow-xl p-12 border border-yellow-200">
            <div className='flex items-center justify-between mb-8'>
              <h2 className="text-2xl font-bold text-gray-900">User Accounts</h2>
              <button onClick={handleAddUser} className="bg-[#636255] text-white px-20 py-2 rounded-lg hover:bg-yellow-500">Add User</button>
            </div>

            {/* Statistics */}
            <div className="flex gap-8 mb-8">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-gray-900">{users.length}</div>
                <div className="text-sm text-gray-600">Total Users</div>
              </div>
              
            </div>

            {/* Users Table */}
            {users.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border border-gray-300 px-4 py-3 text-left font-semibold">Name</th>
                      <th className="border border-gray-300 px-4 py-3 text-left font-semibold">Email</th>
                      <th className="border border-gray-300 px-4 py-3 text-left font-semibold">Role</th>
                      <th className="border border-gray-300 px-4 py-3 text-left font-semibold">Created</th>
                      <th className="border border-gray-300 px-4 py-3 text-left font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="border border-gray-300 px-4 py-3 font-semibold">{user.name}</td>
                        <td className="border border-gray-300 px-4 py-3 text-blue-600">{user.email}</td>
                        <td className="border border-gray-300 px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            user.title === 'Admin' 
                              ? 'bg-red-100 text-red-800' 
                              : user.title === 'Manager'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {user.title}
                          </span>
                        </td>
                        <td className="border border-gray-300 px-4 py-3 text-sm text-gray-600">{formatCreatedDate(user.createdAt)}</td>
                        <td className="border border-gray-300 px-4 py-3">
                          <button 
                            onClick={() => deleteUser(user.id)}
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
                <div className="text-lg">No users created yet</div>
                <div className="text-sm mt-2">Click "Add User" to create your first user account</div>
              </div>
            )}
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
          onClose={() => setShowMenu(false)}
          onSubmit={(newJob) => setCubes([...cubes, newJob])}
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
