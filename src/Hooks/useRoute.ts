import { useHistory } from 'react-router-dom';

export const useNavigation = () => {
  const history = useHistory();

  return {
    navigateTo: (path: string) => {
      history.push(path);
    },
    navigateToHome: () => {
      history.push('/');
    },
    navigateToItem: (itemId: string) => {
      // generatePath('/item/:id', { id: itemId }) TODO: use this
      history.push(`/item/${itemId}`);
    },
  };
};
