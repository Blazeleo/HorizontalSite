import { render, screen } from '@testing-library/react';
import { ParallaxProvider } from 'react-scroll-parallax';
import App from './App';

test('renders the showcase hero', () => {
  render(
    <ParallaxProvider>
      <App />
    </ParallaxProvider>
  );
  const heading = screen.getByText(/every way/i);
  expect(heading).toBeInTheDocument();
});
