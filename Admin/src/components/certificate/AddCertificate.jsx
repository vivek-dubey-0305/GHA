import { X, Plus } from 'lucide-react';
import { Button, Input, Label, Separator, Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../ui';
import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  createCertificate,
  selectCreateCertificateLoading,
  selectCreateCertificateError,
} from '../../redux/slices/certificate.slice.js';


export function AddCertificate({ onClose, onAdd }) {
  const dispatch = useDispatch();
  const createLoading = useSelector(selectCreateCertificateLoading);
  const createError = useSelector(selectCreateCertificateError);

  const [newCertificate, setNewCertificate] = useState({
    userId: '',
    courseId: '',
    certificateUrl: '',
    status: 'issued',
  });

  const handleChange = (field, value) => {
    setNewCertificate(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    try {
      await dispatch(createCertificate(newCertificate)).unwrap();
      onAdd();
    } catch (error) {
      console.error('Failed to create certificate:', error);
    }
  };

  return (
    <div className="w-full h-full bg-[#1a1a1a] border-l border-gray-800 flex flex-col shadow-2xl">
      {/* Header */}
      <div className="p-6 border-b border-gray-800 flex items-center justify-between sticky top-0 bg-[#1a1a1a] z-10">
        <div>
          <h2 className="text-xl font-bold text-white">Add Certificate</h2>
          <p className="text-sm text-gray-400 mt-1">Issue a new certificate</p>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-black transition-colors p-2 hover:bg-gray-800 rounded-lg"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Error Display */}
      {createError && (
        <div className="mx-6 mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
          <p className="text-red-400 text-sm">{createError}</p>
        </div>
      )}

      {/* Content - Scrollable */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 space-y-6">
          {/* Certificate Information */}
          <div>
            <h3 className="text-lg font-semibold text-black mb-4">Certificate Information</h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="userId" className="text-gray-300">User ID *</Label>
                <Input
                  id="userId"
                  value={newCertificate.userId}
                  onChange={(e) => handleChange('userId', e.target.value)}
                  className="bg-[#0f0f0f] border-gray-800 text-black mt-2"
                  placeholder="MongoDB ObjectId of the user"
                  required
                />
              </div>

              <div>
                <Label htmlFor="courseId" className="text-gray-300">Course ID *</Label>
                <Input
                  id="courseId"
                  value={newCertificate.courseId}
                  onChange={(e) => handleChange('courseId', e.target.value)}
                  className="bg-[#0f0f0f] border-gray-800 text-black mt-2"
                  placeholder="MongoDB ObjectId of the course"
                  required
                />
              </div>

              <div>
                <Label htmlFor="certificateUrl" className="text-gray-300">Certificate URL</Label>
                <Input
                  id="certificateUrl"
                  value={newCertificate.certificateUrl}
                  onChange={(e) => handleChange('certificateUrl', e.target.value)}
                  className="bg-[#0f0f0f] border-gray-800 text-black mt-2"
                  placeholder="https://example.com/certificate.pdf"
                />
              </div>
            </div>
          </div>

          <Separator className="bg-gray-800" />

          {/* Status */}
          <div>
            <h3 className="text-lg font-semibold text-black mb-4">Status</h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="status" className="text-gray-300">Certificate Status *</Label>
                <Select value={newCertificate.status} onValueChange={(value) => handleChange('status', value)}>
                  <SelectTrigger className="bg-[#0f0f0f] border-gray-800 text-black mt-2">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1a1a] border-gray-800">
                    <SelectItem value="issued">Issued</SelectItem>
                    <SelectItem value="revoked">Revoked</SelectItem>
                  </SelectContent>
                </Select>
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
          onClick={handleSubmit}
          disabled={createLoading}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          {createLoading ? (
            'Creating...'
          ) : (
            <>
              <Plus className="w-4 h-4 mr-2" />
              Add Certificate
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
