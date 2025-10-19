'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import NewJobForm from '@/app/components/NewJobForm';
import MyCarousel1 from '../components/Mycarousel1';
import TimelineSearch from '../components/TimelineSearch';
type Profile = {
  id: string;
  name: string | null;
  role: string | null;
};

export default function DesignerPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [assignedUsers, setAssignedUsers] = useState<{[key: string]: string | null}>({});

  const [activeSection, setActiveSection] = useState<
     'order-tracking' | 'Roland' | 'Digital' | 'Sign' | 'Laser' | 'Wood' 
  >('order-tracking');

  const handleSectionChange = (section: typeof activeSection) => {
    setActiveSection(section);
    setIsDrawerOpen(false);
  };

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
        .select('id, name, role')
        .eq('id', session.user.id)
        .single();

      if (error || profileData?.role !== 'Designer') {
        router.push('/');
        return;
      }

      setProfile(profileData);
      setLoading(false);
    };

    fetchProfile();
  }, [router]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-yellow-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hamburger Button */}
      <div className="mb-8 flex justify-between items-center"></div>
      <div className="fixed top-6 left-0 right-0 flex justify-between items-center px-6 z-40">
  {/* Three-dot button on the left */}
  <button
    onClick={() => setIsDrawerOpen(true)}
    className="flex flex-row gap-1.5 p-3 duration-200"
  >
    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
  </button>

  {/* Logo on the right */}
  <img
    src="/logo.svg"
    alt="Logo"
    width={100}
    height={100}
    className="object-contain"
  />
</div>
      

      {/* Overlay */}
      {isDrawerOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300"
          onClick={() => setIsDrawerOpen(false)}
        ></div>
      )}

      {/* Drawer Sidebar */}
      <div
        className={`fixed left-0 top-0 h-full w-80 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${
          isDrawerOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-6">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-xl font-bold text-gray-900">Navigation</h2>
            <button
              onClick={() => setIsDrawerOpen(false)}
              className="text-gray-500 hover:text-gray-700 transition-colors duration-200 p-2 hover:bg-gray-100 rounded-lg"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => handleSectionChange('order-tracking')}
              className={`w-full text-left p-4 rounded-xl transition-all duration-200 ${
                activeSection === 'order-tracking'
                  ? 'bg-[#636255] text-white shadow-lg'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <div className="flex items-center gap-3">
                
                <div>
                  <div className="font-semibold">Order Tracking</div>
                  <div className="text-sm opacity-80">Manage print categories</div>
                </div>
              </div>
            </button>

            <button
              onClick={() => handleSectionChange('Roland')}
              className={`w-full text-left p-4 rounded-xl transition-all duration-200 ${
                activeSection === 'Roland'
                  ? 'bg-[#636255] text-white shadow-lg'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <div className="flex items-center gap-3">
                
                <div>
                  <div className="font-semibold">Roland Products</div>
                  <div className="text-sm opacity-80">Browse Roland Products</div>
                </div>
              </div>
            </button>
            <button
              onClick={() => handleSectionChange('Digital')}
              className={`w-full text-left p-4 rounded-xl transition-all duration-200 ${
                activeSection === 'Digital'
                  ? 'bg-[#636255] text-white shadow-lg'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <div className="flex items-center gap-3">
                
                <div>
                  <div className="font-semibold">Digital Products </div>
                  <div className="text-sm opacity-80">Browse our Digital Products</div>
                </div>
              </div>
            </button>
            <button
              onClick={() => handleSectionChange('Sign')}
              className={`w-full text-left p-4 rounded-xl transition-all duration-200 ${
                activeSection === 'Sign'
                  ? 'bg-[#636255] text-white shadow-lg'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <div className="flex items-center gap-3">
                
                <div>
                  <div className="font-semibold">Sign Products </div>
                  <div className="text-sm opacity-80">Browse our Sign Products</div>
                </div>
              </div>
            </button>
            <button
              onClick={() => handleSectionChange('Laser')}
              className={`w-full text-left p-4 rounded-xl transition-all duration-200 ${
                activeSection === 'Laser'
                  ? 'bg-[#636255] text-white shadow-lg'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <div className="flex items-center gap-3">
                
                <div>
                  <div className="font-semibold">Laser Products </div>
                  <div className="text-sm opacity-80">Browse our Laser Products</div>
                </div>
              </div>
            </button>
            <button
              onClick={() => handleSectionChange('Wood')}
              className={`w-full text-left p-4 rounded-xl transition-all duration-200 ${
                activeSection === 'Wood'
                  ? 'bg-[#636255] text-white shadow-lg'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <div className="flex items-center gap-3">
                
                <div>
                  <div className="font-semibold">Wood Products </div>
                  <div className="text-sm opacity-80">Browse our Wood Products</div>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="pl-6 pr-6 pt-20 pb-6 max-w-[1600px] mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-[#636255] mb-2">
            Designer Dashboard
          </h1>
          <p className="text-lg text-gray-600">
            Welcome back, <span className="font-semibold text-[#636255]">{profile?.name || 'Designer'}</span>!
          </p>
        </div>

        {/* Content Sections */}
        {activeSection === 'order-tracking' && (
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-[#636255] mb-2">
                Order Management
              </h2>
              <div className="h-1 w-24 bg-yellow-500 rounded-full"></div>
            </div>
            <div className="flex justify-center">
              <NewJobForm userId={profile?.id!} />
              
            </div>
            <TimelineSearch
              users={[]}
              assignedUsers={assignedUsers}
              onAssignUser={() => {}}
            />
          </div>
        )}

        {activeSection === 'Roland' && (
          <div>
            <div className="mb-8">
            </div>
            <MyCarousel1 type='Roland' />
            
          </div>
        )}
        {activeSection === 'Digital' && (
          <div>
            <div className="mb-8">
            </div>
            <MyCarousel1 type='Digital' />
            
          </div>
        )}
        {activeSection === 'Sign' && (
          <div>
            <div className="mb-8">
            </div>
            <MyCarousel1 type='Sign' />
            
          </div>
        )}
        {activeSection === 'Laser' && (
          <div>
            <div className="mb-8">
            </div>
            <MyCarousel1 type='Laser' />
            
          </div>
        )}
        {activeSection === 'Wood' && (
          <div>
            <div className="mb-8">
            </div>
            <MyCarousel1 type='Wood' />
            
          </div>
        )}
      </div>
    </div>
  );
}