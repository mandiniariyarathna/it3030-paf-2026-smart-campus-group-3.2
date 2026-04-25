import { useEffect, useMemo, useRef, useState } from 'react';

const MAX_FILES = 3;
const ACCEPTED_TYPES = ['image/jpeg', 'image/png'];

function ImageUploadPreview({ files, onChange }) {
  const inputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);

  const previews = useMemo(
    () => files.map((file) => ({
      file,
      url: URL.createObjectURL(file),
    })),
    [files]
  );

  useEffect(() => {
    return () => {
      previews.forEach((preview) => {
        URL.revokeObjectURL(preview.url);
      });
    };
  }, [previews]);

  const handleFiles = (incomingFiles) => {
    const validated = incomingFiles.filter((file) => ACCEPTED_TYPES.includes(file.type));
    const nextFiles = [...files, ...validated].slice(0, MAX_FILES);
    onChange(nextFiles);
  };

  const openFilePicker = () => {
    inputRef.current?.click();
  };

  const removeFile = (indexToRemove) => {
    onChange(files.filter((_, index) => index !== indexToRemove));
  };

  return (
    <section className="upload-preview-section">
      <header>
        <h3>Attach images</h3>
        <p>JPEG or PNG up to 5MB each. Maximum 3 files.</p>
      </header>

      <button
        type="button"
        className={`upload-dropzone ${dragOver ? 'upload-dropzone-active' : ''}`}
        onClick={openFilePicker}
        onDragOver={(event) => {
          event.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragOver(false);
          handleFiles(Array.from(event.dataTransfer.files));
        }}
      >
        <strong>Drag and drop images here</strong>
        <span>or click to browse files</span>
      </button>

      <input
        ref={inputRef}
        type="file"
        multiple
        accept="image/png,image/jpeg"
        className="hidden-file-input"
        onChange={(event) => {
          handleFiles(Array.from(event.target.files || []));
          event.target.value = '';
        }}
      />

      {files.length > 0 ? (
        <div className="upload-preview-grid">
          {previews.map((preview, index) => (
            <article key={`${preview.file.name}-${index}`} className="upload-preview-card">
              <img src={preview.url} alt={preview.file.name} />
              <div>
                <p>{preview.file.name}</p>
                <small>{Math.ceil(preview.file.size / 1024)} KB</small>
              </div>
              <button type="button" onClick={() => removeFile(index)}>
                Remove
              </button>
            </article>
          ))}
        </div>
      ) : null}
    </section>
  );
}

export default ImageUploadPreview;
