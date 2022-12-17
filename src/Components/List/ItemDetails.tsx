import React, { FC } from 'react';
import { Add } from '@mui/icons-material';
import {
  Avatar,
  Button,
  CardContent,
  CircularProgress,
  FormControl,
  FormLabel,
  Grid,
  IconButton,
  MenuItem,
  Select,
  SelectChangeEvent,
  TextField,
  ToggleButtonGroupProps,
} from '@mui/material';
import { ToggleButtonGroup, ToggleButton } from '@mui/material';
import makeStyles from '@mui/styles/makeStyles';
import ImagePlaceholder from '../../Assets/imagePlaceholder.svg';
import { useDB } from '../../Hooks/useDB';
import { useUIStore } from '../../Hooks/useUIStore';
import { addCategory, updateItem, updateListItem } from '../../Services/db';
import { inputFileToArrayBuffer, showFileDialog } from '../../Services/file';
import { getImageUrl, remove, upload } from '../../Services/storage';
import { useGlobalStyles } from '../../Styles/common';
import { ListItemView } from '../../Types/entities';
import { UNCATEGORIZED } from '../../consts';
import { Menu } from '../Menu/Menu';
import { useDeleteListItem } from '../../Hooks/useDeleteListItem';
import { useNavigation } from '../../Hooks/useRoute';
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
  const {navigateToHome} = useNavigation();
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
      if (listItem?.item.image) {
        remove(listItem.item.image);
      }
      updateItem(listItem!.item, {
        image: uploadedPath,
      });
    } catch (error) {
      console.error(`can't replace image`, error);
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
                {listItem.item.image && (
                  <MenuItem onClick={removeImage}>Remove</MenuItem>
                )}
              </Menu>
            )}
          </div>
          <CardContent classes={{root: classes.form}}>
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
            <FormControl classes={{ root: `${classes.formControl} ${classes.deleteItemFormControl}` }}>
              <Button variant='outlined' color='error' onClick={onDeleteItem}>
                Delete
              </Button>
            </FormControl>
          </CardContent>
        </>
      ) : null}
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
