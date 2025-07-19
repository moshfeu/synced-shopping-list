import { useState, FormEvent } from 'react';
import { useRouteMatch } from 'react-router-dom';
import { Toolbar, IconButton, Typography, Box, InputBase, ImageList, ImageListItem, Skeleton, ButtonBase, CircularProgress, Button } from '@mui/material';
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
  paginationContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing(2),
    gap: theme.spacing(1),
  },
  loadMoreButton: {
    marginTop: theme.spacing(2),
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
  const [currentQuery, setCurrentQuery] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [hasNextPage, setHasNextPage] = useState<boolean>(false);
  const classes = useGoogleSearchStyles();
  const [isLoading, setIsLoading] = useState(false);
  const [selected, setSelected] = useState<string>();

  const RESULTS_PER_PAGE = 10;

  async function search(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);
    const query = new FormData(e.target as HTMLFormElement).get('query') as string;
    setCurrentQuery(query);
    setCurrentPage(1);
    const result = await searchGoogle(query, 1);
    setItemData(result.items || []);
    setHasNextPage(!!result.queries?.nextPage);
    setIsLoading(false);
  }

  async function loadNextPage() {
    if (!hasNextPage || isLoading) return;

    setIsLoading(true);
    const nextPage = currentPage + 1;
    const startIndex = (nextPage - 1) * RESULTS_PER_PAGE + 1;
    const result = await searchGoogle(currentQuery, startIndex);
    setItemData(prev => [...prev, ...(result.items || [])]);
    setCurrentPage(nextPage);
    setHasNextPage(!!result.queries?.nextPage);
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
            {itemData.map((item) => (
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
            {isLoading &&
              [...Array(8)].map((_, i) => (
                <ImageListItem key={`skeleton-${i}`}>
                  <Skeleton
                    variant='rectangular'
                    height='auto'
                    style={{ aspectRatio: '1 / 1' }}
                  />
                </ImageListItem>
              ))}
          </ImageList>

          {itemData.length > 0 && hasNextPage && !isLoading && (
            <Box className={classes.paginationContainer}>
              <Button
                variant='outlined'
                onClick={loadNextPage}
                className={classes.loadMoreButton}
              >
                Load More Results
              </Button>
            </Box>
          )}
        </Box>
      </Box>
    </>
  );
};
