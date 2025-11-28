import React, { useState, useEffect } from 'react';
import '../styles/ChatBubble.css';

const ChatBubble = ({
  message = '',
  isUser = false,
  suggestions = [],
  onSuggestionClick,
  isTyping = false,
  isTypingText = false, // iMessage 스타일 타이핑 애니메이션
  imageUrl,
  imageAlt
}) => {
  const [displayedText, setDisplayedText] = useState('');
  const [isAnimating, setIsAnimating] = useState(false);

  // iMessage 스타일 타이핑 애니메이션
  useEffect(() => {
    if (isTypingText && message && !isUser) {
      setIsAnimating(true);
      setDisplayedText('');
      
      let currentIndex = 0;
      const typingInterval = setInterval(() => {
        if (currentIndex < message.length) {
          setDisplayedText(message.substring(0, currentIndex + 1));
          currentIndex++;
        } else {
          clearInterval(typingInterval);
          setIsAnimating(false);
        }
      }, 30); // 한 글자당 30ms (iMessage와 유사한 속도)

      return () => clearInterval(typingInterval);
    } else if (!isTypingText && message) {
      setDisplayedText(message);
      setIsAnimating(false);
    }
  }, [message, isTypingText, isUser]);

  const showSuggestions = !isUser && !isTyping && !isAnimating && suggestions.length > 0;
  const displayMessage = isTypingText && isAnimating ? displayedText : message;
  const showImage = imageUrl && (!isTypingText || !isAnimating);

  return (
    <div className={`chat-bubble ${isUser ? 'user' : 'assistant'}`}>
      <div className={`chat-message ${isTyping ? 'typing' : ''} ${isAnimating ? 'typing-text' : ''}`}>
        {isTyping ? (
          <div className="typing-dots" aria-label="챗봇이 입력 중입니다">
            <span className="typing-dot" />
            <span className="typing-dot" />
            <span className="typing-dot" />
          </div>
        ) : (
          <>
            <p>
              {displayMessage}
              {isAnimating && <span className="typing-cursor">|</span>}
            </p>
            {showImage && (
              <div className="chat-message-media">
                <img src={imageUrl} alt={imageAlt || '관련 이미지'} />
              </div>
            )}
          </>
        )}
      </div>
      {showSuggestions && (
        <div className="chat-suggestions">
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              className="suggestion-button"
              onClick={() => onSuggestionClick && onSuggestionClick(suggestion)}
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ChatBubble;


