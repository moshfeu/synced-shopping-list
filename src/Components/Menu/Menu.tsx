import React, { FC, useRef, useState } from 'react';
import { IconButton, Menu as MuiMenu } from '@material-ui/core';
import { MoreVert } from '@material-ui/icons';

type MenuProps = {
  className?: string;
};

export const Menu: FC<MenuProps> = ({ children, className }) => {
  const anchorEl = useRef(null);
  const [open, setOpen] = useState(false);

  const handleClick = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  return (
    <div className={className}>
      <IconButton
        aria-label='options'
        aria-controls='menu'
        aria-haspopup='true'
        onClick={handleClick}
        ref={anchorEl}
      >
        <MoreVert />
      </IconButton>
      <MuiMenu
        id='menu'
        anchorEl={anchorEl.current}
        open={open}
        onClose={handleClose}
        onClick={handleClose}
      >
        {children}
      </MuiMenu>
    </div>
  );
};
