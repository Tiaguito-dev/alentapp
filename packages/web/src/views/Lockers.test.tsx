import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LockersView } from './Lockers';
import { lockersService } from '../services/lockers';
import { membersService } from '../services/members'; // <-- Importamos el servicio de socios
import { Provider } from '../components/ui/provider';
import type { LockerDTO, MemberDTO } from '@alentapp/shared';


vi.mock('../services/lockers', () => ({
  lockersService: {
    getAll: vi.fn(),
    update: vi.fn(),
    create: vi.fn(), 
  }
}));


vi.mock('../services/members', () => ({
  membersService: {
    getAll: vi.fn(),
  }
}));

describe('LockersView - Integración de UI', () => {
  const renderWithProviders = (ui: React.ReactElement) => {
    return render(<Provider>{ui}</Provider>);
  };

  const mockLockers: LockerDTO[] = [
    { id: 'uuid-1', location: 'Vestuario A', number: 10, status: 'Available', member_id: null },
    { id: 'uuid-2', location: 'Vestuario B', number: 20, status: 'Occupied', member_id: 'socio-123' }
  ];

  
  const mockMembers: MemberDTO[] = [
    { id: 'socio-123', name: 'Juan Perez', dni: '12345678', email: 'juan@test.com', birthdate: '1990-01-01', category: 'Pleno', status: 'Activo', created_at: new Date().toISOString() },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ==========================================
  // HELPERS PARA ABRIR MODALES Y LLENAR DATOS
  // ==========================================
  const openEditModal = async (user: any) => {
    await waitFor(() => {
      expect(screen.getByText(/10/)).toBeInTheDocument();
    });
    const row = screen.getByText(/10/).closest('tr') as HTMLElement;
    const editButton = within(row).getAllByRole('button')[0];
    await user.click(editButton);
    expect(await screen.findByText(/Guardar Cambios/i)).toBeInTheDocument(); 
  };

  const openCreateModal = async (user: any) => {
    const createButton = await screen.findByRole('button', { name: /Agregar Casillero/i });
    await user.click(createButton);
    expect(await screen.findByText(/Crear Casillero/i)).toBeInTheDocument();
  };

  const fillCreateForm = async (user: any) => {
    const numberInput = screen.getByLabelText(/Número de Casillero/i);
    const locationInput = screen.getByLabelText(/Ubicación/i);
    
    await user.type(numberInput, '30');
    await user.type(locationInput, 'Vestuario C');
  };

  // ==========================================
  // TESTS DEL UPDATE 
  // ==========================================
  describe('Integración de Update', () => {
    it('debe abrir el modal de edición al hacer clic en el botón editar', async () => {
      const user = userEvent.setup();
      
      // Inyectamos los mocks al inicio del test (Estilo Teammate)
      vi.mocked(lockersService.getAll).mockResolvedValue(mockLockers);
      vi.mocked(membersService.getAll).mockResolvedValue(mockMembers);
      
      renderWithProviders(<LockersView />);
      
      await openEditModal(user);
    });

    it('debe llamar al servicio de update al guardar los cambios del modal', async () => {
      const user = userEvent.setup();
      
      vi.mocked(lockersService.getAll).mockResolvedValue(mockLockers);
      vi.mocked(membersService.getAll).mockResolvedValue(mockMembers);
      vi.mocked(lockersService.update).mockResolvedValueOnce({ 
        id: 'uuid-1', location: 'Vestuario A', number: 10, status: 'Maintenance', member_id: null 
      } as LockerDTO);

      renderWithProviders(<LockersView />);
      await openEditModal(user);

      const submitButton = screen.getAllByRole('button', { name: /Guardar Cambios/i })[0];
      await user.click(submitButton);

      expect(lockersService.update).toHaveBeenCalledWith(10, expect.any(Object));
    });

    it('debe recargar la lista de casilleros tras una actualización exitosa', async () => {
      const user = userEvent.setup();
      
      vi.mocked(lockersService.getAll).mockResolvedValue(mockLockers);
      vi.mocked(membersService.getAll).mockResolvedValue(mockMembers);
      vi.mocked(lockersService.update).mockResolvedValueOnce({ 
        id: 'uuid-1', location: 'Vestuario A', number: 10, status: 'Occupied', member_id: 'socio-nuevo' 
      } as LockerDTO);

      renderWithProviders(<LockersView />);
      await openEditModal(user);

      const submitButton = screen.getAllByRole('button', { name: /Guardar Cambios/i })[0];
      await user.click(submitButton);

      await waitFor(() => {
        expect(lockersService.getAll).toHaveBeenCalledTimes(2);
      });
    });

    it('debe mostrar un mensaje de error si el update falla', async () => {
      const user = userEvent.setup();
      
      vi.mocked(lockersService.getAll).mockResolvedValue(mockLockers);
      vi.mocked(membersService.getAll).mockResolvedValue(mockMembers);
      vi.mocked(lockersService.update).mockRejectedValueOnce(new Error('ya tiene un casillero asignado'));

      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

      renderWithProviders(<LockersView />);
      await openEditModal(user);

      const submitButton = screen.getAllByRole('button', { name: /Guardar Cambios/i })[0];
      await user.click(submitButton);

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith(expect.stringMatching(/ya tiene un casillero asignado/i));
      });

      alertSpy.mockRestore();
    });
  });

  // ==========================================
  // TESTS DEL CREATE 
  // ==========================================
  describe('Integración de Create', () => {
    it('debe llamar al servicio de create al guardar los cambios en el modal de nuevo casillero', async () => {
      const user = userEvent.setup();
      
      vi.mocked(lockersService.getAll).mockResolvedValue(mockLockers);
      vi.mocked(membersService.getAll).mockResolvedValue(mockMembers);
      vi.mocked(lockersService.create).mockResolvedValueOnce({ 
        id: 'uuid-3', location: 'Vestuario C', number: 30, status: 'Available', member_id: null 
      } as LockerDTO);

      renderWithProviders(<LockersView />);
      await openCreateModal(user);
      await fillCreateForm(user);

      const submitButton = screen.getAllByRole('button', { name: /Crear Casillero/i })[0];
      await user.click(submitButton);

      expect(lockersService.create).toHaveBeenCalledWith(expect.any(Object)); 
    });

    it('debe recargar la lista de casilleros tras crear uno exitosamente', async () => {
      const user = userEvent.setup();
      
      vi.mocked(lockersService.getAll).mockResolvedValue(mockLockers);
      vi.mocked(membersService.getAll).mockResolvedValue(mockMembers);
      vi.mocked(lockersService.create).mockResolvedValueOnce({} as LockerDTO);

      renderWithProviders(<LockersView />);
      await openCreateModal(user);
      await fillCreateForm(user);

      const submitButton = screen.getAllByRole('button', { name: /Crear Casillero/i })[0];
      await user.click(submitButton);

      await waitFor(() => {
        expect(lockersService.getAll).toHaveBeenCalledTimes(2); 
      });
    });

    it('debe mostrar un mensaje de error si el create falla (Ej: Número ya existe)', async () => {
      const user = userEvent.setup();
      
      vi.mocked(lockersService.getAll).mockResolvedValue(mockLockers);
      vi.mocked(membersService.getAll).mockResolvedValue(mockMembers);
      vi.mocked(lockersService.create).mockRejectedValueOnce(new Error('Ya existe Casillero con ese numero'));

      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

      renderWithProviders(<LockersView />);
      await openCreateModal(user);
      await fillCreateForm(user);

      const submitButton = screen.getAllByRole('button', { name: /Crear Casillero/i })[0];
      await user.click(submitButton);

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith(expect.stringMatching(/Ya existe Casillero con ese numero/i));
      });

      alertSpy.mockRestore();
    });
  });
});