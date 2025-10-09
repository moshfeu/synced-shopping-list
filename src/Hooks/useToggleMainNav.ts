import { useNavigate, useLocation } from 'react-router-dom';

export const useToggleMainNav = () => {
  const navigate = useNavigate();
  const location = useLocation();

  function toggleMainNav() {
    const currentSearch = new URLSearchParams(location.search);
    if (currentSearch.has('menu')) {
      currentSearch.delete('menu');
    } else {
      currentSearch.set('menu', 'true');
    }
    const newSearch = currentSearch.toString();
    navigate({
      pathname: location.pathname,
      search: newSearch ? `?${currentSearch.toString()}` : newSearch,
    });
  }

  return toggleMainNav;
};
