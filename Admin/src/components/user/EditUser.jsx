import { X, Plus, Trash2, Upload } from 'lucide-react';
import { Button, Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Switch, Separator, Textarea } from '../ui';
import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { updateUser, uploadUserProfilePicture, selectUpdateUserLoading, selectUpdateUserError, selectUpdateUserSuccess, clearUpdateUserError, resetUpdateUserState } from '../../redux/slices/admin.slice.js';

export function EditUser({ user, onClose, onSave }) {
  const dispatch = useDispatch();
  const updateUserLoading = useSelector(selectUpdateUserLoading);
  const updateUserError = useSelector(selectUpdateUserError);
  const updateUserSuccess = useSelector(selectUpdateUserSuccess);

  const [editedUser, setEditedUser] = useState({
    _id: user._id,
    // Basic Information
    firstName: user.firstName || '',
    lastName: user.lastName || '',
    email: user.email || '',
    phone: user.phone || '',
    dateOfBirth: user.dateOfBirth || null,
    gender: user.gender || null,

    // Profile Picture
    profilePicture: user.profilePicture || null,
    profilePicturePublicId: user.profilePicturePublicId || null,

    // Address
    address: {
      street: user.address?.street || '',
      city: user.address?.city || '',
      state: user.address?.state || '',
      postalCode: user.address?.postalCode || '',
      country: user.address?.country || '',
    },

    // Account Status
    isEmailVerified: user.isEmailVerified || false,
    isPhoneVerified: user.isPhoneVerified || false,
    isKYCVerified: user.isKYCVerified || false,
    isActive: user.isActive !== undefined ? user.isActive : true,

    // Enrollment
    enrolledCourses: user.enrolledCourses || [],

    // Payment Information
    payment: {
      primaryPaymentMethod: user.payment?.primaryPaymentMethod || null,
      cardDetails: {
        cardHolderName: user.payment?.cardDetails?.cardHolderName || '',
        cardNumber: user.payment?.cardDetails?.cardNumber || '',
        expiryDate: user.payment?.cardDetails?.expiryDate || '',
        cvv: user.payment?.cardDetails?.cvv || '',
      },
      wallet: {
        balance: user.payment?.wallet?.balance || 0,
        currency: user.payment?.wallet?.currency || 'INR',
        transactions: user.payment?.wallet?.transactions || [],
      },
      upiId: user.payment?.upiId || '',
    },

    // Learning Progress
    learningProgress: {
      totalCoursesEnrolled: user.learningProgress?.totalCoursesEnrolled || 0,
      totalCoursesCompleted: user.learningProgress?.totalCoursesCompleted || 0,
      totalLearningHours: user.learningProgress?.totalLearningHours || 0,
      certificates: user.learningProgress?.certificates || 0,
      averageRating: user.learningProgress?.averageRating || 0,
    },

    // Preferences
    preferences: {
      emailNotifications: user.preferences?.emailNotifications !== undefined ? user.preferences.emailNotifications : true,
      smsNotifications: user.preferences?.smsNotifications || false,
      courseUpdates: user.preferences?.courseUpdates !== undefined ? user.preferences.courseUpdates : true,
      promotionalEmails: user.preferences?.promotionalEmails !== undefined ? user.preferences.promotionalEmails : true,
      language: user.preferences?.language || 'en',
    },

    // Course Reviews
    courseReviews: user.courseReviews || [],

    // Transactions
    transactions: user.transactions || [],

    // Timestamps
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    passwordChangedAt: user.passwordChangedAt,
  });

  const [profilePictureFile, setProfilePictureFile] = useState(null);
  const [profilePicturePreview, setProfilePicturePreview] = useState(user.profilePicture?.secure_url || null);

  // Handle basic input changes
  const handleChange = (field, value) => {
    setEditedUser(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle nested object changes
  const handleNestedChange = (parent, field, value) => {
    setEditedUser(prev => ({
      ...prev,
      [parent]: {
        ...prev[parent],
        [field]: value
      }
    }));
  };

  // Handle deeply nested changes
  const handleDeepNestedChange = (parent, child, field, value) => {
    setEditedUser(prev => ({
      ...prev,
      [parent]: {
        ...prev[parent],
        [child]: {
          ...(prev[parent][child] || {}),
          [field]: value
        }
      }
    }));
  };

  // Handle Enrolled Course
  const addEnrolledCourse = () => {
    setEditedUser(prev => ({
      ...prev,
      enrolledCourses: [
        ...prev.enrolledCourses,
        {
          courseId: '',
          instructorId: '',
          enrollmentDate: new Date().toISOString(),
          completionPercentage: 0,
          isCompleted: false,
          completedAt: null,
          certificateIssued: false,
          certificateId: null,
          progressModules: [],
          lastAccessedAt: null,
          status: 'active'
        }
      ]
    }));
  };

  const removeEnrolledCourse = (index) => {
    setEditedUser(prev => ({
      ...prev,
      enrolledCourses: prev.enrolledCourses.filter((_, i) => i !== index)
    }));
  };

  const updateEnrolledCourse = (index, field, value) => {
    setEditedUser(prev => ({
      ...prev,
      enrolledCourses: prev.enrolledCourses.map((course, i) =>
        i === index ? { ...course, [field]: value } : course
      )
    }));
  };

  // Handle Transaction
  const addTransaction = () => {
    setEditedUser(prev => ({
      ...prev,
      transactions: [
        ...prev.transactions,
        {
          transactionId: '',
          courseId: '',
          courseName: '',
          amount: 0,
          currency: 'INR',
          paymentMethod: '',
          paymentStatus: 'pending',
          transactionDate: new Date().toISOString(),
        }
      ]
    }));
  };

  const removeTransaction = (index) => {
    setEditedUser(prev => ({
      ...prev,
      transactions: prev.transactions.filter((_, i) => i !== index)
    }));
  };

  const updateTransaction = (index, field, value) => {
    setEditedUser(prev => ({
      ...prev,
      transactions: prev.transactions.map((transaction, i) =>
        i === index ? { ...transaction, [field]: value } : transaction
      )
    }));
  };

  // Handle Course Review
  const addCourseReview = () => {
    setEditedUser(prev => ({
      ...prev,
      courseReviews: [
        ...prev.courseReviews,
        {
          courseId: '',
          courseName: '',
          rating: 5,
          review: '',
          reviewDate: new Date().toISOString(),
          isVerified: false,
        }
      ]
    }));
  };

  const removeCourseReview = (index) => {
    setEditedUser(prev => ({
      ...prev,
      courseReviews: prev.courseReviews.filter((_, i) => i !== index)
    }));
  };

  const updateCourseReview = (index, field, value) => {
    setEditedUser(prev => ({
      ...prev,
      courseReviews: prev.courseReviews.map((review, i) =>
        i === index ? { ...review, [field]: value } : review
      )
    }));
  };

  const handleProfilePictureChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfilePictureFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePicturePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    try {
      // Prepare user data with valid enrolledCourses only
      const userDataToSubmit = {
        ...editedUser,
        enrolledCourses: editedUser.enrolledCourses?.filter(course =>
          course.courseId &&
          course.instructorId &&
          /^[a-f\d]{24}$/i.test(course.courseId) &&
          /^[a-f\d]{24}$/i.test(course.instructorId)
        ) || []
      };

      // Update user data first
      await dispatch(updateUser({ userId: editedUser._id, userData: userDataToSubmit })).unwrap();

      // If new profile picture is selected, upload it
      if (profilePictureFile) {
        const formData = new FormData();
        formData.append('profilePicture', profilePictureFile);
        await dispatch(uploadUserProfilePicture({ userId: editedUser._id, profilePicture: profilePictureFile })).unwrap();
      }

      onSave(editedUser);
    } catch (error) {
      console.error('Failed to update user:', error);
    }
  };

  return (
    <div className="w-full h-full bg-[#1a1a1a] border-l border-gray-800 flex flex-col shadow-2xl">
      {/* Header */}
      <div className="p-6 border-b border-gray-800 flex items-center justify-between sticky top-0 bg-[#1a1a1a] z-10">
        <div>
          <h2 className="text-xl font-bold text-white">Edit User</h2>
          <p className="text-sm text-gray-400 mt-1">Modify user details (Password cannot be changed here)</p>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-gray-800 rounded-lg"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Error Display */}
      {updateUserError && (
        <div className="mx-6 mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
          <p className="text-red-400 text-sm">{updateUserError}</p>
        </div>
      )}

      {/* Content - Scrollable */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 space-y-8">
          {/* Basic Information */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Basic Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName" className="text-gray-300">First Name *</Label>
                <Input
                  id="firstName"
                  value={editedUser.firstName}
                  onChange={(e) => handleChange('firstName', e.target.value)}
                  className="bg-[#0f0f0f] border-gray-800 text-white mt-2"
                  required
                />
              </div>
              <div>
                <Label htmlFor="lastName" className="text-gray-300">Last Name *</Label>
                <Input
                  id="lastName"
                  value={editedUser.lastName}
                  onChange={(e) => handleChange('lastName', e.target.value)}
                  className="bg-[#0f0f0f] border-gray-800 text-white mt-2"
                  required
                />
              </div>
              <div>
                <Label htmlFor="email" className="text-gray-300">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={editedUser.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  className="bg-[#0f0f0f] border-gray-800 text-white mt-2"
                  required
                />
              </div>
              <div>
                <Label htmlFor="phone" className="text-gray-300">Phone</Label>
                <Input
                  id="phone"
                  value={editedUser.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  className="bg-[#0f0f0f] border-gray-800 text-white mt-2"
                />
              </div>
              <div>
                <Label htmlFor="dateOfBirth" className="text-gray-300">Date of Birth</Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  value={editedUser.dateOfBirth ? new Date(editedUser.dateOfBirth).toISOString().split('T')[0] : ''}
                  onChange={(e) => handleChange('dateOfBirth', e.target.value)}
                  className="bg-[#0f0f0f] border-gray-800 text-white mt-2"
                />
              </div>
              <div>
                <Label htmlFor="gender" className="text-gray-300">Gender</Label>
                <Select value={editedUser.gender || ''} onValueChange={(value) => handleChange('gender', value)}>
                  <SelectTrigger className="bg-[#0f0f0f] border-gray-800 text-white mt-2">
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1a1a] border-gray-800">
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                    <SelectItem value="Prefer not to say">Prefer not to say</SelectItem>
                  </SelectContent>
                </Select>
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
                  <div className="w-full h-full bg-gray-700 flex items-center justify-center">
                    <span className="text-gray-400 text-2xl font-bold">
                      {editedUser.firstName?.[0]}{editedUser.lastName?.[0]}
                    </span>
                  </div>
                )}
              </div>
              <div>
                <Label htmlFor="profilePicture" className="text-gray-300 cursor-pointer">
                  <div className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2">
                    <Upload className="w-4 h-4" />
                    Change Picture
                  </div>
                </Label>
                <Input
                  id="profilePicture"
                  type="file"
                  accept="image/*"
                  onChange={handleProfilePictureChange}
                  className="hidden"
                />
                <p className="text-gray-400 text-sm mt-2">Upload a new profile picture (optional)</p>
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
                  value={editedUser.address.street}
                  onChange={(e) => handleNestedChange('address', 'street', e.target.value)}
                  className="bg-[#0f0f0f] border-gray-800 text-white mt-2"
                />
              </div>
              <div>
                <Label htmlFor="city" className="text-gray-300">City</Label>
                <Input
                  id="city"
                  value={editedUser.address.city}
                  onChange={(e) => handleNestedChange('address', 'city', e.target.value)}
                  className="bg-[#0f0f0f] border-gray-800 text-white mt-2"
                />
              </div>
              <div>
                <Label htmlFor="state" className="text-gray-300">State</Label>
                <Input
                  id="state"
                  value={editedUser.address.state}
                  onChange={(e) => handleNestedChange('address', 'state', e.target.value)}
                  className="bg-[#0f0f0f] border-gray-800 text-white mt-2"
                />
              </div>
              <div>
                <Label htmlFor="postalCode" className="text-gray-300">Postal Code</Label>
                <Input
                  id="postalCode"
                  value={editedUser.address.postalCode}
                  onChange={(e) => handleNestedChange('address', 'postalCode', e.target.value)}
                  className="bg-[#0f0f0f] border-gray-800 text-white mt-2"
                />
              </div>
              <div>
                <Label htmlFor="country" className="text-gray-300">Country</Label>
                <Input
                  id="country"
                  value={editedUser.address.country}
                  onChange={(e) => handleNestedChange('address', 'country', e.target.value)}
                  className="bg-[#0f0f0f] border-gray-800 text-white mt-2"
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
                  checked={editedUser.isActive}
                  onCheckedChange={(checked) => handleChange('isActive', checked)}
                />
                <Label className="text-gray-300">Active Account</Label>
              </div>
              <div className="flex items-center gap-4">
                <Switch
                  checked={editedUser.isEmailVerified}
                  onCheckedChange={(checked) => handleChange('isEmailVerified', checked)}
                />
                <Label className="text-gray-300">Email Verified</Label>
              </div>
              <div className="flex items-center gap-4">
                <Switch
                  checked={editedUser.isPhoneVerified}
                  onCheckedChange={(checked) => handleChange('isPhoneVerified', checked)}
                />
                <Label className="text-gray-300">Phone Verified</Label>
              </div>
              <div className="flex items-center gap-4">
                <Switch
                  checked={editedUser.isKYCVerified}
                  onCheckedChange={(checked) => handleChange('isKYCVerified', checked)}
                />
                <Label className="text-gray-300">KYC Verified</Label>
              </div>
            </div>
          </div>

          {/* Enrolled Courses */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Enrolled Courses</h3>
              <Button onClick={addEnrolledCourse} size="sm" className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-1" />
                Add Course
              </Button>
            </div>
            <div className="space-y-4">
              {editedUser.enrolledCourses?.map((course, index) => (
                <div key={index} className="p-4 bg-[#0f0f0f] border border-gray-800 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-white font-medium">Course #{index + 1}</span>
                    <Button
                      onClick={() => removeEnrolledCourse(index)}
                      size="sm"
                      variant="ghost"
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <Label className="text-gray-400 text-xs">Course ID (MongoDB ObjectId)</Label>
                      <Input
                        value={course.courseId || ''}
                        onChange={(e) => updateEnrolledCourse(index, 'courseId', e.target.value)}
                        className={`bg-[#1a1a1a] border-gray-700 text-white mt-1 text-sm ${
                          course.courseId && !/^[a-f\d]{24}$/i.test(course.courseId)
                            ? 'border-red-500'
                            : course.courseId && /^[a-f\d]{24}$/i.test(course.courseId)
                            ? 'border-green-500'
                            : ''
                        }`}
                        placeholder="e.g., 507f1f77bcf86cd799439011"
                      />
                      {course.courseId && !/^[a-f\d]{24}$/i.test(course.courseId) && (
                        <p className="text-red-400 text-xs mt-1">Invalid ObjectId format</p>
                      )}
                    </div>
                    <div>
                      <Label className="text-gray-400 text-xs">Instructor ID (MongoDB ObjectId)</Label>
                      <Input
                        value={course.instructorId || ''}
                        onChange={(e) => updateEnrolledCourse(index, 'instructorId', e.target.value)}
                        className={`bg-[#1a1a1a] border-gray-700 text-white mt-1 text-sm ${
                          course.instructorId && !/^[a-f\d]{24}$/i.test(course.instructorId)
                            ? 'border-red-500'
                            : course.instructorId && /^[a-f\d]{24}$/i.test(course.instructorId)
                            ? 'border-green-500'
                            : ''
                        }`}
                        placeholder="e.g., 507f1f77bcf86cd799439011"
                      />
                      {course.instructorId && !/^[a-f\d]{24}$/i.test(course.instructorId) && (
                        <p className="text-red-400 text-xs mt-1">Invalid ObjectId format</p>
                      )}
                    </div>
                    <div>
                      <Label className="text-gray-400 text-xs">Completion %</Label>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        value={course.completionPercentage || 0}
                        onChange={(e) => updateEnrolledCourse(index, 'completionPercentage', parseInt(e.target.value) || 0)}
                        className="bg-[#1a1a1a] border-gray-700 text-white mt-1 text-sm"
                      />
                    </div>
                    <div className="col-span-3">
                      <Label className="text-gray-400 text-xs">Status</Label>
                      <Select
                        value={course.status || 'active'}
                        onValueChange={(value) => updateEnrolledCourse(index, 'status', value)}
                      >
                        <SelectTrigger className="bg-[#1a1a1a] border-gray-700 text-white mt-1 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-[#1a1a1a] border-gray-800">
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="suspended">Suspended</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={course.isCompleted || false}
                        onCheckedChange={(checked) => updateEnrolledCourse(index, 'isCompleted', checked)}
                      />
                      <Label className="text-gray-400 text-xs">Completed</Label>
                    </div>
                  </div>
                </div>
              ))}
              {(!editedUser.enrolledCourses || editedUser.enrolledCourses.length === 0) && (
                <p className="text-gray-400 text-sm text-center py-8">No enrolled courses</p>
              )}
            </div>
          </div>

          {/* Payment Information */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Payment Information</h3>
            <div className="space-y-4">
              <div>
                <Label className="text-gray-300">Primary Payment Method</Label>
                <Select value={editedUser.payment.primaryPaymentMethod || ''} onValueChange={(value) => handleNestedChange('payment', 'primaryPaymentMethod', value)}>
                  <SelectTrigger className="bg-[#0f0f0f] border-gray-800 text-white mt-2">
                    <SelectValue placeholder="Select payment method" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1a1a] border-gray-800">
                    <SelectItem value="card">Credit/Debit Card</SelectItem>
                    <SelectItem value="upi">UPI</SelectItem>
                    <SelectItem value="wallet">Wallet</SelectItem>
                    <SelectItem value="netbanking">Net Banking</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-gray-300">UPI ID</Label>
                <Input
                  value={editedUser.payment.upiId}
                  onChange={(e) => handleNestedChange('payment', 'upiId', e.target.value)}
                  className="bg-[#0f0f0f] border-gray-800 text-white mt-2"
                  placeholder="user@upi"
                />
              </div>
              <div>
                <Label className="text-gray-300">Wallet Balance</Label>
                <Input
                  type="number"
                  value={editedUser.payment.wallet.balance}
                  onChange={(e) => handleDeepNestedChange('payment', 'wallet', 'balance', parseFloat(e.target.value) || 0)}
                  className="bg-[#0f0f0f] border-gray-800 text-white mt-2"
                />
              </div>
            </div>
          </div>

          {/* Preferences */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Preferences</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-4">
                <Switch
                  checked={editedUser.preferences.emailNotifications}
                  onCheckedChange={(checked) => handleDeepNestedChange('preferences', null, 'emailNotifications', checked)}
                />
                <Label className="text-gray-300">Email Notifications</Label>
              </div>
              <div className="flex items-center gap-4">
                <Switch
                  checked={editedUser.preferences.smsNotifications}
                  onCheckedChange={(checked) => handleDeepNestedChange('preferences', null, 'smsNotifications', checked)}
                />
                <Label className="text-gray-300">SMS Notifications</Label>
              </div>
              <div className="flex items-center gap-4">
                <Switch
                  checked={editedUser.preferences.courseUpdates}
                  onCheckedChange={(checked) => handleDeepNestedChange('preferences', null, 'courseUpdates', checked)}
                />
                <Label className="text-gray-300">Course Updates</Label>
              </div>
              <div className="flex items-center gap-4">
                <Switch
                  checked={editedUser.preferences.promotionalEmails}
                  onCheckedChange={(checked) => handleDeepNestedChange('preferences', null, 'promotionalEmails', checked)}
                />
                <Label className="text-gray-300">Promotional Emails</Label>
              </div>
            </div>
          </div>

          {/* Timestamps */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Timestamps</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <Label className="text-gray-400">Created At</Label>
                <p className="text-gray-300 mt-1">{new Date(editedUser.createdAt).toLocaleString()}</p>
              </div>
              <div>
                <Label className="text-gray-400">Updated At</Label>
                <p className="text-gray-300 mt-1">{new Date(editedUser.updatedAt).toLocaleString()}</p>
              </div>
              {editedUser.passwordChangedAt && (
                <div className="col-span-2">
                  <Label className="text-gray-400">Password Changed At</Label>
                  <p className="text-gray-300 mt-1">{new Date(editedUser.passwordChangedAt).toLocaleString()}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

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
          onClick={handleSave}
          disabled={updateUserLoading}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          {updateUserLoading ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  );
}
