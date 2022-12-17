import { useHistory } from 'react-router-dom';

export const useNavigation = () => {
  const history = useHistory();


  return {
    navigateToHome: () => {
      history.push('/');
    },
    navigateToItem: (itemId: string) => {
      history.push(`/item/${itemId}`);
    }
  }
}