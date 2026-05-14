import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { resumeKeys } from "@/lib/queries/resumes";
import type { Resume } from "@/lib/types/resume";

type UploadInput = { file: File; label?: string };

type UploadResult =
  | { kind: "ok"; resume: Resume }
  | { kind: "error"; message: string };

const ACCEPTED: Record<string, string> = {
  "application/pdf": "pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
};

export function useResumeUpload() {
  const qc = useQueryClient();
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [resume, setResume] = useState<Resume | null>(null);

  const upload = async ({ file, label }: UploadInput): Promise<UploadResult> => {
    setError(null);
    setResume(null);
    setProgress(0);

    const ext = ACCEPTED[file.type];
    if (!ext) {
      const message = "Only PDF and DOCX files are supported.";
      setError(message);
      return { kind: "error", message };
    }

    setIsUploading(true);
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) {
        const message = "You must be signed in to upload a resume.";
        setError(message);
        return { kind: "error", message };
      }

      const resumeId = crypto.randomUUID();
      const storagePath = `${userData.user.id}/${resumeId}.${ext}`;

      setProgress(15);
      const { error: uploadError } = await supabase.storage
        .from("resume-uploads")
        .upload(storagePath, file, { contentType: file.type, upsert: false });
      if (uploadError) {
        const message = uploadError.message || "Upload failed. Try again.";
        setError(message);
        return { kind: "error", message };
      }

      setProgress(60);
      const { data: parseData, error: parseError } = await supabase.functions.invoke<{
        resume: Resume;
      }>("parse-upload", {
        body: { resume_id: resumeId, storage_path: storagePath, mime: file.type, label },
      });

      if (parseError || !parseData?.resume) {
        const message =
          parseError?.message || "We couldn't process that file. Try a different one.";
        setError(message);
        // Best-effort cleanup of the uploaded blob so a later retry can reuse the resume_id.
        await supabase.storage.from("resume-uploads").remove([storagePath]);
        return { kind: "error", message };
      }

      setProgress(100);
      setResume(parseData.resume);
      qc.invalidateQueries({ queryKey: resumeKeys.lists() });
      return { kind: "ok", resume: parseData.resume };
    } finally {
      setIsUploading(false);
    }
  };

  const reset = () => {
    setIsUploading(false);
    setProgress(0);
    setError(null);
    setResume(null);
  };

  return { upload, isUploading, progress, error, resume, reset };
}
