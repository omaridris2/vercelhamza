"use client"
import React, { useState, useRef } from 'react';
import { Plus, Edit3, Trash2, Calendar, Clock, MapPin, DollarSign, Move } from 'lucide-react';

interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  salary: string;
  startDate: string;
  endDate: string;
  description: string;
  status: 'current' | 'past' | 'upcoming';
}

const AdminTimelinePage = () => {
  const [jobs, setJobs] = useState<Job[]>([
    {
      id: '1',
      title: 'Senior Frontend Developer',
      company: 'TechCorp Inc.',
      location: 'San Francisco, CA',
      salary: '$120,000',
      startDate: '2023-01-15',
      endDate: '2024-12-31',
      description: 'Leading frontend development for enterprise applications using React and TypeScript.',
      status: 'current'
    },
    {
      id: '2',
      title: 'Full Stack Developer',
      company: 'StartupXYZ',
      location: 'New York, NY',
      salary: '$95,000',
      startDate: '2021-06-01',
      endDate: '2022-12-31',
      description: 'Developed full-stack web applications using Node.js, React, and MongoDB.',
      status: 'past'
    },
    {
      id: '3',
      title: 'Junior Developer',
      company: 'WebCorp',
      location: 'Austin, TX',
      salary: '$65,000',
      startDate: '2020-03-15',
      endDate: '2021-05-30',
      description: 'Built responsive web applications and learned modern development practices.',
      status: 'past'
    }
  ]);

  const [draggedJob, setDraggedJob] = useState<Job | null>(null);
  const [dragOverYear, setDragOverYear] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    company: '',
    location: '',
    salary: '',
    startDate: '',
    endDate: '',
    description: '',
    status: 'current' as Job['status']
  });

  const openModal = (job?: Job) => {
    if (job) {
      setEditingJob(job);
      setFormData({
        title: job.title,
        company: job.company,
        location: job.location,
        salary: job.salary,
        startDate: job.startDate,
        endDate: job.endDate,
        description: job.description,
        status: job.status
      });
    } else {
      setEditingJob(null);
      setFormData({
        title: '',
        company: '',
        location: '',
        salary: '',
        startDate: '',
        endDate: '',
        description: '',
        status: 'current'
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingJob(null);
  };

  const handleSubmit = () => {
    if (!formData.title || !formData.company || !formData.location || !formData.salary || !formData.startDate || !formData.endDate || !formData.description) {
      alert('Please fill in all fields');
      return;
    }
    
    if (editingJob) {
      // Update existing job
      setJobs(jobs.map(job => 
        job.id === editingJob.id 
          ? { ...job, ...formData }
          : job
      ));
    } else {
      // Add new job
      const newJob: Job = {
        id: Date.now().toString(),
        ...formData
      };
      setJobs([...jobs, newJob]);
    }
    
    closeModal();
  };

  const deleteJob = (id: string) => {
    if (confirm('Are you sure you want to delete this job?')) {
      setJobs(jobs.filter(job => job.id !== id));
    }
  };

  const sortedJobs = [...jobs].sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

  const getStatusColor = (status: Job['status']) => {
    switch (status) {
      case 'current': return 'bg-green-500';
      case 'past': return 'bg-gray-500';
      case 'upcoming': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (status: Job['status']) => {
    switch (status) {
      case 'current': return 'Current';
      case 'past': return 'Past';
      case 'upcoming': return 'Upcoming';
      default: return 'Unknown';
    }
  };

  // Group jobs by year for stacking
  const groupJobsByYear = () => {
    const grouped: { [key: string]: Job[] } = {};
    sortedJobs.forEach(job => {
      const year = new Date(job.startDate).getFullYear().toString();
      if (!grouped[year]) {
        grouped[year] = [];
      }
      grouped[year].push(job);
    });
    return grouped;
  };

  const groupedJobs = groupJobsByYear();
  const years = Object.keys(groupedJobs).sort();

  const handleDragStart = (e: React.DragEvent, job: Job) => {
    setDraggedJob(job);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', '');
    
    // Add drag styling
    const target = e.currentTarget as HTMLElement;
    target.style.opacity = '0.5';
  };

  const handleDragEnd = (e: React.DragEvent) => {
    const target = e.currentTarget as HTMLElement;
    target.style.opacity = '1';
    setDraggedJob(null);
    setDragOverYear(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDragEnter = (e: React.DragEvent, year: string) => {
    e.preventDefault();
    setDragOverYear(year);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    
    // Only clear drag over if mouse is outside the drop zone
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setDragOverYear(null);
    }
  };

  const handleDrop = (e: React.DragEvent, targetYear: string) => {
    e.preventDefault();
    
    if (!draggedJob) return;

    // Update the job's start date to match the target year
    const updatedJob = {
      ...draggedJob,
      startDate: `${targetYear}-01-01`,
    };

    // Update the jobs array
    setJobs(jobs.map(job => 
      job.id === draggedJob.id ? updatedJob : job
    ));

    setDraggedJob(null);
    setDragOverYear(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-yellow-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 border border-yellow-200">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Job Timeline Admin</h1>
              <p className="text-gray-600">Manage your career timeline and job history</p>
            </div>
            <button
              onClick={() => openModal()}
              className="flex items-center px-6 py-3 bg-yellow-400 hover:bg-yellow-300 text-gray-900 font-semibold rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg"
            >
              <Plus className="h-5 w-5 mr-2" />
              Add New Job
            </button>
          </div>
        </div>

        {/* Horizontal Timeline */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-yellow-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">Career Timeline</h2>
          
          {sortedJobs.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <Calendar className="h-16 w-16 mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-500 mb-2">No jobs added yet</h3>
              <p className="text-gray-400">Click "Add New Job" to get started</p>
            </div>
          ) : (
            <div className="relative overflow-x-auto py-8">
              {/* Horizontal timeline line */}
              <div className="absolute top-1/2 left-0 right-0 h-1 bg-yellow-400 shadow-sm"></div>
              
              <div className="flex items-center space-x-8 min-w-max px-4 relative">
                {years.map((year, yearIndex) => (
                  <div 
                    key={year} 
                    className={`relative flex flex-col items-center transition-all duration-200 ${
                      dragOverYear === year ? 'bg-yellow-200 rounded-xl p-4 -m-4' : ''
                    }`}
                    onDragOver={handleDragOver}
                    onDragEnter={(e) => handleDragEnter(e, year)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, year)}
                  >
                    
                    {/* Stacked job cubes - positioned above the line */}
                    <div className="flex flex-col-reverse space-y-reverse space-y-2 mb-4">
                      {groupedJobs[year].map((job, jobIndex) => (
                        <div
                          key={job.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, job)}
                          onDragEnd={handleDragEnd}
                          className={`relative w-20 h-20 rounded-lg shadow-lg cursor-move transform hover:scale-110 transition-all duration-200 ${getStatusColor(job.status)} group border-2 border-white ${
                            draggedJob?.id === job.id ? 'scale-105 shadow-2xl' : ''
                          }`}
                          onClick={() => openModal(job)}
                          style={{
                            transform: `translateY(${jobIndex * -2}px)`,
                          }}
                        >
                          {/* Drag handle icon */}
                          <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Move className="h-3 w-3 text-white" />
                          </div>
                          
                          {/* Cube content */}
                          <div className="p-2 h-full flex flex-col justify-between text-white text-xs">
                            <div className="font-bold truncate pr-3" title={job.title}>
                              {job.title}
                            </div>
                            <div className="truncate" title={job.company}>
                              {job.company}
                            </div>
                          </div>
                          
                          {/* Hover tooltip */}
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-20">
                            <div className="bg-gray-900 text-white text-xs rounded-lg p-3 whitespace-nowrap max-w-xs shadow-xl">
                              <div className="font-bold">{job.title}</div>
                              <div className="text-gray-300">{job.company}</div>
                              <div className="flex items-center mt-1">
                                <MapPin className="h-3 w-3 mr-1" />
                                {job.location}
                              </div>
                              <div className="flex items-center">
                                <DollarSign className="h-3 w-3 mr-1" />
                                {job.salary}
                              </div>
                              <div className="flex items-center">
                                <Clock className="h-3 w-3 mr-1" />
                                {new Date(job.startDate).toLocaleDateString()} - {new Date(job.endDate).toLocaleDateString()}
                              </div>
                              <div className="mt-1 text-gray-300 truncate">{job.description}</div>
                              
                              {/* Action buttons in tooltip */}
                              <div className="flex justify-center gap-2 mt-2 pt-2 border-t border-gray-700">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openModal(job);
                                  }}
                                  className="p-1 text-gray-300 hover:text-yellow-400 transition-colors"
                                  title="Edit job"
                                >
                                  <Edit3 className="h-3 w-3" />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deleteJob(job.id);
                                  }}
                                  className="p-1 text-gray-300 hover:text-red-400 transition-colors"
                                  title="Delete job"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {/* Drop zone indicator */}
                    {dragOverYear === year && (
                      <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-2">
                        <div className="bg-yellow-400 text-gray-900 text-xs px-2 py-1 rounded-full font-medium shadow-lg">
                          Drop here for {year}
                        </div>
                      </div>
                    )}
                    
                    {/* Timeline dot on the line */}
                    <div className="absolute top-1/2 transform -translate-y-1/2 w-5 h-5 bg-yellow-500 rounded-full border-3 border-white shadow-lg z-10"></div>
                    
                    {/* Year label below the line */}
                    <div className="mt-6 text-lg font-bold text-gray-700 bg-yellow-100 px-4 py-2 rounded-full shadow-sm">
                      {year}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              {editingJob ? 'Edit Job' : 'Add New Job'}
            </h2>
            
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Job Title</label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                    placeholder="e.g., Senior Frontend Developer"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Company</label>
                  <input
                    type="text"
                    required
                    value={formData.company}
                    onChange={(e) => setFormData({...formData, company: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                    placeholder="e.g., TechCorp Inc."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Location</label>
                  <input
                    type="text"
                    required
                    value={formData.location}
                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                    placeholder="e.g., San Francisco, CA"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Salary</label>
                  <input
                    type="text"
                    required
                    value={formData.salary}
                    onChange={(e) => setFormData({...formData, salary: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                    placeholder="e.g., $120,000"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Start Date</label>
                  <input
                    type="date"
                    required
                    value={formData.startDate}
                    onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">End Date</label>
                  <input
                    type="date"
                    required
                    value={formData.endDate}
                    onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value as Job['status']})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                >
                  <option value="current">Current</option>
                  <option value="past">Past</option>
                  <option value="upcoming">Upcoming</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                <textarea
                  required
                  rows={4}
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent resize-none"
                  placeholder="Describe your role and responsibilities..."
                />
              </div>
              
              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={handleSubmit}
                  className="flex-1 py-3 px-6 bg-yellow-400 hover:bg-yellow-300 text-gray-900 font-semibold rounded-xl transition-colors"
                >
                  {editingJob ? 'Update Job' : 'Add Job'}
                </button>
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 py-3 px-6 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-xl transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminTimelinePage;
