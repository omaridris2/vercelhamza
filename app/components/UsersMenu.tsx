'use client'

import React from 'react'

type Profile = {
  id: string
  name: string | null
  email: string
  role: string | null
  created_at: string
}

interface UserTableProps {
  users: Profile[]
  loading: boolean
}

const UserTable: React.FC<UserTableProps> = ({ users, loading }) => {
  if (loading) {
    return <div>Loading users...</div>
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse border border-gray-300">
        <thead>
          <tr className="bg-gray-50">
            <th className="border border-gray-300 px-4 py-3 text-left font-semibold">Name</th>
            <th className="border border-gray-300 px-4 py-3 text-left font-semibold">Email</th>
            <th className="border border-gray-300 px-4 py-3 text-left font-semibold">Role</th>
            <th className="border border-gray-300 px-4 py-3 text-left font-semibold">Created</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id} className="hover:bg-gray-50">
              <td className="border border-gray-300 px-4 py-3 font-semibold">{u.name ?? '—'}</td>
              <td className="border border-gray-300 px-4 py-3 text-blue-600">{u.email}</td>
              <td className="border border-gray-300 px-4 py-3">{u.role ?? 'user'}</td>
              <td className="border border-gray-300 px-4 py-3 text-sm text-gray-600">
                {new Date(u.created_at).toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default UserTable