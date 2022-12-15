import { useUIStore } from './useUIStore';

type Undo = { message: string; onAction: () => void };

export const useUndo = () => {
  const { dispatch } = useUIStore();

  return ({ message, onAction }: Undo) => {
    dispatch({
      type: 'SNACK',
      payload: {
        message,
        onAction,
        actionText: 'Undo',
        withProgress: true,
      },
    });
  };
};
