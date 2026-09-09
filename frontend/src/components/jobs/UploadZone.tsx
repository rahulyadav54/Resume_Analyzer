import { useRef, useState } from "react";
import { FolderOpen, Upload } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";

const RESUME_PATTERN = /\.(pdf|docx|txt)$/i;

export function filterResumeFiles(files: File[]) {
  return files.filter((file) => RESUME_PATTERN.test(file.name));
}

export function UploadZone({
  onFiles,
  accept = ".pdf,.docx,.txt",
  multiple = true,
  allowFolder = true,
  label = "Drop resumes here",
  hint = "PDF or DOCX · up to 1,000 resumes per job",
  disabled = false,
}: {
  onFiles: (files: File[]) => void;
  accept?: string;
  multiple?: boolean;
  allowFolder?: boolean;
  label?: string;
  hint?: string;
  disabled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handle = (list: FileList | null) => {
    if (!list || list.length === 0 || disabled) return;
    const resumes = filterResumeFiles(Array.from(list));
    if (resumes.length === 0) return;
    onFiles(resumes);
  };

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        if (!disabled) setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        if (disabled) return;
        handle(e.dataTransfer.files);
      }}
      className={cn(
        "rounded-[10px] border border-dashed bg-slate-50/80 px-4 py-6 text-center transition",
        dragging ? "border-brand-500 bg-brand-50" : "border-border",
        disabled && "pointer-events-none opacity-60"
      )}
    >
      <Upload className="mx-auto text-slate-400" size={20} />
      <p className="mt-2 text-sm font-medium text-slate-800">{label}</p>
      <p className="mt-0.5 text-xs text-slate-500">{hint}</p>
      <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={disabled}
          onClick={() => inputRef.current?.click()}
        >
          Browse Files
        </Button>
        {allowFolder && multiple && (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={disabled}
            onClick={() => folderInputRef.current?.click()}
          >
            <FolderOpen size={14} /> Upload Folder
          </Button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept={accept}
        multiple={multiple}
        disabled={disabled}
        onChange={(e) => handle(e.target.files)}
      />
      {allowFolder && (
        <input
          ref={folderInputRef}
          type="file"
          className="hidden"
          accept={accept}
          multiple
          disabled={disabled}
          // @ts-expect-error webkitdirectory is supported in Chromium browsers
          webkitdirectory=""
          onChange={(e) => handle(e.target.files)}
        />
      )}
    </div>
  );
}
