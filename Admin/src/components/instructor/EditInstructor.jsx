import { X, Save, DollarSign } from 'lucide-react';
import { mockInstructors } from '../../data/mockInstructors';
import { Button, Input, Label, Switch, Separator, Textarea } from '../ui';
import { useState } from 'react';


export function EditInstructor({ instructor, onClose, onSave }) {
  const [editedInstructor, setEditedInstructor] = useState(instructor);

  if (!instructor || !editedInstructor) return null;

  const handleChange = (field, value) => {
    setEditedInstructor(prev => prev ? { ...prev, [field]: value } : null);
  };

  const handleNestedChange = (parent, field, value) => {
    setEditedInstructor(prev => prev ? {
      ...prev,
      [parent]: {
        ...(prev[parent] || {}),
        [field]: value
      }
    } : null);
  };

  const handleSave = () => {
    if (editedInstructor) {
      onSave(editedInstructor);
    }
  };

  return (
    <div className="w-full h-full bg-[#1a1a1a] border-l border-gray-800 flex flex-col shadow-2xl">
      {/* Header */}
      <div className="p-6 border-b border-gray-800 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Edit Instructor</h2>
          <p className="text-sm text-gray-400 mt-1">Make changes to the instructor details</p>
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
                  <Label htmlFor="firstName" className="text-gray-300">First Name</Label>
                  <Input
                    id="firstName"
                    value={editedInstructor.firstName}
                    onChange={(e) => handleChange('firstName', e.target.value)}
                    className="bg-[#0f0f0f] border-gray-800 text-black mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="lastName" className="text-gray-300">Last Name</Label>
                  <Input
                    id="lastName"
                    value={editedInstructor.lastName}
                    onChange={(e) => handleChange('lastName', e.target.value)}
                    className="bg-[#0f0f0f] border-gray-800 text-black mt-2"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="email" className="text-gray-300">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={editedInstructor.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  className="bg-[#0f0f0f] border-gray-800 text-black mt-2"
                />
              </div>

              <div>
                <Label htmlFor="phone" className="text-gray-300">Phone</Label>
                <Input
                  id="phone"
                  value={editedInstructor.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  className="bg-[#0f0f0f] border-gray-800 text-black mt-2"
                />
              </div>

              <div>
                <Label htmlFor="bio" className="text-gray-300">Bio</Label>
                <Textarea
                  id="bio"
                  value={editedInstructor.bio || ''}
                  onChange={(e) => handleChange('bio', e.target.value)}
                  className="bg-[#0f0f0f] border-gray-800 text-black mt-2"
                  rows={4}
                />
              </div>

              <div>
                <Label htmlFor="yearsOfExperience" className="text-gray-300">Years of Experience</Label>
                <Input
                  id="yearsOfExperience"
                  type="number"
                  value={editedInstructor.yearsOfExperience}
                  onChange={(e) => handleChange('yearsOfExperience', parseInt(e.target.value))}
                  className="bg-[#0f0f0f] border-gray-800 text-black mt-2"
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
                  checked={editedInstructor.isActive}
                  onCheckedChange={(checked) => handleChange('isActive', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-gray-300">Suspended</Label>
                  <p className="text-sm text-gray-500">Temporarily disable instructor</p>
                </div>
                <Switch
                  checked={editedInstructor.isSuspended}
                  onCheckedChange={(checked) => handleChange('isSuspended', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-gray-300">Email Verified</Label>
                  <p className="text-sm text-gray-500">Email verification status</p>
                </div>
                <Switch
                  checked={editedInstructor.isEmailVerified}
                  onCheckedChange={(checked) => handleChange('isEmailVerified', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-gray-300">Phone Verified</Label>
                  <p className="text-sm text-gray-500">Phone verification status</p>
                </div>
                <Switch
                  checked={editedInstructor.isPhoneVerified}
                  onCheckedChange={(checked) => handleChange('isPhoneVerified', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-gray-300">Documents Verified</Label>
                  <p className="text-sm text-gray-500">Qualifications verified</p>
                </div>
                <Switch
                  checked={editedInstructor.isDocumentsVerified}
                  onCheckedChange={(checked) => handleChange('isDocumentsVerified', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-gray-300">KYC Verified</Label>
                  <p className="text-sm text-gray-500">Know Your Customer verification</p>
                </div>
                <Switch
                  checked={editedInstructor.isKYCVerified}
                  onCheckedChange={(checked) => handleChange('isKYCVerified', checked)}
                />
              </div>
            </div>
          </div>

          <Separator className="bg-gray-800" />

          {/* Statistics */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Statistics</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-[#0f0f0f] p-4 rounded-lg border border-gray-800">
                <p className="text-sm text-gray-400">Total Courses</p>
                <p className="text-2xl font-bold text-white mt-2">{editedInstructor.totalCourses}</p>
              </div>
              <div className="bg-[#0f0f0f] p-4 rounded-lg border border-gray-800">
                <p className="text-sm text-gray-400">Students</p>
                <p className="text-2xl font-bold text-white mt-2">{editedInstructor.totalStudentsTeaching}</p>
              </div>
              <div className="bg-[#0f0f0f] p-4 rounded-lg border border-gray-800">
                <p className="text-sm text-gray-400">Live Classes</p>
                <p className="text-2xl font-bold text-white mt-2">{editedInstructor.totalLiveClasses}</p>
              </div>
              <div className="bg-[#0f0f0f] p-4 rounded-lg border border-gray-800">
                <p className="text-sm text-gray-400">Rating</p>
                <p className="text-2xl font-bold text-white mt-2">{editedInstructor.rating.averageRating} ⭐</p>
              </div>
            </div>
          </div>

          <Separator className="bg-gray-800" />

          {/* Earnings */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Earnings
            </h3>
            <div className="space-y-4">
              <div className="bg-[#0f0f0f] p-4 rounded-lg border border-gray-800">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-400">Total Earnings</span>
                  <span className="text-xl font-bold text-green-400">
                    ${editedInstructor.earnings.totalEarnings.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-400">Paid Amount</span>
                  <span className="text-white">${editedInstructor.earnings.paidAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Pending Payment</span>
                  <span className="text-yellow-400">${editedInstructor.earnings.pendingPayment.toLocaleString()}</span>
                </div>
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
                  checked={editedInstructor.preferences.emailNotifications}
                  onCheckedChange={(checked) => handleNestedChange('preferences', 'emailNotifications', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label className="text-gray-300">Class Reminders</Label>
                <Switch
                  checked={editedInstructor.preferences.classReminders}
                  onCheckedChange={(checked) => handleNestedChange('preferences', 'classReminders', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label className="text-gray-300">Student Updates</Label>
                <Switch
                  checked={editedInstructor.preferences.studentUpdates}
                  onCheckedChange={(checked) => handleNestedChange('preferences', 'studentUpdates', checked)}
                />
              </div>

              <div>
                <Label htmlFor="timezone" className="text-gray-300">Timezone</Label>
                <Input
                  id="timezone"
                  value={editedInstructor.preferences.timezone}
                  onChange={(e) => handleNestedChange('preferences', 'timezone', e.target.value)}
                  className="bg-[#0f0f0f] border-gray-800 text-black mt-2"
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
          onClick={handleSave}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Save className="w-4 h-4 mr-2" />
          Save Changes
        </Button>
      </div>
    </div>
  );
}
