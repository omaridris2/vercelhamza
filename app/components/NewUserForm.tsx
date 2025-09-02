'use client';

import React, { useState } from 'react';

type NewUserFormProps = {
  onClose: () => void;
  onSubmit: (user: { id: string; name: string; email: string; title: string }) => void;
};

const NewUserForm = ({ onClose, onSubmit }: NewUserFormProps) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [title, setTitle] = useState('Designer');

  const handleSubmit = () => {
    // Basic validation
    if (!name.trim() || !email.trim()) {
      alert('Please fill in all required fields');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      alert('Please enter a valid email address');
      return;
    }

    const id = `user-${Math.random().toString(36).substr(2, 9)}`;
    onSubmit({ id, name, email, title });
    onClose();
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

          {/* Title/Role */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Role
            </label>
            <select
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
            >
              <option value="Designer">Designer</option>
              <option value="Manager">Manager</option>
              <option value="Admin">Admin</option>
            </select>
          </div>

          {/* Buttons */}
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
