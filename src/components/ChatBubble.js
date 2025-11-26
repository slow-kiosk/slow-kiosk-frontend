import React from 'react';
import '../styles/ChatBubble.css';

const ChatBubble = ({
  message = '',
  isUser = false,
  suggestions = [],
  onSuggestionClick,
  isTyping = false
}) => {
  const showSuggestions = !isUser && !isTyping && suggestions.length > 0;

  return (
    <div className={`chat-bubble ${isUser ? 'user' : 'assistant'}`}>
      <div className={`chat-message ${isTyping ? 'typing' : ''}`}>
        {isTyping ? (
          <div className="typing-dots" aria-label="챗봇이 입력 중입니다">
            <span className="typing-dot" />
            <span className="typing-dot" />
            <span className="typing-dot" />
          </div>
        ) : (
          <p>{message}</p>
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


