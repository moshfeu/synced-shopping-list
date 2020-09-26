import React, { FC, FormEvent } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Paper from '@material-ui/core/Paper';
import InputBase from '@material-ui/core/InputBase';
import Divider from '@material-ui/core/Divider';
import IconButton from '@material-ui/core/IconButton';
import SearchIcon from '@material-ui/icons/Search';
import HistoryIcon from '@material-ui/icons/History';
import { addItem } from '../../Services/Firebase';

const useStyles = makeStyles((theme) => ({
  root: {
    padding: '2px 4px',
    display: 'flex',
    alignItems: 'center',
  },
  input: {
    marginLeft: theme.spacing(1),
    flex: 1,
  },
  iconButton: {
    padding: 10,
  },
  divider: {
    height: 28,
    margin: 4,
  },
}));

export const Search: FC = () => {
  function onAdd(e: FormEvent<HTMLDivElement>) {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const name = new FormData(form).get('name') as string;
    if (!name) {
      return;
    }
    addItem({ name });
    form.reset();
  }

  const classes = useStyles();

  return (
    <Paper component='form' className={classes.root} onSubmit={onAdd}>
      {/* <IconButton className={classes.iconButton} aria-label="menu">
        <MenuIcon />
      </IconButton> */}
      <InputBase
        className={classes.input}
        placeholder='Product Name'
        name='name'
      />
      <IconButton type='submit' className={classes.iconButton} aria-label='add'>
        <SearchIcon />
      </IconButton>
      <Divider className={classes.divider} orientation='vertical' />
      <IconButton className={classes.iconButton} aria-label='add from history'>
        <HistoryIcon />
      </IconButton>
    </Paper>
  );
};
