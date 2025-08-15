import React, { useState, useCallback, useMemo } from 'react';
import GlassCard from './common/GlassCard';
import FuturisticButton from './common/FuturisticButton';
import { FileIcon } from './common/icons/FileIcon';
import { ImageIcon } from './common/icons/ImageIcon';
import { useLanguage } from '../contexts/LanguageContext';

interface FileUploadViewProps {
  onFilesSubmit: (files: File[]) => void;
  isLoading: boolean;
  error: string | null;
}

const FileUploadView: React.FC<FileUploadViewProps> = ({ onFilesSubmit, isLoading, error }) => {
  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const { language, setLanguage, t } = useLanguage();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setFiles(prev => [...prev, ...Array.from(event.target.files!)]);
    }
  };

  const handleDragEvents = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragEnter = (e: React.DragEvent<HTMLLabelElement>) => {
    handleDragEvents(e);
    setIsDragging(true);
  };
  
  const handleDragLeave = (e: React.DragEvent<HTMLLabelElement>) => {
    handleDragEvents(e);
    setIsDragging(false);
  };
  
  const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    handleDragEvents(e);
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setFiles(prev => [...prev, ...Array.from(e.dataTransfer.files)]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };
  
  const fileCount = useMemo(() => {
    const docTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
    const imgTypes = ['image/png', 'image/jpeg'];
    return {
      docs: files.filter(f => docTypes.includes(f.type)).length,
      images: files.filter(f => imgTypes.includes(f.type)).length
    };
  }, [files]);

  const handleSubmit = () => {
    if (files.length > 0 && !isLoading) {
      onFilesSubmit(files);
    }
  };

  return (
    <GlassCard>
      <div className="text-center">
        <h1 className="text-4xl font-bold text-white mb-2">{t('upload_title')}</h1>
        <p className="text-lg text-slate-300 mb-6">{t('upload_subtitle')}</p>
      </div>

      <div className="flex flex-col items-center gap-2 mb-6">
        <p className="text-slate-300 text-sm font-medium">{t('upload_lang_select')}</p>
        <div className="flex items-center bg-slate-900/60 p-1 rounded-lg">
           <button onClick={() => setLanguage('bn')} className={`px-4 py-2 text-sm font-bold rounded-md transition-colors ${language === 'bn' ? 'bg-sky-500 text-white' : 'text-slate-300 hover:bg-slate-800'}`}>
              বাংলা
           </button>
           <button onClick={() => setLanguage('en')} className={`px-4 py-2 text-sm font-bold rounded-md transition-colors ${language === 'en' ? 'bg-sky-500 text-white' : 'text-slate-300 hover:bg-slate-800'}`}>
              English
           </button>
        </div>
      </div>
      
      {error && <div className="bg-red-500/20 border border-red-500 text-red-300 p-3 rounded-md mb-4">{error}</div>}

      <label
        htmlFor="file-upload"
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onDragOver={handleDragEvents}
        className={`flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer bg-slate-900/50 border-slate-700 hover:border-sky-500 hover:bg-slate-900/80 transition-all duration-300 ${isDragging ? 'border-sky-500 bg-slate-800' : ''}`}
      >
        <div className="flex flex-col items-center justify-center pt-5 pb-6">
          <svg className="w-10 h-10 mb-4 text-slate-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
            <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
          </svg>
          <p className="mb-2 text-sm text-slate-400"><span className="font-semibold text-sky-400">{t('upload_cta')}</span> {t('upload_drag')}</p>
          <p className="text-xs text-slate-500">{t('upload_formats')}</p>
        </div>
        <input id="file-upload" type="file" multiple className="hidden" onChange={handleFileChange} accept=".pdf,.docx,.txt,.png,.jpeg,.jpg" />
      </label>

      {files.length > 0 && (
        <div className="mt-6">
          <div className="flex justify-between items-center mb-2">
             <h3 className="text-lg font-semibold text-white">{t('upload_selected_files', {count: files.length})}</h3>
             <div className="flex gap-4 text-sm text-slate-300">
               <span>{t('upload_docs')} <span className="font-bold text-sky-400">{fileCount.docs}</span>/15</span>
               <span>{t('upload_images')} <span className="font-bold text-amber-400">{fileCount.images}</span>/15</span>
             </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-48 overflow-y-auto pr-2">
            {files.map((file, index) => (
              <div key={index} className="flex items-center bg-slate-800/80 p-2 rounded-md text-sm">
                {file.type.startsWith('image/') ? <ImageIcon className="w-5 h-5 mr-2 text-amber-400" /> : <FileIcon className="w-5 h-5 mr-2 text-sky-400" />}
                <span className="flex-1 truncate text-slate-300">{file.name}</span>
                <button onClick={() => removeFile(index)} className="ml-2 text-slate-500 hover:text-red-400">&times;</button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-8 text-center">
        <FuturisticButton onClick={handleSubmit} disabled={files.length === 0 || isLoading}>
          {isLoading ? t('processing_title') : t('upload_button')}
        </FuturisticButton>
      </div>
    </GlassCard>
  );
};

export default FileUploadView;