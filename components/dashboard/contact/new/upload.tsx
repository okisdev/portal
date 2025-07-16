'use client';

import { format, startOfDay } from 'date-fns';
import { Download, Upload } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import Papa from 'papaparse';
import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { Banner } from '@/components/shared/banner';
import { Combobox } from '@/components/shared/combobox';
import { SmartColorBadge } from '@/components/shared/smart-color-badge';
import { TableLoading } from '@/components/shared/table/loading';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { sources } from '@/data/data';
import type { Status } from '@/lib/schema';
import { parseDate, parseFullName } from '@/utils/format';
import { stringifyPhone } from '@/utils/phone';
import { api } from '@/utils/trpc/client';

// Add this new function to handle phone number formatting
const formatPhoneNumber = (phone: string): string => {
  // Remove all non-digit characters
  const cleanPhone = phone.replace(/\D/g, '');

  // If it's exactly 8 digits and doesn't start with any country code
  if (cleanPhone.length === 8 && !cleanPhone.startsWith('852')) {
    return `852${cleanPhone}`;
  }

  return cleanPhone;
};

interface ContactFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  gender?: string;
  company?: string;
  companyId?: string | null;
  jobTitle?: string;
  status: Status;
  source?: string;
  remark?: string;
  createdAt?: Date;
}

export default function ContactUpload() {
  const router = useRouter();
  const t = useTranslations();
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessingCsv, setIsProcessingCsv] = useState(false);
  const [csvData, setCsvData] = useState<ContactFormData[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [duplicates, setDuplicates] = useState<ContactFormData[]>([]);
  const [nonDuplicates, setNonDuplicates] = useState<ContactFormData[]>([]);
  const [hasDuplicates, setHasDuplicates] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const cancelUploadRef = useRef(false);
  const [progress, setProgress] = useState(0);
  const [progressStatus, setProgressStatus] = useState('');

  const checkDuplicates = api.contact.checkDuplicateContacts.useMutation();

  const { data: companies } = api.company.getAllCompanies.useQuery();
  const { data: statuses } = api.site.getStatus.useQuery();

  const createContacts = api.contact.createContacts.useMutation({
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const isRowEmpty = (row: ContactFormData) => {
    return !(
      row.firstName ||
      row.lastName ||
      row.email ||
      row.phone ||
      row.company
    );
  };

  const isRowValid = (row: ContactFormData) => {
    return row.email || row.phone;
  };

  // Function to format date for display
  const formatDateForDisplay = (date: Date | undefined): string => {
    if (!date) return '';
    return format(date, 'yyyy/MM/dd');
  };

  // Add this new function to validate date format
  const validateDateFormat = (dateStr: string): boolean => {
    const regex = /^\d{4}\/\d{2}\/\d{2}$/;
    if (!regex.test(dateStr)) return false;

    const [year, month, day] = dateStr.split('/').map(Number);
    const date = new Date(year, month - 1, day);
    return (
      date.getFullYear() === year &&
      date.getMonth() === month - 1 &&
      date.getDate() === day
    );
  };

  const handleCsvUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingCsv(true);
    try {
      Papa.parse(file, {
        header: true,
        complete: async (results) => {
          try {
            const parsedData = (results.data as any[])
              .filter(
                (row) => row.name || row.firstName || row.email || row.phone
              )
              .map((row) => {
                // Parse createdAt if it exists
                let createdAt: Date | undefined;
                if (row.createdAt) {
                  if (!validateDateFormat(row.createdAt)) {
                    toast.error(
                      `Invalid date format for row: ${row.firstName || row.name}. Please use YYYY/MM/DD format.`
                    );
                    return null;
                  }
                  createdAt = parseDate(row.createdAt);
                }

                const contactData: ContactFormData = {
                  firstName: row.firstName || 'N/A',
                  lastName: row.lastName || '',
                  email: row.email || '',
                  phone: row.phone ? formatPhoneNumber(row.phone) : '',
                  company: row.company || '',
                  status: row.status || 'Lead',
                  source: row.source || '',
                  remark: row.remark || '',
                  createdAt,
                };

                if (row.firstName || row.lastName) {
                  return contactData;
                }

                const { firstName, lastName } = parseFullName(row.name || '');
                return {
                  ...contactData,
                  firstName: firstName || 'N/A',
                  lastName: lastName || '',
                };
              })
              .filter((row): row is ContactFormData => {
                if (!row) return false;
                const isEmpty = Boolean(isRowEmpty(row));
                const isValid = Boolean(isRowValid(row));
                return !isEmpty && isValid;
              });

            setCsvData(parsedData);

            // Check for duplicates using the new API endpoint
            const duplicateResults = await checkDuplicates.mutateAsync({
              contacts: parsedData.map((contact) => ({
                email: contact.email || undefined,
                phone: contact.phone || undefined,
              })),
            });

            // Filter contacts into duplicates and non-duplicates
            const duplicateContacts: ContactFormData[] = [];
            const nonDuplicateContacts: ContactFormData[] = [];

            for (const contact of parsedData) {
              if (
                (contact.email &&
                  duplicateResults.existingEmails.includes(contact.email)) ||
                (contact.phone &&
                  duplicateResults.existingPhones.includes(
                    stringifyPhone(contact.phone)
                  ))
              ) {
                duplicateContacts.push(contact);
              } else {
                nonDuplicateContacts.push(contact);
              }
            }

            setDuplicates(duplicateContacts);
            setNonDuplicates(nonDuplicateContacts);
            setHasDuplicates(duplicateContacts.length > 0);
            setShowPreview(true);

            toast.success(
              t('number_of_rows_processed_successfully', {
                count: parsedData.length,
              })
            );
          } catch (error) {
            console.error('Error processing CSV:', error);
            toast.error('Failed to process CSV file');
          } finally {
            setIsProcessingCsv(false);
          }
        },
        error: (error) => {
          console.error('Error parsing CSV:', error);
          toast.error('Failed to parse CSV file');
          setIsProcessingCsv(false);
        },
      });
    } catch (error) {
      console.error('Error handling CSV upload:', error);
      toast.error('Failed to handle CSV upload');
      setIsProcessingCsv(false);
    }
  };

  const handleCsvEdit = (
    index: number,
    field: keyof ContactFormData,
    value: string
  ) => {
    const updateData = (prev: ContactFormData[]) => {
      const newData = [...prev];
      if (field === 'company') {
        const selectedCompany = companies?.find((c) => c.name === value);
        newData[index] = {
          ...newData[index],
          company: selectedCompany ? selectedCompany.name : value,
          companyId: selectedCompany?.id || null,
        };
      } else {
        newData[index] = { ...newData[index], [field]: value };
      }
      return newData;
    };

    setCsvData((prev) => updateData(prev));
    setNonDuplicates((prev) => updateData(prev));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    cancelUploadRef.current = false;
    setProgress(0);
    setProgressStatus('');

    try {
      const nonDuplicateContacts = csvData.filter(
        (contact) =>
          !isRowEmpty(contact) &&
          isRowValid(contact) &&
          !duplicates.some((d) => d.email === contact.email)
      );
      const totalContacts = nonDuplicateContacts.length;
      const BATCH_SIZE = 25;
      let processedCount = 0;
      const allResults = {
        created: [] as any[],
        existing: [] as any[],
        errors: [] as any[],
      };

      setProgressStatus(t('processing_contacts'));
      const toastId = toast.loading(t('processing_contacts'));

      // Process contacts in batches
      for (let i = 0; i < nonDuplicateContacts.length; i += BATCH_SIZE) {
        if (cancelUploadRef.current) {
          setProgressStatus('Import cancelled');
          toast.error('Import cancelled', { id: toastId });
          return;
        }

        const batch = nonDuplicateContacts
          .slice(i, i + BATCH_SIZE)
          .map((contact) => ({
            ...contact,
            status: contact.status.value,
          }));
        const result = await createContacts.mutateAsync({
          contacts: batch,
        });

        // Accumulate results
        allResults.created.push(...result.created);
        allResults.existing.push(...result.existing);
        allResults.errors.push(...result.errors);

        // Update progress
        processedCount += batch.length;
        const percentage = (processedCount / totalContacts) * 100;
        setProgress(percentage);
        setProgressStatus(
          t('processed_number_of_total_contacts', {
            count: processedCount,
            total: totalContacts,
          })
        );
      }

      if (allResults.errors.length > 0) {
        console.error('Some contacts failed to create:', allResults.errors);
        setProgressStatus(
          `Failed to create ${allResults.errors.length} contacts`
        );
        toast.error(
          `${allResults.errors.length} contacts failed to create. Check console for details.`,
          { id: toastId }
        );
      } else {
        setProgressStatus(t('import_completed_successfully'));
        toast.success(
          `${t('number_of_contacts_created', { count: allResults.created.length })} ${
            allResults.existing.length > 0
              ? ` (${t('number_of_duplicates_contacts_skipped', { count: allResults.existing.length })})`
              : ''
          }`,
          {
            id: toastId,
          }
        );
      }

      router.push('/dashboard/crm/contacts');
      router.refresh();
    } catch (error: any) {
      console.error('Error creating contacts:', error);
      setProgressStatus('Import failed');
      toast.error('Failed to create contacts');
    } finally {
      setIsLoading(false);
      setIsCancelling(false);
      cancelUploadRef.current = false;
    }
  };

  const handleCancelUpload = () => {
    setIsCancelling(true);
    cancelUploadRef.current = true;
  };

  const downloadDuplicates = () => {
    const csv = Papa.unparse(duplicates);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'duplicate_contacts.csv';
    link.click();
  };

  const downloadTemplate = () => {
    // Create template data with example row
    const templateData = [
      {
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        company: '',
        status: 'Lead',
        source: 'N/A',
        remark: '',
        createdAt: '2024/02/16', // Example format: YYYY/MM/DD
      },
    ];

    const csv = Papa.unparse(templateData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'contact_import_template.csv';
    link.click();
  };

  return (
    <div className='space-y-4'>
      <div className='flex gap-4'>
        {!showPreview && (
          <>
            <Button
              className='h-8 gap-2'
              disabled={isProcessingCsv}
              onClick={() => document.getElementById('csvUpload')?.click()}
              variant='outline'
            >
              <Upload className='h-4 w-4' />
              {isProcessingCsv ? t('processing') : t('upload_csv')}
            </Button>
            {!isProcessingCsv && (
              <Button
                className='h-8 gap-2'
                onClick={downloadTemplate}
                variant='outline'
              >
                <Download className='h-4 w-4' />
                {t('download_template')}
              </Button>
            )}
          </>
        )}
        <input
          accept='.csv'
          className='hidden'
          id='csvUpload'
          onChange={handleCsvUpload}
          type='file'
        />
      </div>

      {!showPreview && (
        <p className='text-muted-foreground text-sm'>
          {t('note')}: {t('either_email_or_phone_required')}
        </p>
      )}

      {hasDuplicates && (
        <Banner
          action={{
            label: t('download_duplicate_list'),
            icon: <Download className='mr-2 h-4 w-4' />,
            onClick: downloadDuplicates,
          }}
          description={t('duplicate_entries_detected_description', {
            count: duplicates.length,
          })}
          title={t('duplicate_entries_detected')}
          variant='warning'
        />
      )}

      {isProcessingCsv && <TableLoading />}

      {showPreview && (
        <div className='mb-6 space-y-4'>
          <div className='mt-6 flex gap-4'>
            {isLoading ? (
              <>
                <div className='flex-1 space-y-2'>
                  <Progress className='w-full' value={progress} />
                  <p className='text-muted-foreground text-sm'>
                    {progressStatus} {t('processing_time_description')}
                  </p>
                </div>
                <Button
                  className='shrink-0'
                  disabled={isCancelling}
                  onClick={handleCancelUpload}
                  type='button'
                  variant='destructive'
                >
                  {isCancelling ? t('cancelling') : t('cancel_upload')}
                </Button>
              </>
            ) : (
              <>
                <div className='flex flex-1 items-center gap-4'>
                  <Button
                    disabled={isLoading}
                    onClick={handleSubmit}
                    size='sm'
                    type='submit'
                  >
                    {t('import_contacts')}
                  </Button>
                  <Button
                    onClick={() => {
                      setShowPreview(false);
                      setCsvData([]);
                      setDuplicates([]);
                      setHasDuplicates(false);
                      // Reset the file input
                      const fileInput = document.getElementById(
                        'csvUpload'
                      ) as HTMLInputElement;
                      if (fileInput) fileInput.value = '';
                    }}
                    size='sm'
                    type='button'
                    variant='outline'
                  >
                    {t('reset')}
                  </Button>
                </div>
              </>
            )}
          </div>

          <div className='overflow-x-auto rounded-lg border'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('first_name')}</TableHead>
                  <TableHead>{t('last_name')}</TableHead>
                  <TableHead>{t('email')}</TableHead>
                  <TableHead>{t('phone')}</TableHead>
                  <TableHead>{t('company')}</TableHead>
                  <TableHead>{t('status')}</TableHead>
                  <TableHead>{t('source')}</TableHead>
                  <TableHead>{t('remark')}</TableHead>
                  <TableHead>{t('created_at')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {nonDuplicates.map((row, index) => (
                  <TableRow key={row.email + row.phone}>
                    <TableCell>
                      <Input
                        onChange={(e) =>
                          handleCsvEdit(index, 'firstName', e.target.value)
                        }
                        value={row.firstName}
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        onChange={(e) =>
                          handleCsvEdit(index, 'lastName', e.target.value)
                        }
                        value={row.lastName}
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        onChange={(e) =>
                          handleCsvEdit(index, 'email', e.target.value)
                        }
                        value={row.email}
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        onChange={(e) =>
                          handleCsvEdit(index, 'phone', e.target.value)
                        }
                        value={row.phone}
                      />
                    </TableCell>
                    <TableCell>
                      <Combobox
                        allowCustom={true}
                        groupHeading={t('companies')}
                        items={companies?.map((c) => c.name) || []}
                        onChange={(value) => {
                          const selectedCompany = companies?.find(
                            (c) => c.name === value
                          );
                          handleCsvEdit(
                            index,
                            'company',
                            selectedCompany ? selectedCompany.name : value
                          );
                        }}
                        placeholder={t('select_company')}
                        searchPlaceholder={t('search_company')}
                        value={row.company ?? ''}
                      />
                    </TableCell>
                    <TableCell>
                      <Select
                        onValueChange={(value) =>
                          handleCsvEdit(index, 'status', value)
                        }
                        value={row.status.value}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {statuses?.map((status: Status) => (
                            <SelectItem key={status.value} value={status.value}>
                              <SmartColorBadge
                                color={status.color}
                                value={status.value}
                              />
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Combobox
                        groupHeading={t('sources')}
                        items={sources}
                        onChange={(value) =>
                          handleCsvEdit(index, 'source', value)
                        }
                        placeholder={t('select_source')}
                        searchPlaceholder={t('search_source')}
                        value={row.source ?? ''}
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        onChange={(e) =>
                          handleCsvEdit(index, 'remark', e.target.value)
                        }
                        value={row.remark}
                      />
                    </TableCell>
                    <TableCell>
                      <div className='flex gap-2'>
                        <Input
                          onChange={(e) => {
                            const dateStr = e.target.value;
                            if (dateStr && !validateDateFormat(dateStr)) {
                              toast.error('Please use YYYY/MM/DD format');
                              return;
                            }
                            const parsedDate = dateStr
                              ? parseDate(dateStr)
                              : undefined;
                            const updateData = (prev: ContactFormData[]) => {
                              const newData = [...prev];
                              newData[index] = {
                                ...newData[index],
                                createdAt: parsedDate,
                              };
                              return newData;
                            };
                            setCsvData((prev) => updateData(prev));
                            setNonDuplicates((prev) => updateData(prev));
                          }}
                          placeholder='YYYY/MM/DD'
                          value={
                            row.createdAt
                              ? formatDateForDisplay(row.createdAt)
                              : ''
                          }
                        />
                        <Input
                          className='absolute right-0 w-10 p-0 opacity-0'
                          onChange={(e) => {
                            const date = e.target.value
                              ? startOfDay(new Date(e.target.value))
                              : undefined;
                            const updateData = (prev: ContactFormData[]) => {
                              const newData = [...prev];
                              newData[index] = {
                                ...newData[index],
                                createdAt: date,
                              };
                              return newData;
                            };
                            setCsvData((prev) => updateData(prev));
                            setNonDuplicates((prev) => updateData(prev));
                          }}
                          type='date'
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  );
}
