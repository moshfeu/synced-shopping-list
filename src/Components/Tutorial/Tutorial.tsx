import React, { FC } from 'react';
import { Dialog, DialogContent, DialogTitle, IconButton } from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import makeStyles from '@mui/styles/makeStyles';

type TutorialProps = {
  open: boolean;
  onClose: () => void;
  videoId: string;
  title?: string;
};

const useStyles = makeStyles(() => ({
  dialogPaper: {
    maxWidth: '90vw',
    width: 800,
  },
  dialogTitle: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  videoContainer: {
    position: 'relative',
    paddingBottom: '56.25%', // 16:9 aspect ratio
    height: 0,
    overflow: 'hidden',
  },
  iframe: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    border: 'none',
  },
}));

export const Tutorial: FC<TutorialProps> = ({
  open,
  onClose,
  videoId,
  title = 'Tutorial',
}) => {
  const classes = useStyles();

  // Fix for YouTube Error 153: Add proper parameters to embed URL
  // enablejsapi=1 - enables the JavaScript API
  // origin parameter helps with CORS
  // rel=0 - shows related videos from same channel only
  const embedUrl = `https://www.youtube.com/embed/${videoId}?enablejsapi=1&origin=${window.location.origin}&rel=0`;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      classes={{ paper: classes.dialogPaper }}
      maxWidth={false}
    >
      <DialogTitle className={classes.dialogTitle}>
        {title}
        <IconButton
          aria-label='close'
          onClick={onClose}
          size='small'
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <div className={classes.videoContainer}>
          <iframe
            className={classes.iframe}
            src={embedUrl}
            title={title}
            allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share'
            referrerPolicy='strict-origin-when-cross-origin'
            allowFullScreen
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};
