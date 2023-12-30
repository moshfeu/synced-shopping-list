import { useState, FormEvent } from 'react';
import { useRouteMatch } from 'react-router-dom';
import { Toolbar, IconButton, Typography, Box, InputBase, ImageList, ImageListItem, Skeleton, ButtonBase, CircularProgress } from '@mui/material';
import { ArrowBack, Search as SearchIcon } from '@mui/icons-material';
import makeStyles from '@mui/styles/makeStyles';

import { useNavigation } from '../../Hooks/useRoute';
import { GoogleSearchResult, searchGoogle } from '../../Services/googleSearch';

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
