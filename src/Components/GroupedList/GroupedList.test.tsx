import React from 'react';
import { render } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { GroupedList, GroupedListItem } from './GroupedList';

const theme = createTheme();

const renderWithTheme = (component: React.ReactElement) => {
  return render(
    <ThemeProvider theme={theme}>
      {component}
    </ThemeProvider>
  );
};

const mockCategories: Array<[string, Array<GroupedListItem>]> = [
  [
    'Fruits',
    [
      { key: '1', checked: false, primary: 'Apple' },
      { key: '2', checked: false, primary: 'Banana' },
    ],
  ],
  [
    'Vegetables',
    [
      { key: '3', checked: false, primary: 'Carrot' },
      { key: '4', checked: false, primary: 'Broccoli' },
    ],
  ],
];

describe('GroupedList', () => {
  const mockProps = {
    categories: mockCategories,
    actionIcon: <span>Action</span>,
    onCheckItem: jest.fn(),
    onDeleteItem: jest.fn(),
    onAction: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders all categories expanded when collapsible is false', () => {
    const { getByText } = renderWithTheme(<GroupedList {...mockProps} collapsible={false} />);
    
    expect(getByText('Apple')).toBeInTheDocument();
    expect(getByText('Banana')).toBeInTheDocument();
    expect(getByText('Carrot')).toBeInTheDocument();
    expect(getByText('Broccoli')).toBeInTheDocument();
  });

  it('renders only first category expanded when collapsible is true', () => {
    const { getByText, queryByText } = renderWithTheme(<GroupedList {...mockProps} collapsible={true} />);
    
    // First category items should be visible
    expect(getByText('Apple')).toBeInTheDocument();
    expect(getByText('Banana')).toBeInTheDocument();
    
    // Second category items should not be visible
    expect(queryByText('Carrot')).not.toBeInTheDocument();
    expect(queryByText('Broccoli')).not.toBeInTheDocument();
  });

  it('toggles category expansion when header is clicked', () => {
    const { getByText, queryByText } = renderWithTheme(<GroupedList {...mockProps} collapsible={true} />);
    
    // Initially, second category is collapsed
    expect(queryByText('Carrot')).not.toBeInTheDocument();
    
    // Click on Vegetables header to expand
    getByText('Vegetables').click();
    
    // Now vegetables should be visible
    expect(getByText('Carrot')).toBeInTheDocument();
    expect(getByText('Broccoli')).toBeInTheDocument();
  });

  it('does not show expand/collapse icons when not collapsible', () => {
    const { container } = renderWithTheme(<GroupedList {...mockProps} collapsible={false} />);
    
    // Should not show expand/collapse icons
    expect(container.querySelector('[data-testid="ExpandLessIcon"]')).not.toBeInTheDocument();
    expect(container.querySelector('[data-testid="ExpandMoreIcon"]')).not.toBeInTheDocument();
  });
});