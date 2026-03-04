import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';
import { Label } from './label';

/**
 * Generic Reusable Dropdown Component
 * Works with any field - gender, country, courses, status, etc.
 * 
 * @component
 * @example
 * // Simple string options
 * <Dropdown 
 *   value={gender}
 *   onChange={(value) => setGender(value)}
 *   options={['Male', 'Female', 'Other']}
 *   label="Gender"
 * />
 * 
 * @example
 * // Object options with value and label
 * <Dropdown 
 *   value={country}
 *   onChange={(value) => setCountry(value)}
 *   options={[
 *     { value: 'us', label: 'United States' },
 *     { value: 'uk', label: 'United Kingdom' }
 *   ]}
 *   label="Country"
 * />
 * 
 * @example
 * // With groups
 * <Dropdown 
 *   value={selectedCourse}
 *   onChange={(value) => setSelectedCourse(value)}
 *   options={courses}
 *   optionValue="courseId"
 *   optionLabel="courseName"
 *   label="Select Course"
 * />
 */
export default function Dropdown({
  value = '',
  onChange,
  options = [],
  label = '',
  placeholder = 'Select an option',
  required = false,
  error = null,
  disabled = false,
  className = '',
  showLabel = true,
  // For object arrays - specify which properties to use as value and label
  optionValue = 'value',
  optionLabel = 'label',
  id, // Add id prop
}) {
  const handleChange = (newValue) => {
    if (onChange) {
      onChange(newValue);
    }
  };

  // Normalize options to always be array of objects with value and label
  const normalizedOptions = (options || []).map((option) => {
    // If option is a string, convert to { value, label }
    if (typeof option === 'string') {
      return { value: option, label: option };
    }
    // If option is an object, map according to optionValue and optionLabel
    if (typeof option === 'object' && option !== null) {
      return {
        value: option[optionValue] || option.value || '',
        label: option[optionLabel] || option.label || '',
      };
    }
    return { value: '', label: '' };
  });

  // Ensure value is always a string
  const currentValue = value || '';

  // Find the label for the current value
  const currentLabel = normalizedOptions.find(opt => opt.value === currentValue)?.label || '';

  // Generate unique ID if not provided
  const dropdownId = id || `dropdown-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className={`w-full ${className}`}>
      {showLabel && label && (
        <Label htmlFor="dropdown-field" className="text-gray-300 block mb-2">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </Label>
      )}
      <Select value={currentValue} onValueChange={handleChange} disabled={disabled} id={dropdownId}>
        <SelectTrigger
          id="dropdown-field"
          className={`
            bg-[#0f0f0f] border-2 text-white transition-all duration-200
            focus:ring-2 focus:ring-blue-500 focus:border-blue-500
            ${
              error
                ? 'border-red-500 bg-red-50/10 focus:border-red-500 focus:ring-red-500'
                : 'border-gray-800 hover:border-gray-700'
            }
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          `}
        >
          <SelectValue placeholder={placeholder} value={currentLabel} />
        </SelectTrigger>
        <SelectContent className="bg-[#1a1a1a] border-gray-800 z-50">
          {normalizedOptions.map((option) => (
            <SelectItem key={option.value} value={String(option.value)}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error && (
        <p className="text-red-400 text-xs mt-2 font-medium animate-pulse">
          {error}
        </p>
      )}
    </div>
  );
}
