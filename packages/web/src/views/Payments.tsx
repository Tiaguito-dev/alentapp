import {
  Table, Button, Heading, HStack, IconButton,
  Stack, Text, Box, Flex, Spinner, Center, Input,
} from "@chakra-ui/react";
import {
  LuPlus, LuPencil, LuTrash2, LuRefreshCw, LuCheck, LuX,
} from "react-icons/lu";
import { useEffect, useState } from "react";
import { paymentsService } from "../services/payments";
import { membersService } from "../services/members";
import type {
  PaymentResponse, CreatePaymentRequest, UpdatePaymentRequest,
  MemberDTO, PaymentStatus,
} from "@alentapp/shared";
import {
  DialogRoot, DialogContent, DialogHeader, DialogTitle,
  DialogBody, DialogFooter, DialogActionTrigger, DialogCloseTrigger,
} from "../components/ui/dialog";
import { Field } from "../components/ui/field";
import {
  SelectRoot, SelectTrigger, SelectValueText,
  SelectContent, SelectItem, createListCollection,
} from "../components/ui/select";

const MONTH_NAMES = [
  '', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

const STATUS_STYLE: Record<PaymentStatus, { bg: string; color: string; label: string }> = {
  Pending:  { bg: 'yellow.50', color: 'yellow.700', label: 'Pendiente' },
  Paid:     { bg: 'green.50',  color: 'green.700',  label: 'Pagado'    },
  Canceled: { bg: 'gray.50',   color: 'gray.700',   label: 'Cancelado' },
  Overdue:  { bg: 'red.50',    color: 'red.700',    label: 'Vencido'   },
};

// Un pago Overdue es Pending en la DB — el backend lo resuelve al consultarlo
const isEditable  = (s: PaymentStatus) => s === 'Pending' || s === 'Overdue';
const isPayable   = (s: PaymentStatus) => s === 'Pending' || s === 'Overdue';
const isCancelable = (s: PaymentStatus) => s === 'Pending' || s === 'Overdue';
const isDeletable  = (s: PaymentStatus) => s !== 'Paid';

export function PaymentsView() {
  const [payments, setPayments]   = useState<PaymentResponse[]>([]);
  const [members, setMembers]     = useState<MemberDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError]         = useState<string | null>(null);

  // Modal de creación
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createForm, setCreateForm] = useState<CreatePaymentRequest>({
    member_id: '',
    amount: 0,
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    due_date: '',
  });

  // Modal de edición
  const [isEditOpen, setIsEditOpen]         = useState(false);
  const [editingId, setEditingId]           = useState<string | null>(null);
  const [editForm, setEditForm]             = useState<UpdatePaymentRequest>({});

  // Modal de marcar como pagado
  const [isPayOpen, setIsPayOpen] = useState(false);
  const [payingId, setPayingId] = useState<string | null>(null);
  const [paymentDate, setPaymentDate] = useState('');

  // Mapa memberId → nombre para mostrar en tabla
  const memberMap = members.reduce<Record<string, string>>((acc, m) => {
    acc[m.id] = m.name;
    return acc;
  }, {});

  const memberCollection = createListCollection({
    items: members.map((m) => ({ label: m.name, value: m.id })),
  });

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [paymentsData, membersData] = await Promise.all([
        paymentsService.getAll(),
        membersService.getAll(),
      ]);
      setPayments(paymentsData);
      setMembers(membersData);
    } catch (err: any) {
      setError(err.message || 'Error al cargar los datos');
    } finally {
      setIsLoading(false);
    }
  };

  const openCreateModal = () => {
    setCreateForm({
      member_id: members[0]?.id || '',
      amount: 0,
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear(),
      due_date: '',
    });
    setIsCreateOpen(true);
  };

  const openEditModal = (payment: PaymentResponse) => {
    setEditingId(payment.id);
    setEditForm({ amount: payment.amount, due_date: payment.due_date });
    setIsEditOpen(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await paymentsService.create(createForm);
      setIsCreateOpen(false);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Error al crear el pago');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;
    setIsSubmitting(true);
    try {
      await paymentsService.update(editingId, editForm);
      setIsEditOpen(false);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Error al actualizar el pago');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openPayModal = (id: string) => {
    setPayingId(id);
    setPaymentDate('');
    setIsPayOpen(true);
  };

  const handleMarkAsPaid = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingId) return;
    setIsSubmitting(true);
    try {
      let payload = {};
      if (paymentDate) {
        // Convertir a ISO string con timezone de Argentina
        const localDate = new Date(paymentDate);
        payload = { payment_date: localDate.toISOString() };
      }
      await paymentsService.markAsPaid(payingId, payload);
      setIsPayOpen(false);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Error al marcar como pagado');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = async (id: string) => {
    if (!window.confirm('¿Estás seguro de que deseas cancelar este pago?')) return;
    try {
      await paymentsService.cancel(id);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Error al cancelar el pago');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar este pago? Esta acción no se puede deshacer.')) return;
    try {
      await paymentsService.delete(id);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Error al eliminar el pago');
    }
  };

  useEffect(() => { fetchData(); }, []);

  return (
    <>
      {/* Modal Crear */}
      <DialogRoot open={isCreateOpen} onOpenChange={(e) => setIsCreateOpen(e.open)}>
        <DialogContent>
          <form onSubmit={handleCreate}>
            <DialogHeader>
              <DialogTitle>Nuevo Pago</DialogTitle>
            </DialogHeader>
            <DialogBody>
              <Stack gap="4">
                <Field label="Socio" required>
                  <SelectRoot
                    collection={memberCollection}
                    value={[createForm.member_id]}
                    onValueChange={(e) => setCreateForm({ ...createForm, member_id: e.value[0] })}
                  >
                    <SelectTrigger>
                      <SelectValueText placeholder="Seleccione un socio" />
                    </SelectTrigger>
                    <SelectContent>
                      {memberCollection.items.map((item) => (
                        <SelectItem item={item} key={item.value}>{item.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </SelectRoot>
                </Field>
                <Field label="Monto ($)" required>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="Ej. 5000"
                    value={createForm.amount || ''}
                    onChange={(e) => setCreateForm({ ...createForm, amount: parseFloat(e.target.value) })}
                    required
                  />
                </Field>
                <Field label="Mes" required>
                  <Input
                    type="number"
                    placeholder="1-12"
                    value={createForm.month}
                    onChange={(e) => setCreateForm({ ...createForm, month: parseInt(e.target.value) })}
                    required
                  />
                </Field>
                <Field label="Año" required>
                  <Input
                    type="number"
                    placeholder={String(new Date().getFullYear())}
                    value={createForm.year}
                    onChange={(e) => setCreateForm({ ...createForm, year: parseInt(e.target.value) })}
                    required
                  />
                </Field>
                <Field label="Fecha de vencimiento" required>
                  <Input
                    type="date"
                    value={createForm.due_date}
                    onChange={(e) => setCreateForm({ ...createForm, due_date: e.target.value })}
                    required
                  />
                </Field>
              </Stack>
            </DialogBody>
            <DialogFooter>
              <DialogActionTrigger asChild>
                <Button variant="outline">Cancelar</Button>
              </DialogActionTrigger>
              <Button type="submit" colorPalette="blue" loading={isSubmitting}>
                Crear Pago
              </Button>
            </DialogFooter>
            <DialogCloseTrigger />
          </form>
        </DialogContent>
      </DialogRoot>

      {/* Modal Editar */}
      <DialogRoot open={isEditOpen} onOpenChange={(e) => setIsEditOpen(e.open)}>
        <DialogContent>
          <form onSubmit={handleEdit}>
            <DialogHeader>
              <DialogTitle>Editar Pago</DialogTitle>
            </DialogHeader>
            <DialogBody>
              <Stack gap="4">
                <Field label="Monto ($)" required>
                  <Input
                    type="number"
                    step="0.01"
                    value={editForm.amount || ''}
                    onChange={(e) => setEditForm({ ...editForm, amount: parseFloat(e.target.value) })}
                    required
                  />
                </Field>
                <Field label="Fecha de vencimiento" required>
                  <Input
                    type="date"
                    value={editForm.due_date || ''}
                    onChange={(e) => setEditForm({ ...editForm, due_date: e.target.value })}
                    required
                  />
                </Field>
              </Stack>
            </DialogBody>
            <DialogFooter>
              <DialogActionTrigger asChild>
                <Button variant="outline">Cancelar</Button>
              </DialogActionTrigger>
              <Button type="submit" colorPalette="blue" loading={isSubmitting}>
                Guardar Cambios
              </Button>
            </DialogFooter>
            <DialogCloseTrigger />
          </form>
        </DialogContent>
      </DialogRoot>

      {/* Modal Marcar como Pagado */}
      <DialogRoot open={isPayOpen} onOpenChange={(e) => setIsPayOpen(e.open)}>
        <DialogContent>
          <form onSubmit={handleMarkAsPaid}>
            <DialogHeader>
              <DialogTitle>Registrar Pago</DialogTitle>
            </DialogHeader>
            <DialogBody>
              <Stack gap="4">
                <Field label="Fecha de pago (opcional)">
                  <Input
                    type="datetime-local"
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                  />
                </Field>
                <Text color="fg.muted" fontSize="sm">
                  Si no ingresás una fecha, se usará la fecha y hora actual del servidor.
                </Text>
              </Stack>
            </DialogBody>
            <DialogFooter>
              <DialogActionTrigger asChild>
                <Button variant="outline">Cancelar</Button>
              </DialogActionTrigger>
              <Button type="submit" colorPalette="blue" loading={isSubmitting}>
                Confirmar Pago
              </Button>
            </DialogFooter>
            <DialogCloseTrigger />
          </form>
        </DialogContent>
      </DialogRoot>

      {/* Vista principal */}
      <Stack gap="8">
        <Flex justify="space-between" align="center">
          <Stack gap="1">
            <Heading size="2xl" fontWeight="bold">Gestión de Pagos</Heading>
            <Text color="fg.muted" fontSize="md">
              Registrá y administrá las cuotas de los socios del club.
            </Text>
          </Stack>
          <HStack gap="3">
            <Button variant="outline" onClick={fetchData} disabled={isLoading}>
              <LuRefreshCw /> Actualizar
            </Button>
            <Button colorPalette="blue" size="md" onClick={openCreateModal}>
              <LuPlus /> Nuevo Pago
            </Button>
          </HStack>
        </Flex>

        {error && (
          <Box p="4" bg="red.50" color="red.700" borderRadius="md" border="1px solid" borderColor="red.200">
            <Text fontWeight="bold">Error:</Text>
            <Text>{error}</Text>
          </Box>
        )}

        <Box
          bg="bg.panel"
          borderRadius="xl"
          boxShadow="sm"
          borderWidth="1px"
          overflow="hidden"
          minH="300px"
          position="relative"
        >
          {isLoading ? (
            <Center h="300px">
              <Stack align="center" gap="4">
                <Spinner size="xl" color="blue.500" />
                <Text color="fg.muted">Cargando pagos...</Text>
              </Stack>
            </Center>
          ) : payments.length === 0 ? (
            <Center h="300px">
              <Stack align="center" gap="4">
                <Text color="fg.muted">No se encontraron pagos.</Text>
                <Button variant="ghost" onClick={fetchData}>Reintentar</Button>
              </Stack>
            </Center>
          ) : (
            <Table.Root size="md" variant="line" interactive>
              <Table.Header>
                <Table.Row bg="bg.muted/50">
                  <Table.ColumnHeader py="4">Socio</Table.ColumnHeader>
                  <Table.ColumnHeader py="4">Período</Table.ColumnHeader>
                  <Table.ColumnHeader py="4">Monto</Table.ColumnHeader>
                  <Table.ColumnHeader py="4">Estado</Table.ColumnHeader>
                  <Table.ColumnHeader py="4">Vencimiento</Table.ColumnHeader>
                  <Table.ColumnHeader py="4">Fecha de Pago</Table.ColumnHeader>
                  <Table.ColumnHeader py="4" textAlign="end">Acciones</Table.ColumnHeader>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {payments.map((payment) => {
                  const style = STATUS_STYLE[payment.status];
                  return (
                    <Table.Row key={payment.id} _hover={{ bg: 'bg.muted/30' }}>
                      <Table.Cell fontWeight="semibold" color="fg.emphasized">
                        {memberMap[payment.member_id] || payment.member_id}
                      </Table.Cell>
                      <Table.Cell color="fg.muted">
                        {MONTH_NAMES[payment.month]} {payment.year}
                      </Table.Cell>
                      <Table.Cell color="fg.muted">
                        ${payment.amount.toLocaleString('es-AR')}
                      </Table.Cell>
                      <Table.Cell>
                        <Box
                          display="inline-block"
                          px="2" py="0.5"
                          borderRadius="md"
                          bg={style.bg}
                          color={style.color}
                          fontSize="xs"
                          fontWeight="bold"
                        >
                          {style.label}
                        </Box>
                      </Table.Cell>
                      <Table.Cell color="fg.muted">{payment.due_date}</Table.Cell>
                      <Table.Cell color="fg.muted">
                        {payment.payment_date
                          ? new Date(payment.payment_date).toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' })
                          : '—'}
                      </Table.Cell>
                      <Table.Cell textAlign="end">
                        <HStack gap="1" justify="flex-end">
                          {isEditable(payment.status) && (
                            <IconButton variant="ghost" size="sm" aria-label="Editar" onClick={() => openEditModal(payment)}>
                              <LuPencil />
                            </IconButton>
                          )}
                          {isPayable(payment.status) && (
                            <IconButton variant="ghost" size="sm" colorPalette="green" aria-label="Marcar como pagado" onClick={() => openPayModal(payment.id)}>
                              <LuCheck />
                            </IconButton>
                          )}
                          {isCancelable(payment.status) && (
                            <IconButton variant="ghost" size="sm" colorPalette="orange" aria-label="Cancelar pago" onClick={() => handleCancel(payment.id)}>
                              <LuX />
                            </IconButton>
                          )}
                          {isDeletable(payment.status) && (
                            <IconButton variant="ghost" size="sm" colorPalette="red" aria-label="Eliminar" onClick={() => handleDelete(payment.id)}>
                              <LuTrash2 />
                            </IconButton>
                          )}
                        </HStack>
                      </Table.Cell>
                    </Table.Row>
                  );
                })}
              </Table.Body>
            </Table.Root>
          )}
        </Box>
      </Stack>
    </>
  );
}