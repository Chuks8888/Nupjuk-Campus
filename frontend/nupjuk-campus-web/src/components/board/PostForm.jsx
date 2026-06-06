import { useRef, useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Download, File, Paperclip, Save, Trash2, Upload, X } from 'lucide-react';
import { createPost, updatePost, getPostDetail } from '../../api/board';
import { deleteAttachment, getPostAttachments, uploadPostAttachment } from '../../api/attachments';
import '../../styles/Board.css';

const ALLOWED_CATEGORIES = ['GENERAL', 'QUESTION', 'ASSIGNMENT', 'EXAM', 'PROJECT'];

function formatFileSize(bytes) {
  const size = Number(bytes);
  if (!size) return '';

  const units = ['B', 'KB', 'MB', 'GB'];
  const unitIndex = Math.min(Math.floor(Math.log(size) / Math.log(1024)), units.length - 1);
  const value = size / 1024 ** unitIndex;

  return `${value.toFixed(value >= 10 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

export default function PostForm() {
  const { courseId, postId } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(postId);
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({ title: '', category: 'GENERAL', body: '' });
  const [attachments, setAttachments] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [fileInputKey, setFileInputKey] = useState(0);
  const [isLoading, setIsLoading] = useState(isEditing);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isEditing) {
      const fetchExistingPost = async () => {
        try {
          const [data, postAttachments] = await Promise.all([
            getPostDetail(courseId, postId),
            getPostAttachments(postId),
          ]);
          setFormData({ title: data.title, category: data.category, body: data.body });
          setAttachments(postAttachments);
        } catch {
          setError('Failed to load the post for editing.');
        } finally {
          setIsLoading(false);
        }
      };
      fetchExistingPost();
    }
  }, [courseId, postId, isEditing]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const resetFilePicker = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setFileInputKey((prev) => prev + 1);
  };

  const handleOpenFilePicker = () => {
    resetFilePicker();
    window.setTimeout(() => fileInputRef.current?.click(), 0);
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      setSelectedFiles((prev) => [...prev, ...files]);
    }
    resetFilePicker();
  };

  const handleRemoveSelectedFile = (indexToRemove) => {
    setSelectedFiles((prev) => prev.filter((_, index) => index !== indexToRemove));
    resetFilePicker();
  };

  const handleDeleteAttachment = async (attachmentId) => {
    if (!window.confirm('Remove this attachment from the post?')) return;

    try {
      await deleteAttachment(attachmentId);
      setAttachments((prev) => prev.filter((attachment) => attachment.id !== attachmentId));
      resetFilePicker();
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to delete attachment.');
    }
  };

  const uploadSelectedFiles = async (savedPostId) => {
    if (selectedFiles.length === 0) return;

    await Promise.all(selectedFiles.map((file) => uploadPostAttachment(savedPostId, file)));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      if (isEditing) {
        await updatePost(postId, formData);
        await uploadSelectedFiles(postId);
        navigate(`/courses/${courseId}/posts/${postId}`);
      } else {
        const newPost = await createPost(courseId, formData);
        const createdId = newPost.post?.id || newPost.id;
        await uploadSelectedFiles(createdId);
        navigate(`/courses/${courseId}/posts/${createdId}`);
      }
    } catch (err) {
      setError(err.message || 'Failed to save the post. Please try again.');
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <div className="post-container">Loading post data...</div>;

  return (
    <div className="post-container">
      <button
        onClick={() =>
          isEditing
            ? navigate(`/courses/${courseId}/posts/${postId}`)
            : navigate(`/courses/${courseId}`, { state: { activeTab: 'board' } })
        }
        className="back-button board-back-btn"
      >
        <ArrowLeft size={20} /> Back
      </button>

      <div className="post-content-card">
        <h2 className="board-page-title">{isEditing ? 'Edit Post' : 'Create New Post'}</h2>

        {error && <div className="board-error-banner">{error}</div>}

        <form onSubmit={handleSubmit} className="board-form-layout">
          <div className="board-form-row">
            <div className="board-form-group title-group">
              <label htmlFor="title" className="board-form-label">
                Title
              </label>
              <input
                id="title"
                name="title"
                type="text"
                required
                value={formData.title}
                onChange={handleChange}
                placeholder="Keep it clear and concise"
                className="board-input"
              />
            </div>

            <div className="board-form-group category-group">
              <label htmlFor="category" className="board-form-label">
                Category
              </label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="board-input"
              >
                {ALLOWED_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="board-form-group">
            <label htmlFor="body" className="board-form-label">
              Details
            </label>
            <textarea
              id="body"
              name="body"
              required
              value={formData.body}
              onChange={handleChange}
              placeholder="Write the details of your post here..."
              className="board-input board-textarea-large"
            />
          </div>

          <div className="board-form-group">
            <label className="board-form-label">Attachments</label>
            <div className="attachment-upload-box">
              <button type="button" onClick={handleOpenFilePicker} className="btn-secondary">
                <Upload size={18} /> Add files
              </button>
              <span>Attach files students may need for this post.</span>
              <input
                key={fileInputKey}
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileChange}
                className="visually-hidden-file-input"
              />
            </div>

            {(attachments.length > 0 || selectedFiles.length > 0) && (
              <div className="attachment-list attachment-list-form">
                {attachments.map((attachment) => (
                  <div key={attachment.id} className="attachment-item">
                    <div className="attachment-file-meta">
                      <File size={18} />
                      <div>
                        <a
                          href={attachment.file_url}
                          target="_blank"
                          rel="noreferrer"
                          className="attachment-name"
                        >
                          {attachment.file_name || 'Attachment'}
                        </a>
                        <span className="attachment-detail">
                          {[attachment.file_extension, formatFileSize(attachment.file_size)]
                            .filter(Boolean)
                            .join(' | ')}
                        </span>
                      </div>
                    </div>
                    <div className="attachment-actions">
                      <a
                        href={attachment.file_url}
                        target="_blank"
                        rel="noreferrer"
                        className="icon-link-button"
                        aria-label={`Download ${attachment.file_name || 'attachment'}`}
                      >
                        <Download size={16} />
                      </a>
                      <button
                        type="button"
                        onClick={() => handleDeleteAttachment(attachment.id)}
                        className="icon-link-button danger"
                        aria-label={`Delete ${attachment.file_name || 'attachment'}`}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}

                {selectedFiles.map((file, index) => (
                  <div
                    key={`${file.name}-${file.lastModified}-${index}`}
                    className="attachment-item pending"
                  >
                    <div className="attachment-file-meta">
                      <Paperclip size={18} />
                      <div>
                        <span className="attachment-name">{file.name}</span>
                        <span className="attachment-detail">
                          {[formatFileSize(file.size), 'Ready to upload']
                            .filter(Boolean)
                            .join(' | ')}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveSelectedFile(index)}
                      className="icon-link-button"
                      aria-label={`Remove ${file.name}`}
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="board-form-actions">
            <button type="button" onClick={() => navigate(-1)} className="btn-secondary">
              <X size={18} /> Cancel
            </button>
            <button type="submit" disabled={isSubmitting} className="btn-primary">
              <Save size={18} /> {isSubmitting ? 'Saving...' : isEditing ? 'Save Changes' : 'Post'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
