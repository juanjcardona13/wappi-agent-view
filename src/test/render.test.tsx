import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { AppRoutes } from '../App';

describe('rutas', () => {
  it('opens the explorer from the root', async () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <AppRoutes />
      </MemoryRouter>,
    );
    expect(await screen.findByRole('img', { name: 'Diagrama de Wappi' })).toBeInTheDocument();
  });
});
