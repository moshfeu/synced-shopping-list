import React, { FC, FormEvent, useState } from 'react';
import { Switch, Route, useRouteMatch } from 'react-router-dom';
import { Add, ArrowBack, Search as SearchIcon } from '@mui/icons-material';
import {
  Avatar,
  Box,
  Button,
  ButtonBase,
  CardContent,
  CircularProgress,
  FormControl,
  FormLabel,
  Grid,
  IconButton,
  ImageList,
  ImageListItem,
  InputBase,
  MenuItem,
  Select,
  SelectChangeEvent,
  Skeleton,
  TextField,
  ToggleButtonGroupProps,
  Toolbar,
  Typography,
} from '@mui/material';
import { ToggleButtonGroup, ToggleButton } from '@mui/material';
import makeStyles from '@mui/styles/makeStyles';
import ImagePlaceholder from '../../Assets/imagePlaceholder.svg';
import { useDB } from '../../Hooks/useDB';
import { useDeleteListItem } from '../../Hooks/useDeleteListItem';
import { useNavigation } from '../../Hooks/useRoute';
import { useUIStore } from '../../Hooks/useUIStore';
import { addCategory, updateItem, updateListItem } from '../../Services/db';
import {
  base64ToArrayBuffer,
  inputFileToArrayBuffer,
  showFileDialog,
} from '../../Services/file';
import { GoogleSearchResult, searchGoogle } from '../../Services/googleSearch';
import { proxy } from '../../Services/proxy';
import { getImageUrl, remove, upload } from '../../Services/storage';
import { useGlobalStyles } from '../../Styles/common';
import { ListItemView } from '../../Types/entities';
import { UNCATEGORIZED } from '../../consts';
import { Menu } from '../Menu/Menu';
import { Tooltip } from '../TouchTooltip/TouchTooltip';

type ItemDetailsProps = {
  listItem: ListItemView;
};

const useStyles = makeStyles((theme) => ({
  root: {
    width: 250,
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
  },
  imageWrapper: {
    position: 'relative',
    background: '#fdfdfd',
    borderBottom: '1px solid #efefef',
    padding: theme.spacing(2, 0),
  },
  imageMenu: {
    position: 'absolute',
    top: 0,
    right: 0,
  },
  uploadingSpinner: {
    padding: theme.spacing(1.5),
  },
  image: {
    maxWidth: '100%',
    margin: '0 auto',
    display: 'block',
    maxHeight: 100,
  },
  name: {
    '& .MuiInput-input': {
      fontSize: theme.typography.h5.fontSize,
    },
    '& .MuiInput-underline:before': {
      borderBottomColor: 'transparent',
    },
  },
  form: {
    flexDirection: 'column',
    display: 'flex',
    flex: 1,
  },
  formControl: {
    display: 'flex',
    marginBottom: theme.spacing(3),
  },
  deleteItemFormControl: {
    justifyContent: 'end',
    marginBottom: 0,
    flex: 1,
  },
  addCategoryButton: {
    padding: 0,
  },
  label: {
    '& + $select': {
      margin: 0,
    },
  },
  select: {},
  urgency: {
    marginTop: theme.spacing(1),
  },
  urgencyButton: {
    flex: 1,
    color: 'inherit',
  },
  addedBy: {
    alignSelf: 'end',
  },
}));

export const ItemDetails: FC<ItemDetailsProps> = ({ listItem }) => {
  const classes = useStyles();
  const deleteListItem = useDeleteListItem();
  const { navigateToHome, navigateTo } = useNavigation();
  const { path, url } = useRouteMatch();
  const { flexGrow, flex } = useGlobalStyles();
  const { categories } = useDB();
  const { dispatch } = useUIStore();
  const [isUploading, setIsUploading] = React.useState(false);
  const category = categories.find(
    ({ id }) => id === listItem?.item.category?.id
  );

  function onChange(
    e:
      | React.ChangeEvent<{ name?: string; value: any }>
      | SelectChangeEvent<any>
      | React.MouseEvent<HTMLElement>
  ) {
    let value = null;
    let name = null;

    ({ value, name } = (e.currentTarget as HTMLInputElement) || {});
    if (!name) {
      ({ value, name } = e.target as HTMLInputElement);
    }
    if (name?.startsWith('item_')) {
      const [, prop] = name.split('_');
      value = value === UNCATEGORIZED ? null : value;
      updateItem(listItem!.item, {
        [prop]: value,
      });
    } else {
      updateListItem(listItem!, {
        [name!]: value,
      });
    }
  }

  async function onAddCategory(formData: FormData) {
    const name = formData.get('category') as string;
    const category = await addCategory({
      name,
    });
    if (!category?.key) {
      return;
    }
    updateItem(listItem!.item, {
      categoryId: category.key,
    });
  }

  function showAddCategory() {
    dispatch({
      type: 'DIALOG',
      payload: {
        title: 'Add Category',
        actionText: 'Add',
        content: (
          <TextField name='category' type='text' required variant='standard' />
        ),
        onAction: onAddCategory,
      },
    });
  }

  async function updateImage(uploadedPath: string) {
    try {
      if (listItem?.item.image) {
        remove(listItem.item.image);
      }
      updateItem(listItem!.item, {
        image: uploadedPath,
      });
    } catch (error) {
      console.error(`can't replace image`, error);
    }
  }

  async function onReplaceGoogle() {
    navigateTo(`${url}/google-search`);
  }

  async function onGoogleResult(imagePath: string) {
    const base64 = await proxy(imagePath);
    const file = base64ToArrayBuffer(base64);
    const name = `${listItem?.item.id}#${listItem?.item.name}.png`;
    const uploadedPath = await upload(name, file);

    await updateImage(uploadedPath);
    navigateTo(url);
  }

  async function onReplace() {
    const [imageFile] = await showFileDialog();
    if (!imageFile) {
      return;
    }

    try {
      setIsUploading(true);
      const file = await inputFileToArrayBuffer(imageFile);
      const name = `${listItem?.item.id}#${imageFile.name}`;
      const uploadedPath = await upload(name, file);

      await updateImage(uploadedPath);
    } finally {
      setIsUploading(false);
    }
  }

  function removeImage() {
    if (!listItem?.item.image) {
      return;
    }
    remove(listItem.item.image);
    updateItem(listItem!.item, {
      image: null,
    });
  }

  function onDeleteItem() {
    navigateToHome();
    deleteListItem(listItem);
  }

  return (
    <div className={classes.root}>
      <Switch>
        <Route path={path} exact>
          {listItem ? (
            <>
              <div className={classes.imageWrapper}>
                <img
                  className={classes.image}
                  alt={listItem.item.name}
                  src={
                    listItem.item.image
                      ? getImageUrl(listItem.item.image)
                      : ImagePlaceholder
                  }
                />
                {isUploading ? (
                  <CircularProgress
                    className={`${classes.imageMenu} ${classes.uploadingSpinner}`}
                    color='secondary'
                  />
                ) : (
                  <Menu className={classes.imageMenu}>
                    <MenuItem onClick={onReplace}>Replace</MenuItem>
                    <MenuItem onClick={onReplaceGoogle}>
                      Replace (Google)
                    </MenuItem>
                    {listItem.item.image && (
                      <MenuItem onClick={removeImage}>Remove</MenuItem>
                    )}
                  </Menu>
                )}
              </div>
              <CardContent classes={{ root: classes.form }}>
                <FormControl classes={{ root: classes.formControl }}>
                  <TextField
                    name='item_name'
                    classes={{ root: classes.name }}
                    defaultValue={listItem?.item.name}
                    size='medium'
                    onChange={onChange}
                    variant='standard'
                  />
                </FormControl>
                <Grid
                  gap={1}
                  container
                  wrap='nowrap'
                  alignItems='center'
                  classes={{ root: classes.formControl }}
                >
                  <Grid item classes={{ root: flexGrow }}>
                    <FormControl classes={{ root: flex }} variant='standard'>
                      <FormLabel
                        classes={{ filled: classes.label }}
                        htmlFor='category'
                      >
                        Caetgory
                      </FormLabel>
                      <Select
                        name='item_categoryId'
                        id='category'
                        onChange={onChange}
                        value={category?.id || UNCATEGORIZED}
                        className={classes.select}
                      >
                        <MenuItem key={UNCATEGORIZED} value={UNCATEGORIZED}>
                          Uncategorized
                        </MenuItem>
                        {categories.map(({ id, name }) => (
                          <MenuItem key={id} value={id}>
                            {name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item>
                    <IconButton
                      onClick={showAddCategory}
                      className={classes.addCategoryButton}
                      size='large'
                    >
                      <Add />
                    </IconButton>
                  </Grid>
                </Grid>
                <FormControl classes={{ root: classes.formControl }}>
                  <FormLabel htmlFor='quantity'>Quantity</FormLabel>
                  <TextField
                    name='quantity'
                    type='number'
                    defaultValue={listItem.quantity || 1}
                    onFocus={(e) => e.target.select()}
                    onChange={onChange}
                    variant='standard'
                  />
                </FormControl>
                <FormControl classes={{ root: classes.formControl }}>
                  <FormLabel htmlFor='urgency'>Urgency</FormLabel>
                  <Urgency
                    classes={{
                      root: classes.urgency,
                      grouped: classes.urgencyButton,
                    }}
                    exclusive={true}
                    onChange={onChange}
                    value={listItem.urgency || '1'}
                  />
                </FormControl>
                <FormControl classes={{ root: classes.formControl }}>
                  <FormLabel htmlFor='notes'>Note</FormLabel>
                  <TextField
                    name='note'
                    type='text'
                    multiline
                    rows={4}
                    placeholder='The blue one..'
                    defaultValue={listItem.note}
                    onChange={onChange}
                    variant='standard'
                  />
                </FormControl>
                {listItem.addedBy && (
                  <FormControl classes={{ root: classes.formControl }}>
                    <Tooltip
                      title={listItem.addedBy.displayName ?? 'Anonymous'}
                    >
                      <Avatar
                        src={listItem.addedBy.photoURL!}
                        alt={listItem.addedBy.displayName ?? 'Anonymous'}
                        classes={{ root: classes.addedBy }}
                      />
                    </Tooltip>
                  </FormControl>
                )}
                <FormControl
                  classes={{
                    root: `${classes.formControl} ${classes.deleteItemFormControl}`,
                  }}
                >
                  <Button
                    variant='outlined'
                    color='error'
                    onClick={onDeleteItem}
                  >
                    Delete
                  </Button>
                </FormControl>
              </CardContent>
            </>
          ) : null}
        </Route>
        <Route path={`${path}/google-search`}>
          <GoogleSearch onSelect={onGoogleResult} />
        </Route>
      </Switch>
    </div>
  );
};

const Urgency: FC<ToggleButtonGroupProps> = (props) => (
  <ToggleButtonGroup {...props}>
    {['🟢', '🟡', '🔴'].map((level, index) => (
      <ToggleButton
        key={index}
        name='urgency'
        value={`${index + 1}`}
        selected={props.value === `${index + 1}`}
      >
        {level}
      </ToggleButton>
    ))}
  </ToggleButtonGroup>
);

const useGoogleSearchStyles = makeStyles((theme) => ({
  googleSearchForm: {
    paddingInline: theme.spacing(1.5),
  },
  imageList: {
    margin: 0,
    overflow: 'unset',
  },
  input: {
    flex: 1,
  },
}));

export const GoogleSearch = ({
  onSelect,
}: {
  onSelect: (url: string) => Promise<void>;
}) => {
  const { url } = useRouteMatch();
  const { navigateTo } = useNavigation();
  const [itemData, setItemData] = useState<GoogleSearchResult[]>([]);
  const classes = useGoogleSearchStyles();
  const [isLoading, setIsLoading] = useState(false);
  const [selected, setSelected] = useState<string>();

  async function search(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);
    const query = new FormData(e.target as HTMLFormElement).get('query');
    const result = await searchGoogle(query as string);
    setItemData(result);
    setIsLoading(false);
  }

  async function onResultClick(imagePath: string) {
    setSelected(imagePath);
    await onSelect(imagePath);
  }

  return (
    <>
      <Toolbar>
        <IconButton
          edge='start'
          color='inherit'
          aria-label='menu'
          onClick={() => navigateTo(url)}
        >
          <ArrowBack />
        </IconButton>
        <Typography variant='h6'>Search on Google</Typography>
      </Toolbar>
      <Box
        component='form'
        onSubmit={search}
        className={classes.googleSearchForm}
        display='flex'
        flexDirection='column'
      >
        <Box display='flex'>
          <InputBase
            name='query'
            className={classes.input}
            placeholder='Search Google Images'
            inputProps={{ 'aria-label': 'search google images' }}
          />
          <IconButton
            type='submit'
            // className={classes.iconButton}
            aria-label='search'
          >
            <SearchIcon />
          </IconButton>
        </Box>
        <Box flexDirection='column'>
          <ImageList className={classes.imageList} cols={2} component='div'>
            {isLoading
              ? [...Array(8)].map((i) => (
                  <ImageListItem key={i}>
                    <Skeleton
                      variant='rectangular'
                      height='auto'
                      style={{ aspectRatio: '1 / 1' }}
                    />
                  </ImageListItem>
                ))
              : itemData.map((item) => (
                  <ImageListItem
                    key={item.link}
                    style={{
                      overflow: 'hidden',
                      aspectRatio: '1 / 1',
                    }}
                    component={ButtonBase}
                    onClick={() => onResultClick(item.link)}
                    disabled={!!selected}
                    >
                    <img
                      alt=''
                      src={item.image.thumbnailLink}
                      style={{
                        opacity: selected ? 0.5 : 1,
                        transition: 'opacity 0.3s',
                      }}
                    />
                    {selected === item.link && (
                      <CircularProgress
                        color='secondary'
                        sx={{ position: 'absolute', inset: 0, margin: 'auto' }}
                      />
                    )}
                  </ImageListItem>
                ))}
          </ImageList>
        </Box>
      </Box>
    </>
  );
};
