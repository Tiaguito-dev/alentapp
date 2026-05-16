
import {
  Box,
  Button,
  Center,
  Heading,
  HStack,
  Spinner,
  Stack,
  Table,
  Text,
  Input,
  Flex,
} from '@chakra-ui/react';
import { useEffect, useState, useMemo } from 'react';
import { LuRefreshCw, LuPlus } from 'react-icons/lu';
import type { MedicalCertificateResponse, CreateMedicalCertificateRequest, MemberDTO } from '@alentapp/shared';
import { medicalCertificatesService } from '../services/medicalCertificates';
import { membersService } from '../services/members';
import {
  DialogRoot, DialogContent, DialogHeader, DialogTitle, DialogBody, DialogFooter, DialogActionTrigger, DialogCloseTrigger
} from '../components/ui/dialog';
import { Field } from '../components/ui/field';
import { SelectRoot, SelectTrigger, SelectValueText, SelectContent, SelectItem, createListCollection } from '../components/ui/select';

export function MedicalCertificatesView() {
  const [certificates, setCertificates] = useState<MedicalCertificateResponse[]>([]);
  const [members, setMembers] = useState<MemberDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal de creación
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createForm, setCreateForm] = useState<CreateMedicalCertificateRequest>({
    member_id: '',
    issue_date: '',
    expiry_date: '',
    doctor_license: '',
  });

  // Colección de socios para el Select
  const memberCollection = useMemo(() => {
    return createListCollection({
      items: members.map((m) => ({ label: m.name, value: m.id })),
    });
  }, [members]);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [certificatesData, membersData] = await Promise.all([
        medicalCertificatesService.getAll(),
        membersService.getAll(),
      ]);
      setCertificates(certificatesData);
      setMembers(membersData);
    } catch (err: any) {
      setError(err.message || 'Error al cargar certificados médicos');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openCreateModal = () => {
    setCreateForm({
      member_id: members[0]?.id || '',
      issue_date: '',
      expiry_date: '',
      doctor_license: '',
    });
    setIsCreateOpen(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await medicalCertificatesService.create(createForm);
      setIsCreateOpen(false);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Error al crear el certificado médico');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Modal Crear */}
      <DialogRoot open={isCreateOpen} onOpenChange={(e) => setIsCreateOpen(e.open)}>
        <DialogContent>
          <form onSubmit={handleCreate}>
            <DialogHeader>
              <DialogTitle>Nuevo Certificado Médico</DialogTitle>
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
                <Field label="Fecha de emisión" required>
                  <Input
                    type="date"
                    value={createForm.issue_date}
                    onChange={(e) => setCreateForm({ ...createForm, issue_date: e.target.value })}
                    required
                  />
                </Field>
                <Field label="Fecha de vencimiento" required>
                  <Input
                    type="date"
                    value={createForm.expiry_date}
                    onChange={(e) => setCreateForm({ ...createForm, expiry_date: e.target.value })}
                    required
                  />
                </Field>
                <Field label="Matrícula del médico" required>
                  <Input
                    type="text"
                    placeholder="Ej. 12345"
                    value={createForm.doctor_license}
                    onChange={(e) => setCreateForm({ ...createForm, doctor_license: e.target.value })}
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
                Crear Certificado
              </Button>
            </DialogFooter>
            <DialogCloseTrigger />
          </form>
        </DialogContent>
      </DialogRoot>

      {/* Vista principal */}
      <Stack gap='8'>
        <Flex justify='space-between' align='center'>
          <Stack gap='1'>
            <Heading size='2xl' fontWeight='bold'>
              Consulta de Certificados Médicos
            </Heading>
            <Text color='fg.muted' fontSize='md'>
              Historial de certificados activos ordenado por fecha de creación.
            </Text>
          </Stack>
          <HStack gap='3'>
            <Button variant='outline' onClick={fetchData} disabled={isLoading}>
              <LuRefreshCw /> Actualizar
            </Button>
            <Button colorPalette='blue' size='md' onClick={openCreateModal}>
              <LuPlus /> Nuevo Certificado
            </Button>
          </HStack>
        </Flex>

        {error && (
          <Box p='4' bg='red.50' color='red.700' borderRadius='md' border='1px solid' borderColor='red.200'>
            <Text fontWeight='bold'>Error:</Text>
            <Text>{error}</Text>
          </Box>
        )}

        <Box bg='bg.panel' borderRadius='xl' boxShadow='sm' borderWidth='1px' overflow='hidden' minH='300px'>
          {isLoading ? (
            <Center h='300px'>
              <Stack align='center' gap='4'>
                <Spinner size='xl' color='blue.500' />
                <Text color='fg.muted'>Cargando certificados...</Text>
              </Stack>
            </Center>
          ) : certificates.length === 0 ? (
            <Center h='300px'>
              <Text color='fg.muted'>No hay certificados activos.</Text>
            </Center>
          ) : (
            <Table.Root size='md' variant='line'>
              <Table.Header>
                <Table.Row bg='bg.muted/50'>
                  <Table.ColumnHeader>ID</Table.ColumnHeader>
                  <Table.ColumnHeader>Socio</Table.ColumnHeader>
                  <Table.ColumnHeader>Emisión</Table.ColumnHeader>
                  <Table.ColumnHeader>Vencimiento</Table.ColumnHeader>
                  <Table.ColumnHeader>Matrícula</Table.ColumnHeader>
                  <Table.ColumnHeader>Validado</Table.ColumnHeader>
                  <Table.ColumnHeader>Creado</Table.ColumnHeader>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {certificates.map((certificate) => (
                  <Table.Row key={certificate.id}>
                    <Table.Cell>{certificate.id}</Table.Cell>
                    <Table.Cell>{members.find(m => m.id === certificate.member_id)?.name || certificate.member_id}</Table.Cell>
                    <Table.Cell>{certificate.issue_date}</Table.Cell>
                    <Table.Cell>{certificate.expiry_date}</Table.Cell>
                    <Table.Cell>{certificate.doctor_license}</Table.Cell>
                    <Table.Cell>{certificate.is_validated ? 'Sí' : 'No'}</Table.Cell>
                    <Table.Cell>{new Date(certificate.created_at).toLocaleString()}</Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table.Root>
          )}
        </Box>
      </Stack>
    </>
  );
}
