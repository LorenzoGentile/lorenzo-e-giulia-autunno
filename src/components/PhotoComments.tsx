
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { MessageCircle, Send } from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

interface PhotoCommentsProps {
  photoId: string;
  className?: string;
}

interface Comment {
  id: string;
  comment_text: string;
  created_at: string;
  guest_id: string;
  invited_guests?: {
    name: string;
  };
}

const PhotoComments: React.FC<PhotoCommentsProps> = ({ photoId, className = '' }) => {
  const { user, isInvitedGuest } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [showComments, setShowComments] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (showComments) {
      fetchComments();
    }
  }, [photoId, showComments]);

  const fetchComments = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('photo_comments')
        .select(`
          *,
          invited_guests (
            name
          )
        `)
        .eq('photo_id', photoId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setComments(data || []);
    } catch (error) {
      console.error('Error fetching comments:', error);
      toast.error('Failed to load comments');
    } finally {
      setLoading(false);
    }
  };

  const submitComment = async () => {
    if (!newComment.trim()) return;
    if (!user || !isInvitedGuest) {
      toast.error('Please log in to comment');
      return;
    }

    setSubmitting(true);

    try {
      const { data: guestData, error: guestError } = await supabase
        .from('invited_guests')
        .select('id')
        .eq('email', user.email)
        .single();

      if (guestError) throw guestError;

      const { error } = await supabase
        .from('photo_comments')
        .insert({
          photo_id: photoId,
          guest_id: guestData.id,
          comment_text: newComment.trim()
        });

      if (error) throw error;

      setNewComment('');
      fetchComments();
      toast.success('Comment added!');
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error('Failed to add comment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submitComment();
    }
  };

  return (
    <div className={className}>
      <button
        onClick={() => setShowComments(!showComments)}
        className="flex items-center space-x-1 px-3 py-1 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
      >
        <MessageCircle className="w-4 h-4" />
        <span className="text-sm font-medium">{comments.length}</span>
      </button>

      {showComments && (
        <div className="mt-4 space-y-3">
          {loading ? (
            <div className="animate-pulse space-y-2">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {comments.map((comment) => (
                <div key={comment.id} className="bg-gray-50 rounded-lg p-3">
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-medium text-sm text-autumn-burgundy">
                      {comment.invited_guests?.name || 'Guest'}
                    </span>
                    <span className="text-xs text-gray-500">
                      {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700">{comment.comment_text}</p>
                </div>
              ))}
            </div>
          )}

          {user && isInvitedGuest && (
            <div className="flex space-x-2">
              <Textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Add a comment..."
                className="flex-1 min-h-[60px] resize-none"
                disabled={submitting}
              />
              <Button
                onClick={submitComment}
                disabled={!newComment.trim() || submitting}
                size="sm"
                className="autumn-button self-end"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          )}

          {!user && (
            <p className="text-sm text-gray-500 text-center py-2">
              Please log in to add comments
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default PhotoComments;
