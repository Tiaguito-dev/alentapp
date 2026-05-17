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
import { disciplinesService } from "../services/Disciplines";
import { membersService } from "../services/members";
import type { 
  DisciplineDTO, 
  CreateDisciplineRequest, 
  UpdateDisciplineRequest, 
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

const suspensionTypes = createListCollection({
  items: [
    { label: "Sí, Suspensión Total", value: "true" },
    { label: "No, Parcial / Advertencia", value: "false" },
  ],
});

export function DisciplinesView() {
  const [disciplines, setDisciplines] = useState<DisciplineDTO[]>([]);
  const [members, setMembers] = useState<MemberDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // State for the modal
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingDisciplineId, setEditingDisciplineId] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState<{
    name: string;
    description: string;
    start_date: string;
    end_date: string;
    is_total_suspension: boolean;
    member_id: string;
  }>({
    name: "",
    description: "",
    start_date: "",
    end_date: "",
    is_total_suspension: false,
    member_id: "",
  });

  // Colección dinámica de socios para el Select
  const memberCollection = useMemo(() => {
    return createListCollection({
      items: members.map((m) => ({ label: `${m.name} (DNI: ${m.dni})`, value: m.id }))
    });
  }, [members]);

  // Mapa para mostrar el nombre del socio en la tabla
  const memberMap = useMemo(() => {
    return members.reduce<Record<string, string>>((acc, m) => {
      acc[m.id] = m.name;
      return acc;
    }, {});
  }, [members]);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [disciplinesData, membersData] = await Promise.all([
        disciplinesService.getAll(),
        membersService.getAll(),
      ]);
      setDisciplines(disciplinesData);
      setMembers(membersData);
    } catch (err: any) {
      setError(err.message || "Error al cargar los datos");
    } finally {
      setIsLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingDisciplineId(null);
    setFormData({ 
      name: "", 
      description: "", 
      start_date: "", 
      end_date: "", 
      is_total_suspension: false, 
      member_id: "" 
    });
    setIsDialogOpen(true);
  };

  const openEditModal = (discipline: DisciplineDTO) => {
    setEditingDisciplineId(discipline.id);
    
    // Formatear fechas para el input type="date" (YYYY-MM-DD)
    const formattedStart = discipline.start_date ? discipline.start_date.split('T')[0] : "";
    const formattedEnd = discipline.end_date ? discipline.end_date.split('T')[0] : "";

    setFormData({
      name: discipline.name,
      description: discipline.description || "",
      start_date: formattedStart,
      end_date: formattedEnd,
      is_total_suspension: discipline.is_total_suspension,
      member_id: "", 
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const isoStart = new Date(formData.start_date).toISOString();
      const isoEnd = new Date(formData.end_date).toISOString();

      if (editingDisciplineId) {
        const updateData: UpdateDisciplineRequest = {
          end_date: isoEnd,
          is_total_suspension: formData.is_total_suspension,
          member_id: formData.member_id || null,
        };
        await disciplinesService.update(editingDisciplineId, updateData);
      } else {
        if (!formData.member_id) throw new Error("Debe seleccionar un socio.");
        
        const createData: CreateDisciplineRequest = {
          name: formData.name,
          description: formData.description || undefined,
          start_date: isoStart,
          end_date: isoEnd,
          member_id: formData.member_id,
        };
        await disciplinesService.create(createData);
      }
      setIsDialogOpen(false);
      fetchData(); 
    } catch (err: any) {
      alert(err.message || "Error al guardar la sanción");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteDiscipline = async (id: string, name: string) => {
    if (window.confirm(`¿Estás seguro de que deseas eliminar la sanción "${name}"? Esta acción no se puede deshacer.`)) {
      try {
        await disciplinesService.delete(id);
        fetchData(); 
      } catch (err: any) {
        alert(err.message || "Error al eliminar la sanción");
      }
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const formatDate = (isoString: string) => {
    if (!isoString) return "-";
    return new Date(isoString).toLocaleDateString('es-AR', {
      day: '2-digit', month: '2-digit', year: 'numeric'
    });
  };

  return (
    <DialogRoot open={isDialogOpen} onOpenChange={(e) => setIsDialogOpen(e.open)}>
      <Stack gap="8">
        <Flex justify="space-between" align="center">
          <Stack gap="1">
            <Heading size="2xl" fontWeight="bold">Sanciones Disciplinarias</Heading>
            <Text color="fg.muted" fontSize="md">
              Gestiona las penalizaciones y suspensiones de los miembros.
            </Text>
          </Stack>
          <HStack gap="3">
            <Button variant="outline" onClick={fetchData} disabled={isLoading}>
              <LuRefreshCw /> Actualizar
            </Button>
            <Button colorPalette="blue" size="md" onClick={openCreateModal}>
              <LuPlus /> Nueva Sanción
            </Button>
          </HStack>
        </Flex>

        <DialogContent>
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>{editingDisciplineId ? "Editar Sanción" : "Registrar Nueva Sanción"}</DialogTitle>
            </DialogHeader>
            <DialogBody>
              <Stack gap="4">
                <Field label="Nombre del Incidente" required>
                  <Input 
                    placeholder="Ej. Comportamiento inadecuado" 
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    disabled={editingDisciplineId !== null}
                    required
                  />
                </Field>
                <Field label="Descripción">
                  <Input 
                    placeholder="Detalles de la sanción" 
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    disabled={editingDisciplineId !== null}
                  />
                </Field>

                {editingDisciplineId === null && (
                  <Field label="Socio Sancionado" required>
                    <SelectRoot 
                      collection={memberCollection} 
                      value={[formData.member_id]}
                      onValueChange={(e) => setFormData({ ...formData, member_id: e.value[0] })}
                    >
                      <SelectTrigger>
                        <SelectValueText placeholder="Seleccione un socio" />
                      </SelectTrigger>
                      <SelectContent>
                        {memberCollection.items.map((m) => (
                          <SelectItem item={m} key={m.value}>
                            {m.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </SelectRoot>
                  </Field>
                )}

                <HStack gap="4" width="full">
                  <Field label="Fecha de Inicio" required>
                    <Input 
                      type="date" 
                      value={formData.start_date}
                      onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                      disabled={editingDisciplineId !== null}
                      required
                    />
                  </Field>
                  <Field label="Fecha de Fin" required>
                    <Input 
                      type="date" 
                      value={formData.end_date}
                      onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                      required
                    />
                  </Field>
                </HStack>

                <Field label="Tipo de Suspensión" required>
                  <SelectRoot 
                    collection={suspensionTypes} 
                    value={[formData.is_total_suspension ? "true" : "false"]}
                    onValueChange={(e) => setFormData({ ...formData, is_total_suspension: e.value[0] === "true" })}
                  >
                    <SelectTrigger>
                      <SelectValueText placeholder="Seleccione el tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      {suspensionTypes.items.map((type) => (
                        <SelectItem item={type} key={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </SelectRoot>
                </Field>
              </Stack>
            </DialogBody>
            <DialogFooter>
              <DialogActionTrigger asChild>
                <Button variant="outline">Cancelar</Button>
              </DialogActionTrigger>
              <Button type="submit" colorPalette="blue" loading={isSubmitting}>
                {editingDisciplineId ? "Guardar Cambios" : "Aplicar Sanción"}
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
                <Text color="fg.muted">Cargando sanciones...</Text>
              </Stack>
            </Center>
          ) : disciplines.length === 0 ? (
            <Center h="300px">
              <Stack align="center" gap="4">
                <Text color="fg.muted">No se encontraron sanciones.</Text>
                <Button variant="ghost" onClick={fetchData}>Reintentar</Button>
              </Stack>
            </Center>
          ) : (
            <Table.Root size="md" variant="line" interactive>
              <Table.Header>
                <Table.Row bg="bg.muted/50">
                  <Table.ColumnHeader py="4">Sanción</Table.ColumnHeader>
                  <Table.ColumnHeader py="4">Descripción</Table.ColumnHeader>
                  {/* 👇 COLUMNA SOCIO AÑADIDA 👇 */}
                  <Table.ColumnHeader py="4">Socio</Table.ColumnHeader>
                  <Table.ColumnHeader py="4">Inicio</Table.ColumnHeader>
                  <Table.ColumnHeader py="4">Fin</Table.ColumnHeader>
                  <Table.ColumnHeader py="4">Tipo</Table.ColumnHeader>
                  <Table.ColumnHeader py="4" textAlign="end">Acciones</Table.ColumnHeader>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {disciplines.map((discipline) => (
                  <Table.Row key={discipline.id} _hover={{ bg: "bg.muted/30" }}>
                    <Table.Cell fontWeight="semibold" color="fg.emphasized">
                      {discipline.name}
                    </Table.Cell>
                    <Table.Cell color="fg.muted" maxW="200px" overflow="hidden" textOverflow="ellipsis" whiteSpace="nowrap">
                      {discipline.description || "-"}
                    </Table.Cell>
                    {/* 👇 CELDA SOCIO AÑADIDA 👇 */}
                    <Table.Cell fontWeight="medium" color="blue.600">
                      {memberMap[discipline.member_id] || "Socio desconocido"}
                    </Table.Cell>
                    <Table.Cell color="fg.muted">{formatDate(discipline.start_date)}</Table.Cell>
                    <Table.Cell color="fg.muted">{formatDate(discipline.end_date)}</Table.Cell>
                    <Table.Cell>
                      <Box 
                        display="inline-block" 
                        px="2" 
                        py="0.5" 
                        borderRadius="md" 
                        bg={discipline.is_total_suspension ? 'red.50' : 'orange.50'} 
                        color={discipline.is_total_suspension ? 'red.700' : 'orange.700'} 
                        fontSize="xs" 
                        fontWeight="bold"
                      >
                        {discipline.is_total_suspension ? 'Total' : 'Parcial'}
                      </Box>
                    </Table.Cell>
                    <Table.Cell textAlign="end">
                      <HStack gap="2" justify="flex-end">
                        <IconButton 
                          variant="ghost" 
                          size="sm" 
                          aria-label="Editar sanción"
                          onClick={() => openEditModal(discipline)}
                        >
                          <LuPencil />
                        </IconButton>
                        <IconButton 
                          variant="ghost" 
                          size="sm" 
                          colorPalette="red" 
                          aria-label="Eliminar sanción"
                          onClick={() => handleDeleteDiscipline(discipline.id, discipline.name)}
                        >
                          <LuTrash2 />
                        </IconButton>
                      </HStack>
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table.Root>
          )}
        </Box>
      </Stack>
    </DialogRoot>
  );
}