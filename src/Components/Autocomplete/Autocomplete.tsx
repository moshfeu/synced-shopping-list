import React, { FC, useEffect, useState, useRef, FormEvent } from 'react';
import { Chip, InputBase, List, ListItem } from '@mui/material';
import makeStyles from '@mui/styles/makeStyles';
import { Item } from '../../Types/entities';

export type AutocompleteOption = Item & { checked?: boolean };

type AutocompleteOptions = {
  maxResult: number;
  placeholder: string;
  options: Array<AutocompleteOption>;
  onSelect(option: Partial<AutocompleteOption> | string): void;
};

const useStyles = makeStyles((theme) => ({
  root: {
    position: 'relative',
    zIndex: 2,
    flex: 1,
  },
  input: {
    display: 'flex',
  },
  listItem: {
    gap: theme.spacing(1),
  },
  name: {
    flex: 1,
  },
  badge: {
    flexShrink: 0,
  },
  list: {
    position: 'absolute',
    width: '100%',
    boxShadow: theme.shadows[1],
    background: '#fff',
  },
}));

export const Autocomplete: FC<AutocompleteOptions> = ({
  maxResult,
  options,
  onSelect,
  placeholder,
}) => {
  const classes = useStyles();
  const [inputValue, setInputValue] = useState('');
  const [optionsList, setOptionsList] = useState(options);
  const [inputInFocus, setInputInFocus] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setOptionsList(
      inputValue && inputInFocus
        ? options
            .filter((option) => option.name.includes(inputValue.trim()))
            .slice(0, maxResult)
        : []
    );
  }, [inputValue, options, inputInFocus, maxResult]);

  function onItemClick(option: Partial<AutocompleteOption> | string) {
    setInputValue('');
    onSelect(option);
    inputRef.current?.focus();
  }

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    onItemClick(inputValue);
  }

  return (
    <div className={classes.root}>
      <form onSubmit={onSubmit}>
        <InputBase
          classes={{ root: classes.input }}
          placeholder={placeholder}
          name='name'
          inputRef={inputRef}
          onFocus={() => setInputInFocus(true)}
          // hold it, let the item's `onClick` to fire
          onChange={(e) => setInputValue(e.target.value)}
          value={inputValue}
          autoComplete='off'
        />
      </form>
      {inputInFocus && optionsList.length ? (
        <List classes={{ root: classes.list }}>
          {optionsList.map((option) => (
            <ListItem
              button
              className={classes.listItem}
              key={option.id}
              onClick={() => onItemClick(option)}
            >
              <span className={classes.name}>{option.name}</span>
              {option.checked && (
                <Chip
                  className={classes.badge}
                  label='Collected'
                  size='small'
                  color='success'
                />
              )}
            </ListItem>
          ))}
        </List>
      ) : null}
    </div>
  );
};
