import React, { FC, useEffect, useState, useRef, FormEvent } from 'react';
import { InputBase, List, ListItem, makeStyles } from '@material-ui/core';
import { Item } from '../../Types/entities';

type AutocompleteOptions = {
  maxResult: number;
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
  input: {
    display: 'flex',
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
            .filter((option) => option.name.includes(inputValue))
            .slice(0, maxResult)
        : []
    );
  }, [inputValue, options, inputInFocus, maxResult]);

  function onItemClick(option: Partial<Item> | string) {
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
