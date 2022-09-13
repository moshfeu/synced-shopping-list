import { MenuItem, Select, SelectChangeEvent } from '@mui/material';
import makeStyles from '@mui/styles/makeStyles';

const useStyles = makeStyles(() => ({
  select: {
    backgroundColor: '#fff',
    '&:focus': {
      backgroundColor: '#fff',
    }
  },
}));

export const ListsPicker = () => {
  const classes = useStyles();

  const handleChange = (event: SelectChangeEvent<unknown>) => {
    console.log(222, event);
  };

  return (
    <Select
      size='small'
      onChange={handleChange}
      variant='filled'
      disableUnderline
      classes={{
        filled: classes.select,
      }}
    >
      <MenuItem value=''>
        <em>None</em>
      </MenuItem>
      <MenuItem value={10}>Twenty</MenuItem>
      <MenuItem value={21}>Twenty one</MenuItem>
      <MenuItem value={22}>Twenty one and a half</MenuItem>
    </Select>
  );
};
