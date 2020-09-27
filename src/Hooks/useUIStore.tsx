import React, {
  createContext,
  FC,
  useContext,
  useReducer,
  Dispatch,
} from 'react';

type Action = { type: 'TOGGLE_DRAWER' };

type UIState = {
  drawOpened: boolean;
};

function reducer(state: UIState, action: Action): UIState {
  switch (action.type) {
    case 'TOGGLE_DRAWER':
      return { ...state, drawOpened: !state.drawOpened };
    default:
      throw new Error(`action not found: ${action.type}`);
  }
}

const initialState: UIState = {
  drawOpened: false,
};

const UIContext = createContext<{
  state: UIState;
  dispatch?: Dispatch<Action>;
}>({
  state: initialState,
});

export const UIStoreProvider: FC = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialState);
  return (
    <UIContext.Provider value={{ state, dispatch }}>
      {children}
    </UIContext.Provider>
  );
};

export const useUIStore = () => {
  const { state, dispatch } = useContext(UIContext);
  if (!dispatch) {
    throw new Error('useUIStore must be called from a UIStoreProvider!');
  }
  return { state, dispatch: dispatch! };
};
