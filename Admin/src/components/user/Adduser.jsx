import { Upload, X, Plus, Trash2 } from 'lucide-react';
import { Button, Input, Label, Dropdown, Switch, Separator, Textarea } from '../ui';
import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { createUser, uploadUserProfilePicture, selectCreateUserLoading, selectCreateUserError, selectCreateUserSuccess, clearCreateUserError, resetCreateUserState } from '../../redux/slices/admin.slice.js';
import { validateFields, validators } from '../../utils/validators.js';

export function AddUser({ onClose, onAdd }) {
  const dispatch = useDispatch();
  const createUserLoading = useSelector(selectCreateUserLoading);
  const createUserError = useSelector(selectCreateUserError);
  const createUserSuccess = useSelector(selectCreateUserSuccess);

  const [newUser, setNewUser] = useState({
    // Basic Information
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    dateOfBirth: null,
    gender: '',

    // Profile Picture
    profilePicture: null,

    // Address
    address: {
      street: '',
      city: '',
      state: '',
      postalCode: '',
      country: '',
    },

    // Account Status
    isEmailVerified: false,
    isPhoneVerified: false,
    isKYCVerified: false,
    isActive: true,

    // Learning Progress
    learningProgress: {
      totalCoursesEnrolled: 0,
      totalCoursesCompleted: 0,
      totalLearningHours: 0,
      certificates: 0,
      averageRating: 0,
    },

    // Preferences
    preferences: {
      emailNotifications: true,
      smsNotifications: false,
      courseUpdates: true,
      promotionalEmails: true,
      language: 'en',
    },
  });

  const [validationErrors, setValidationErrors] = useState({});
  const [profilePictureFile, setProfilePictureFile] = useState(null);
  const [profilePicturePreview, setProfilePicturePreview] = useState(null);

  // Log when component mounts
  useEffect(() => {
    console.log('✅ AddUser component MOUNTED');
  }, []);

  // Log when newUser changes (autofill detection)
  useEffect(() => {
    if (newUser.firstName || newUser.lastName || newUser.email) {
      console.log('🔄 FORM STATE CHANGED (Autofill Detection):', {
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        email: newUser.email,
        phone: newUser.phone,
        timestamp: new Date().toLocaleTimeString()
      });
    }
  }, [newUser.firstName, newUser.lastName, newUser.email, newUser.phone]);

  // Handle basic input changes
  const handleChange = (field, value) => {
    console.log('📝 FORM FIELD CHANGE:', {
      field,
      value,
      timestamp: new Date().toLocaleTimeString(),
      eventType: 'handleChange',
      stack: new Error().stack
    });
    
    setNewUser(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear validation error for this field
    if (validationErrors[field]) {
      setValidationErrors(prev => ({
        ...prev,
        [field]: null
      }));
    }
  };

  // Handle nested object changes
  const handleNestedChange = (parent, field, value) => {
    setNewUser(prev => ({
      ...prev,
      [parent]: {
        ...prev[parent],
        [field]: value
      }
    }));

    // Clear validation error for nested fields
    const fieldName = parent === 'address' && field === 'postalCode' ? 'postalCode' : null;
    if (fieldName && validationErrors[fieldName]) {
      setValidationErrors(prev => ({
        ...prev,
        [fieldName]: null
      }));
    }
  };

  // Handle deeply nested changes
  const handleDeepNestedChange = (parent, child, field, value) => {
    setNewUser(prev => ({
      ...prev,
      [parent]: child ? {
        ...prev[parent],
        [child]: {
          ...(prev[parent][child] || {}),
          [field]: value
        }
      } : {
        ...prev[parent],
        [field]: value
      }
    }));
  };

  // Handle field validation on blur
  const handleFieldBlur = (fieldName, value) => {
    const isRequired = ['firstName', 'lastName', 'email', 'password'].includes(fieldName);
    const validator = validators[fieldName];
    if (validator) {
      const error = validator(value, isRequired);
      setValidationErrors(prev => ({
        ...prev,
        [fieldName]: error
      }));
    }
  };

  // Handle nested field validation on blur
  const handleNestedFieldBlur = (parent, field, value) => {
    const fieldName = parent === 'address' && field === 'postalCode' ? 'postalCode' : null;
    if (fieldName) {
      const isRequired = false; // postalCode is optional
      const validator = validators[fieldName];
      if (validator) {
        const error = validator(value, isRequired);
        setValidationErrors(prev => ({
          ...prev,
          [fieldName]: error
        }));
      }
    }
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
    // Validate required fields
    const fieldsToValidate = {
      firstName: newUser.firstName,
      lastName: newUser.lastName,
      email: newUser.email,
      password: newUser.password,
      phone: newUser.phone,
      gender: newUser.gender,
      postalCode: newUser.address.postalCode,
    };

    const requiredFields = ['firstName', 'lastName', 'email', 'password'];
    const { errors, hasErrors } = validateFields(fieldsToValidate, requiredFields);

    if (hasErrors) {
      setValidationErrors(errors);
      return;
    }

    try {
      // Clear any previous errors
      setValidationErrors({});

      // Prepare user data for submission (exclude courseReviews and learningProgress for new users)
      const { courseReviews, learningProgress, ...userDataWithoutReviews } = newUser;
      const userDataToSubmit = {
        ...userDataWithoutReviews,
        // Remove empty strings for optional fields
        phone: newUser.phone || undefined,
        gender: newUser.gender || undefined,
        address: {
          ...newUser.address,
          postalCode: newUser.address.postalCode || undefined,
        }
      };

      // If profile picture is selected, create FormData
      let submissionData = userDataToSubmit;
      if (profilePictureFile) {
        const formData = new FormData();
        
        // Append all user data as JSON string
        Object.keys(userDataToSubmit).forEach(key => {
          if (userDataToSubmit[key] !== undefined && userDataToSubmit[key] !== null) {
            if (typeof userDataToSubmit[key] === 'object') {
              formData.append(key, JSON.stringify(userDataToSubmit[key]));
            } else {
              formData.append(key, userDataToSubmit[key]);
            }
          }
        });
        
        // Append profile picture
        formData.append('profilePicture', profilePictureFile);
        submissionData = formData;
      }

      // Create user
      const result = await dispatch(createUser(submissionData)).unwrap();

      // Close modal and notify parent
      onAdd();
      onClose();
      
      // Reset form state
      setNewUser({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        password: '',
        dateOfBirth: null,
        gender: '',
        profilePicture: null,
        address: {
          street: '',
          city: '',
          state: '',
          postalCode: '',
          country: '',
        },
        isEmailVerified: false,
        isPhoneVerified: false,
        isKYCVerified: false,
        isActive: true,
        learningProgress: {
          totalCoursesEnrolled: 0,
          totalCoursesCompleted: 0,
          totalLearningHours: 0,
          certificates: 0,
          averageRating: 0,
        },
        preferences: {
          emailNotifications: true,
          smsNotifications: false,
          courseUpdates: true,
          promotionalEmails: true,
          language: 'en',
        },
        courseReviews: [],
      });
      setValidationErrors({});
      setProfilePictureFile(null);
      setProfilePicturePreview(null);
    } catch (error) {
      console.error('Failed to create user:', error);
    }
  };

  return (
    <div className="w-full h-full bg-[#1a1a1a] border-l border-gray-800 flex flex-col shadow-2xl">
      {/* Header */}
      <div className="p-6 border-b border-gray-800 flex items-center justify-between sticky top-0 bg-[#1a1a1a] z-10">
        <h2 className="text-xl font-bold text-white">Add New User</h2>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-gray-800 rounded-lg"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

        {/* Error Display */}
        {createUserError && (
          <div className="mx-6 mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
            <p className="text-red-400 text-sm">{createUserError}</p>
          </div>
        )}

        {/* Validation Errors Summary */}
        {Object.keys(validationErrors).some(key => validationErrors[key]) && (
          <div className="mx-6 mt-4 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
            <p className="text-yellow-400 text-sm font-medium">Please fix the validation errors below before submitting.</p>
          </div>
        )}

        {/* Content - Scrollable */}
        <form className="flex-1 overflow-y-auto" autoComplete="on" onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
          <div className="p-6 space-y-8">
            {/* Basic Information */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Basic Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName" className="text-gray-300">First Name *</Label>
                  <Input
                    id="firstName"
                    value={newUser.firstName}
                    onChange={(e) => {
                      console.log('✍️ FIRST NAME INPUT:', {
                        value: e.target.value,
                        timestamp: new Date().toLocaleTimeString(),
                        inputType: e.nativeEvent?.inputType,
                      });
                      handleChange('firstName', e.target.value);
                    }}
                    onBlur={(e) => handleFieldBlur('firstName', e.target.value)}
                    className={`bg-[#0f0f0f] border-2 text-black mt-2 transition-colors duration-200 ${validationErrors.firstName ? 'border-red-500 bg-red-50' : 'border-gray-800 focus:border-blue-500'}`}
                    required
                    autoComplete="given-name"
                  />
                  {validationErrors.firstName && (
                    <p className="text-red-400 text-xs mt-1 font-medium animate-pulse">{validationErrors.firstName}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="lastName" className="text-gray-300">Last Name *</Label>
                  <Input
                    id="lastName"
                    value={newUser.lastName}
                    onChange={(e) => {
                      console.log('✍️ LAST NAME INPUT:', {
                        value: e.target.value,
                        timestamp: new Date().toLocaleTimeString(),
                        inputType: e.nativeEvent?.inputType,
                      });
                      handleChange('lastName', e.target.value);
                    }}
                    onBlur={(e) => handleFieldBlur('lastName', e.target.value)}
                    className={`bg-[#0f0f0f] border-2 text-black mt-2 transition-colors duration-200 ${validationErrors.lastName ? 'border-red-500 bg-red-50' : 'border-gray-800 focus:border-blue-500'}`}
                    required
                    autoComplete="family-name"
                  />
                  {validationErrors.lastName && (
                    <p className="text-red-400 text-xs mt-1 font-medium animate-pulse">{validationErrors.lastName}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="email" className="text-gray-300">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newUser.email}
                    onChange={(e) => {
                      console.log('✍️ EMAIL INPUT:', {
                        value: e.target.value,
                        timestamp: new Date().toLocaleTimeString(),
                        inputType: e.nativeEvent?.inputType,
                      });
                      handleChange('email', e.target.value);
                    }}
                    onBlur={(e) => handleFieldBlur('email', e.target.value)}
                    className={`bg-[#0f0f0f] border-2 text-black mt-2 transition-colors duration-200 ${validationErrors.email ? 'border-red-500 bg-red-50' : 'border-gray-800 focus:border-blue-500'}`}
                    required
                    autoComplete="email"
                  />
                  {validationErrors.email && (
                    <p className="text-red-400 text-xs mt-1 font-medium animate-pulse">{validationErrors.email}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="phone" className="text-gray-300">Phone</Label>
                  <Input
                    id="phone"
                    value={newUser.phone}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    onBlur={(e) => handleFieldBlur('phone', e.target.value)}
                    className={`bg-[#0f0f0f] border-2 text-black mt-2 transition-colors duration-200 ${validationErrors.phone ? 'border-red-500 bg-red-50' : 'border-gray-800 focus:border-blue-500'}`}
                    autoComplete="tel"
                  />
                  {validationErrors.phone && (
                    <p className="text-red-400 text-xs mt-1 font-medium animate-pulse">{validationErrors.phone}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="password" className="text-gray-300">Password *</Label>
                  <Input
                    id="password"
                    type="password"
                    value={newUser.password}
                    onChange={(e) => handleChange('password', e.target.value)}
                    onBlur={(e) => handleFieldBlur('password', e.target.value)}
                    className={`bg-[#0f0f0f] border-2 text-black mt-2 transition-colors duration-200 ${validationErrors.password ? 'border-red-500 bg-red-50' : 'border-gray-800 focus:border-blue-500'}`}
                    required
                    autoComplete="new-password"
                  />
                  {validationErrors.password && (
                    <p className="text-red-400 text-xs mt-1 font-medium animate-pulse">{validationErrors.password}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="dateOfBirth" className="text-gray-300">Date of Birth</Label>
                  <Input
                    id="dateOfBirth"
                    type="date"
                    value={newUser.dateOfBirth ? new Date(newUser.dateOfBirth).toISOString().split('T')[0] : ''}
                    onChange={(e) => handleChange('dateOfBirth', e.target.value)}
                    className="bg-[#0f0f0f] border-gray-800 text-black mt-2"
                  />
                </div>
                <div className="col-span-2">
                  <Dropdown
                    value={newUser.gender}
                    onChange={(value) => {
                      handleChange('gender', value);
                      setTimeout(() => handleFieldBlur('gender', value), 0);
                    }}
                    options={['Male', 'Female', 'Other', 'Prefer not to say']}
                    label="Gender"
                    placeholder="Select gender"
                    error={validationErrors.gender}
                  />
                </div>
              </div>
            </div>

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

            {/* Address */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Address</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label htmlFor="street" className="text-gray-300">Street</Label>
                  <Input
                    id="street"
                    value={newUser.address.street}
                    onChange={(e) => handleNestedChange('address', 'street', e.target.value)}
                    className="bg-[#0f0f0f] border-gray-800 text-black mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="city" className="text-gray-300">City</Label>
                  <Input
                    id="city"
                    value={newUser.address.city}
                    onChange={(e) => handleNestedChange('address', 'city', e.target.value)}
                    className="bg-[#0f0f0f] border-gray-800 text-black mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="state" className="text-gray-300">State</Label>
                  <Input
                    id="state"
                    value={newUser.address.state}
                    onChange={(e) => handleNestedChange('address', 'state', e.target.value)}
                    className="bg-[#0f0f0f] border-gray-800 text-black mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="postalCode" className="text-gray-300">Postal Code</Label>
                  <Input
                    id="postalCode"
                    value={newUser.address.postalCode}
                    onChange={(e) => handleNestedChange('address', 'postalCode', e.target.value)}
                    onBlur={(e) => handleNestedFieldBlur('address', 'postalCode', e.target.value)}
                    className={`bg-[#0f0f0f] border-2 text-black mt-2 transition-colors duration-200 ${validationErrors.postalCode ? 'border-red-500 bg-red-50' : 'border-gray-800 focus:border-blue-500'}`}
                  />
                  {validationErrors.postalCode && (
                    <p className="text-red-400 text-xs mt-1 font-medium animate-pulse">{validationErrors.postalCode}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="country" className="text-gray-300">Country</Label>
                  <Input
                    id="country"
                    value={newUser.address.country}
                    onChange={(e) => handleNestedChange('address', 'country', e.target.value)}
                    className="bg-[#0f0f0f] border-gray-800 text-black mt-2"
                  />
                </div>
              </div>
            </div>

            {/* Account Status */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Account Status</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-4">
                  <Switch
                    checked={newUser.isActive}
                    onCheckedChange={(checked) => handleChange('isActive', checked)}
                  />
                  <Label className="text-gray-300">Active Account</Label>
                </div>
                <div className="flex items-center gap-4">
                  <Switch
                    checked={newUser.isEmailVerified}
                    onCheckedChange={(checked) => handleChange('isEmailVerified', checked)}
                  />
                  <Label className="text-gray-300">Email Verified</Label>
                </div>
                <div className="flex items-center gap-4">
                  <Switch
                    checked={newUser.isPhoneVerified}
                    onCheckedChange={(checked) => handleChange('isPhoneVerified', checked)}
                  />
                  <Label className="text-gray-300">Phone Verified</Label>
                </div>
                <div className="flex items-center gap-4">
                  <Switch
                    checked={newUser.isKYCVerified}
                    onCheckedChange={(checked) => handleChange('isKYCVerified', checked)}
                  />
                  <Label className="text-gray-300">KYC Verified</Label>
                </div>
              </div>
            </div>

            {/* Preferences */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Preferences</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-4">
                  <Switch
                    checked={newUser.preferences.emailNotifications}
                    onCheckedChange={(checked) => handleDeepNestedChange('preferences', null, 'emailNotifications', checked)}
                  />
                  <Label className="text-gray-300">Email Notifications</Label>
                </div>
                <div className="flex items-center gap-4">
                  <Switch
                    checked={newUser.preferences.smsNotifications}
                    onCheckedChange={(checked) => handleDeepNestedChange('preferences', null, 'smsNotifications', checked)}
                  />
                  <Label className="text-gray-300">SMS Notifications</Label>
                </div>
                <div className="flex items-center gap-4">
                  <Switch
                    checked={newUser.preferences.courseUpdates}
                    onCheckedChange={(checked) => handleDeepNestedChange('preferences', null, 'courseUpdates', checked)}
                  />
                  <Label className="text-gray-300">Course Updates</Label>
                </div>
                <div className="flex items-center gap-4">
                  <Switch
                    checked={newUser.preferences.promotionalEmails}
                    onCheckedChange={(checked) => handleDeepNestedChange('preferences', null, 'promotionalEmails', checked)}
                  />
                  <Label className="text-gray-300">Promotional Emails</Label>
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
            className="text-gray-400 hover:text-white hover:bg-gray-800"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={createUserLoading}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {createUserLoading ? 'Creating...' : 'Create User'}
          </Button>
        </div>
      </div>
    // </div>
  );
}
