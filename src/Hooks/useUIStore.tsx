import React, {
  createContext,
  FC,
  useContext,
  useReducer,
  Dispatch,
  useState,
} from 'react';
import { useHistory } from 'react-router-dom';
import { ConfirmationDialog } from '../Components/Dialogs/Confirmation/Confirmation';
import { Snackbar } from '../Components/Dialogs/Snackbar/Snackbar';

type UIState = {
  isAppLoading: boolean;
};

type Action = { type: 'IS_APP_LOADING'; payload: UIState['isAppLoading'] };

type ConfirmationState = {
  title: string;
  text: string;
  onConfirm(): void;
};

type SnackState = {
  title: string;
  actionText: string;
  onAction(): void;
};

const initialState: UIState = {
  isAppLoading: true,
};

const UIContext = createContext<{
  state: UIState;
  dispatch?: Dispatch<Action>;
  showConfirmation?(options: ConfirmationState | null): void;
  showSnack?(options: SnackState | null): void;
  toggleMainNav?(): void;
}>({
  state: initialState,
});

function reducer(state: UIState, action: Action): UIState {
  switch (action.type) {
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
  const [snackState, setSnackState] = useState<SnackState | null>();
  const history = useHistory();

  function showConfirmation(options: ConfirmationState | null) {
    setConfirmationState(options);
  }

  function showSnack(options: SnackState) {
    setSnackState(options);
  }

  function toggleMainNav() {
    const currentSearch = new URLSearchParams(history.location.search);
    if (currentSearch.has('menu')) {
      currentSearch.delete('menu');
    } else {
      currentSearch.set('menu', 'true');
    }
    const newSearch = currentSearch.toString();
    history.push({
      pathname: history.location.pathname,
      search: newSearch ? `?${currentSearch.toString()}` : newSearch,
    });
  }

  return (
    <UIContext.Provider
      value={{ state, dispatch, showConfirmation, showSnack, toggleMainNav }}
    >
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
      {snackState && (
        <Snackbar
          open={true}
          actionText={snackState.actionText}
          onAction={snackState.onAction}
        />
      )}
      {children}
    </UIContext.Provider>
  );
};

export const useUIStore = () => {
  const {
    state,
    dispatch,
    showConfirmation,
    showSnack,
    toggleMainNav,
  } = useContext(UIContext);
  if (!dispatch) {
    throw new Error('useUIStore must be called from a UIStoreProvider!');
  }
  return {
    state,
    dispatch: dispatch!,
    showConfirmation: showConfirmation!,
    showSnack: showSnack!,
    toggleMainNav: toggleMainNav!,
  };
};
