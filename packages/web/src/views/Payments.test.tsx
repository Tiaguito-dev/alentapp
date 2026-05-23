import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PaymentsView } from './Payments';
import { paymentsService } from '../services/payments';
import { membersService } from '../services/members';
import { Provider } from '../components/ui/provider';
import type { PaymentResponse, MemberDTO } from '@alentapp/shared';

//mockeamos el servicio
vi.mock('../services/payments', () => ({
  paymentsService: {
    getAll: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    markAsPaid: vi.fn(),
    cancel: vi.fn(),
    delete: vi.fn(),
  },
}));

//tambien mockeamos
vi.mock('../services/members', () => ({
  membersService: {
    getAll: vi.fn(),
  },
}));

describe('PaymentsView', () => {
  const renderWithProviders = (ui: React.ReactElement) => {
    return render(<Provider>{ui}</Provider>);
  };

  const mockMembers: MemberDTO[] = [
    { id: 'member-1', name: 'Juan Perez', dni: '12345678', email: 'juan@test.com', birthdate: '1990-01-01', category: 'Pleno', status: 'Activo', created_at: new Date().toISOString() },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('debe mostrar el estado de carga y luego renderizar lista vacía', async () => {
    vi.mocked(paymentsService.getAll).mockResolvedValueOnce([]);
    vi.mocked(membersService.getAll).mockResolvedValueOnce(mockMembers);

    renderWithProviders(<PaymentsView />);

    expect(screen.getByText('Cargando pagos...')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.queryByText('Cargando pagos...')).not.toBeInTheDocument();
    });

    expect(screen.getByText('No se encontraron pagos.')).toBeInTheDocument();
  });

  it('debe renderizar la lista de pagos si el backend responde exitosamente', async () => {
    const mockPayments: PaymentResponse[] = [
      { id: '1', member_id: 'member-1', amount: 1500, month: 5, year: 2026, status: 'Pending', due_date: '2026-05-31', payment_date: null },
    ];

    vi.mocked(paymentsService.getAll).mockResolvedValueOnce(mockPayments);
    vi.mocked(membersService.getAll).mockResolvedValueOnce(mockMembers);

    renderWithProviders(<PaymentsView />);

    await waitFor(() => {
      expect(screen.getByText('Juan Perez')).toBeInTheDocument();
    });

    expect(screen.getByText('Mayo 2026')).toBeInTheDocument();
    expect(screen.getByText('$1.500')).toBeInTheDocument();
  });

  it('debe permitir crear un nuevo pago mediante el formulario', async () => {
    const user = (await import('@testing-library/user-event')).default.setup();

    vi.mocked(paymentsService.getAll).mockResolvedValue([]);
    vi.mocked(membersService.getAll).mockResolvedValue(mockMembers);
    vi.mocked(paymentsService.create).mockResolvedValueOnce({
      id: '2', member_id: 'member-1', amount: 2000, month: 6, year: 2026,
      status: 'Pending', due_date: '2026-06-30', payment_date: null,
    });

    renderWithProviders(<PaymentsView />);

    await waitFor(() => {
      expect(screen.queryByText('Cargando pagos...')).not.toBeInTheDocument();
    });

    const addButton = screen.getByText(/Nuevo Pago/i);
    await user.click(addButton);

    const montoInput = screen.getByPlaceholderText('Ej. 5000');
    await user.clear(montoInput);
    await user.type(montoInput, '2000');

    const { fireEvent } = await import('@testing-library/react');
    const dateInput = screen.getByDisplayValue('');
    fireEvent.change(dateInput, { target: { value: '2026-06-30' } });

    const submitButton = screen.getByText('Crear Pago');
    await user.click(submitButton);

    expect(paymentsService.create).toHaveBeenCalledWith(expect.objectContaining({
      amount: 2000,
      member_id: 'member-1',
    }));
  });

  it('debe permitir editar un pago existente', async () => {
    const user = (await import('@testing-library/user-event')).default.setup();

    const mockPayments: PaymentResponse[] = [
      { id: '1', member_id: 'member-1', amount: 1500, month: 5, year: 2026, status: 'Pending', due_date: '2026-05-31', payment_date: null },
    ];

    vi.mocked(paymentsService.getAll).mockResolvedValue(mockPayments);
    vi.mocked(membersService.getAll).mockResolvedValue(mockMembers);
    vi.mocked(paymentsService.update).mockResolvedValueOnce({
      ...mockPayments[0],
      amount: 2000,
    });

    renderWithProviders(<PaymentsView />);

    await waitFor(() => {
      expect(screen.getByText('Juan Perez')).toBeInTheDocument();
    });

    const editButton = screen.getByLabelText(/Editar/i);
    await user.click(editButton);

    const montoInput = screen.getByDisplayValue('1500');
    await user.clear(montoInput);
    await user.type(montoInput, '2000');

    const submitButton = screen.getByText('Guardar Cambios');
    await user.click(submitButton);

    expect(paymentsService.update).toHaveBeenCalledWith('1', expect.objectContaining({
      amount: 2000,
    }));
  });

  it('debe permitir marcar un pago como pagado', async () => {
    const user = (await import('@testing-library/user-event')).default.setup();

    const mockPayments: PaymentResponse[] = [
      { id: '1', member_id: 'member-1', amount: 1500, month: 5, year: 2026, status: 'Pending', due_date: '2026-05-31', payment_date: null },
    ];

    vi.mocked(paymentsService.getAll).mockResolvedValue(mockPayments);
    vi.mocked(membersService.getAll).mockResolvedValue(mockMembers);
    vi.mocked(paymentsService.markAsPaid).mockResolvedValueOnce({
      ...mockPayments[0],
      status: 'Paid',
      payment_date: '2026-05-15T10:00:00.000Z',
    });

    renderWithProviders(<PaymentsView />);

    await waitFor(() => {
      expect(screen.getByText('Juan Perez')).toBeInTheDocument();
    });

    const payButton = screen.getByLabelText(/Marcar como pagado/i);
    await user.click(payButton);

    const submitButton = screen.getByText('Confirmar Pago');
    await user.click(submitButton);

    expect(paymentsService.markAsPaid).toHaveBeenCalledWith('1', expect.objectContaining({}));
  });

  it('debe permitir cancelar un pago con confirmación', async () => {
    const user = (await import('@testing-library/user-event')).default.setup();

    const mockPayments: PaymentResponse[] = [
      { id: '1', member_id: 'member-1', amount: 1500, month: 5, year: 2026, status: 'Pending', due_date: '2026-05-31', payment_date: null },
    ];

    vi.mocked(paymentsService.getAll).mockResolvedValue(mockPayments);
    vi.mocked(membersService.getAll).mockResolvedValue(mockMembers);
    vi.mocked(paymentsService.cancel).mockResolvedValueOnce({
      ...mockPayments[0],
      status: 'Canceled',
    });

    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);

    renderWithProviders(<PaymentsView />);

    await waitFor(() => {
      expect(screen.getByText('Juan Perez')).toBeInTheDocument();
    });

    const cancelButton = screen.getByLabelText(/Cancelar pago/i);
    await user.click(cancelButton);

    expect(confirmSpy).toHaveBeenCalledWith('¿Estás seguro de que deseas cancelar este pago?');
    expect(paymentsService.cancel).toHaveBeenCalledWith('1');

    confirmSpy.mockRestore();
  });
});