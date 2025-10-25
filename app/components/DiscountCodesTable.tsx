'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

type DiscountCode = {
  id: string;
  code: string;
  type: string;
  mode: string;
  amount: number;
  expiration_date: string;
  use_limit: number;
  times_used: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

const DiscountCodesTable = () => {
  const [codes, setCodes] = useState<DiscountCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    fetchDiscountCodes();
  }, []);

  const fetchDiscountCodes = async () => {
    try {
      setLoading(true);
      setIsRefreshing(true);
      const { data, error } = await supabase
        .from('discount_codes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCodes(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching discount codes:', err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  const toggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('discount_codes')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (error) throw error;
      
      // Update local state
      setCodes(prev => 
        prev.map(code => 
          code.id === id ? { ...code, is_active: !currentStatus } : code
        )
      );
    } catch (err) {
      console.error('Error toggling active status:', err);
    }
  };

  // hard delete is here
  const deleteCode = async (id: string) => {
    if (!confirm('Are you sure you want to permanently delete this discount code? This action cannot be undone.')) return;

    try {
      setIsDeleting(id);

      const { data: ordersWithDiscount, error: checkError } = await supabase
        .from('orders')
        .select('id')
        .eq('discount_code_id', id)
        .limit(1);

      if (checkError) {
        console.error('Error checking orders:', checkError);
        throw new Error('Failed to check if discount code is in use');
      }

      // If orders exist, set their discount_code_id to null first
      if (ordersWithDiscount && ordersWithDiscount.length > 0) {
        const { error: updateError } = await supabase
          .from('orders')
          .update({ discount_code_id: null })
          .eq('discount_code_id', id);

        if (updateError) {
          console.error('Error updating orders:', updateError);
          throw new Error('Failed to remove discount code from orders');
        }
      }

      const { error: deleteError } = await supabase
        .from('discount_codes')
        .delete()
        .eq('id', id);

      if (deleteError) {
        console.error('Error deleting code:', deleteError);
        throw deleteError;
      }

      //  UI
      setCodes(prev => prev.filter(code => code.id !== id));
    } catch (err) {
      console.error('Error deleting code:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete discount code. Please try again.';
      alert(errorMessage);
    } finally {
      setIsDeleting(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const isExpired = (dateString: string) => {
    return new Date(dateString) < new Date();
  };

  const formatAmount = (amount: number, type: string) => {
    return type === 'Percentage' ? `${amount}%` : `$${amount.toFixed(2)}`;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-200">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#636255]"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-8 border border-red-200">
        <div className="text-red-600 text-center">
          <p className="text-lg font-semibold mb-2">Error loading discount codes</p>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (codes.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-200">
        <div className="text-center text-gray-500 py-12">
          <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
          </svg>
          <p className="text-lg font-medium">No discount codes yet</p>
          <p className="text-sm mt-2">Create your first discount code to get started</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
      <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200">
        
        
        <div className="flex gap-4 text-sm text-gray-700">
           <div>
            Total: <span className="font-semibold text-gray-900">{codes.length}</span> codes
          </div>
          <div>
              Active: <span className="font-semibold text-green-600">{codes.filter(c => c.is_active).length}</span>
            </div>
            <div>
              Expired: <span className="font-semibold text-red-600">{codes.filter(c => isExpired(c.expiration_date)).length}</span>
            </div>
             </div>
       
            <button
          onClick={() => fetchDiscountCodes()}
          disabled={isRefreshing}
          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg
            className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          {isRefreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mode</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usage</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expires</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {codes.map((code) => (
              <tr key={code.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="font-mono font-semibold text-gray-900 bg-gray-100 px-3 py-1 rounded-md">
                    {code.code}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    code.type === 'Percentage' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                  }`}>
                    {code.type}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                  {formatAmount(code.amount, code.type)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    code.mode === 'Auto' ? 'bg-purple-100 text-purple-800' : 'bg-orange-100 text-orange-800'
                  }`}>
                    {code.mode}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <div className="flex items-center">
                    <span className="font-medium">{code.times_used}</span>
                    <span className="text-gray-500 mx-1">/</span>
                    <span className="text-gray-600">{code.use_limit}</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <div className={`flex items-center ${isExpired(code.expiration_date) ? 'text-red-600' : 'text-gray-900'}`}>
                    {formatDate(code.expiration_date)}
                    {isExpired(code.expiration_date) && (
                      <span className="ml-2 text-xs text-red-600 font-semibold">(Expired)</span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <button
                    onClick={() => toggleActive(code.id, code.is_active)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      code.is_active ? 'bg-green-500' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        code.is_active ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => deleteCode(code.id)}
                    disabled={isDeleting === code.id}
                    className={`text-red-600 hover:text-red-900 transition-colors ${
                      isDeleting === code.id ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    {isDeleting === code.id ? (
                      <div className="animate-spin h-5 w-5">
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                      </div>
                    ) : (
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    )}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
        <div className="flex justify-between items-center text-sm text-gray-600">
          
          <div className="flex gap-4">
            
          </div>
        </div>
      </div>
    </div>
  );
};

export default DiscountCodesTable;
