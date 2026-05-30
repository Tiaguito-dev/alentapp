import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MedicalCertificatesView } from './MedicalCertificates';
import { medicalCertificatesService } from '../services/medicalCertificates';
import { membersService } from '../services/members';
import { Provider } from '../components/ui/provider';
import type { MedicalCertificateResponse, MemberDTO } from '@alentapp/shared';

vi.mock('../services/medicalCertificates', () => ({
  medicalCertificatesService: {
    getAll: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    invalidate: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock('../services/members', () => ({
  membersService: {
    getAll: vi.fn(),
  },
}));

describe('MedicalCertificatesView - Integración de Update', () => {
  const renderWithProviders = (ui: React.ReactElement) => {
    return render(<Provider>{ui}</Provider>);
  };

  const mockMembers: MemberDTO[] = [
    { id: 'member-1', name: 'Juan Perez', dni: '12345678', email: 'juan@test.com', birthdate: '1990-01-01', category: 'Pleno', status: 'Activo', created_at: new Date().toISOString() },
  ];

  const mockCertificates: MedicalCertificateResponse[] = [
    { id: 'cert-1', member_id: 'member-1', issue_date: '2026-05-01', expiry_date: '2027-05-01', doctor_license: '12345', is_validated: true, created_at: new Date().toISOString() },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('debe permitir editar un certificado médico existente', async () => {
    vi.mocked(medicalCertificatesService.getAll).mockResolvedValue(mockCertificates);
    vi.mocked(membersService.getAll).mockResolvedValue(mockMembers);
    vi.mocked(medicalCertificatesService.update).mockResolvedValueOnce({
      ...mockCertificates[0],
      doctor_license: '54321',
    });
    vi.mocked(medicalCertificatesService.getAll).mockResolvedValueOnce([
      { ...mockCertificates[0], doctor_license: '54321' },
    ]);

    renderWithProviders(<MedicalCertificatesView />);
    await waitFor(() => {
      expect(screen.getByText('12345')).toBeInTheDocument();
    });

    const user = userEvent.setup();
    // Abrir modal de edición (ajustar selector según UI real)
    const editButton = screen.getByLabelText(/Editar/i);
    await user.click(editButton);

    // Cambiar matrícula
    const licenseInput = screen.getByDisplayValue('12345');
    await user.clear(licenseInput);
    await user.type(licenseInput, '54321');

    const submitButton = screen.getByText('Guardar Cambios');
    await user.click(submitButton);

    expect(medicalCertificatesService.update).toHaveBeenCalledWith('cert-1', expect.objectContaining({
      doctor_license: '54321',
    }));

    await waitFor(() => {
      expect(screen.getByText('54321')).toBeInTheDocument();
    });
  });

  it('debe mostrar un mensaje de error si el update falla', async () => {
    vi.mocked(medicalCertificatesService.getAll).mockResolvedValue(mockCertificates);
    vi.mocked(membersService.getAll).mockResolvedValue(mockMembers);
    vi.mocked(medicalCertificatesService.update).mockRejectedValueOnce(new Error('error de validación'));

    renderWithProviders(<MedicalCertificatesView />);
    await waitFor(() => {
      expect(screen.getByText('12345')).toBeInTheDocument();
    });

    const user = userEvent.setup();
    const editButton = screen.getByLabelText(/Editar/i);
    await user.click(editButton);

    const licenseInput = screen.getByDisplayValue('12345');
    await user.clear(licenseInput);
    await user.type(licenseInput, '54321');

    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
    const submitButton = screen.getByText('Guardar Cambios');
    await user.click(submitButton);

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith(expect.stringMatching(/error de validación/i));
    });
    alertSpy.mockRestore();
  });
});
