'use client';

import React, { useState } from 'react';

type NewUserFormProps = {
  onClose: () => void;
  onSubmit: (user: { 
    id: string; 
    name: string; 
    email: string; 
    role: string; 
    type?: string | null 
  }) => void;
};

const NewUserForm = ({ onClose, onSubmit }: NewUserFormProps) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('Designer');
  const [type, setType] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async () => {
    // Basic validation
    if (!name.trim() || !email.trim() || !password.trim()) {
      alert('Please fill in all required fields');
      return;
    }

    // Ensure type is required for Designer role
    if (role === 'Operator' && !type) {
      alert('Please select a type for Designer role');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      alert('Please enter a valid email address');
      return;
    }

    if (password.length < 8) {
      alert('Password must be at least 8 characters long');
      return;
    }

    try {
      const res = await fetch('/api/create-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          name,
          role,
          type: role === 'Operator' ? type : null
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(`Error: ${data.error}`);
        return;
      }

      // Include type in the onSubmit callback
      onSubmit({
        id: data.user?.id ?? '',
        name: data.user?.name ?? name,
        email: data.user?.email ?? email,
        role: data.user?.role ?? role,
        // Always include type in the response
        type: role === 'Operator' ? type : null
      });

      onClose();
    } catch (err) {
      console.error(err);
      alert('Something went wrong creating the user');
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
      <div className="bg-white rounded-2xl shadow-xl p-8 border border-yellow-200 max-w-md w-full">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Create New User</h2>

        <div className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              placeholder="Enter full name"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Address <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              placeholder="Enter email address"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              placeholder="Minimum 8 characters"
            />
          </div>

          {/* Role Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Role
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
            >
              <option value="Designer">Designer</option>
              <option value="Operator">Operator</option>
              <option value="Admin">Admin</option>
            </select>
          </div>

          
          {role === 'Operator' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              >
                <option value="Roland">Roland</option>
                <option value="Digital">Digital</option>
                <option value="Sign">Sign</option>
                <option value="Laser">Laser</option>
                <option value="Wood">Wood</option>
                <option value="Reprint">Reprint</option>
                <option value="UV">UV</option>
              </select>
            </div>
          )}

          <div className="flex justify-end gap-4 mt-6">
            <button 
              onClick={onClose} 
              className="text-red-500 hover:text-red-700 px-4 py-2 rounded-lg hover:bg-red-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="bg-[#636255] text-white px-6 py-2 rounded-lg hover:bg-yellow-500 transition-colors"
            >
              Create User
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewUserForm;