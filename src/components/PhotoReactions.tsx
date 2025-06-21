
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Heart } from 'lucide-react';
import { toast } from 'sonner';

interface PhotoReactionsProps {
  photoId: string;
  className?: string;
}

interface Reaction {
  id: string;
  guest_id: string;
  reaction_type: string;
}

const PhotoReactions: React.FC<PhotoReactionsProps> = ({ photoId, className = '' }) => {
  const { user, isInvitedGuest } = useAuth();
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [hasUserReacted, setHasUserReacted] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchReactions();
  }, [photoId]);

  const fetchReactions = async () => {
    try {
      const { data, error } = await supabase
        .from('photo_reactions')
        .select('*')
        .eq('photo_id', photoId);

      if (error) throw error;

      setReactions(data || []);

      // Check if current user has reacted
      if (user && isInvitedGuest) {
        const { data: guestData } = await supabase
          .from('invited_guests')
          .select('id')
          .eq('email', user.email)
          .single();

        if (guestData) {
          const userReaction = data?.find(r => r.guest_id === guestData.id);
          setHasUserReacted(!!userReaction);
        }
      }
    } catch (error) {
      console.error('Error fetching reactions:', error);
    }
  };

  const toggleReaction = async () => {
    if (!user || !isInvitedGuest) {
      toast.error('Please log in to react to photos');
      return;
    }

    setLoading(true);

    try {
      const { data: guestData, error: guestError } = await supabase
        .from('invited_guests')
        .select('id')
        .eq('email', user.email)
        .single();

      if (guestError) throw guestError;

      if (hasUserReacted) {
        // Remove reaction
        const { error } = await supabase
          .from('photo_reactions')
          .delete()
          .eq('photo_id', photoId)
          .eq('guest_id', guestData.id);

        if (error) throw error;
        setHasUserReacted(false);
      } else {
        // Add reaction
        const { error } = await supabase
          .from('photo_reactions')
          .insert({
            photo_id: photoId,
            guest_id: guestData.id,
            reaction_type: 'heart'
          });

        if (error) throw error;
        setHasUserReacted(true);
      }

      fetchReactions();
    } catch (error) {
      console.error('Error toggling reaction:', error);
      toast.error('Failed to update reaction');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <button
        onClick={toggleReaction}
        disabled={loading}
        className={`flex items-center space-x-1 px-3 py-1 rounded-full transition-colors ${
          hasUserReacted
            ? 'bg-red-100 text-red-600'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <Heart
          className={`w-4 h-4 ${hasUserReacted ? 'fill-current' : ''}`}
        />
        <span className="text-sm font-medium">{reactions.length}</span>
      </button>
    </div>
  );
};

export default PhotoReactions;
