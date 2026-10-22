import React, { useRef, useState } from 'react';
import { Search, Camera, X, Sparkles, Image as ImageIcon } from 'lucide-react';
import { useApp } from '../../context/AppContext.js';

interface SearchInputWithImageProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  autoFocus?: boolean;
  onClose?: () => void;
}

export const SearchInputWithImage: React.FC<SearchInputWithImageProps> = ({
  value,
  onChange,
  placeholder,
  className = '',
  size = 'md',
  autoFocus = false,
  onClose,
}) => {
  const { lang, startVisualSearch, showToast } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      startVisualSearch(file);
      // Reset input value so same file can be re-selected if needed
      e.target.value = '';
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      startVisualSearch(file);
      showToast(lang === 'bn' ? '📷 ছবিটি বিশ্লেষণ করা হচ্ছে...' : '📷 Analyzing image...');
    } else {
      showToast(lang === 'bn' ? 'দয়া করে একটি প্রোডাক্ট ছবি ড্রপ করুন।' : 'Please drop an image file.', 'error');
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const pyClass = size === 'sm' ? 'py-1.5' : size === 'lg' ? 'py-3' : 'py-2 sm:py-2.5';
  const textClass = size === 'sm' ? 'text-xs font-medium' : size === 'lg' ? 'text-base font-bold' : 'text-sm sm:text-base font-bold';
  const iconSize = size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4 sm:w-5 sm:h-5';

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      className={`relative flex items-center w-full transition-all duration-200 ${
        isDragOver
          ? 'ring-2 ring-[#009245] ring-offset-2 rounded-full scale-[1.01]'
          : ''
      } ${className}`}
    >
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Left Search Icon */}
      <Search className={`absolute left-3.5 ${iconSize} text-slate-400 pointer-events-none shrink-0`} />

      {/* Main Text Input */}
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            onClose?.();
          }
        }}
        placeholder={
          isDragOver
            ? (lang === 'bn' ? '✨ ছবি এখানে ছেড়ে দিন...' : '✨ Drop image here...')
            : (placeholder || (lang === 'bn' ? 'পণ্য খুঁজুন...' : 'Search products...'))
        }
        autoFocus={autoFocus}
        className={`w-full pl-10 pr-24 ${pyClass} ${textClass} bg-[#f4f7f5] dark:bg-slate-800 hover:bg-slate-100/90 dark:hover:bg-slate-700/80 focus:bg-white dark:focus:bg-slate-800 border ${
          isDragOver
            ? 'border-[#009245] bg-emerald-50 dark:bg-emerald-950/40 text-[#009245]'
            : 'border-slate-200/90 dark:border-slate-700 focus:border-[#009245]'
        } rounded-full outline-none transition-all placeholder:text-slate-400 placeholder:opacity-75 placeholder:font-normal text-slate-900 dark:text-white focus:ring-2 focus:ring-[#009245]/20`}
      />

      {/* Right Action Icons: Clear Text (if any) + Camera / Visual Search Lens */}
      <div className="absolute right-2 flex items-center gap-1.5">
        {value && (
          <button
            type="button"
            onClick={() => onChange('')}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            title={lang === 'bn' ? 'মুছে ফেলুন' : 'Clear'}
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {/* Camera / Visual Search Trigger Button */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="px-2 py-1 rounded-full bg-emerald-50 dark:bg-slate-700 hover:bg-[#009245] text-[#009245] dark:text-emerald-300 hover:text-white border border-emerald-200 dark:border-slate-600 transition-all cursor-pointer shadow-2xs group flex items-center gap-1"
          title={lang === 'bn' ? 'ছবি দিয়ে পণ্য খুঁজুন (Visual Search)' : 'Search with image / photo'}
          aria-label="Image Search"
        >
          <Camera className="w-3.5 h-3.5 group-hover:scale-110 transition-transform shrink-0" />
          <span className="text-[10px] font-bold hidden sm:inline">
            {lang === 'bn' ? 'ক্যামেরা' : 'Camera'}
          </span>
        </button>
      </div>

      {/* Drag Over Overlay Prompt */}
      {isDragOver && (
        <div className="absolute inset-0 bg-[#009245]/90 text-white rounded-full flex items-center justify-center gap-2 text-xs font-bold pointer-events-none shadow-lg animate-pulse z-10">
          <Sparkles className="w-4 h-4 text-emerald-200" />
          <span>{lang === 'bn' ? 'ছবি এখানে ছেড়ে দিন (AI অনুসন্ধান)' : 'Drop image here for AI search'}</span>
        </div>
      )}
    </div>
  );
};
