import { X, Plus } from 'lucide-react';
import { mockCourses } from '../../data/mockCourses';
import { Button, Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Switch, Separator, Textarea } from '../ui';
import { useState } from 'react';


export function AddCourse({ onClose, onAdd }) {
  const [newCourse, setNewCourse] = useState({
    title: '',
    description: '',
    shortDescription: '',
    instructor: {
      _id: '1',
      name: 'Dr. Sarah Williams',
    },
    category: 'programming',
    level: 'beginner',
    language: 'English',
    price: 0,
    currency: 'USD',
    totalModules: 0,
    totalLessons: 0,
    totalDuration: 0,
    status: 'draft',
    isPublished: false,
    enrolledCount: 0,
    rating: 0,
    totalReviews: 0,
    learningOutcomes: [],
    prerequisites: [],
    tags: [],
    isFree: false,
    certificateEnabled: true,
  });

  const handleChange = (field, value) => {
    setNewCourse(prev => ({ ...prev, [field]: value }));
  };

  const handleAdd = () => {
    onAdd({
      ...newCourse,
      _id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    });
  };

  return (
    <div className="w-full h-full bg-[#1a1a1a] border-l border-gray-800 flex flex-col shadow-2xl">
      {/* Header */}
      <div className="p-6 border-b border-gray-800 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Add Course</h2>
          <p className="text-sm text-gray-400 mt-1">Create a new course</p>
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
              <div>
                <Label htmlFor="title" className="text-gray-300">Course Title *</Label>
                <Input
                  id="title"
                  value={newCourse.title}
                  onChange={(e) => handleChange('title', e.target.value)}
                  className="bg-[#0f0f0f] border-gray-800 text-black mt-2"
                  placeholder="e.g., Advanced React Development"
                />
              </div>

              <div>
                <Label htmlFor="shortDescription" className="text-gray-300">Short Description</Label>
                <Input
                  id="shortDescription"
                  value={newCourse.shortDescription}
                  onChange={(e) => handleChange('shortDescription', e.target.value)}
                  className="bg-[#0f0f0f] border-gray-800 text-black mt-2"
                  placeholder="Brief one-liner about the course"
                />
              </div>

              <div>
                <Label htmlFor="description" className="text-gray-300">Full Description *</Label>
                <Textarea
                  id="description"
                  value={newCourse.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  className="bg-[#0f0f0f] border-gray-800 text-black mt-2"
                  rows={4}
                  placeholder="Detailed course description..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="category" className="text-gray-300">Category *</Label>
                  <Select value={newCourse.category} onValueChange={(value) => handleChange('category', value)}>
                    <SelectTrigger className="bg-[#0f0f0f] border-gray-800 text-black mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1a1a1a] border-gray-800">
                      <SelectItem value="programming">Programming</SelectItem>
                      <SelectItem value="design">Design</SelectItem>
                      <SelectItem value="business">Business</SelectItem>
                      <SelectItem value="marketing">Marketing</SelectItem>
                      <SelectItem value="data-science">Data Science</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="level" className="text-gray-300">Level *</Label>
                  <Select value={newCourse.level} onValueChange={(value) => handleChange('level', value)}>
                    <SelectTrigger className="bg-[#0f0f0f] border-gray-800 text-black mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1a1a1a] border-gray-800">
                      <SelectItem value="beginner">Beginner</SelectItem>
                      <SelectItem value="intermediate">Intermediate</SelectItem>
                      <SelectItem value="advanced">Advanced</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="language" className="text-gray-300">Language</Label>
                <Input
                  id="language"
                  value={newCourse.language}
                  onChange={(e) => handleChange('language', e.target.value)}
                  className="bg-[#0f0f0f] border-gray-800 text-black mt-2"
                  placeholder="English"
                />
              </div>
            </div>
          </div>

          <Separator className="bg-gray-800" />

          {/* Pricing */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Pricing</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-gray-300">Free Course</Label>
                  <p className="text-sm text-gray-500">Make this course free</p>
                </div>
                <Switch
                  checked={newCourse.isFree}
                  onCheckedChange={(checked) => handleChange('isFree', checked)}
                />
              </div>

              {!newCourse.isFree && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="price" className="text-gray-300">Price *</Label>
                      <Input
                        id="price"
                        type="number"
                        value={newCourse.price}
                        onChange={(e) => handleChange('price', parseFloat(e.target.value) || 0)}
                        className="bg-[#0f0f0f] border-gray-800 text-black mt-2"
                        placeholder="99.99"
                      />
                    </div>
                    <div>
                      <Label htmlFor="discountPrice" className="text-gray-300">Discount Price</Label>
                      <Input
                        id="discountPrice"
                        type="number"
                        value={newCourse.discountPrice || ''}
                        onChange={(e) => handleChange('discountPrice', parseFloat(e.target.value))}
                        className="bg-[#0f0f0f] border-gray-800 text-black mt-2"
                        placeholder="79.99"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="currency" className="text-gray-300">Currency</Label>
                    <Input
                      id="currency"
                      value={newCourse.currency}
                      onChange={(e) => handleChange('currency', e.target.value)}
                      className="bg-[#0f0f0f] border-gray-800 text-black mt-2"
                      placeholder="USD"
                    />
                  </div>
                </>
              )}
            </div>
          </div>

          <Separator className="bg-gray-800" />

          {/* Course Structure */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Course Structure</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="totalModules" className="text-gray-300">Modules</Label>
                  <Input
                    id="totalModules"
                    type="number"
                    value={newCourse.totalModules}
                    onChange={(e) => handleChange('totalModules', parseInt(e.target.value) || 0)}
                    className="bg-[#0f0f0f] border-gray-800 text-black mt-2"
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label htmlFor="totalLessons" className="text-gray-300">Lessons</Label>
                  <Input
                    id="totalLessons"
                    type="number"
                    value={newCourse.totalLessons}
                    onChange={(e) => handleChange('totalLessons', parseInt(e.target.value) || 0)}
                    className="bg-[#0f0f0f] border-gray-800 text-black mt-2"
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label htmlFor="totalDuration" className="text-gray-300">Duration (min)</Label>
                  <Input
                    id="totalDuration"
                    type="number"
                    value={newCourse.totalDuration}
                    onChange={(e) => handleChange('totalDuration', parseInt(e.target.value) || 0)}
                    className="bg-[#0f0f0f] border-gray-800 text-black mt-2"
                    placeholder="0"
                  />
                </div>
              </div>
            </div>
          </div>

          <Separator className="bg-gray-800" />

          {/* Settings */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Settings</h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="status" className="text-gray-300">Course Status</Label>
                <Select value={newCourse.status} onValueChange={(value) => handleChange('status', value)}>
                  <SelectTrigger className="bg-[#0f0f0f] border-gray-800 text-black mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1a1a] border-gray-800">
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-gray-300">Certificate Enabled</Label>
                  <p className="text-sm text-gray-500">Issue certificates upon completion</p>
                </div>
                <Switch
                  checked={newCourse.certificateEnabled}
                  onCheckedChange={(checked) => handleChange('certificateEnabled', checked)}
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
          Add Course
        </Button>
      </div>
    </div>
  );
}
