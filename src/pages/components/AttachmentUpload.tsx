
import React, { useRef } from 'react';
import { Paperclip, X, FileText, Image as ImageIcon } from 'lucide-react';
import { Button } from "../ui/button";

interface Attachment {
  id: string;
  name: string;
  size: string;
  type: 'pdf' | 'image' | 'document';
  file?: File;
}

interface AttachmentUploadProps {
  attachments: Attachment[];
  onAttachmentAdd: (files: FileList) => void;
  onAttachmentRemove: (id: string) => void;
}

const AttachmentUpload: React.FC<AttachmentUploadProps> = ({
  attachments,
  onAttachmentAdd,
  onAttachmentRemove
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      onAttachmentAdd(files);
    }
    // Reset input value to allow selecting the same file again
    if (event.target) {
      event.target.value = '';
    }
  };

  const getFileIcon = (type: string) => {
    if (type === 'pdf' || type === 'document') {
      return <FileText className="w-4 h-4 text-red-500" />;
    }
    return <ImageIcon className="w-4 h-4 text-blue-500" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center space-x-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleFileSelect}
        >
          <Paperclip className="w-4 h-4" />
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif"
          onChange={handleFileChange}
        />
      </div>

      {attachments.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Attachments ({attachments.length})
          </h4>
          {attachments.map((attachment) => (
            <div
              key={attachment.id}
              className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded-md"
            >
              <div className="flex items-center space-x-2">
                {getFileIcon(attachment.type)}
                <div>
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                    {attachment.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {attachment.size}
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onAttachmentRemove(attachment.id)}
                className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AttachmentUpload;
