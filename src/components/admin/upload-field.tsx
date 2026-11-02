"use client";

import { useEffect, useId, useRef, useState } from "react";
import Image from "next/image";
import { FileText, ImagePlus, Upload, X, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";

type SavedFile = { id: string; name: string };
function PhotoPreview({ file }: { file: File }) {
  const [url, setUrl] = useState<string>();
  useEffect(() => {
    const reader = new FileReader();
    reader.onload = () => setUrl(String(reader.result));
    reader.readAsDataURL(file);
    return () => {
      reader.onload = null;
      if (reader.readyState === FileReader.LOADING) reader.abort();
    };
  }, [file]);
  return url ? (
    <Image src={url} width={48} height={48} unoptimized alt="" />
  ) : (
    <ImagePlus size={22} aria-hidden="true" />
  );
}
const fileKey = (file: File) =>
  `${file.name}-${file.size}-${file.lastModified}`;

export function UploadField({
  kind,
  files,
  saved = [],
  onChange,
  disabled,
}: {
  kind: "photo" | "im";
  files: File[];
  saved?: SavedFile[];
  onChange: (files: File[]) => void;
  disabled?: boolean;
}) {
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState("");
  const photos = kind === "photo";
  const title = photos ? "Property photographs" : "Investment memorandum";
  const types = photos
    ? ["image/jpeg", "image/png", "image/webp"]
    : ["application/pdf"];
  const Icon = photos ? ImagePlus : FileText;
  function select(incoming: File[]) {
    setDragging(false);
    if (disabled || !incoming.length) return;
    if (!photos && incoming.length > 1) {
      setError("Choose one PDF memorandum at a time.");
      return;
    }
    const invalid = incoming.find(
      (file) =>
        !types.includes(file.type) ||
        !file.size ||
        file.size > 10 * 1024 * 1024,
    );
    if (invalid) {
      setError(
        `${invalid.name}: choose ${photos ? "a JPG, PNG or WebP image" : "a PDF"} smaller than 10 MB.`,
      );
      return;
    }
    setError("");
    onChange(
      photos
        ? [
            ...new Map(
              [...files, ...incoming].map((file) => [fileKey(file), file]),
            ).values(),
          ]
        : incoming,
    );
  }
  return (
    <section className="admin-upload-field" aria-labelledby={`${id}-title`}>
      <div className="admin-upload-heading">
        <h3 id={`${id}-title`}>{title}</h3>
        <span>
          {photos ? "JPG, PNG or WebP" : "PDF document"} · 10 MB
          {photos ? " each" : ""}
        </span>
      </div>
      <div
        className="admin-dropzone"
        data-dragging={dragging}
        data-disabled={!!disabled}
        onDragOver={(event) => {
          event.preventDefault();
          if (!disabled) setDragging(true);
        }}
        onDragLeave={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node | null))
            setDragging(false);
        }}
        onDrop={(event) => {
          event.preventDefault();
          select(Array.from(event.dataTransfer.files));
        }}
      >
        <span className="admin-upload-icon">
          <Icon size={24} aria-hidden="true" />
        </span>
        <div className="admin-upload-copy">
          <strong>
            {dragging
              ? "Drop files here"
              : photos
                ? "Add property photographs"
                : "Upload the investment memorandum"}
          </strong>
          <p>
            {photos
              ? "Drag images here, or browse your files."
              : "Drag a PDF here, or browse your files."}
          </p>
        </div>
        <input
          ref={input}
          id={id}
          type="file"
          hidden
          multiple={photos}
          accept={types.join(",")}
          aria-label={title}
          disabled={disabled}
          onChange={(event) => {
            select(Array.from(event.target.files || []));
            event.target.value = "";
          }}
        />
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          onClick={() => input.current?.click()}
          aria-label={photos ? "Browse photographs" : "Browse memorandum"}
        >
          <Upload size={16} />
          {photos ? "Browse images" : "Browse PDF"}
        </Button>
      </div>
      {error && (
        <p role="alert" className="field-error">
          {error}
        </p>
      )}
      {!!files.length && (
        <ul
          className="admin-upload-list"
          aria-label={`Selected ${title.toLowerCase()}`}
        >
          {files.map((file, index) => (
            <li key={fileKey(file)}>
              <span className="admin-file-preview">
                {photos ? (
                  <PhotoPreview file={file} />
                ) : (
                  <FileText size={22} aria-hidden="true" />
                )}
              </span>
              <div className="admin-file-copy">
                <strong>{file.name}</strong>
                <span>
                  {file.size < 1024 * 1024
                    ? `${Math.max(1, Math.round(file.size / 1024))} KB`
                    : `${(file.size / 1024 / 1024).toFixed(1)} MB`}{" "}
                  · Ready to upload
                  {photos && index === files.length - 1
                    ? " · Listing cover"
                    : ""}
                </span>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                disabled={disabled}
                aria-label={`Remove ${file.name}`}
                onClick={() => onChange(files.filter((_, i) => i !== index))}
              >
                <X size={16} />
              </Button>
            </li>
          ))}
        </ul>
      )}
      {!!saved.length && (
        <div className="admin-existing-files">
          <span className="admin-upload-caption">Currently attached</span>
          {saved.map((file) => (
            <a
              key={file.id}
              href={`/api/materials/${file.id}`}
              target="_blank"
              rel="noreferrer"
            >
              <Icon size={16} aria-hidden="true" />
              <span>{file.name}</span>
              <ArrowUpRight size={14} aria-hidden="true" />
            </a>
          ))}
        </div>
      )}
      <p className="admin-upload-caption">
        {photos
          ? "The last image added becomes the listing cover."
          : saved.length
            ? "Uploading a new PDF replaces the current memorandum."
            : "Available to investors according to the access setting below."}
      </p>
    </section>
  );
}
