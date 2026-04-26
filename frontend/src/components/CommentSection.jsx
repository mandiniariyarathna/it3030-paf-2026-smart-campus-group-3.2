import { useState } from 'react';

import { addComment, deleteComment, editComment, getCurrentActor } from '../services/ticketService';

function CommentSection({ ticketId, comments, onCommentsUpdated }) {
  const actor = getCurrentActor();
  const isAdmin = actor.role === 'ADMIN';
  const [commentInput, setCommentInput] = useState('');
  const [editingCommentId, setEditingCommentId] = useState('');
  const [editingContent, setEditingContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleAddComment = async (event) => {
    event.preventDefault();

    if (!commentInput.trim()) {
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const updatedTicket = await addComment(ticketId, { content: commentInput.trim() });
      onCommentsUpdated(updatedTicket.comments || []);
      setCommentInput('');
    } catch (addError) {
      setError(addError.message || 'Failed to add comment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const beginEdit = (comment) => {
    setEditingCommentId(comment.commentId);
    setEditingContent(comment.content);
  };

  const cancelEdit = () => {
    setEditingCommentId('');
    setEditingContent('');
  };

  const handleEditComment = async (event) => {
    event.preventDefault();

    if (!editingContent.trim()) {
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const updatedTicket = await editComment(ticketId, editingCommentId, {
        content: editingContent.trim(),
      });
      onCommentsUpdated(updatedTicket.comments || []);
      cancelEdit();
    } catch (editError) {
      setError(editError.message || 'Failed to update comment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    const confirmed = window.confirm('Delete this comment?');
    if (!confirmed) {
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const updatedTicket = await deleteComment(ticketId, commentId);
      onCommentsUpdated(updatedTicket.comments || []);
    } catch (deleteError) {
      setError(deleteError.message || 'Failed to delete comment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="ticket-panel">
      <header className="ticket-panel-head">
        <h3>Discussion</h3>
      </header>

      {error ? <p className="field-error">{error}</p> : null}

      <form className="comment-form" onSubmit={handleAddComment}>
        <textarea
          value={commentInput}
          onChange={(event) => setCommentInput(event.target.value)}
          placeholder="Write an update or note for this ticket..."
          maxLength={1000}
        />
        <button type="submit" className="primary-btn" disabled={isSubmitting}>
          Add Comment
        </button>
      </form>

      <div className="comment-list">
        {comments.length === 0 ? <p className="comment-empty">No comments yet.</p> : null}
        {comments.map((comment) => {
          const canModify = !isAdmin && actor.userId === comment.authorId;
          const isEditing = editingCommentId === comment.commentId;

          return (
            <article key={comment.commentId} className="comment-card">
              <div className="comment-head">
                <strong>{comment.authorId}</strong>
                <small>{new Date(comment.updatedAt || comment.createdAt).toLocaleString()}</small>
              </div>

              {isEditing ? (
                <form className="comment-edit-form" onSubmit={handleEditComment}>
                  <textarea
                    value={editingContent}
                    onChange={(event) => setEditingContent(event.target.value)}
                    maxLength={1000}
                  />
                  <div className="inline-actions">
                    <button type="submit" className="primary-btn" disabled={isSubmitting}>
                      Save
                    </button>
                    <button type="button" className="ghost-btn" onClick={cancelEdit}>
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <p>{comment.content}</p>
              )}

              {canModify && !isEditing ? (
                <div className="inline-actions">
                  <button type="button" className="ghost-btn" onClick={() => beginEdit(comment)}>
                    Edit
                  </button>
                  <button type="button" className="ghost-btn" onClick={() => handleDeleteComment(comment.commentId)}>
                    Delete
                  </button>
                </div>
              ) : null}
            </article>
          );
        })}
      </div>
    </section>
  );
}

export default CommentSection;
