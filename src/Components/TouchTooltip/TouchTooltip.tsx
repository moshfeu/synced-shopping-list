import React, { useReducer } from 'react';
import { TooltipProps, ClickAwayListener, Tooltip as MuiTooltip } from '@mui/material';

export const Tooltip = ({ children, ...props }: TooltipProps) => {
  const [open, toggleOpen] = useReducer(
    (isOpenNow: boolean, toOpen: boolean) =>
      typeof toOpen === 'boolean' ? toOpen : !isOpenNow,
    false
  );

  return (
    <ClickAwayListener onClickAway={() => toggleOpen(false)}>
      <MuiTooltip open={open} {...props}>
        {React.cloneElement(children, { onClick: toggleOpen })}
      </MuiTooltip>
    </ClickAwayListener>
  );
};
