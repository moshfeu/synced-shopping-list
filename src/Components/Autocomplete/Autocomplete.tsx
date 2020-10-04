import React, { FC, useEffect, useState, useRef, FormEvent } from 'react';
import { InputBase, List, ListItem, makeStyles } from '@material-ui/core';
import { Item } from '../../types';

type AutocompleteOptions = {
  placeholder: string;
  options: Array<Item>;
  onSelect(option: Partial<Item> | string): void;
};

const useStyles = makeStyles((theme) => ({
  root: {
    position: 'relative',
    zIndex: 2,
    flex: 1,
  },
  list: {
    position: 'absolute',
    width: '100%',
    boxShadow: theme.shadows[1],
    background: '#fff',
  },
}));

export const Autocomplete: FC<AutocompleteOptions> = ({
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
        ? options.filter((option) => option.name.includes(inputValue))
        : []
    );
  }, [inputValue, options, inputInFocus]);

  function onItemClick(option: Partial<Item> | string) {
    setInputValue('');
    onSelect(option);
  }

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    onItemClick(inputValue);
  }

  return (
    <div className={classes.root}>
      <form onSubmit={onSubmit}>
        <InputBase
          ref={inputRef}
          placeholder={placeholder}
          name='name'
          onFocus={() => setInputInFocus(true)}
          // hold tp let the item's `onClick` to fire
          onBlur={() => setTimeout(() => setInputInFocus(false))}
          onChange={(e) => setInputValue(e.target.value)}
          value={inputValue}
        />
      </form>
      {inputInFocus && optionsList.length ? (
        <List classes={{ root: classes.list }}>
          {optionsList.map((option) => (
            <ListItem
              button
              key={option.id}
              onClick={() => onItemClick(option)}
            >
              {option.name}
            </ListItem>
          ))}
        </List>
      ) : null}
    </div>
  );
};
