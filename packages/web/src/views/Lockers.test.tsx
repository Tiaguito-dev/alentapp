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

    
    
    const submitButton = screen.getAllByRole('button', { name: /Guardar/i })[0];
    await user.click(submitButton);

    
    expect(lockersService.update).toHaveBeenCalled();
    expect(lockersService.update).toHaveBeenCalledWith(10, expect.any(Object));
  });

  it('debe recargar la lista de casilleros tras una actualización exitosa', async () => {
    const user = userEvent.setup();
    
    vi.mocked(lockersService.getAll).mockResolvedValue(mockLockers);
    vi.mocked(lockersService.update).mockResolvedValueOnce({ 
      id: 'uuid-1', location: 'Vestuario A', number: 10, status: 'Occupied', member_id: 'socio-nuevo' 
    } as LockerDTO);

    renderWithProviders(<LockersView />);
    await openEditModal(user);

    const submitButton = screen.getAllByRole('button', { name: /Guardar/i })[0];
    await user.click(submitButton);

    await waitFor(() => {
      //
      expect(lockersService.getAll).toHaveBeenCalledTimes(2);
    });
  });

  it('debe mostrar un mensaje de error si el update falla (Reglas del Validator/UseCase)', async () => {
    const user = userEvent.setup();
    vi.mocked(lockersService.getAll).mockResolvedValue(mockLockers);
    vi.mocked(lockersService.update).mockRejectedValueOnce(new Error('ya tiene un casillero asignado'));

    
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

    renderWithProviders(<LockersView />);
    await openEditModal(user);

    const submitButton = screen.getAllByRole('button', { name: /Guardar/i })[0];
    await user.click(submitButton);

    
    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith(expect.stringMatching(/ya tiene un casillero asignado/i));
    });

    
    alertSpy.mockRestore();
  });
});