import { useRef, useState, type ChangeEvent } from "react";
import type { ResumeDesignSettings } from "../../domain/resume.types";
import { TEMPLATE_REGISTRY } from "../templates/registry";
import { readProfilePhoto } from "./photoFile";

export function PhotoControls({
  photo,
  design,
  onPhotoChange,
  onDesignChange,
}: {
  photo: string;
  design: ResumeDesignSettings;
  onPhotoChange: (photo: string) => void;
  onDesignChange: (patch: Partial<ResumeDesignSettings>) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState("");
  const selectedTemplate = TEMPLATE_REGISTRY[design.templateId];

  const uploadPhoto = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try {
      const value = await readProfilePhoto(file);
      onPhotoChange(value);
      onDesignChange({ showPhoto: true });
      setError("");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "The profile photo could not be read.");
    }
  };

  return (
    <fieldset className="photo-controls">
      <legend>Profile photo</legend>
      <p className="icon-persistence-note">
        Optional. Photos can reduce ATS compatibility and are shown only by supported templates.
      </p>
      <input
        ref={inputRef}
        className="sr-only"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={(event) => void uploadPhoto(event)}
      />
      <div className="photo-control-layout">
        <div className={`photo-editor-preview photo-shape-${design.photoShape}`}>
          {photo ? (
            <img
              alt="Profile preview"
              src={photo}
              style={{
                objectPosition: `${design.photoPositionX}% ${design.photoPositionY}%`,
                transform: `scale(${design.photoZoom})`,
              }}
            />
          ) : (
            <span aria-hidden="true">Photo</span>
          )}
        </div>
        <div className="photo-actions">
          <button className="secondary-button compact-button" type="button" onClick={() => inputRef.current?.click()}>
            {photo ? "Replace photo" : "Upload photo"}
          </button>
          {photo && (
            <button
              className="text-button danger"
              type="button"
              onClick={() => {
                onPhotoChange("");
                onDesignChange({ showPhoto: false });
              }}
            >
              Remove photo
            </button>
          )}
        </div>
      </div>
      {error && <div className="warning" role="alert">{error}</div>}
      {photo && (
        <>
          <label className="checkbox-field">
            <input
              type="checkbox"
              checked={design.showPhoto}
              onChange={(event) => onDesignChange({ showPhoto: event.target.checked })}
            />
            <span>Show photo in supported templates</span>
          </label>
          {!selectedTemplate.supportsPhoto && design.showPhoto && (
            <div className="warning">
              {selectedTemplate.name} keeps photos hidden for ATS safety.{" "}
              <button
                className="link-button"
                type="button"
                onClick={() => onDesignChange({ templateId: "professional" })}
              >
                Use Professional
              </button>
            </div>
          )}
          <div className="field-grid two-columns">
            <label>
              Shape
              <select
                value={design.photoShape}
                onChange={(event) => {
                  const photoShape = event.target.value;
                  if (photoShape === "square" || photoShape === "rounded" || photoShape === "circle") {
                    onDesignChange({ photoShape });
                  }
                }}
              >
                <option value="square">Square</option>
                <option value="rounded">Rounded square</option>
                <option value="circle">Circle</option>
              </select>
            </label>
            <label>
              Zoom <output>{design.photoZoom.toFixed(1)}×</output>
              <input type="range" min="1" max="2" step="0.1" value={design.photoZoom} onChange={(event) => onDesignChange({ photoZoom: Number(event.target.value) })} />
            </label>
            <label>
              Horizontal position <output>{design.photoPositionX}%</output>
              <input type="range" min="0" max="100" value={design.photoPositionX} onChange={(event) => onDesignChange({ photoPositionX: Number(event.target.value) })} />
            </label>
            <label>
              Vertical position <output>{design.photoPositionY}%</output>
              <input type="range" min="0" max="100" value={design.photoPositionY} onChange={(event) => onDesignChange({ photoPositionY: Number(event.target.value) })} />
            </label>
          </div>
        </>
      )}
    </fieldset>
  );
}
