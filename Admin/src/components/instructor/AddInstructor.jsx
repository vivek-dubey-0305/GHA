import { X, Plus } from 'lucide-react';
import { mockInstructors } from '../../data/mockInstructors';
import { Button, Input, Label, Switch, Separator, Textarea } from '../ui';
import { useState } from 'react';


export function AddInstructor({ onClose, onAdd }) {
  const [newInstructor, setNewInstructor] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    bio: '',
    specialization: [],
    yearsOfExperience: 0,
    totalStudentsTeaching: 0,
    totalCourses: 0,
    totalLiveClasses: 0,
    rating: {
      averageRating: 0,
      totalReviews: 0,
    },
    isEmailVerified: false,
    isPhoneVerified: false,
    isDocumentsVerified: false,
    isKYCVerified: false,
    isActive: true,
    isSuspended: false,
    qualifications: [],
    earnings: {
      totalEarnings: 0,
      pendingPayment: 0,
      paidAmount: 0,
      currency: 'USD',
    },
    preferences: {
      emailNotifications: true,
      classReminders: true,
      studentUpdates: true,
      language: 'en',
      timezone: 'UTC',
    },
  });

  const handleChange = (field, value) => {
    setNewInstructor(prev => ({ ...prev, [field]: value }));
  };

  const handleNestedChange = (parent, field, value) => {
    setNewInstructor(prev => ({
      ...prev,
      [parent]: {
        ...(prev[parent] || {}),
        [field]: value
      }
    }));
  };

  const handleAdd = () => {
    onAdd({
      ...newInstructor,
      _id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    });
  };

  return (
    <div className="w-full h-full bg-[#1a1a1a] border-l border-gray-800 flex flex-col shadow-2xl">
      {/* Header */}
      <div className="p-6 border-b border-gray-800 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Add Instructor</h2>
          <p className="text-sm text-gray-400 mt-1">Create a new instructor account</p>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-gray-800 rounded-lg"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Content - Scrollable */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 space-y-6">
          {/* Basic Information */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Basic Information</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName" className="text-gray-300">First Name *</Label>
                  <Input
                    id="firstName"
                    value={newInstructor.firstName}
                    onChange={(e) => handleChange('firstName', e.target.value)}
                    className="bg-[#0f0f0f] border-gray-800 text-black mt-2"
                    placeholder="John"
                  />
                </div>
                <div>
                  <Label htmlFor="lastName" className="text-gray-300">Last Name *</Label>
                  <Input
                    id="lastName"
                    value={newInstructor.lastName}
                    onChange={(e) => handleChange('lastName', e.target.value)}
                    className="bg-[#0f0f0f] border-gray-800 text-black mt-2"
                    placeholder="Doe"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="email" className="text-gray-300">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={newInstructor.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  className="bg-[#0f0f0f] border-gray-800 text-black mt-2"
                  placeholder="john.doe@greedacademy.com"
                />
              </div>

              <div>
                <Label htmlFor="phone" className="text-gray-300">Phone *</Label>
                <Input
                  id="phone"
                  value={newInstructor.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  className="bg-[#0f0f0f] border-gray-800 text-black mt-2"
                  placeholder="+1234567890"
                />
              </div>

              <div>
                <Label htmlFor="bio" className="text-gray-300">Bio</Label>
                <Textarea
                  id="bio"
                  value={newInstructor.bio || ''}
                  onChange={(e) => handleChange('bio', e.target.value)}
                  className="bg-[#0f0f0f] border-gray-800 text-black mt-2"
                  rows={4}
                  placeholder="Brief description about the instructor..."
                />
              </div>

              <div>
                <Label htmlFor="yearsOfExperience" className="text-gray-300">Years of Experience</Label>
                <Input
                  id="yearsOfExperience"
                  type="number"
                  value={newInstructor.yearsOfExperience}
                  onChange={(e) => handleChange('yearsOfExperience', parseInt(e.target.value) || 0)}
                  className="bg-[#0f0f0f] border-gray-800 text-black mt-2"
                  placeholder="0"
                />
              </div>
            </div>
          </div>

          <Separator className="bg-gray-800" />

          {/* Account Status */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Account Status</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-gray-300">Active Account</Label>
                  <p className="text-sm text-gray-500">Instructor can access the platform</p>
                </div>
                <Switch
                  checked={newInstructor.isActive}
                  onCheckedChange={(checked) => handleChange('isActive', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-gray-300">Email Verified</Label>
                  <p className="text-sm text-gray-500">Email verification status</p>
                </div>
                <Switch
                  checked={newInstructor.isEmailVerified}
                  onCheckedChange={(checked) => handleChange('isEmailVerified', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-gray-300">Phone Verified</Label>
                  <p className="text-sm text-gray-500">Phone verification status</p>
                </div>
                <Switch
                  checked={newInstructor.isPhoneVerified}
                  onCheckedChange={(checked) => handleChange('isPhoneVerified', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-gray-300">Documents Verified</Label>
                  <p className="text-sm text-gray-500">Qualifications verified</p>
                </div>
                <Switch
                  checked={newInstructor.isDocumentsVerified}
                  onCheckedChange={(checked) => handleChange('isDocumentsVerified', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-gray-300">KYC Verified</Label>
                  <p className="text-sm text-gray-500">Know Your Customer verification</p>
                </div>
                <Switch
                  checked={newInstructor.isKYCVerified}
                  onCheckedChange={(checked) => handleChange('isKYCVerified', checked)}
                />
              </div>
            </div>
          </div>

          <Separator className="bg-gray-800" />

          {/* Preferences */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Preferences</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-gray-300">Email Notifications</Label>
                <Switch
                  checked={newInstructor.preferences?.emailNotifications}
                  onCheckedChange={(checked) => handleNestedChange('preferences', 'emailNotifications', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label className="text-gray-300">Class Reminders</Label>
                <Switch
                  checked={newInstructor.preferences?.classReminders}
                  onCheckedChange={(checked) => handleNestedChange('preferences', 'classReminders', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label className="text-gray-300">Student Updates</Label>
                <Switch
                  checked={newInstructor.preferences?.studentUpdates}
                  onCheckedChange={(checked) => handleNestedChange('preferences', 'studentUpdates', checked)}
                />
              </div>

              <div>
                <Label htmlFor="timezone" className="text-gray-300">Timezone</Label>
                <Input
                  id="timezone"
                  value={newInstructor.preferences?.timezone}
                  onChange={(e) => handleNestedChange('preferences', 'timezone', e.target.value)}
                  className="bg-[#0f0f0f] border-gray-800 text-black mt-2"
                  placeholder="UTC"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Footer */}
      <div className="p-6 border-t border-gray-800 flex gap-3 bg-[#1a1a1a] sticky bottom-0 shadow-lg">
        <Button
          onClick={onClose}
          variant="outline"
          className="flex-1 bg-transparent border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white"
        >
          Cancel
        </Button>
        <Button
          onClick={handleAdd}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Instructor
        </Button>
      </div>
    </div>
  );
}
