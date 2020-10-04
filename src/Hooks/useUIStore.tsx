import React, {
  createContext,
  FC,
  useContext,
  useReducer,
  Dispatch,
  useState,
} from 'react';
import { ConfirmationDialog } from '../Components/Dialogs/Confirmation/Confirmation';

type UIState = {
  drawOpened: boolean;
  isAppLoading: boolean;
};

type Action =
  | { type: 'TOGGLE_DRAWER' }
  | { type: 'IS_APP_LOADING'; payload: UIState['isAppLoading'] };

type ConfirmationState = {
  title: string;
  text: string;
  onConfirm(): void;
};

const initialState: UIState = {
  drawOpened: false,
  isAppLoading: true,
};

const UIContext = createContext<{
  state: UIState;
  dispatch?: Dispatch<Action>;
  showConfirmation?(options: ConfirmationState | null): void;
}>({
  state: initialState,
});

function reducer(state: UIState, action: Action): UIState {
  switch (action.type) {
    case 'TOGGLE_DRAWER':
      return { ...state, drawOpened: !state.drawOpened };
    case 'IS_APP_LOADING':
      return { ...state, isAppLoading: action.payload };
  }
}

export const UIStoreProvider: FC = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [
    confirmationState,
    setConfirmationState,
  ] = useState<ConfirmationState | null>();

  function showConfirmation(options: ConfirmationState | null) {
    setConfirmationState(options);
  }

  return (
    <UIContext.Provider value={{ state, dispatch, showConfirmation }}>
      {confirmationState && (
        <ConfirmationDialog
          open={true}
          title={confirmationState.title}
          text={confirmationState.text}
          onConfirm={() => {
            confirmationState.onConfirm();
            setConfirmationState(null);
          }}
          handleClose={() => setConfirmationState(null)}
        />
      )}
      {children}
    </UIContext.Provider>
  );
};

export const useUIStore = () => {
  const { state, dispatch, showConfirmation } = useContext(UIContext);
  if (!dispatch) {
    throw new Error('useUIStore must be called from a UIStoreProvider!');
  }
  return { state, dispatch: dispatch!, showConfirmation: showConfirmation! };
};
