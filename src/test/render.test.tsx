import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { AppRoutes } from '../App';

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AppRoutes />
    </MemoryRouter>,
  );
}

describe('pages', () => {
  it('loads the home question and the theme control', async () => {
    const user = userEvent.setup();
    renderAt('/');
    expect(await screen.findByRole('heading', { name: '¿Cómo piensa y responde Wappi?', level: 1 })).toBeInTheDocument();
    const theme = screen.getByRole('button', { name: /Tema:/ });
    await user.click(theme);
    expect(screen.getByRole('button', { name: /Tema:/ })).toBeInTheDocument();
  });

  it('steps the simulator forward', async () => {
    const user = userEvent.setup();
    renderAt('/simulador');
    expect(await screen.findByRole('heading', { name: 'Simulador', level: 1 })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Paso siguiente' }));
    expect(screen.getByRole('heading', { name: 'El mensaje cifrado se reparte' })).toBeInTheDocument();
  });
});
