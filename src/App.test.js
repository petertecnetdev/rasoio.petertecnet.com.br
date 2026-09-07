import { render, screen } from '@testing-library/react';
import ProcessingIndicatorComponent from './components/ProcessingIndicatorComponent';

test('renders the branded Rasoio processing state', () => {
  render(<ProcessingIndicatorComponent messages={['Carregando Rasoio']} gifSrc="" />);

  expect(screen.getByRole('status', { name: 'Carregando Rasoio' })).toBeInTheDocument();
  expect(screen.getByText('Rasoio')).toBeInTheDocument();
  expect(screen.getByText('Carregando Rasoio')).toBeInTheDocument();
});
