import makeStyles from '@mui/styles/makeStyles';

export const useStyles = makeStyles((theme) => ({
  root: {
    width: 250,
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    overflow: 'hidden',
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
    marginBottom: theme.spacing(2),
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
  modal: {
    padding: theme.spacing(1),
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',

    '& img': {
      maxWidth: '100%',
      maxHeight: '100%',
    },
  },
  cardHeader: {
    padding: 0,
  },
  cardHeaderContent: {
    flex: 'initial',
    width: '100%',
  },
  cardActionArea: {
    position: 'relative',
    overflow: 'hidden',
  },
  cardMedia: {
    height: 130
  },
  cardHeaderZoomIconWrapper: {
    display: 'flex',
    position: 'absolute',
    bottom: 0,
    right: 0,
    background: 'rgba(255, 255, 255, 0.9)',
    borderTopLeftRadius: 5,
    padding: theme.spacing(0.5),
    boxShadow: theme.shadows[1],
  }
}));
