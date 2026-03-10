import { X, Save, Trash2, Upload } from 'lucide-react';
import { Button, Input, Label, Switch, Separator, Textarea, WarningModal } from '../ui';
import Dropdown from '../ui/dropdown';
import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  updateInstructor,
  deleteInstructor,
  deleteInstructorProfilePicture,
  selectUpdateInstructorLoading,
  selectUpdateInstructorError,
  selectDeleteInstructorLoading,
  selectDeleteProfilePictureLoading,
  selectDeleteProfilePictureError,
  selectDeleteProfilePictureSuccess,
} from '../../redux/slices/instructor.slice.js';
import { getCourseById } from '../../redux/slices/course.slice.js';
import { getLiveClassById } from '../../redux/slices/liveclass.slice.js';
import { getVideoPackageById } from '../../redux/slices/videopackage.slice.js';

// Specialization options with display labels
const SPECIALIZATION_OPTIONS = [
  { value: 'web_development', label: 'Web Development' },
  { value: 'mobile_app_development', label: 'Mobile App Development' },
  { value: 'data_science', label: 'Data Science' },
  { value: 'artificial_intelligence', label: 'Artificial Intelligence' },
  { value: 'cloud_computing', label: 'Cloud Computing' },
  { value: 'cybersecurity', label: 'Cybersecurity' },
  { value: 'devops', label: 'DevOps' },
  { value: 'machine_learning', label: 'Machine Learning' },
  { value: 'blockchain', label: 'Blockchain' },
  { value: 'design', label: 'Design' },
  { value: 'business', label: 'Business' },
  { value: 'soft_skills', label: 'Soft Skills' },
  { value: 'other', label: 'Other' }
];

// Degree options
const DEGREE_OPTIONS = [
  { value: 'bca', label: 'Bachelor of Computer Applications (B.C.A)' },
  { value: 'mca', label: 'Master of Computer Applications (M.C.A)' },
  { value: 'mtech', label: 'Master of Technology (M.Tech)' },
  { value: 'btech', label: 'Bachelor of Technology (B.Tech)' },
  { value: 'bba', label: 'Bachelor of Business Administration (B.B.A)' },
  { value: 'mba', label: 'Master of Business Administration (M.B.A)' },
  { value: 'ma', label: 'Master of Arts (M.A)' },
  { value: 'ba', label: 'Bachelor of Arts (B.A)' },
  { value: 'bcom', label: 'Bachelor of Commerce (B.Com)' },
  { value: 'mcom', label: 'Master of Commerce (M.Com)' },
  { value: 'bsc', label: 'Bachelor of Science (B.Sc)' },
  { value: 'msc', label: 'Master of Science (M.Sc)' },
  { value: 'be', label: 'Bachelor of Engineering (B.E)' },
  { value: 'me', label: 'Master of Engineering (M.E)' },
  { value: 'phd', label: 'Doctor of Philosophy (Ph.D)' },
  { value: 'diploma', label: 'Diploma' },
  { value: 'certificate', label: 'Certificate Course' },
  { value: 'other', label: 'Other' }
];

// Gender options
const GENDER_OPTIONS = [
  { value: 'Male', label: 'Male' },
  { value: 'Female', label: 'Female' },
  { value: 'Other', label: 'Other' },
  { value: 'Prefer not to say', label: 'Prefer not to say' }
];

// Institution options (major ones in India)
const INSTITUTION_OPTIONS = [
  { value: 'bansal_group_of_institutions', label: 'Bansal Group of Institutions' },
  { value: 'lnct_group', label: 'LNCT Group' },
  { value: 'sage_university', label: 'Sage University' },
  { value: 'sam_global_university', label: 'SAM Global University' },
  { value: 'rk_df_university', label: 'RKDF University' },
  { value: 'jain_university', label: 'Jain University' },
  { value: 'christ_university', label: 'Christ University' },
  { value: 'pes_university', label: 'PES University' },
  { value: 'rv_university', label: 'RV University' },
  { value: 'reva_university', label: 'REVA University' },
  { value: 'alliance_university', label: 'Alliance University' },
  { value: 'presidency_university', label: 'Presidency University' },
  { value: 'ms_ramaiah_university', label: 'MS Ramaiah University' },
  { value: 'dayananda_sagar_university', label: 'Dayananda Sagar University' },
  { value: 'cmr_university', label: 'CMR University' },
  { value: 'iit_delhi', label: 'Indian Institute of Technology Delhi' },
  { value: 'iit_bombay', label: 'Indian Institute of Technology Bombay' },
  { value: 'iit_madras', label: 'Indian Institute of Technology Madras' },
  { value: 'iit_kanpur', label: 'Indian Institute of Technology Kanpur' },
  { value: 'iit_kharagpur', label: 'Indian Institute of Technology Kharagpur' },
  { value: 'iit_roorkee', label: 'Indian Institute of Technology Roorkee' },
  { value: 'iit_guwahati', label: 'Indian Institute of Technology Guwahati' },
  { value: 'iit_hyderabad', label: 'Indian Institute of Technology Hyderabad' },
  { value: 'iit_indore', label: 'Indian Institute of Technology Indore' },
  { value: 'iit_bhubaneswar', label: 'Indian Institute of Technology Bhubaneswar' },
  { value: 'iit_patna', label: 'Indian Institute of Technology Patna' },
  { value: 'iit_gandhinagar', label: 'Indian Institute of Technology Gandhinagar' },
  { value: 'iit_ropar', label: 'Indian Institute of Technology Ropar' },
  { value: 'iit_jodhpur', label: 'Indian Institute of Technology Jodhpur' },
  { value: 'iit_mandi', label: 'Indian Institute of Technology Mandhi' },
  { value: 'iit_tirupati', label: 'Indian Institute of Technology Tirupati' },
  { value: 'iit_dharwad', label: 'Indian Institute of Technology Dharwad' },
  { value: 'iit_palakkad', label: 'Indian Institute of Technology Palakkad' },
  { value: 'iit_goa', label: 'Indian Institute of Technology Goa' },
  { value: 'iit_jammu', label: 'Indian Institute of Technology Jammu' },
  { value: 'iit_bhopal', label: 'Indian Institute of Technology Bhopal' },
  { value: 'nit_trichy', label: 'National Institute of Technology Trichy' },
  { value: 'nit_surathkal', label: 'National Institute of Technology Surathkal' },
  { value: 'nit_warangal', label: 'National Institute of Technology Warangal' },
  { value: 'nit_calicut', label: 'National Institute of Technology Calicut' },
  { value: 'nit_durgapur', label: 'National Institute of Technology Durgapur' },
  { value: 'nit_rourkela', label: 'National Institute of Technology Rourkela' },
  { value: 'nit_allahabad', label: 'National Institute of Technology Allahabad' },
  { value: 'nit_jamshedpur', label: 'National Institute of Technology Jamshedpur' },
  { value: 'nit_hamirpur', label: 'National Institute of Technology Hamirpur' },
  { value: 'nit_kurukshetra', label: 'National Institute of Technology Kurukshetra' },
  { value: 'nit_silchar', label: 'National Institute of Technology Silchar' },
  { value: 'nit_manipur', label: 'National Institute of Technology Manipur' },
  { value: 'nit_mizoram', label: 'National Institute of Technology Mizoram' },
  { value: 'nit_nagaland', label: 'National Institute of Technology Nagaland' },
  { value: 'nit_arunachal_pradesh', label: 'National Institute of Technology Arunachal Pradesh' },
  { value: 'nit_sikkim', label: 'National Institute of Technology Sikkim' },
  { value: 'nit_andhra_pradesh', label: 'National Institute of Technology Andhra Pradesh' },
  { value: 'nit_delhi', label: 'National Institute of Technology Delhi' },
  { value: 'nit_goa', label: 'National Institute of Technology Goa' },
  { value: 'nit_jharkhand', label: 'National Institute of Technology Jharkhand' },
  { value: 'nit_karnataka', label: 'National Institute of Technology Karnataka' },
  { value: 'nit_madhya_pradesh', label: 'National Institute of Technology Madhya Pradesh' },
  { value: 'nit_meghalaya', label: 'National Institute of Technology Meghalaya' },
  { value: 'nit_nagaland', label: 'National Institute of Technology Nagaland' },
  { value: 'nit_puducherry', label: 'National Institute of Technology Puducherry' },
  { value: 'nit_rajasthan', label: 'National Institute of Technology Rajasthan' },
  { value: 'nit_srinagar', label: 'National Institute of Technology Srinagar' },
  { value: 'nit_uttarakhand', label: 'National Institute of Technology Uttarakhand' },
  { value: 'vit_vellore', label: 'VIT University Vellore' },
  { value: 'vit_chennai', label: 'VIT University Chennai' },
  { value: 'vit_bhopal', label: 'VIT University Bhopal' },
  { value: 'vit_amravati', label: 'VIT University Amravati' },
  { value: 'amrita_university', label: 'Amrita University' },
  { value: 'srm_university', label: 'SRM University' },
  { value: 'manipal_university', label: 'Manipal University' },
  { value: 'bits_pilani', label: 'Birla Institute of Technology and Science, Pilani' },
  { value: 'bits_goa', label: 'Birla Institute of Technology and Science, Goa' },
  { value: 'bits_hyderabad', label: 'Birla Institute of Technology and Science, Hyderabad' },
  { value: 'iiit_hyderabad', label: 'International Institute of Information Technology, Hyderabad' },
  { value: 'iiit_bangalore', label: 'International Institute of Information Technology, Bangalore' },
  { value: 'iiit_delhi', label: 'Indraprastha Institute of Information Technology, Delhi' },
  { value: 'dseu', label: 'Delhi Skill and Entrepreneurship University' },
  { value: 'du', label: 'University of Delhi' },
  { value: 'jnu', label: 'Jawaharlal Nehru University' },
  { value: 'ipu', label: 'Guru Gobind Singh Indraprastha University' },
  { value: 'jamia_millia_islamia', label: 'Jamia Millia Islamia' },
  { value: 'jamia_hamdard', label: 'Jamia Hamdard' },
  { value: 'amazon_web_services', label: 'Amazon Web Services' },
  { value: 'google', label: 'Google' },
  { value: 'microsoft', label: 'Microsoft' },
  { value: 'meta', label: 'Meta (Facebook)' },
  { value: 'apple', label: 'Apple' },
  { value: 'netflix', label: 'Netflix' },
  { value: 'other', label: 'Other (Custom)' }
];

// Generate year options from 1900 to current year + 10
const currentYear = new Date().getFullYear();
const YEAR_OPTIONS = [];
for (let year = currentYear + 10; year >= 1900; year--) {
  YEAR_OPTIONS.push({ value: year.toString(), label: year.toString() });
}

// Helper: normalize a Mongoose-populated array to plain IDs and extract pre-fetched details
const normalizeItems = (items) => {
  const ids = [];
  const details = {};
  (items || []).forEach(item => {
    if (item && typeof item === 'object' && item._id) {
      const id = item._id.toString();
      ids.push(id);
      details[id] = item;
    } else if (item) {
      ids.push(String(item));
    }
  });
  return { ids, details };
};

export function EditInstructor({ instructor, onClose, onSave }) {
  const dispatch = useDispatch();
  // Normalize populated arrays to IDs and extract known details (computed once)
  const initCourses = normalizeItems(instructor?.courses);
  const initLiveClasses = normalizeItems(instructor?.liveClasses);
  const initVideoPackages = normalizeItems(instructor?.videoPackages);
  const updateInstructorLoading = useSelector(selectUpdateInstructorLoading);
  const updateInstructorError = useSelector(selectUpdateInstructorError);
  const deleteInstructorLoading = useSelector(selectDeleteInstructorLoading);
  const deleteProfilePictureLoading = useSelector(selectDeleteProfilePictureLoading);
  const deleteProfilePictureError = useSelector(selectDeleteProfilePictureError);
  const deleteProfilePictureSuccess = useSelector(selectDeleteProfilePictureSuccess);

  const [editedInstructor, setEditedInstructor] = useState({
    _id: instructor?._id,
    firstName: instructor?.firstName || '',
    lastName: instructor?.lastName || '',
    email: instructor?.email || '',
    phone: instructor?.phone || '',
    gender: instructor?.gender || '',
    address: {
      street: instructor?.address?.street || '',
      city: instructor?.address?.city || '',
      state: instructor?.address?.state || '',
      postalCode: instructor?.address?.postalCode || '',
      country: instructor?.address?.country || '',
    },
    bio: instructor?.bio || '',
    specialization: instructor?.specialization || [],
    qualifications: instructor?.qualifications || [],
    yearsOfExperience: instructor?.yearsOfExperience || 0,
    totalStudentsTeaching: instructor?.totalStudentsTeaching || 0,
    totalCourses: instructor?.totalCourses || 0,
    totalLiveClasses: instructor?.totalLiveClasses || 0,
    profilePicture: instructor?.profilePicture || null,
    // profilePicturePublicId: instructor?.profilePicturePublicId || null,
    rating: {
      averageRating: 0,
      totalReviews: 0,
    },
    courses: initCourses.ids,
    zoomIntegration: {
      zoomUserId: instructor?.zoomIntegration?.zoomUserId || '',
      zoomAccessToken: instructor?.zoomIntegration?.zoomAccessToken || '',
      zoomRefreshToken: instructor?.zoomIntegration?.zoomRefreshToken || '',
      isConnected: instructor?.zoomIntegration?.isConnected || false,
      connectedAt: instructor?.zoomIntegration?.connectedAt || null,
    },
    liveClasses: initLiveClasses.ids,
    videoPackages: initVideoPackages.ids,
    isEmailVerified: instructor?.isEmailVerified || false,
    isPhoneVerified: instructor?.isPhoneVerified || false,
    isDocumentsVerified: instructor?.isDocumentsVerified || false,
    isKYCVerified: instructor?.isKYCVerified || false,
    isActive: instructor?.isActive !== undefined ? instructor.isActive : true,
    preferences: {
      emailNotifications: instructor?.preferences?.emailNotifications !== undefined ? instructor.preferences.emailNotifications : true,
      classReminders: instructor?.preferences?.classReminders !== undefined ? instructor.preferences.classReminders : true,
      studentUpdates: instructor?.preferences?.studentUpdates !== undefined ? instructor.preferences.studentUpdates : true,
      language: instructor?.preferences?.language || 'en',
      timezone: instructor?.preferences?.timezone || 'UTC',
    },
    createdAt: instructor?.createdAt,
    updatedAt: instructor?.updatedAt,
  });

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [profilePictureFile, setProfilePictureFile] = useState(null);
  const [profilePicturePreview, setProfilePicturePreview] = useState(instructor.profilePicture?.secure_url || null);
  
  // State for adding courses
  const [showAddCourse, setShowAddCourse] = useState(false);
  const [newCourseId, setNewCourseId] = useState('');
  const [courseDetails, setCourseDetails] = useState(initCourses.details);
  const [courseLoading, setCourseLoading] = useState(false);
  const [courseError, setCourseError] = useState('');
  
  // State for adding live classes
  const [showAddLiveClass, setShowAddLiveClass] = useState(false);
  const [newLiveClassId, setNewLiveClassId] = useState('');
  const [liveClassDetails, setLiveClassDetails] = useState(initLiveClasses.details);
  const [liveClassLoading, setLiveClassLoading] = useState(false);
  const [liveClassError, setLiveClassError] = useState('');
  
  // State for adding video packages
  const [showAddVideoPackage, setShowAddVideoPackage] = useState(false);
  const [newVideoPackageId, setNewVideoPackageId] = useState('');
  const [videoPackageDetails, setVideoPackageDetails] = useState(initVideoPackages.details);
  const [videoPackageLoading, setVideoPackageLoading] = useState(false);
  const [videoPackageError, setVideoPackageError] = useState('');

  // Fetch details for existing courses, live classes, and video packages
  useEffect(() => {
    const fetchExistingDetails = async () => {
      // Fetch course details — skip items already pre-populated (objects from backend populate)
      if (instructor.courses && instructor.courses.length > 0) {
        for (const course of instructor.courses) {
          if (typeof course === 'object' && course?._id) continue; // already pre-populated
          const id = String(course);
          try {
            const result = await dispatch(getCourseById(id)).unwrap();
            setCourseDetails(prev => ({ ...prev, [id]: result?.course || result }));
          } catch (error) {
            console.error(`Failed to fetch course details for ${id}:`, error);
          }
        }
      }

      // Fetch live class details — skip pre-populated items
      if (instructor.liveClasses && instructor.liveClasses.length > 0) {
        for (const liveClass of instructor.liveClasses) {
          if (typeof liveClass === 'object' && liveClass?._id) continue;
          const id = String(liveClass);
          try {
            const result = await dispatch(getLiveClassById(id)).unwrap();
            setLiveClassDetails(prev => ({ ...prev, [id]: result?.data || result }));
          } catch (error) {
            console.error(`Failed to fetch live class details for ${id}:`, error);
          }
        }
      }

      // Fetch video package details — skip pre-populated items
      if (instructor.videoPackages && instructor.videoPackages.length > 0) {
        for (const videoPkg of instructor.videoPackages) {
          if (typeof videoPkg === 'object' && videoPkg?._id) continue;
          const id = String(videoPkg);
          try {
            const result = await dispatch(getVideoPackageById(id)).unwrap();
            setVideoPackageDetails(prev => ({ ...prev, [id]: result?.data || result }));
          } catch (error) {
            console.error(`Failed to fetch video package details for ${id}:`, error);
          }
        }
      }
    };

    if (instructor) {
      fetchExistingDetails();
    }
  }, [instructor, dispatch]);

  if (!instructor) return null;

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

  // Handle qualifications
  const handleAddQualification = () => {
    setEditedInstructor(prev => prev ? {
      ...prev,
      qualifications: [
        ...prev.qualifications,
        { degree: '', institution: '', yearOfCompletion: '', certificationId: '' }
      ]
    } : null);
  };

  const handleRemoveQualification = (index) => {
    setEditedInstructor(prev => prev ? {
      ...prev,
      qualifications: prev.qualifications.filter((_, i) => i !== index)
    } : null);
  };

  const handleQualificationChange = (index, field, value) => {
    setEditedInstructor(prev => prev ? {
      ...prev,
      qualifications: prev.qualifications.map((qual, i) =>
        i === index ? { ...qual, [field]: value } : qual
      )
    } : null);
  };

  // Handle courses
  const handleFetchCourseDetails = async () => {
    if (!newCourseId.trim()) {
      setCourseError('Please enter a Course ID');
      return;
    }
    
    setCourseLoading(true);
    setCourseError('');
    
    try {
      const result = await dispatch(getCourseById(newCourseId.trim())).unwrap();
      const courseData = result?.course || result;
      setCourseDetails(prev => ({ ...prev, [newCourseId.trim()]: courseData }));
      
      // Add the course to the list
      setEditedInstructor(prev => prev ? {
        ...prev,
        courses: [...prev.courses, newCourseId.trim()]
      } : null);
      
      // Reset the form
      setNewCourseId('');
      setShowAddCourse(false);
      setCourseLoading(false);
    } catch (error) {
      setCourseError(error?.message || 'Failed to fetch course details. Please check the ID.');
      setCourseLoading(false);
    }
  };

  const handleAddCourse = () => {
    setShowAddCourse(true);
    setNewCourseId('');
    setCourseError('');
  };

  const handleRemoveCourse = (courseId) => {
    setEditedInstructor(prev => prev ? {
      ...prev,
      courses: prev.courses.filter(id => id !== courseId)
    } : null);
    setCourseDetails(prev => {
      const updated = { ...prev };
      delete updated[courseId];
      return updated;
    });
  };

  // Handle live classes
  const handleFetchLiveClassDetails = async () => {
    if (!newLiveClassId.trim()) {
      setLiveClassError('Please enter a Live Class ID');
      return;
    }
    
    setLiveClassLoading(true);
    setLiveClassError('');
    
    try {
      const result = await dispatch(getLiveClassById(newLiveClassId.trim())).unwrap();
      setLiveClassDetails(prev => ({ ...prev, [newLiveClassId.trim()]: result?.data || result }));
      
      // Add the live class to the list
      setEditedInstructor(prev => prev ? {
        ...prev,
        liveClasses: [...prev.liveClasses, newLiveClassId.trim()]
      } : null);
      
      // Reset the form
      setNewLiveClassId('');
      setShowAddLiveClass(false);
      setLiveClassLoading(false);
    } catch (error) {
      setLiveClassError(error?.message || 'Failed to fetch live class details. Please check the ID.');
      setLiveClassLoading(false);
    }
  };

  const handleAddLiveClass = () => {
    setShowAddLiveClass(true);
    setNewLiveClassId('');
    setLiveClassError('');
  };

  const handleRemoveLiveClass = (liveClassId) => {
    setEditedInstructor(prev => prev ? {
      ...prev,
      liveClasses: prev.liveClasses.filter(id => id !== liveClassId)
    } : null);
    setLiveClassDetails(prev => {
      const updated = { ...prev };
      delete updated[liveClassId];
      return updated;
    });
  };

  // Handle video packages
  const handleFetchVideoPackageDetails = async () => {
    if (!newVideoPackageId.trim()) {
      setVideoPackageError('Please enter a Video Package ID');
      return;
    }
    
    setVideoPackageLoading(true);
    setVideoPackageError('');
    
    try {
      const result = await dispatch(getVideoPackageById(newVideoPackageId.trim())).unwrap();
      setVideoPackageDetails(prev => ({ ...prev, [newVideoPackageId.trim()]: result?.data || result }));
      
      // Add the video package to the list
      setEditedInstructor(prev => prev ? {
        ...prev,
        videoPackages: [...prev.videoPackages, newVideoPackageId.trim()]
      } : null);
      
      // Reset the form
      setNewVideoPackageId('');
      setShowAddVideoPackage(false);
      setVideoPackageLoading(false);
    } catch (error) {
      setVideoPackageError(error?.message || 'Failed to fetch video package details. Please check the ID.');
      setVideoPackageLoading(false);
    }
  };

  const handleAddVideoPackage = () => {
    setShowAddVideoPackage(true);
    setNewVideoPackageId('');
    setVideoPackageError('');
  };

  const handleRemoveVideoPackage = (videoPackageId) => {
    setEditedInstructor(prev => prev ? {
      ...prev,
      videoPackages: prev.videoPackages.filter(id => id !== videoPackageId)
    } : null);
    setVideoPackageDetails(prev => {
      const updated = { ...prev };
      delete updated[videoPackageId];
      return updated;
    });
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

  // Handle profile picture delete
  const handleDeleteProfilePicture = async () => {
    try {
      await dispatch(deleteInstructorProfilePicture(editedInstructor._id)).unwrap();
      // Update local state to reflect the change
      setEditedInstructor(prev => prev ? {
        ...prev,
        profilePicture: null
      } : null);
      setProfilePictureFile(null);
      setProfilePicturePreview(null);
    } catch (error) {
      console.error('Failed to delete profile picture:', error);
    }
  };

  const handleSave = async () => {
    try {
      // If profile picture is selected, create FormData
      let submissionData = editedInstructor;
      if (profilePictureFile) {
        const formData = new FormData();
        
        // Append all instructor data
        Object.keys(editedInstructor).forEach(key => {
          if (editedInstructor[key] !== undefined && editedInstructor[key] !== null) {
            if (Array.isArray(editedInstructor[key])) {
              // Handle arrays (like specialization) as JSON strings
              formData.append(key, JSON.stringify(editedInstructor[key]));
            } else if (typeof editedInstructor[key] === 'object') {
              formData.append(key, JSON.stringify(editedInstructor[key]));
            } else {
              formData.append(key, editedInstructor[key]);
            }
          }
        });
        
        // Append profile picture
        formData.append('profilePicture', profilePictureFile);
        submissionData = formData;
      }

      await dispatch(updateInstructor({
        instructorId: editedInstructor._id,
        instructorData: submissionData,
      })).unwrap();
      onSave(editedInstructor);
    } catch (error) {
      console.error('Failed to update instructor:', error);
    }
  };

  const handleConfirmDelete = async () => {
    try {
      await dispatch(deleteInstructor(editedInstructor._id)).unwrap();
      setShowDeleteModal(false);
      onClose();
    } catch (error) {
      console.error('Failed to delete instructor:', error);
      setShowDeleteModal(false);
    }
  };

  return (
    <div className="w-full h-full bg-[#1a1a1a] border-l border-gray-800 flex flex-col shadow-2xl">
      {/* Header */}
      <div className="p-6 border-b border-gray-800 flex items-center justify-between sticky top-0 bg-[#1a1a1a] z-10">
        <div>
          <h2 className="text-xl font-bold text-white">Edit Instructor</h2>
          <p className="text-sm text-gray-400 mt-1">Make changes to the instructor details</p>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-black transition-colors p-2 hover:bg-gray-800 rounded-lg"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Error Display */}
      {updateInstructorError && (
        <div className="mx-6 mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
          <p className="text-red-400 text-sm">{updateInstructorError}</p>
        </div>
      )}

      {deleteProfilePictureError && (
        <div className="mx-6 mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
          <p className="text-red-400 text-sm">{deleteProfilePictureError}</p>
        </div>
      )}

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
                <Label className="text-gray-300">Gender</Label>
                <Dropdown
                  id="gender-dropdown"
                  options={GENDER_OPTIONS}
                  value={editedInstructor.gender}
                  onChange={(value) => handleChange('gender', value)}
                  placeholder="Select gender"
                  className="bg-[#0f0f0f] border-gray-800 text-black mt-2"
                />
              </div>

              <div>
                <Label htmlFor="bio" className="text-gray-300">Bio</Label>
                <Textarea
                  id="bio"
                  value={editedInstructor.bio}
                  onChange={(e) => handleChange('bio', e.target.value)}
                  className="bg-[#0f0f0f] border-gray-800 text-black mt-2"
                  rows={4}
                />
              </div>

              {/* Address Fields */}
              <div className="space-y-4">
                <h4 className="text-md font-medium text-gray-300">Address</h4>
                <div>
                  <Label htmlFor="street" className="text-gray-300">Street</Label>
                  <Input
                    id="street"
                    value={editedInstructor.address.street}
                    onChange={(e) => handleNestedChange('address', 'street', e.target.value)}
                    className="bg-[#0f0f0f] border-gray-800 text-black mt-2"
                    placeholder="Street address"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="city" className="text-gray-300">City</Label>
                    <Input
                      id="city"
                      value={editedInstructor.address.city}
                      onChange={(e) => handleNestedChange('address', 'city', e.target.value)}
                      className="bg-[#0f0f0f] border-gray-800 text-black mt-2"
                      placeholder="City"
                    />
                  </div>
                  <div>
                    <Label htmlFor="state" className="text-gray-300">State</Label>
                    <Input
                      id="state"
                      value={editedInstructor.address.state}
                      onChange={(e) => handleNestedChange('address', 'state', e.target.value)}
                      className="bg-[#0f0f0f] border-gray-800 text-black mt-2"
                      placeholder="State"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="postalCode" className="text-gray-300">Postal Code</Label>
                    <Input
                      id="postalCode"
                      value={editedInstructor.address.postalCode}
                      onChange={(e) => handleNestedChange('address', 'postalCode', e.target.value)}
                      className="bg-[#0f0f0f] border-gray-800 text-black mt-2"
                      placeholder="Postal code"
                    />
                  </div>
                  <div>
                    <Label htmlFor="country" className="text-gray-300">Country</Label>
                    <Input
                      id="country"
                      value={editedInstructor.address.country}
                      onChange={(e) => handleNestedChange('address', 'country', e.target.value)}
                      className="bg-[#0f0f0f] border-gray-800 text-black mt-2"
                      placeholder="Country"
                    />
                  </div>
                </div>
              </div>

              <div>
                <Label className="text-gray-300">Specialization</Label>
                <div className="mt-2 grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                  {SPECIALIZATION_OPTIONS.map((option) => (
                    <label key={option.value} className="flex items-center space-x-2 text-sm">
                      <input
                        type="checkbox"
                        checked={editedInstructor.specialization.includes(option.value)}
                        onChange={(e) => {
                          const value = option.value;
                          if (e.target.checked) {
                            handleChange('specialization', [...editedInstructor.specialization, value]);
                          } else {
                            handleChange('specialization', editedInstructor.specialization.filter(s => s !== value));
                          }
                        }}
                        className="rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-gray-300">{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="yearsOfExperience" className="text-gray-300">Years of Experience</Label>
                <Input
                  id="yearsOfExperience"
                  type="number"
                  value={editedInstructor.yearsOfExperience}
                  onChange={(e) => handleChange('yearsOfExperience', parseInt(e.target.value) || 0)}
                  className="bg-[#0f0f0f] border-gray-800 text-black mt-2"
                />
              </div>

              {/* Qualifications */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <Label className="text-gray-300">Qualifications</Label>
                  <Button
                    type="button"
                    onClick={handleAddQualification}
                    className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-3 py-1"
                  >
                    Add Qualification
                  </Button>
                </div>
                <div className="space-y-4">
                  {editedInstructor.qualifications.map((qual, index) => (
                    <div key={index} className="p-4 bg-[#0f0f0f] border border-gray-800 rounded-lg">
                      <div className="flex justify-between items-center mb-3">
                        <h4 className="text-white font-medium">Qualification {index + 1}</h4>
                        <Button
                          type="button"
                          onClick={() => handleRemoveQualification(index)}
                          variant="outline"
                          className="border-red-500 text-red-400 hover:bg-red-500/10 text-sm px-2 py-1"
                        >
                          Remove
                        </Button>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-gray-300 text-sm">Degree</Label>
                          <Dropdown
                            value={qual.degree}
                            onChange={(value) => handleQualificationChange(index, 'degree', value)}
                            options={DEGREE_OPTIONS}
                            placeholder="Select degree"
                            className="mt-1"
                            id={`degree-${index}`}
                          />
                        </div>
                        <div>
                          <Label className="text-gray-300 text-sm">Institution</Label>
                          <Dropdown
                            value={qual.institution}
                            onChange={(value) => handleQualificationChange(index, 'institution', value)}
                            options={INSTITUTION_OPTIONS}
                            placeholder="Select institution"
                            className="mt-1"
                            id={`institution-${index}`}
                          />
                        </div>
                        <div>
                          <Label className="text-gray-300 text-sm">Year of Completion</Label>
                          <Dropdown
                            value={qual.yearOfCompletion?.toString()}
                            onChange={(value) => handleQualificationChange(index, 'yearOfCompletion', parseInt(value))}
                            options={YEAR_OPTIONS}
                            placeholder="Select year"
                            className="mt-1"
                            id={`year-${index}`}
                          />
                        </div>
                        <div>
                          <Label className="text-gray-300 text-sm">Certification ID</Label>
                          <Input
                            value={qual.certificationId || ''}
                            onChange={(e) => handleQualificationChange(index, 'certificationId', e.target.value)}
                            className="bg-[#0f0f0f] border-gray-800 text-black mt-1"
                            placeholder="Enter certification ID"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <Separator className="bg-gray-800" />

          {/* Course Assignments */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Course Assignments</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-gray-300">Assigned Courses ({editedInstructor.courses.length})</Label>
                <Button
                  type="button"
                  onClick={handleAddCourse}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-3 py-1"
                >
                  Add Course
                </Button>
              </div>

              {/* Add Course Form */}
              {showAddCourse && (
                <div className="p-4 bg-[#0f0f0f] border border-gray-800 rounded-lg">
                  <Label className="text-gray-300 text-sm mb-3 block">Enter Course ID</Label>
                  <div className="flex gap-2 mb-3">
                    <Input
                      value={newCourseId}
                      onChange={(e) => setNewCourseId(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          handleFetchCourseDetails();
                        }
                      }}
                      placeholder="Paste course ID here..."
                      className="bg-[#1a1a1a] border-gray-700 text-white mt-0 flex-1"
                      disabled={courseLoading}
                    />
                    <Button
                      type="button"
                      onClick={handleFetchCourseDetails}
                      disabled={courseLoading || !newCourseId.trim()}
                      className="bg-green-600 hover:bg-green-700 text-white px-4"
                    >
                      {courseLoading ? 'Adding...' : 'Add'}
                    </Button>
                    <Button
                      type="button"
                      onClick={() => {
                        setShowAddCourse(false);
                        setNewCourseId('');
                        setCourseError('');
                      }}
                      variant="outline"
                      className="border-gray-700 text-gray-300 hover:bg-gray-800"
                    >
                      Cancel
                    </Button>
                  </div>
                  {courseError && (
                    <p className="text-red-400 text-sm">{courseError}</p>
                  )}
                </div>
              )}

              <div className="space-y-2 max-h-40 overflow-y-auto">
                {editedInstructor.courses.length === 0 ? (
                  <p className="text-gray-500 text-sm">No courses assigned</p>
                ) : (
                  editedInstructor.courses.map((courseId, index) => {
                    const courseName = courseDetails[courseId]?.title || courseDetails[courseId]?.name || 'Unnamed Course';
                    return (
                      <div key={courseId} className="flex items-center justify-between p-3 bg-[#0f0f0f] border border-gray-800 rounded">
                        <div className="flex-1">
                          <p className="text-gray-300 text-sm font-medium">{courseName}</p>
                          <p className="text-gray-500 text-xs">ID: {courseId}</p>
                        </div>
                        <Button
                          type="button"
                          onClick={() => handleRemoveCourse(courseId)}
                          variant="outline"
                          className="border-red-500 text-red-400 hover:bg-red-500/10 text-xs px-2 py-1"
                        >
                          Remove
                        </Button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          <Separator className="bg-gray-800" />

          {/* Zoom Integration */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Zoom Integration</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="zoomUserId" className="text-gray-300">Zoom User ID</Label>
                  <Input
                    id="zoomUserId"
                    value={editedInstructor.zoomIntegration.zoomUserId}
                    onChange={(e) => handleNestedChange('zoomIntegration', 'zoomUserId', e.target.value)}
                    className="bg-[#0f0f0f] border-gray-800 text-black mt-2"
                    placeholder="Enter Zoom User ID"
                  />
                </div>
                <div>
                  <Label htmlFor="zoomAccessToken" className="text-gray-300">Access Token</Label>
                  <Input
                    id="zoomAccessToken"
                    type="password"
                    value={editedInstructor.zoomIntegration.zoomAccessToken}
                    onChange={(e) => handleNestedChange('zoomIntegration', 'zoomAccessToken', e.target.value)}
                    className="bg-[#0f0f0f] border-gray-800 text-black mt-2"
                    placeholder="Enter Access Token"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="zoomRefreshToken" className="text-gray-300">Refresh Token</Label>
                  <Input
                    id="zoomRefreshToken"
                    type="password"
                    value={editedInstructor.zoomIntegration.zoomRefreshToken}
                    onChange={(e) => handleNestedChange('zoomIntegration', 'zoomRefreshToken', e.target.value)}
                    className="bg-[#0f0f0f] border-gray-800 text-black mt-2"
                    placeholder="Enter Refresh Token"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="zoomConnected"
                    checked={editedInstructor.zoomIntegration.isConnected}
                    onCheckedChange={(checked) => handleNestedChange('zoomIntegration', 'isConnected', checked)}
                  />
                  <Label htmlFor="zoomConnected" className="text-gray-300">Connected to Zoom</Label>
                </div>
              </div>
              {editedInstructor.zoomIntegration.connectedAt && (
                <div>
                  <Label className="text-gray-300">Connected At</Label>
                  <p className="text-gray-400 text-sm mt-1">
                    {new Date(editedInstructor.zoomIntegration.connectedAt).toLocaleString()}
                  </p>
                </div>
              )}
            </div>
          </div>

          <Separator className="bg-gray-800" />

          {/* Live Classes */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Live Classes</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-gray-300">Assigned Live Classes ({editedInstructor.liveClasses.length})</Label>
                <Button
                  type="button"
                  onClick={handleAddLiveClass}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-3 py-1"
                >
                  Add Live Class
                </Button>
              </div>

              {/* Add Live Class Form */}
              {showAddLiveClass && (
                <div className="p-4 bg-[#0f0f0f] border border-gray-800 rounded-lg">
                  <Label className="text-gray-300 text-sm mb-3 block">Enter Live Class ID</Label>
                  <div className="flex gap-2 mb-3">
                    <Input
                      value={newLiveClassId}
                      onChange={(e) => setNewLiveClassId(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          handleFetchLiveClassDetails();
                        }
                      }}
                      placeholder="Paste live class ID here..."
                      className="bg-[#1a1a1a] border-gray-700 text-white mt-0 flex-1"
                      disabled={liveClassLoading}
                    />
                    <Button
                      type="button"
                      onClick={handleFetchLiveClassDetails}
                      disabled={liveClassLoading || !newLiveClassId.trim()}
                      className="bg-green-600 hover:bg-green-700 text-white px-4"
                    >
                      {liveClassLoading ? 'Adding...' : 'Add'}
                    </Button>
                    <Button
                      type="button"
                      onClick={() => {
                        setShowAddLiveClass(false);
                        setNewLiveClassId('');
                        setLiveClassError('');
                      }}
                      variant="outline"
                      className="border-gray-700 text-gray-300 hover:bg-gray-800"
                    >
                      Cancel
                    </Button>
                  </div>
                  {liveClassError && (
                    <p className="text-red-400 text-sm">{liveClassError}</p>
                  )}
                </div>
              )}

              <div className="space-y-2 max-h-40 overflow-y-auto">
                {editedInstructor.liveClasses.length === 0 ? (
                  <p className="text-gray-500 text-sm">No live classes assigned</p>
                ) : (
                  editedInstructor.liveClasses.map((liveClassId, index) => {
                    const liveClassName = liveClassDetails[liveClassId]?.title || liveClassDetails[liveClassId]?.name || 'Unnamed Live Class';
                    return (
                      <div key={liveClassId} className="flex items-center justify-between p-3 bg-[#0f0f0f] border border-gray-800 rounded">
                        <div className="flex-1">
                          <p className="text-gray-300 text-sm font-medium">{liveClassName}</p>
                          <p className="text-gray-500 text-xs">ID: {liveClassId}</p>
                        </div>
                        <Button
                          type="button"
                          onClick={() => handleRemoveLiveClass(liveClassId)}
                          variant="outline"
                          className="border-red-500 text-red-400 hover:bg-red-500/10 text-xs px-2 py-1"
                        >
                          Remove
                        </Button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          <Separator className="bg-gray-800" />

          {/* Video Packages */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Video Packages</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-gray-300">Assigned Video Packages ({editedInstructor.videoPackages.length})</Label>
                <Button
                  type="button"
                  onClick={handleAddVideoPackage}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-3 py-1"
                >
                  Add Video Package
                </Button>
              </div>

              {/* Add Video Package Form */}
              {showAddVideoPackage && (
                <div className="p-4 bg-[#0f0f0f] border border-gray-800 rounded-lg">
                  <Label className="text-gray-300 text-sm mb-3 block">Enter Video Package ID</Label>
                  <div className="flex gap-2 mb-3">
                    <Input
                      value={newVideoPackageId}
                      onChange={(e) => setNewVideoPackageId(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          handleFetchVideoPackageDetails();
                        }
                      }}
                      placeholder="Paste video package ID here..."
                      className="bg-[#1a1a1a] border-gray-700 text-white mt-0 flex-1"
                      disabled={videoPackageLoading}
                    />
                    <Button
                      type="button"
                      onClick={handleFetchVideoPackageDetails}
                      disabled={videoPackageLoading || !newVideoPackageId.trim()}
                      className="bg-green-600 hover:bg-green-700 text-white px-4"
                    >
                      {videoPackageLoading ? 'Adding...' : 'Add'}
                    </Button>
                    <Button
                      type="button"
                      onClick={() => {
                        setShowAddVideoPackage(false);
                        setNewVideoPackageId('');
                        setVideoPackageError('');
                      }}
                      variant="outline"
                      className="border-gray-700 text-gray-300 hover:bg-gray-800"
                    >
                      Cancel
                    </Button>
                  </div>
                  {videoPackageError && (
                    <p className="text-red-400 text-sm">{videoPackageError}</p>
                  )}
                </div>
              )}

              <div className="space-y-2 max-h-40 overflow-y-auto">
                {editedInstructor.videoPackages.length === 0 ? (
                  <p className="text-gray-500 text-sm">No video packages assigned</p>
                ) : (
                  editedInstructor.videoPackages.map((videoPackageId, index) => {
                    const videoPackageName = videoPackageDetails[videoPackageId]?.packageName || videoPackageDetails[videoPackageId]?.title || videoPackageDetails[videoPackageId]?.name || 'Unnamed Video Package';
                    return (
                      <div key={videoPackageId} className="flex items-center justify-between p-3 bg-[#0f0f0f] border border-gray-800 rounded">
                        <div className="flex-1">
                          <p className="text-gray-300 text-sm font-medium">{videoPackageName}</p>
                          <p className="text-gray-500 text-xs">ID: {videoPackageId}</p>
                        </div>
                        <Button
                          type="button"
                          onClick={() => handleRemoveVideoPackage(videoPackageId)}
                          variant="outline"
                          className="border-red-500 text-red-400 hover:bg-red-500/10 text-xs px-2 py-1"
                        >
                          Remove
                        </Button>
                      </div>
                    );
                  })
                )}
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
                ) : editedInstructor.profilePicture?.secure_url ? (
                  <img src={editedInstructor.profilePicture.secure_url} alt="Current" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gray-700 flex items-center justify-center">
                    <span className="text-gray-400 text-2xl font-bold">
                      {editedInstructor.firstName?.[0]}{editedInstructor.lastName?.[0]}
                    </span>
                  </div>
                )}
              </div>
              <div>
                <Label htmlFor="profilePicture" className="text-gray-300 cursor-pointer">
                  <div className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 mb-2">
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
                <button
                  onClick={handleDeleteProfilePicture}
                  disabled={!editedInstructor.profilePicture?.secure_url || deleteProfilePictureLoading}
                  className="bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  {deleteProfilePictureLoading ? 'Removing...' : 'Remove Picture'}
                </button>
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

          <Separator className="bg-gray-800" />

          {/* Statistics */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Statistics</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="totalCourses" className="text-gray-300">Total Courses</Label>
                <Input
                  id="totalCourses"
                  type="number"
                  value={editedInstructor.totalCourses}
                  onChange={(e) => handleChange('totalCourses', parseInt(e.target.value) || 0)}
                  className="bg-[#0f0f0f] border-gray-800 text-black mt-2"
                />
              </div>
              <div>
                <Label htmlFor="totalStudentsTeaching" className="text-gray-300">Total Students Teaching</Label>
                <Input
                  id="totalStudentsTeaching"
                  type="number"
                  value={editedInstructor.totalStudentsTeaching}
                  onChange={(e) => handleChange('totalStudentsTeaching', parseInt(e.target.value) || 0)}
                  className="bg-[#0f0f0f] border-gray-800 text-black mt-2"
                />
              </div>
              <div>
                <Label htmlFor="totalLiveClasses" className="text-gray-300">Total Live Classes</Label>
                <Input
                  id="totalLiveClasses"
                  type="number"
                  value={editedInstructor.totalLiveClasses}
                  onChange={(e) => handleChange('totalLiveClasses', parseInt(e.target.value) || 0)}
                  className="bg-[#0f0f0f] border-gray-800 text-black mt-2"
                />
              </div>
              <div className="bg-[#0f0f0f] p-4 rounded-lg border border-gray-800">
                <p className="text-sm text-gray-400">Rating</p>
                <p className="text-2xl font-bold text-white mt-2">{editedInstructor.rating.averageRating} ⭐</p>
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

          <Separator className="bg-gray-800" />

          {/* Timestamps */}
          {editedInstructor.createdAt && (
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Timestamps</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <Label className="text-gray-400">Created At</Label>
                  <p className="text-gray-300 mt-1">{new Date(editedInstructor.createdAt).toLocaleString()}</p>
                </div>
                {editedInstructor.updatedAt && (
                  <div>
                    <Label className="text-gray-400">Updated At</Label>
                    <p className="text-gray-300 mt-1">{new Date(editedInstructor.updatedAt).toLocaleString()}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          <Separator className="bg-gray-800" />

          {/* Danger Zone */}
          <div>
            <h3 className="text-lg font-semibold text-red-400 mb-4">Danger Zone</h3>
            <div className="p-4 bg-red-500/5 border border-red-500/20 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-medium">Delete Instructor</p>
                  <p className="text-sm text-gray-400 mt-1">Permanently remove this instructor and all associated data</p>
                </div>
                <Button
                  onClick={() => setShowDeleteModal(true)}
                  disabled={deleteInstructorLoading}
                  variant="outline"
                  className="border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  {deleteInstructorLoading ? 'Deleting...' : 'Delete'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

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
          onClick={handleSave}
          disabled={updateInstructorLoading}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          {updateInstructorLoading ? (
            'Saving...'
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </>
          )}
        </Button>
      </div>

      {/* Delete Warning Modal */}
      <WarningModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Instructor"
        message={`Are you sure you want to delete ${editedInstructor.firstName} ${editedInstructor.lastName}? This action cannot be undone and will remove all associated data.`}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleConfirmDelete}
        onCancel={() => setShowDeleteModal(false)}
      />
    </div>
  );
}
