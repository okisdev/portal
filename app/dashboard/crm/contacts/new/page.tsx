'use client';

import { Banner } from '@/components/shared/banner';
import { Combobox } from '@/components/shared/combobox';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { insuranceCompanies, sources } from '@/data/data';
import type { Status } from '@/lib/schema';
import { generateUUID } from '@/lib/utils';
import { api } from '@/utils/trpc/client';
import { Download, Upload } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Papa from 'papaparse';
import { useState } from 'react';
import { toast } from 'sonner';

interface ContactFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  gender?: string;
  company?: string;
  jobTitle?: string;
  status: Status;
  source?: string;
  remark?: string;
}

interface DuplicateContact {
  firstName: string;
  lastName: string;
  email: string;
  existingRecord: boolean;
  rowIndex: number;
}

export default function ImportContacts() {
  const router = useRouter();
  const [formData, setFormData] = useState<ContactFormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    gender: '',
    company: '',
    jobTitle: '',
    status: 'lead',
    source: '',
    remark: '',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [csvData, setCsvData] = useState<ContactFormData[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [activeTab, setActiveTab] = useState('simple');
  const [duplicates, setDuplicates] = useState<DuplicateContact[]>([]);
  const [hasDuplicates, setHasDuplicates] = useState(false);

  const checkExistingContacts = api.contact.checkExistingContacts.useQuery({ emails: csvData.map((contact) => contact.email) }, { enabled: false });

  const createContact = api.contact.createContact.useMutation({
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const isRowEmpty = (row: ContactFormData) => {
    return !row.firstName && !row.lastName && !row.email && !row.phone && !row.company;
  };

  const parseFullName = (fullName: string): { firstName: string; lastName: string } => {
    if (!fullName) return { firstName: '', lastName: '' };

    // Trim and remove extra spaces
    const cleanName = fullName.trim().replace(/\s+/g, ' ');

    // Check if it's a Chinese name (contains Chinese characters)
    if (/[\u4e00-\u9fa5]/.test(cleanName)) {
      // For Chinese names, first character is lastName, rest is firstName
      return {
        lastName: cleanName.charAt(0),
        firstName: cleanName.slice(1),
      };
    }

    // For western names, split by space
    const parts = cleanName.split(' ');
    if (parts.length >= 2) {
      // If there are multiple parts, treat last part as lastName
      return {
        firstName: parts.slice(0, -1).join(' '),
        lastName: parts[parts.length - 1],
      };
    }

    // If single word or unsure, use it as firstName
    return {
      firstName: cleanName,
      lastName: '',
    };
  };

  const handleCsvUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Create a promise that wraps the Papa.parse operation
    const parsePromise = new Promise<ContactFormData[]>((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        complete: async (results) => {
          try {
            const parsedData = (results.data as any[])
              .filter((row) => row.name || row.firstName || row.email)
              .map((row) => {
                if (row.firstName || row.lastName) {
                  return {
                    firstName: row.firstName || '',
                    lastName: row.lastName || '',
                    email: row.email || '',
                    phone: row.phone || '',
                    company: row.company || '',
                    status: row.status || 'lead',
                    source: row.source || '',
                    remark: row.remark || '',
                  };
                }

                const { firstName, lastName } = parseFullName(row.name || '');
                return {
                  firstName,
                  lastName,
                  email: row.email || '',
                  phone: row.phone || '',
                  company: row.company || '',
                  status: row.status || 'lead',
                  source: row.source || '',
                  remark: row.remark || '',
                };
              })
              .filter((row) => !isRowEmpty(row));

            setCsvData(parsedData);

            const duplicatesMap = new Map<string, DuplicateContact[]>();
            for (const [index, contact] of parsedData.entries()) {
              const key = `${contact.email}`.toLowerCase();
              if (!duplicatesMap.has(key)) {
                duplicatesMap.set(key, []);
              }
              duplicatesMap.get(key)?.push({
                firstName: contact.firstName,
                lastName: contact.lastName,
                email: contact.email,
                existingRecord: false,
                rowIndex: index,
              });
            }

            const { data: existingContacts } = await checkExistingContacts.refetch();
            const allDuplicates: DuplicateContact[] = [];

            for (const [, dupes] of duplicatesMap) {
              if (dupes.length > 1) {
                allDuplicates.push(...dupes);
              }
            }

            if (existingContacts) {
              for (const email of existingContacts) {
                const matchingRow = parsedData.findIndex((contact) => contact.email.toLowerCase() === email.toLowerCase());
                if (matchingRow !== -1) {
                  allDuplicates.push({
                    ...parsedData[matchingRow],
                    existingRecord: true,
                    rowIndex: matchingRow,
                  });
                }
              }
            }

            if (allDuplicates.length > 0) {
              setDuplicates(allDuplicates);
              setHasDuplicates(true);
            }

            setShowPreview(true);
            resolve(parsedData);
          } catch (error) {
            reject(error);
          }
        },
        error: (error) => {
          reject(error);
        },
      });
    });

    await toast.promise(parsePromise, {
      loading: 'Processing CSV file...',
      success: (data: ContactFormData[]) => `Successfully processed ${data.length} contacts`,
      error: 'Failed to process CSV file',
    });
  };

  const handleCsvEdit = (index: number, field: keyof ContactFormData, value: string) => {
    setCsvData((prev) => {
      const newData = [...prev];
      newData[index] = { ...newData[index], [field]: value };
      return newData;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const formatName = (firstName: string, lastName?: string) => {
      if (firstName && lastName) return `${firstName} ${lastName}`;
      return firstName || '';
    };

    const processBatch = async (contacts: typeof csvData, startIdx: number, batchSize: number, totalContacts: number) => {
      const endIdx = Math.min(startIdx + batchSize, contacts.length);
      const batch = contacts.slice(startIdx, endIdx);

      await Promise.all(
        batch.map((contact) =>
          createContact.mutateAsync({
            firstName: contact.firstName,
            lastName: contact.lastName,
            name: formatName(contact.firstName, contact.lastName),
            email: contact.email,
            phone: contact.phone || '',
            company: contact.company || '',
            source: formData.source || '',
            remark: formData.remark || '',
          })
        )
      );

      return endIdx;
    };

    try {
      if (showPreview && csvData.length > 0) {
        const nonDuplicateContacts = csvData.filter((contact) => !isRowEmpty(contact) && !duplicates.some((d) => d.email === contact.email));

        const batchSize = 10;
        let processedCount = 0;
        const totalContacts = nonDuplicateContacts.length;

        const toastId = toast.loading(`Processing contacts... (0/${totalContacts})`);

        while (processedCount < totalContacts) {
          processedCount = await processBatch(nonDuplicateContacts, processedCount, batchSize, totalContacts);
          toast.loading(`Processing contacts... (${processedCount}/${totalContacts})`, { id: toastId });
        }

        toast.success(
          totalContacts !== csvData.length ? `Created ${totalContacts} contacts (${csvData.length - totalContacts} duplicates skipped)` : `Successfully created ${totalContacts} contacts`,
          { id: toastId }
        );
      } else {
        toast.promise(
          createContact.mutateAsync({
            firstName: formData.firstName,
            lastName: formData.lastName,
            name: formatName(formData.firstName, formData.lastName),
            email: formData.email,
            phone: formData.phone || '',
            company: formData.company || '',
            source: formData.source || '',
            remark: formData.remark || '',
          }),
          {
            loading: 'Creating contact...',
            success: 'Contact created successfully',
            error: 'Failed to create contact',
          }
        );

        router.push('/dashboard/crm/contacts');
        router.refresh();
      }
    } catch (error) {
      console.error('Error creating contact:', error);
      toast.error('Failed to create contacts');
    } finally {
      setIsLoading(false);
    }
  };

  const downloadDuplicates = () => {
    const duplicateData = duplicates.map((d) => ({
      firstName: d.firstName,
      lastName: d.lastName,
      email: d.email,
      type: d.existingRecord ? 'Existing in Database' : 'Duplicate in CSV',
      rowIndex: d.rowIndex + 1,
    }));

    const csv = Papa.unparse(duplicateData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'duplicate_contacts.csv';
    link.click();
  };

  return (
    <div className='space-y-4 p-4'>
      <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className='w-full'>
        <PageHeader
          title='Import Contacts'
          description='Import contacts from CSV file'
          right={
            <TabsList>
              <TabsTrigger value='simple'>Simple Contact Import</TabsTrigger>
              <TabsTrigger value='existing'>Import Existing Users</TabsTrigger>
            </TabsList>
          }
        />

        <TabsContent value='simple'>
          <div className='mb-6 flex gap-4'>
            <Button variant='outline' className='h-8 gap-2' onClick={() => document.getElementById('csvUpload')?.click()}>
              <Upload className='h-4 w-4' />
              Upload CSV
            </Button>
            <input id='csvUpload' type='file' accept='.csv' className='hidden' onChange={handleCsvUpload} />
          </div>

          {hasDuplicates && (
            <Banner
              variant='warning'
              title='Duplicate Entries Detected'
              description={`${duplicates.length} duplicate entries were found. Please review before proceeding.`}
              action={{
                label: 'Download Duplicate List',
                icon: <Download className='mr-2 h-4 w-4' />,
                onClick: downloadDuplicates,
              }}
            />
          )}

          {showPreview ? (
            <div className='mb-6 space-y-4'>
              <PageHeader
                title='Preview CSV Data'
                description={`Total: ${csvData.length} Duplicates Removed: ${duplicates.length}`}
                right={
                  <div className='mt-6 flex gap-4'>
                    <Button type='submit' disabled={isLoading} onClick={handleSubmit} className='w-full sm:w-auto'>
                      {isLoading ? 'Creating...' : showPreview ? 'Import Contacts' : 'Create Contact'}
                    </Button>
                    <Button
                      type='button'
                      variant='outline'
                      onClick={() => {
                        if (showPreview) {
                          setShowPreview(false);
                          setCsvData([]);
                        } else {
                          router.back();
                        }
                      }}
                      className='w-full sm:w-auto'
                    >
                      {showPreview ? 'Cancel Import' : 'Cancel'}
                    </Button>
                  </div>
                }
              />

              <div className='overflow-x-auto rounded-lg border'>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>First Name</TableHead>
                      <TableHead>Last Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Company</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead>Remark</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {csvData
                      .filter((row) => !isRowEmpty(row) && !duplicates.some((d) => d.email === row.email))
                      .map((row, index) => (
                        <TableRow key={generateUUID()}>
                          <TableCell>
                            <Input value={row.firstName} onChange={(e) => handleCsvEdit(index, 'firstName', e.target.value)} />
                          </TableCell>
                          <TableCell>
                            <Input value={row.lastName} onChange={(e) => handleCsvEdit(index, 'lastName', e.target.value)} />
                          </TableCell>
                          <TableCell>
                            <Input value={row.email} onChange={(e) => handleCsvEdit(index, 'email', e.target.value)} />
                          </TableCell>
                          <TableCell>
                            <Input value={row.phone} onChange={(e) => handleCsvEdit(index, 'phone', e.target.value)} />
                          </TableCell>
                          <TableCell>
                            <Input value={row.company} onChange={(e) => handleCsvEdit(index, 'company', e.target.value)} />
                          </TableCell>
                          <TableCell>
                            <Select value={row.status} onValueChange={(value) => handleCsvEdit(index, 'status', value)}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value='lead'>Lead</SelectItem>
                                <SelectItem value='prospect'>Prospect</SelectItem>
                                <SelectItem value='customer'>Customer</SelectItem>
                                <SelectItem value='churned'>Churned</SelectItem>
                                <SelectItem value='opportunity'>Opportunity</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <Combobox
                              value={row.source ?? ''}
                              onChange={(value) => handleCsvEdit(index, 'source', value)}
                              items={sources}
                              placeholder='Select source...'
                              searchPlaceholder='Search source...'
                              groupHeading='Sources'
                            />
                          </TableCell>
                          <TableCell>
                            <Input value={row.remark} onChange={(e) => handleCsvEdit(index, 'remark', e.target.value)} />
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className='max-w-2xl space-y-6'>
              <div className='grid grid-cols-2 gap-4'>
                <div className='space-y-2'>
                  <Label htmlFor='firstName'>First Name *</Label>
                  <Input id='firstName' name='firstName' value={formData.firstName} onChange={handleChange} required />
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='lastName'>Last Name *</Label>
                  <Input id='lastName' name='lastName' value={formData.lastName} onChange={handleChange} required />
                </div>
              </div>

              <div className='grid grid-cols-2 gap-4'>
                <div className='space-y-2'>
                  <Label htmlFor='email'>Email</Label>
                  <Input id='email' name='email' type='email' value={formData.email} onChange={handleChange} />
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='phone'>Phone</Label>
                  <Input id='phone' name='phone' type='tel' value={formData.phone} onChange={handleChange} />
                </div>
              </div>

              <div className='grid grid-cols-2 gap-4'>
                <div className='space-y-2'>
                  <Label htmlFor='gender'>Gender</Label>
                  <Select name='gender' value={formData.gender} onValueChange={(value) => handleSelectChange('gender', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder='Select gender' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='male'>Male</SelectItem>
                      <SelectItem value='female'>Female</SelectItem>
                      <SelectItem value='other'>Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='company'>Company</Label>
                  <Combobox
                    value={formData.company ?? ''}
                    onChange={(value) => handleSelectChange('company', value)}
                    items={insuranceCompanies}
                    placeholder='Select company'
                    searchPlaceholder='Search company...'
                    groupHeading='Companies'
                  />
                </div>
              </div>

              <div className='grid grid-cols-2 gap-4'>
                <div className='space-y-2'>
                  <Label htmlFor='status'>Status *</Label>
                  <Select name='status' value={formData.status} onValueChange={(value) => handleSelectChange('status', value)} required>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='lead'>Lead</SelectItem>
                      <SelectItem value='prospect'>Prospect</SelectItem>
                      <SelectItem value='customer'>Customer</SelectItem>
                      <SelectItem value='churned'>Churned</SelectItem>
                      <SelectItem value='opportunity'>Opportunity</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='source'>Source</Label>
                  <Combobox
                    value={formData.source ?? ''}
                    onChange={(value) => handleSelectChange('source', value)}
                    items={sources}
                    placeholder='Select source...'
                    searchPlaceholder='Search source...'
                    groupHeading='Sources'
                  />
                </div>
              </div>

              <div className='flex gap-4'>
                <Button type='submit' disabled={isLoading} onClick={handleSubmit} className='w-full sm:w-auto'>
                  {isLoading ? 'Creating...' : showPreview ? 'Import Contacts' : 'Create Contact'}
                </Button>
                <Button
                  type='button'
                  variant='outline'
                  onClick={() => {
                    if (showPreview) {
                      setShowPreview(false);
                      setCsvData([]);
                    } else {
                      router.back();
                    }
                  }}
                  className='w-full sm:w-auto'
                >
                  {showPreview ? 'Cancel Import' : 'Cancel'}
                </Button>
              </div>
            </form>
          )}
        </TabsContent>

        <TabsContent value='existing'>
          <div className='p-4 text-center text-gray-500'>
            <h3 className='mb-2 font-medium text-lg'>Import Existing Users</h3>
            <p>Upload a CSV file containing existing user data to import.</p>
            {/* Add specific implementation for existing users import */}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
