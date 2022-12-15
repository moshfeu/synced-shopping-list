import React, {
  createContext,
  FC,
  useContext,
  useReducer,
  Dispatch,
  ReactChild,
} from 'react';
import { ConfirmationDialog } from '../Components/Dialogs/Confirmation/Confirmation';
import { FormDialog } from '../Components/Dialogs/FormDialog/FormDialog';
import { Snackbar } from '../Components/Dialogs/Snackbar/Snackbar';

type ConfirmationState = {
  title: string;
  text: string;
  onConfirm(): void;
};

type SnackState = {
  message: string;
  actionText?: string;
  onAction?(): void;
  withProgress?: boolean;
  autoHideDuration?: number;
};

type DialogState = {
  title: ReactChild;
  content: ReactChild;
  actionText: string;
  onAction(form: FormData): void;
};

type UIState = {
  isAppLoading: boolean;
  snackState: SnackState | null;
  confirmationState: ConfirmationState | null;
  dialogState: DialogState | null;
};

type Action =
  | { type: 'IS_APP_LOADING'; payload: UIState['isAppLoading'] }
  | { type: 'SNACK'; payload: SnackState | null }
  | { type: 'CONFIRMATION'; payload: ConfirmationState | null }
  | { type: 'DIALOG'; payload: DialogState | null };

const initialState: UIState = {
  isAppLoading: true,
  snackState: null,
  confirmationState: null,
  dialogState: null,
};

const UIContext = createContext<{
  state: UIState;
  dispatch?: Dispatch<Action>;
}>({
  state: initialState,
});

function reducer(state: UIState, action: Action): UIState {
  switch (action.type) {
    case 'IS_APP_LOADING':
      return { ...state, isAppLoading: action.payload };
    case 'DIALOG':
      return { ...state, dialogState: action.payload };
    case 'CONFIRMATION':
      return { ...state, confirmationState: action.payload };
    case 'SNACK':
      return { ...state, snackState: action.payload };
  }
}

export const UIStoreProvider: FC = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const { confirmationState, dialogState, snackState } = state;

  function closeDialog() {
    dispatch({
      type: 'DIALOG',
      payload: null,
    });
  }

  function closeConfirm() {
    dispatch({
      type: 'CONFIRMATION',
      payload: null,
    });
  }

  return (
    <UIContext.Provider value={{ state, dispatch }}>
      {confirmationState && (
        <ConfirmationDialog
          open={true}
          title={confirmationState.title}
          text={confirmationState.text}
          onConfirm={() => {
            confirmationState.onConfirm();
            closeConfirm();
          }}
          handleClose={closeConfirm}
        />
      )}
      <Snackbar
        open={!!snackState}
        message={snackState?.message || ''}
        onAction={snackState?.onAction}
        actionText={snackState?.actionText}
        autoHideDuration={snackState?.autoHideDuration}
        withProgress={snackState?.withProgress}
      />
      {dialogState && (
        <FormDialog
          closeDialog={closeDialog}
          actionText={dialogState.actionText}
          title={dialogState.title}
          content={dialogState.content}
          onAction={dialogState.onAction}
        />
      )}
      {children}
    </UIContext.Provider>
  );
};

export const useUIStore = () => {
  const { state, dispatch } = useContext(UIContext);
  if (!dispatch) {
    throw new Error('useUIStore must be called from a UIStoreProvider!');
  }
  return {
    state,
    dispatch,
  };
};
