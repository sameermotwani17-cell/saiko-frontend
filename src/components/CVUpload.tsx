"use client";

import { useState, useRef, DragEvent } from "react";
import { useSession } from "@/context/SessionContext";
import { uploadCV } from "@/lib/api";

interface CVUploadProps {
  onComplete: () => void;
}

export default function CVUpload({ onComplete }: CVUploadProps) {
  const { cv_data, setCvData, setSessionId } = useSession();
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (file.type !== "application/pdf") {
      setError("Please upload a PDF file.");
      return;
    }

    setError(null);
    setIsUploading(true);
    setFileName(file.name);

    try {
      const result = await uploadCV(file);
      setSessionId(result.session_id);
      setCvData({
        name: result.name,
        background: result.background,
        target_role: result.target_role,
      });
      onComplete();
    } catch {
      setError("Failed to process CV. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  if (cv_data) {
    return (
      <div className="border border-border rounded-lg p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center">
            <span className="text-accent text-sm">✓</span>
          </div>
          <h3 className="text-lg font-semibold">CV Processed</h3>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs uppercase tracking-wider text-primary-text/40 block mb-1">
              Name
            </label>
            <p className="text-primary-text">{cv_data.name}</p>
          </div>
          <div>
            <label className="text-xs uppercase tracking-wider text-primary-text/40 block mb-1">
              Background
            </label>
            <p className="text-primary-text/80">{cv_data.background}</p>
          </div>
          <div>
            <label className="text-xs uppercase tracking-wider text-primary-text/40 block mb-1">
              Target Role
            </label>
            <p className="text-primary-text/80">{cv_data.target_role}</p>
          </div>
        </div>

        <button
          onClick={() => {
            setFileName(null);
          }}
          className="mt-6 text-sm text-primary-text/40 hover:text-primary-text/60 transition-colors"
        >
          Upload a different CV
        </button>
      </div>
    );
  }

  return (
    <div>
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
        className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors duration-200 ${
          isDragging
            ? "border-accent bg-accent/5"
            : "border-border hover:border-primary-text/20"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          onChange={handleInputChange}
          className="hidden"
        />

        {isUploading ? (
          <div>
            <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-primary-text/60">Processing {fileName}...</p>
          </div>
        ) : (
          <div>
            <div className="w-12 h-12 rounded-full bg-border flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-6 h-6 text-primary-text/40"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M12 16V4m0 0l-4 4m4-4l4 4M4 20h16"
                />
              </svg>
            </div>
            <p className="text-primary-text/60 mb-2">
              Drag and drop your CV here
            </p>
            <p className="text-primary-text/30 text-sm">PDF only</p>
          </div>
        )}
      </div>

      {error && (
        <p className="mt-4 text-accent text-sm text-center">{error}</p>
      )}
    </div>
  );
}