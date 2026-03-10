import { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Award, RefreshCw, AlertTriangle, Search, Download, ExternalLink, CheckCircle
} from 'lucide-react';
import { InstructorLayout } from '../../components/layout/InstructorLayout';
import { getMyCourses } from '../../redux/slices/course.slice';
import { useProtectedRoute, useTokenRefreshOnActivity } from '../../hooks/useProtectedRoute';
import apiClient from '../../utils/api.utils';

export default function Certificates() {
  const dispatch = useDispatch();
  const { courses } = useSelector(s => s.course);
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useProtectedRoute();
  useTokenRefreshOnActivity();

  useEffect(() => {
    dispatch(getMyCourses({ page: 1, limit: 100 }));
  }, [dispatch]);

  const fetchCertificates = useCallback(async () => {
    if (!selectedCourse) return;
    setLoading(true);
    try {
      const res = await apiClient.get(`/certificates/course/${selectedCourse}`);
      setCertificates(res.data?.data?.certificates || res.data?.data || []);
    } catch {
      setCertificates([]);
    } finally {
      setLoading(false);
    }
  }, [selectedCourse]);

  useEffect(() => { fetchCertificates(); }, [fetchCertificates]);

  const filtered = certificates.filter(c =>
    !searchTerm || (c.user?.firstName + ' ' + c.user?.lastName).toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <InstructorLayout>
      <div className="p-6 lg:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <Award className="w-7 h-7 text-white" />
              <h1 className="text-2xl lg:text-3xl font-bold text-white">Certificates</h1>
            </div>
            <p className="text-gray-500">View certificates issued for your courses</p>
          </div>
          <button onClick={fetchCertificates} disabled={loading || !selectedCourse}
            className="flex items-center gap-2 px-4 py-2 bg-[#111] border border-gray-800 hover:border-gray-600 text-gray-300 rounded-lg text-sm font-medium disabled:opacity-50">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <select value={selectedCourse} onChange={e => setSelectedCourse(e.target.value)}
            className="px-3 py-2 bg-[#111] border border-gray-800 rounded-lg text-gray-300 text-sm flex-1 max-w-xs">
            <option value="">Select a course</option>
            {(courses || []).map(c => <option key={c._id} value={c._id}>{c.title}</option>)}
          </select>
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search by student name..."
              className="w-full pl-10 pr-4 py-2 bg-[#111] border border-gray-800 rounded-lg text-gray-300 text-sm placeholder:text-gray-600 focus:outline-none focus:border-gray-600" />
          </div>
        </div>

        {/* Content */}
        {!selectedCourse ? (
          <div className="flex flex-col items-center justify-center min-h-[40vh] text-center">
            <Award className="w-16 h-16 text-gray-700 mb-4" />
            <p className="text-gray-500">Select a course to view issued certificates</p>
          </div>
        ) : loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-[#111] border border-gray-800 rounded-xl p-4 animate-pulse">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-gray-800"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-800 rounded w-40"></div>
                    <div className="h-3 bg-gray-800 rounded w-24"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[40vh] text-center">
            <Award className="w-16 h-16 text-gray-700 mb-4" />
            <h3 className="text-lg font-semibold text-white mb-1">No certificates found</h3>
            <p className="text-gray-500 text-sm">No certificates have been issued for this course yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(cert => (
              <div key={cert._id} className="bg-[#111] border border-gray-800 rounded-xl p-4 hover:border-gray-700 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 text-green-400" />
                    </div>
                    <div>
                      <p className="text-white font-medium">
                        {cert.user?.firstName} {cert.user?.lastName}
                      </p>
                      <p className="text-gray-500 text-sm">
                        {cert.certificateCode ? `Code: ${cert.certificateCode}` : ''} • Issued {new Date(cert.issuedAt || cert.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  {cert.certificateUrl && (
                    <a href={cert.certificateUrl} target="_blank" rel="noopener noreferrer"
                      className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </InstructorLayout>
  );
}
