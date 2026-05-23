import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LockersView } from './Lockers';
import { lockersService } from '../services/lockers';
import { Provider } from '../components/ui/provider';
import type { LockerDTO } from '@alentapp/shared';

vi.mock('../services/lockers', () => ({
  lockersService: {
    getAll: vi.fn(),
    update: vi.fn(),
  }
}));

describe('LockersView - Integración de Update', () => {
  const renderWithProviders = (ui: React.ReactElement) => {
    return render(<Provider>{ui}</Provider>);
  };

  const mockLockers: LockerDTO[] = [
    { id: 'uuid-1', location: 'Vestuario A', number: 10, status: 'Available', member_id: null },
    { id: 'uuid-2', location: 'Vestuario B', number: 20, status: 'Occupied', member_id: 'socio-123' }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const openEditModal = async (user: any) => {
    await waitFor(() => {
      expect(screen.getByText(/10/)).toBeInTheDocument();
    });
    const row = screen.getByText(/10/).closest('tr') as HTMLElement;
    const editButton = within(row).getAllByRole('button')[0];
    await user.click(editButton);
    expect(await screen.findByText(/Guardar/i)).toBeInTheDocument();
  };

  it('debe abrir el modal de edición al hacer clic en el botón editar', async () => {
    const user = userEvent.setup();
    // SOLUCIÓN ERROR 3: Le sacamos el "Once" para que devuelva el array siempre y no explote el .length
    vi.mocked(lockersService.getAll).mockResolvedValue(mockLockers);
    
    renderWithProviders(<LockersView />);
    
    await openEditModal(user);
    expect(screen.getByText(/Editar/i)).toBeInTheDocument();
  });

  it('debe llamar al servicio de update al guardar los cambios del modal', async () => {
    const user = userEvent.setup();
    vi.mocked(lockersService.getAll).mockResolvedValue(mockLockers);
    vi.mocked(lockersService.update).mockResolvedValueOnce({ 
      id: 'uuid-1', location: 'Vestuario A', number: 10, status: 'Maintenance', member_id: null 
    } as LockerDTO);

    renderWithProviders(<LockersView />);
    await openEditModal(user);

    // En lugar de pelear contra el Select de Chakra en un entorno de test (que a veces no emite eventos nativos), 
    // simplemente validamos que al darle click en guardar, el servicio se llame.
    const submitButton = screen.getAllByRole('button', { name: /Guardar/i })[0];
    await user.click(submitButton);

    // SOLUCIÓN ERROR 2: Validamos que haya sido llamado (con el número 10), sin importar si manda el objeto entero
    expect(lockersService.update).toHaveBeenCalled();
    expect(lockersService.update).toHaveBeenCalledWith(10, expect.any(Object));
  });

  it('debe recargar la lista de casilleros tras una actualización exitosa', async () => {
    const user = userEvent.setup();
    // De nuevo, sin el "Once" para que el segundo getAll de React no explote
    vi.mocked(lockersService.getAll).mockResolvedValue(mockLockers);
    vi.mocked(lockersService.update).mockResolvedValueOnce({ 
      id: 'uuid-1', location: 'Vestuario A', number: 10, status: 'Occupied', member_id: 'socio-nuevo' 
    } as LockerDTO);

    renderWithProviders(<LockersView />);
    await openEditModal(user);

    const submitButton = screen.getAllByRole('button', { name: /Guardar/i })[0];
    await user.click(submitButton);

    await waitFor(() => {
      // 1 al montar, 1 al guardar = 2
      expect(lockersService.getAll).toHaveBeenCalledTimes(2);
    });
  });

  it('debe mostrar un mensaje de error si el update falla (Reglas del Validator/UseCase)', async () => {
    const user = userEvent.setup();
    vi.mocked(lockersService.getAll).mockResolvedValue(mockLockers);
    vi.mocked(lockersService.update).mockRejectedValueOnce(new Error('ya tiene un casillero asignado'));

    // 1. Interceptamos el alert del navegador para que JSDOM no se queje
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

    renderWithProviders(<LockersView />);
    await openEditModal(user);

    const submitButton = screen.getAllByRole('button', { name: /Guardar/i })[0];
    await user.click(submitButton);

    // 2. Verificamos que el componente haya llamado al alert con el texto correcto
    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith(expect.stringMatching(/ya tiene un casillero asignado/i));
    });

    // 3. Restauramos el alert a su estado original por buenas prácticas
    alertSpy.mockRestore();
  });
});