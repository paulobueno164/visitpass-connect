import { useState, useCallback } from "react";
import { Upload, X, FileText, Image as ImageIcon, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface UploadedFile {
  file: File;
  preview?: string;
}

interface DocumentUploadProps {
  label: string;
  description?: string;
  accept?: string;
  multiple?: boolean;
  required?: boolean;
  files: UploadedFile[];
  onFilesChange: (files: UploadedFile[]) => void;
  className?: string;
}

export function DocumentUpload({
  label,
  description,
  accept = "image/*,.pdf",
  multiple = false,
  required = false,
  files,
  onFilesChange,
  className,
}: DocumentUploadProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleFiles = useCallback(
    (newFiles: FileList | null) => {
      if (!newFiles) return;
      const fileArray = Array.from(newFiles).map((file) => {
        const uploaded: UploadedFile = { file };
        if (file.type.startsWith("image/")) {
          uploaded.preview = URL.createObjectURL(file);
        }
        return uploaded;
      });
      onFilesChange(multiple ? [...files, ...fileArray] : fileArray);
    },
    [files, multiple, onFilesChange]
  );

  const removeFile = (index: number) => {
    const updated = files.filter((_, i) => i !== index);
    onFilesChange(updated);
  };

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center gap-1">
        <span className="text-sm font-medium text-foreground">{label}</span>
        {required && <span className="text-destructive">*</span>}
      </div>
      {description && <p className="text-xs text-muted-foreground">{description}</p>}

      {files.length === 0 ? (
        <label
          className={cn(
            "upload-zone flex flex-col items-center gap-2",
            isDragging && "border-primary bg-primary/5"
          )}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => { e.preventDefault(); setIsDragging(false); handleFiles(e.dataTransfer.files); }}
        >
          <Upload className="h-8 w-8 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            Arraste o arquivo ou <span className="text-primary font-medium">clique para selecionar</span>
          </span>
          <input
            type="file"
            accept={accept}
            multiple={multiple}
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
        </label>
      ) : (
        <div className="space-y-2">
          <AnimatePresence>
            {files.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="card-institutional flex items-center gap-3"
              >
                {f.preview ? (
                  <img src={f.preview} alt="" className="h-12 w-12 rounded-md object-cover" />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-md bg-muted">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{f.file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(f.file.size / 1024).toFixed(0)} KB
                  </p>
                </div>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", bounce: 0.5, delay: 0.2 }}
                >
                  <Check className="h-5 w-5 text-success" />
                </motion.div>
                <button
                  type="button"
                  onClick={() => removeFile(i)}
                  className="rounded-md p-1 hover:bg-muted transition-colors"
                >
                  <X className="h-4 w-4 text-muted-foreground" />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
          {multiple && (
            <label className="upload-zone flex items-center justify-center gap-2 py-3 cursor-pointer">
              <Upload className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Adicionar mais arquivos</span>
              <input
                type="file"
                accept={accept}
                multiple
                className="hidden"
                onChange={(e) => handleFiles(e.target.files)}
              />
            </label>
          )}
        </div>
      )}
    </div>
  );
}
