import { useRef, useState } from "react";
import { Upload } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";

export function UploadZone({
  onFiles,
  accept = ".pdf,.docx,.txt",
  multiple = true,
  label = "Drop resumes here",
  hint = "PDF or DOCX · multiple files supported",
}: {
  onFiles: (files: File[]) => void;
  accept?: string;
  multiple?: boolean;
  label?: string;
  hint?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handle = (list: FileList | null) => {
    if (!list || list.length === 0) return;
    onFiles(Array.from(list));
  };

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        handle(e.dataTransfer.files);
      }}
      className={cn(
        "rounded-[10px] border border-dashed bg-slate-50/80 px-4 py-6 text-center transition",
        dragging ? "border-brand-500 bg-brand-50" : "border-border"
      )}
    >
      <Upload className="mx-auto text-slate-400" size={20} />
      <p className="mt-2 text-sm font-medium text-slate-800">{label}</p>
      <p className="mt-0.5 text-xs text-slate-500">{hint}</p>
      <Button
        type="button"
        variant="secondary"
        size="sm"
        className="mt-3"
        onClick={() => inputRef.current?.click()}
      >
        Browse Files
      </Button>
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept={accept}
        multiple={multiple}
        onChange={(e) => handle(e.target.files)}
      />
    </div>
  );
}
