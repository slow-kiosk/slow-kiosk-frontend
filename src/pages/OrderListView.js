// 주문 내역
import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MenuVisualization from '../components/MenuVisualization';
import { useOrder } from '../hooks/useOrder';
import { allMenus, findMenuByName } from '../utils/menuUtils';
import '../styles/OrderListView.css';

const OrderListView = () => {
  const navigate = useNavigate();
  const {
    orderItems,
    addItem,
    addChatMessage,
    setListening,
    removeItem
  } = useOrder();

  const [isProcessing, setIsProcessing] = useState(false);
  const hasInitialized = useRef(false);

  const handleVoiceInput = useCallback(
    async (text) => {
      if (isProcessing || !text.trim()) return;
      setIsProcessing(true);

      try {
        const menu = findMenuByName(text);

        if (menu) {
          // 메뉴 추가
          addItem({ ...menu, quantity: 1 });

        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsProcessing(false);
      }
    },
    [isProcessing, addItem, addChatMessage]
  );

  // 음성 인식 시작/종료
  useEffect(() => {
    if (!hasInitialized.current) {
      setListening(true);
      hasInitialized.current = true;
    }

    return () => setListening(false);
  }, [setListening]);

  const handleSuggestionClick = (suggestion) => {
    handleVoiceInput(suggestion);
  };

  const handleRemoveItem = (index) => {
    removeItem(index);
    addChatMessage({
      role: 'assistant',
      content: '주문에서 제거했습니다.',
      suggestions: []
    });
  };

  const handleCompleteOrder = () => {
    navigate('/discount');
  };

  return (
    <div className="order-list-view">
      <div className="ordering-right">
        <MenuVisualization orderItems={orderItems} />

        <div className="action-buttons">
          <button
            className="action-button remove-button"
            onClick={() => {
              if (orderItems.length > 0)
                handleRemoveItem(orderItems.length - 1);
            }}
            disabled={orderItems.length === 0}
          >
            마지막 항목 제거
          </button>

          <button
            className="action-button complete-button"
            onClick={handleCompleteOrder}
            disabled={orderItems.length === 0}
          >
            주문 확인
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderListView;