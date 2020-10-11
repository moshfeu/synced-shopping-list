import { useHistory } from 'react-router-dom';

export const useToggleMainNav = () => {
  const history = useHistory();

  if (!history) {
    throw new Error(
      'useToggleNavbar should been called inside <BrowserRouter />'
    );
  }

  function toggleMainNav() {
    const currentSearch = new URLSearchParams(history.location.search);
    if (currentSearch.has('menu')) {
      currentSearch.delete('menu');
    } else {
      currentSearch.set('menu', 'true');
    }
    const newSearch = currentSearch.toString();
    history.push({
      pathname: history.location.pathname,
      search: newSearch ? `?${currentSearch.toString()}` : newSearch,
    });
  }

  return toggleMainNav;
};
