import { X, Plus, Upload } from 'lucide-react';
import { Button, Input, Label, Switch, Separator, Textarea } from '../ui';
import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  createInstructor,
  selectCreateInstructorLoading,
  selectCreateInstructorError,
  clearCreateInstructorError,
  resetCreateInstructorState,
} from '../../redux/slices/instructor.slice.js';


export function AddInstructor({ onClose, onAdd }) {
  const dispatch = useDispatch();
  const createInstructorLoading = useSelector(selectCreateInstructorLoading);
  const createInstructorError = useSelector(selectCreateInstructorError);

  const [newInstructor, setNewInstructor] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    bio: '',
    specialization: [],
    yearsOfExperience: 0,
    isEmailVerified: false,
    isPhoneVerified: false,
    isDocumentsVerified: false,
    isKYCVerified: false,
    isActive: true,
    preferences: {
      emailNotifications: true,
      classReminders: true,
      studentUpdates: true,
      language: 'en',
    },
  });

  const [profilePictureFile, setProfilePictureFile] = useState(null);
  const [profilePicturePreview, setProfilePicturePreview] = useState(null);

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

  // Handle profile picture change
  const handleProfilePictureChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      console.log('Profile picture selected:', file.name, file.type, file.size);
      setProfilePictureFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        console.log('Profile picture loaded:', reader.result?.substring(0, 50) + '...');
        setProfilePicturePreview(reader.result);
      };
      reader.onerror = () => {
        console.error('Error reading file');
      };
      reader.readAsDataURL(file);
    } else {
      // Clear preview if no file selected
      setProfilePictureFile(null);
      setProfilePicturePreview(null);
    }
  };

  const handleSubmit = async () => {
    try {
      // If profile picture is selected, create FormData
      let submissionData = newInstructor;
      if (profilePictureFile) {
        const formData = new FormData();
        
        // Append all instructor data as JSON string
        Object.keys(newInstructor).forEach(key => {
          if (newInstructor[key] !== undefined && newInstructor[key] !== null) {
            if (typeof newInstructor[key] === 'object') {
              formData.append(key, JSON.stringify(newInstructor[key]));
            } else {
              formData.append(key, newInstructor[key]);
            }
          }
        });
        
        // Append profile picture
        formData.append('profilePicture', profilePictureFile);
        submissionData = formData;
      }

      await dispatch(createInstructor(submissionData)).unwrap();
      onAdd();
    } catch (error) {
      console.error('Failed to create instructor:', error);
    }
  };

  return (
    <div className="w-full h-full bg-[#1a1a1a] border-l border-gray-800 flex flex-col shadow-2xl">
      {/* Header */}
      <div className="p-6 border-b border-gray-800 flex items-center justify-between sticky top-0 bg-[#1a1a1a] z-10">
        <div>
          <h2 className="text-xl font-bold text-white">Add Instructor</h2>
          <p className="text-sm text-gray-400 mt-1">Create a new instructor account</p>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-black transition-colors p-2 hover:bg-gray-800 rounded-lg"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Error Display */}
      {createInstructorError && (
        <div className="mx-6 mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
          <p className="text-red-400 text-sm">{createInstructorError}</p>
        </div>
      )}

      {/* Content - Scrollable */}
      <form className="flex-1 overflow-y-auto" autoComplete="on" onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
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
                    required
                    autoComplete="given-name"
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
                    required
                    autoComplete="family-name"
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
                  required
                  autoComplete="email"
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
                  required
                />
              </div>

              <div>
                <Label htmlFor="password" className="text-gray-300">Password *</Label>
                <Input
                  id="password"
                  type="password"
                  value={newInstructor.password}
                  onChange={(e) => handleChange('password', e.target.value)}
                  className="bg-[#0f0f0f] border-gray-800 text-black mt-2"
                  placeholder="Minimum 8 characters"
                  required
                />
              </div>

              <div>
                <Label htmlFor="bio" className="text-gray-300">Bio</Label>
                <Textarea
                  id="bio"
                  value={newInstructor.bio}
                  onChange={(e) => handleChange('bio', e.target.value)}
                  className="bg-[#0f0f0f] border-gray-800 text-black mt-2"
                  rows={4}
                  placeholder="Brief description about the instructor..."
                />
              </div>

              <div>
                <Label htmlFor="specialization" className="text-gray-300">Specialization</Label>
                <Input
                  id="specialization"
                  value={newInstructor.specialization.join(', ')}
                  onChange={(e) => handleChange('specialization', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                  className="bg-[#0f0f0f] border-gray-800 text-black mt-2"
                  placeholder="e.g. React, Node.js, Python (comma separated)"
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

          {/* Profile Picture */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Profile Picture</h3>
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 bg-[#0f0f0f] border border-gray-800 rounded-lg flex items-center justify-center overflow-hidden">
                {profilePicturePreview ? (
                  <img src={profilePicturePreview} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <Upload className="w-8 h-8 text-gray-400" />
                )}
              </div>
              <div>
                <Label htmlFor="profilePicture" className="text-gray-300 cursor-pointer">
                  <div className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2">
                    <Upload className="w-4 h-4" />
                    Choose File
                  </div>
                </Label>
                <Input
                  id="profilePicture"
                  type="file"
                  accept="image/*"
                  onChange={handleProfilePictureChange}
                  className="hidden"
                />
                <p className="text-gray-400 text-sm mt-2">Upload a profile picture (optional)</p>
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
            </div>
          </div>
        </div>
      </form>

      {/* Footer */}
      <div className="p-6 border-t border-gray-800 flex justify-end gap-3">
        <Button
          onClick={onClose}
          variant="ghost"
          className="text-gray-400 hover:text-black hover:bg-gray-800"
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={createInstructorLoading}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          {createInstructorLoading ? (
            'Creating...'
          ) : (
            <>
              <Plus className="w-4 h-4 mr-2" />
              Add Instructor
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
