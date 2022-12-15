import { Button, IconButton, Snackbar as MuiSnackbar, Theme } from '@mui/material';
import makeStyles from '@mui/styles/makeStyles';
import { Close } from '@mui/icons-material';
import { useUIStore } from '../../../Hooks/useUIStore';

type SnackbarProps = {
  open: boolean;
  onAction?(): void;
  actionText?: string;
  message: string;
  autoHideDuration?: number;
  withProgress?: boolean;
};

const useStyles = makeStyles((theme: Theme) => ({
  '@global': {
    '@keyframes brrrrr': {
      '0%': {
        width: 0,
      },
      '100%': {
        width: '100%',
      },
    },
  },
  root: (props: Pick<SnackbarProps, 'withProgress' | 'autoHideDuration'>) => ({
    '& .MuiSnackbarContent-root': {
      backgroundColor: theme.palette.info.main,
      overflow: 'hidden',

      '&:before': {
        content: props.withProgress ? '""' : undefined,
        top: 0,
        left: 0,
        width: '100%',
        position: 'absolute',
        animation: `brrrrr ${props.autoHideDuration}ms linear forwards`,
        borderTopLeftRadius: theme.shape.borderRadius,
        borderTopRightRadius: theme.shape.borderRadius,
        borderTop: `10px solid ${theme.palette.info.dark}`,
      }
    },
  }),
}));

export const Snackbar = ({
  open,
  actionText,
  message,
  onAction,
  autoHideDuration = 6000,
  withProgress = false,
}: SnackbarProps) => {
  const { root } = useStyles({withProgress, autoHideDuration});
  const { dispatch } = useUIStore();

  function handleClose() {
    dispatch({
      type: 'SNACK',
      payload: null,
    });
  }

  return (
    <MuiSnackbar
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'left',
      }}
      classes={{ root }}
      open={open}
      autoHideDuration={autoHideDuration}
      onClose={handleClose}
      message={message}
      action={
        <>
          {onAction ? (
            <Button
              color='inherit'
              size='small'
              onClick={() => {
                handleClose();
                onAction();
              }}
            >
              {actionText}
            </Button>
          ) : null}
          <IconButton
            size='small'
            aria-label='close'
            color='inherit'
            onClick={handleClose}
          >
            <Close fontSize='small' />
          </IconButton>
        </>
      }
    />
  );
};
