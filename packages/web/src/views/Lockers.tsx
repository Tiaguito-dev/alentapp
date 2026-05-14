import { 
  Table, 
  Button, 
  Heading, 
  HStack, 
  IconButton, 
  Stack, 
  Text, 
  Box,
  Flex,
  Spinner,
  Center,
  Input
} from "@chakra-ui/react";
import { LuPlus, LuPencil, LuTrash2, LuRefreshCw } from "react-icons/lu";
import { useEffect, useState, useMemo } from "react";
import { lockersService } from "../services/lockers";
import { membersService } from "../services/members";
import type { 
  LockerDTO, 
  CreateLockerRequest, 
  UpdateLockerRequest, 
  LockerStatus, 
  MemberDTO 
} from "@alentapp/shared";
import { 
  DialogRoot, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogBody, 
  DialogFooter, 
  DialogActionTrigger,
  DialogCloseTrigger
} from "../components/ui/dialog";
import { Field } from "../components/ui/field";
import { 
  SelectRoot, 
  SelectTrigger, 
  SelectValueText, 
  SelectContent, 
  SelectItem, 
  createListCollection 
} from "../components/ui/select";

// Configuración de estilos y etiquetas para los estados (Igual que STATUS_STYLE en pagos)
const LOCKER_STATUS_STYLE: Record<LockerStatus, { bg: string; color: string; label: string }> = {
  Available:   { bg: 'green.50',  color: 'green.700',  label: 'Disponible' },
  Occupied:    { bg: 'blue.50',   color: 'blue.700',   label: 'Ocupado'    },
  Maintenance: { bg: 'orange.50', color: 'orange.700', label: 'Mantenimiento' },
};

const statusCollection = createListCollection({
  items: [
    { label: "Disponible", value: "Available" },
    { label: "Ocupado", value: "Occupied" },
    { label: "En Mantenimiento", value: "Maintenance" },
  ],
});

export function LockersView() {
  const [lockers, setLockers] = useState<LockerDTO[]>([]);
  const [members, setMembers] = useState<MemberDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Estados para el Modal
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingLockerNumber, setEditingLockerNumber] = useState<number | null>(null);

  // Estado del Formulario
  const [formData, setFormData] = useState<{
    number: number | "";
    location: string;
    status: LockerStatus;
    member_id: string;
  }>({
    number: "",
    location: "",
    status: "Available",
    member_id: "",
  });

  // Mapa memberId -> nombre para mostrar en la tabla (Igual que en Payments)
  const memberMap = useMemo(() => {
    return members.reduce<Record<string, string>>((acc, m) => {
      acc[m.id] = m.name;
      return acc;
    }, {});
  }, [members]);

  // Colección de socios para el Select del formulario
  const memberCollection = useMemo(() => {
    return createListCollection({
      items: [
        { label: "Sin asignar", value: "" },
        ...members.map((m) => ({ label: `${m.name} (DNI: ${m.dni})`, value: m.id }))
      ],
    });
  }, [members]);

  // Carga de datos usando Promise.all (Como en pagos)
  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [lockersData, membersData] = await Promise.all([
        lockersService.getAll(),
        membersService.getAll(),
      ]);
      setLockers(lockersData);
      setMembers(membersData);
    } catch (err: any) {
      setError(err.message || "Error al cargar los datos");
    } finally {
      setIsLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingLockerNumber(null);
    setFormData({ number: "", location: "", status: "Available", member_id: "" });
    setIsDialogOpen(true);
  };

  const openEditModal = (locker: LockerDTO) => {
    setEditingLockerNumber(locker.number);
    setFormData({
      number: locker.number,
      location: locker.location,
      status: locker.status,
      member_id: locker.member_id || "",
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (editingLockerNumber !== null) {
        const updateData: UpdateLockerRequest = {
          location: formData.location,
          status: formData.status,
          member_id: formData.member_id || null,
        };
        await lockersService.update(editingLockerNumber, updateData);
      } else {
        const createData: CreateLockerRequest = {
          number: Number(formData.number),
          location: formData.location,
          status: formData.status,
        };
        await lockersService.create(createData);
      }
      setIsDialogOpen(false);
      fetchData();
    } catch (err: any) {
      // --- MANEJO DE ERROR AMIGABLE PARA EL USUARIO ---
      if (err.message === 'error: casillero en mantenimiento') {
        alert("No se puede reparar y asignar un socio al mismo tiempo. Por favor, primero cambie el estado a 'Disponible' y guarde. Luego vuelva a editarlo para asignar al socio.");
      } else {
        alert(err.message || "Error al guardar el casillero");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteLocker = async (number: number) => {
    if (window.confirm(`¿Estás seguro de que deseas eliminar el casillero #${number}?`)) {
      try {
        await lockersService.delete(number);
        fetchData();
      } catch (err: any) {
        alert(err.message || "Error al eliminar el casillero");
      }
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <DialogRoot open={isDialogOpen} onOpenChange={(e) => setIsDialogOpen(e.open)}>
      <Stack gap="8">
        <Flex justify="space-between" align="center">
          <Stack gap="1">
            <Heading size="2xl" fontWeight="bold">Administración de Casilleros</Heading>
            <Text color="fg.muted" fontSize="md">
              Gestioná las ubicaciones y asignaciones de los casilleros del club.
            </Text>
          </Stack>
          <HStack gap="3">
            <Button variant="outline" onClick={fetchData} disabled={isLoading}>
              <LuRefreshCw /> Actualizar
            </Button>
            <Button colorPalette="blue" size="md" onClick={openCreateModal}>
              <LuPlus /> Agregar Casillero
            </Button>
          </HStack>
        </Flex>

        {/* Modal de Formulario */}
        <DialogContent>
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>{editingLockerNumber !== null ? `Editar Casillero #${editingLockerNumber}` : "Nuevo Casillero"}</DialogTitle>
            </DialogHeader>
            <DialogBody>
              <Stack gap="4">
                <Field label="Número de Casillero" required>
                  <Input 
                    type="number"
                    value={formData.number}
                    onChange={(e) => setFormData({ ...formData, number: e.target.value === "" ? "" : Number(e.target.value) })}
                    disabled={editingLockerNumber !== null}
                    required
                  />
                </Field>
                <Field label="Ubicación" required>
                  <Input 
                    placeholder="Ej. Vestuario Sector A" 
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    required
                  />
                </Field>

                {/* Selección de Estado (Solo al editar) */}
                {editingLockerNumber !== null && (
                  <Field label="Estado" required>
                    <SelectRoot 
                      collection={statusCollection} 
                      value={[formData.status]}
                      onValueChange={(e) => setFormData({ ...formData, status: e.value[0] as LockerStatus })}
                    >
                      <SelectTrigger>
                        <SelectValueText placeholder="Seleccione el estado" />
                      </SelectTrigger>
                      <SelectContent>
                        {statusCollection.items.map((stat) => (
                          <SelectItem item={stat} key={stat.value}>{stat.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </SelectRoot>
                  </Field>
                )}

                {/* Selección de Socio por Nombre (Solo al editar y si no está en mantenimiento) */}
                {editingLockerNumber !== null && formData.status !== 'Maintenance' && (
                  <Field label="Socio Asignado">
                    <SelectRoot 
                      collection={memberCollection} 
                      value={[formData.member_id]}
                      onValueChange={(e) => {
                        const selectedMember = e.value[0];
                        setFormData({ 
                          ...formData, 
                          member_id: selectedMember,
                          status: selectedMember ? "Occupied" : "Available" 
                        });
                      }}
                    >
                      <SelectTrigger>
                        <SelectValueText placeholder="Seleccione un socio" />
                      </SelectTrigger>
                      <SelectContent>
                        {memberCollection.items.map((m) => (
                          <SelectItem item={m} key={m.value}>{m.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </SelectRoot>
                  </Field>
                )}
              </Stack>
            </DialogBody>
            <DialogFooter>
              <DialogActionTrigger asChild>
                <Button variant="outline">Cancelar</Button>
              </DialogActionTrigger>
              <Button type="submit" colorPalette="blue" loading={isSubmitting}>
                {editingLockerNumber !== null ? "Guardar Cambios" : "Crear Casillero"}
              </Button>
            </DialogFooter>
            <DialogCloseTrigger />
          </form>
        </DialogContent>

        {error && (
          <Box p="4" bg="red.50" color="red.700" borderRadius="md" border="1px solid" borderColor="red.200">
            <Text fontWeight="bold">Error:</Text>
            <Text>{error}</Text>
          </Box>
        )}

        <Box bg="bg.panel" borderRadius="xl" boxShadow="sm" borderWidth="1px" overflow="hidden" minH="300px">
          {isLoading ? (
            <Center h="300px">
              <Stack align="center" gap="4">
                <Spinner size="xl" color="blue.500" />
                <Text color="fg.muted">Cargando datos...</Text>
              </Stack>
            </Center>
          ) : lockers.length === 0 ? (
            <Center h="300px">
              <Text color="fg.muted">No se encontraron casilleros.</Text>
            </Center>
          ) : (
            <Table.Root size="md" variant="line" interactive>
              <Table.Header>
                <Table.Row bg="bg.muted/50">
                  <Table.ColumnHeader py="4">Número</Table.ColumnHeader>
                  <Table.ColumnHeader py="4">Ubicación</Table.ColumnHeader>
                  <Table.ColumnHeader py="4">Estado</Table.ColumnHeader>
                  <Table.ColumnHeader py="4">Socio Asignado</Table.ColumnHeader>
                  <Table.ColumnHeader py="4" textAlign="end">Acciones</Table.ColumnHeader>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {lockers.map((locker) => {
                  const style = LOCKER_STATUS_STYLE[locker.status];
                  return (
                    <Table.Row key={locker.id} _hover={{ bg: "bg.muted/30" }}>
                      <Table.Cell fontWeight="bold" color="fg.emphasized">#{locker.number}</Table.Cell>
                      <Table.Cell color="fg.muted">{locker.location}</Table.Cell>
                      <Table.Cell>
                        <Box display="inline-block" px="2" py="0.5" borderRadius="md" bg={style.bg} color={style.color} fontSize="xs" fontWeight="bold">
                          {style.label}
                        </Box>
                      </Table.Cell>
                      <Table.Cell>
                        {locker.member_id ? (
                          <Text fontWeight="medium" color="fg.emphasized">
                            {memberMap[locker.member_id] || "Socio desconocido"}
                          </Text>
                        ) : (
                          <Text fontStyle="italic" color="gray.400">Sin asignar</Text>
                        )}
                      </Table.Cell>
                      <Table.Cell textAlign="end">
                        <HStack gap="2" justify="flex-end">
                          <IconButton variant="ghost" size="sm" onClick={() => openEditModal(locker)}>
                            <LuPencil />
                          </IconButton>
                          <IconButton variant="ghost" size="sm" colorPalette="red" onClick={() => handleDeleteLocker(locker.number)}>
                            <LuTrash2 />
                          </IconButton>
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
    </DialogRoot>
  );
}