import React, { createContext, useContext, useReducer, useCallback } from 'react';

// 초기 상태
const initialState = {
  orderItems: [],
  totalPrice: 0,
  discount: 0,
  finalPrice: 0,
  couponCode: null,
  giftCardCode: null,
  stage: 'kiosk', // kiosk, ordering, discount, payment
  chatHistory: [],
  isListening: false,
  currentTranscript: '',
  serviceType: null,
  paymentMethod: null
};

// 액션 타입
const ActionTypes = {
  ADD_ITEM: 'ADD_ITEM',
  REMOVE_ITEM: 'REMOVE_ITEM',
  UPDATE_ITEM: 'UPDATE_ITEM',
  CLEAR_ORDER: 'CLEAR_ORDER',
  APPLY_DISCOUNT: 'APPLY_DISCOUNT',
  SET_COUPON: 'SET_COUPON',
  SET_GIFT_CARD: 'SET_GIFT_CARD',
  SET_STAGE: 'SET_STAGE',
  ADD_CHAT_MESSAGE: 'ADD_CHAT_MESSAGE',
  SET_LISTENING: 'SET_LISTENING',
  SET_TRANSCRIPT: 'SET_TRANSCRIPT',
  CALCULATE_TOTAL: 'CALCULATE_TOTAL',
  SET_SERVICE_TYPE: 'SET_SERVICE_TYPE',
  SET_PAYMENT_METHOD: 'SET_PAYMENT_METHOD'
};

// 리듀서
function orderReducer(state, action) {
  switch (action.type) {
    case ActionTypes.ADD_ITEM:
      const newItems = [...state.orderItems, action.payload];
      return {
        ...state,
        orderItems: newItems
      };
    
    case ActionTypes.REMOVE_ITEM:
      return {
        ...state,
        orderItems: state.orderItems.filter((_, index) => index !== action.payload)
      };
    
    case ActionTypes.UPDATE_ITEM:
      return {
        ...state,
        orderItems: state.orderItems.map((item, index) =>
          index === action.payload.index ? { ...item, ...action.payload.updates } : item
        )
      };
    
    case ActionTypes.CLEAR_ORDER:
      return initialState;
    
    case ActionTypes.APPLY_DISCOUNT:
      return {
        ...state,
        discount: action.payload,
        finalPrice: Math.max(0, state.totalPrice - action.payload)
      };
    
    case ActionTypes.SET_COUPON:
      return {
        ...state,
        couponCode: action.payload
      };
    
    case ActionTypes.SET_GIFT_CARD:
      return {
        ...state,
        giftCardCode: action.payload
      };
    
    case ActionTypes.SET_STAGE:
      return {
        ...state,
        stage: action.payload
      };
    
    case ActionTypes.ADD_CHAT_MESSAGE:
      return {
        ...state,
        chatHistory: [...state.chatHistory, action.payload]
      };
    
    case ActionTypes.SET_LISTENING:
      return {
        ...state,
        isListening: action.payload
      };
    
    case ActionTypes.SET_TRANSCRIPT:
      return {
        ...state,
        currentTranscript: action.payload
      };

    case ActionTypes.SET_SERVICE_TYPE:
      return {
        ...state,
        serviceType: action.payload
      };

    case ActionTypes.SET_PAYMENT_METHOD:
      return {
        ...state,
        paymentMethod: action.payload
      };
    
    case ActionTypes.CALCULATE_TOTAL:
      const total = state.orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      return {
        ...state,
        totalPrice: total,
        finalPrice: Math.max(0, total - state.discount)
      };
    
    default:
      return state;
  }
}

// Context 생성
const OrderContext = createContext();

// Provider 컴포넌트
export function OrderProvider({ children }) {
  const [state, dispatch] = useReducer(orderReducer, initialState);

  // 액션 생성자들
  const addItem = useCallback((item) => {
    dispatch({ type: ActionTypes.ADD_ITEM, payload: item });
    dispatch({ type: ActionTypes.CALCULATE_TOTAL });
  }, []);

  const removeItem = useCallback((index) => {
    dispatch({ type: ActionTypes.REMOVE_ITEM, payload: index });
    dispatch({ type: ActionTypes.CALCULATE_TOTAL });
  }, []);

  const updateItem = useCallback((index, updates) => {
    dispatch({ type: ActionTypes.UPDATE_ITEM, payload: { index, updates } });
    dispatch({ type: ActionTypes.CALCULATE_TOTAL });
  }, []);

  const clearOrder = useCallback(() => {
    dispatch({ type: ActionTypes.CLEAR_ORDER });
  }, []);

  const applyDiscount = useCallback((amount) => {
    dispatch({ type: ActionTypes.APPLY_DISCOUNT, payload: amount });
  }, []);

  const setCoupon = useCallback((code) => {
    dispatch({ type: ActionTypes.SET_COUPON, payload: code });
  }, []);

  const setGiftCard = useCallback((code) => {
    dispatch({ type: ActionTypes.SET_GIFT_CARD, payload: code });
  }, []);

  const setStage = useCallback((stage) => {
    dispatch({ type: ActionTypes.SET_STAGE, payload: stage });
  }, []);

  const addChatMessage = useCallback((message) => {
    dispatch({ type: ActionTypes.ADD_CHAT_MESSAGE, payload: message });
  }, []);

  const setListening = useCallback((isListening) => {
    dispatch({ type: ActionTypes.SET_LISTENING, payload: isListening });
  }, []);

  const setTranscript = useCallback((transcript) => {
    dispatch({ type: ActionTypes.SET_TRANSCRIPT, payload: transcript });
  }, []);

  const setServiceType = useCallback((type) => {
    dispatch({ type: ActionTypes.SET_SERVICE_TYPE, payload: type });
  }, []);

  const setPaymentMethod = useCallback((method) => {
    dispatch({ type: ActionTypes.SET_PAYMENT_METHOD, payload: method });
  }, []);

  const value = {
    ...state,
    addItem,
    removeItem,
    updateItem,
    clearOrder,
    applyDiscount,
    setCoupon,
    setGiftCard,
    setStage,
    addChatMessage,
    setListening,
    setTranscript,
    setServiceType,
    setPaymentMethod
  };

  return (
    <OrderContext.Provider value={value}>
      {children}
    </OrderContext.Provider>
  );
}

// Hook
export function useOrder() {
  const context = useContext(OrderContext);
  if (!context) {
    throw new Error('useOrder must be used within an OrderProvider');
  }
  return context;
}


