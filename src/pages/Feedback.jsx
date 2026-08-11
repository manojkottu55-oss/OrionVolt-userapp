import React, { useState } from 'react';
import { MessageSquare, Star, CheckCircle } from 'lucide-react';
import api from '../api';
import { useAuth } from '../context/AuthContext';

const Feedback = () => {
  const { user } = useAuth();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [feedbackText, setFeedbackText] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) {
      alert("Please select a star rating before submitting.");
      return;
    }
    
    setIsSubmitting(true);
    try {
      await api.post('/feedback', {
        rating,
        text: feedbackText,
        user: user?.email || user?.user_metadata?.full_name || 'Anonymous'
      });
      setSubmitted(true);
    } catch (err) {
      console.error('Failed to submit feedback:', err);
      alert('Failed to submit feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="page-content flex flex-col items-center justify-center text-center" style={{ minHeight: '60vh' }}>
        <CheckCircle size={64} color="var(--success)" style={{ marginBottom: '1rem' }} />
        <h1>Thank You!</h1>
        <p className="subtitle">Your feedback has been received.</p>
        <button 
          className="btn btn-primary mt-6" 
          onClick={() => {
            setSubmitted(false);
            setRating(0);
            setFeedbackText('');
          }}
        >
          Submit Another
        </button>
      </div>
    );
  }

  return (
    <div className="page-content">
      <div className="flex items-center justify-center gap-2 mb-2">
        <MessageSquare size={24} color="var(--primary)" />
        <h1 style={{marginBottom: 0}}>App Feedback</h1>
      </div>
      <p className="subtitle text-center mb-6">We'd love to hear about your experience</p>

      <div className="card max-w-md mx-auto">
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          
          <div className="flex flex-col items-center gap-2">
            <label style={{fontWeight: 600}}>How would you rate OrionVolt?</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  size={32}
                  className="cursor-pointer transition-colors"
                  style={{ transition: 'transform 0.2s ease, color 0.2s ease', transform: hoverRating === star ? 'scale(1.15)' : 'scale(1)' }}
                  fill={(hoverRating || rating) >= star ? "var(--warning)" : "transparent"}
                  color={(hoverRating || rating) >= star ? "var(--warning)" : "var(--border)"}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setRating(rating === star ? 0 : star)}
                />
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="feedback" style={{fontWeight: 600}}>Tell us more (Optional)</label>
            <textarea
              id="feedback"
              className="input"
              style={{
                minHeight: '140px',
                resize: 'vertical',
                padding: '1rem',
                borderRadius: '12px',
                border: '1px solid var(--border)',
                background: 'var(--input-bg)',
                boxShadow: 'inset 0 2px 4px var(--shadow-color)',
                fontSize: '1rem',
                color: 'var(--text-main)',
                transition: 'border-color 0.3s ease, box-shadow 0.3s ease, background 0.3s ease',
                outline: 'none'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = 'var(--primary)';
                e.target.style.boxShadow = '0 0 0 3px var(--primary-alpha)';
                e.target.style.background = 'var(--hover-bg)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'var(--border)';
                e.target.style.boxShadow = 'inset 0 2px 4px var(--shadow-color)';
                e.target.style.background = 'var(--input-bg)';
              }}
              placeholder="What did you like? What can we improve?"
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-primary w-full"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Sending...' : 'Send Feedback'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Feedback;
