'use client';

import { Banner } from '@/components/shared/banner';
import { ColorBadge } from '@/components/shared/color-badge';
import { Combobox } from '@/components/shared/combobox';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { sources } from '@/data/data';
import { type Status, statusSchema } from '@/lib/schema';
import { generateUUID } from '@/lib/utils';
import { parseDate, parseFullName } from '@/utils/format';
import { stringifyPhone } from '@/utils/phone';
import { api } from '@/utils/trpc/client';
import { format, startOfDay } from 'date-fns';
import { Download, Upload } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import Papa from 'papaparse';
import { useRef, useState } from 'react';
import { toast } from 'sonner';

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
  campaignCode?: string;
  campaignCodes?: string[];
  createdAt?: Date;
}

interface DuplicateContact {
  firstName: string;
  lastName: string;
  email: string;
  existingRecord: boolean;
  rowIndex: number;
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
  const [selectedCampaignCode, setSelectedCampaignCode] = useState<string | undefined>(undefined);
  const [progress, setProgress] = useState(0);
  const [progressStatus, setProgressStatus] = useState('');

  const checkDuplicates = api.contact.checkDuplicateContacts.useMutation();

  const checkExistingContactsWithEmails = api.contact.checkExistingContactsWithEmails.useQuery(
    {
      emails: csvData.map((contact) => contact.email).filter((email) => email !== null) as string[],
    },
    { enabled: false }
  );

  const checkExistingContactsWithPhones = api.contact.checkExistingContactsWithPhones.useQuery(
    {
      phones: csvData.map((contact) => contact.phone).filter((phone) => phone !== null) as string[],
    },
    { enabled: false }
  );

  const { data: campaigns } = api.marketing.getActiveCampaigns.useQuery();
  const { data: companies } = api.company.getAllCompanies.useQuery();

  const createContacts = api.contact.createContacts.useMutation({
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const isRowEmpty = (row: ContactFormData) => {
    return !row.firstName && !row.lastName && !row.email && !row.phone && !row.company;
  };

  const isRowValid = (row: ContactFormData) => {
    return (row.email || row.phone) && (row.firstName || row.lastName);
  };

  // Function to format date for display
  const formatDateForDisplay = (date: Date | undefined): string => {
    if (!date) return '';
    return format(date, 'dd/MM/yyyy');
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
              .filter((row) => row.name || row.firstName || row.email || row.phone)
              .map((row) => {
                const campaignCodes: string[] = [];
                if (row.campaignCode) {
                  const codes = row.campaignCode.split(',').map((code: string) => code.trim());
                  for (const code of codes) {
                    if (campaigns?.some((c) => c.campaignCode === code) && !campaignCodes.includes(code)) {
                      campaignCodes.push(code);
                    }
                  }
                }

                // Parse createdAt if it exists
                let createdAt: Date | undefined = undefined;
                if (row.createdAt) {
                  createdAt = parseDate(row.createdAt);
                }

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
                    campaignCodes,
                    campaignCode: campaignCodes.join(',') || '',
                    createdAt,
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
                  campaignCodes,
                  campaignCode: campaignCodes.join(',') || '',
                  createdAt,
                };
              })
              .filter((row) => !isRowEmpty(row) && isRowValid(row));

            // Set the global campaign code if any row has a campaign code
            const firstCampaignCode = parsedData.find((row) => row.campaignCodes?.length)?.campaignCodes?.[0];
            if (firstCampaignCode) {
              setSelectedCampaignCode(firstCampaignCode);
            }

            setCsvData(parsedData);

            // Check for duplicates using the new API endpoint
            const duplicateResults = await checkDuplicates.mutateAsync({
              contacts: parsedData.map((contact: ContactFormData) => ({
                email: contact.email || undefined,
                phone: contact.phone || undefined,
              })),
            });

            // Filter contacts into duplicates and non-duplicates
            const duplicateContacts: ContactFormData[] = [];
            const nonDuplicateContacts: ContactFormData[] = [];

            for (const contact of parsedData) {
              if ((contact.email && duplicateResults.existingEmails.includes(contact.email)) || (contact.phone && duplicateResults.existingPhones.includes(stringifyPhone(contact.phone)))) {
                duplicateContacts.push(contact);
              } else {
                nonDuplicateContacts.push(contact);
              }
            }

            setDuplicates(duplicateContacts);
            setNonDuplicates(nonDuplicateContacts);
            setHasDuplicates(duplicateContacts.length > 0);
            setShowPreview(true);

            toast.success(t('number_of_rows_processed_successfully', { count: parsedData.length }));
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

  const handleCsvEdit = (index: number, field: keyof ContactFormData, value: string) => {
    setCsvData((prev) => {
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
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    cancelUploadRef.current = false;
    setProgress(0);
    setProgressStatus('');

    try {
      const nonDuplicateContacts = csvData.filter((contact) => !isRowEmpty(contact) && isRowValid(contact) && !duplicates.some((d) => d.email === contact.email));
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

        const batch = nonDuplicateContacts.slice(i, i + BATCH_SIZE);
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
        setProgressStatus(t('processed_number_of_total_contacts', { count: processedCount, total: totalContacts }));
      }

      if (allResults.errors.length > 0) {
        console.error('Some contacts failed to create:', allResults.errors);
        setProgressStatus(`Failed to create ${allResults.errors.length} contacts`);
        toast.error(`${allResults.errors.length} contacts failed to create. Check console for details.`, { id: toastId });
      } else {
        setProgressStatus(t('import_completed_successfully'));
        toast.success(
          `${t('number_of_contacts_created', { count: allResults.created.length })} ${
            allResults.existing.length > 0 ? ` (${t('number_of_duplicates_contacts_skipped', { count: allResults.existing.length })})` : ''
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
        status: 'lead',
        source: '',
        remark: '',
        campaignCode: 'CAMP1,CAMP2,CAMP3', // Example of multiple campaign codes
        createdAt: '16/02/2025', // Example format: DD/MM/YYYY
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
            <Button variant='outline' className='h-8 gap-2' onClick={() => document.getElementById('csvUpload')?.click()} disabled={isProcessingCsv}>
              <Upload className='h-4 w-4' />
              {isProcessingCsv ? t('processing') : t('upload_csv')}
            </Button>
            {!isProcessingCsv && (
              <Button variant='outline' className='h-8 gap-2' onClick={downloadTemplate}>
                <Download className='h-4 w-4' />
                {t('download_template')}
              </Button>
            )}
          </>
        )}
        <input id='csvUpload' type='file' accept='.csv' className='hidden' onChange={handleCsvUpload} />
      </div>

      {!showPreview && (
        <p className='text-muted-foreground text-sm'>
          {t('note')}: {t('either_email_or_phone_required')}
        </p>
      )}

      {hasDuplicates && (
        <Banner
          variant='warning'
          title={t('duplicate_entries_detected')}
          description={t('duplicate_entries_detected_description', { count: duplicates.length })}
          action={{
            label: t('download_duplicate_list'),
            icon: <Download className='mr-2 h-4 w-4' />,
            onClick: downloadDuplicates,
          }}
        />
      )}

      {isProcessingCsv && (
        <div className='space-y-4'>
          <Skeleton className='h-10 w-full' />
          <Skeleton className='h-10 w-full' />
          <Skeleton className='h-10 w-full' />
          <Skeleton className='h-10 w-full' />
          <Skeleton className='h-10 w-full' />
          <Skeleton className='h-10 w-full' />
          <Skeleton className='h-10 w-full' />
          <Skeleton className='h-10 w-full' />
        </div>
      )}

      {showPreview && (
        <div className='mb-6 space-y-4'>
          <div className='mt-6 flex gap-4'>
            {isLoading ? (
              <>
                <div className='flex-1 space-y-2'>
                  <Progress value={progress} className='w-full' />
                  <p className='text-muted-foreground text-sm'>
                    {progressStatus} {t('processing_time_description')}
                  </p>
                </div>
                <Button type='button' variant='destructive' onClick={handleCancelUpload} disabled={isCancelling} className='shrink-0'>
                  {isCancelling ? t('cancelling') : t('cancel_upload')}
                </Button>
              </>
            ) : (
              <>
                <div className='flex flex-1 items-center gap-4'>
                  <div className='w-64'>
                    <Combobox
                      value={selectedCampaignCode ?? ''}
                      onChange={(value) => setSelectedCampaignCode(value)}
                      items={campaigns?.map((c) => c.campaignCode) ?? []}
                      placeholder={t('select_campaign_optional')}
                      searchPlaceholder={t('search_campaigns')}
                      groupHeading={t('campaigns')}
                      allowCustom={false}
                      renderItem={(code) => {
                        const campaign = campaigns?.find((c) => c.campaignCode === code);
                        return campaign?.name ?? code;
                      }}
                    />
                  </div>
                  <Button type='submit' size='sm' disabled={isLoading} onClick={handleSubmit}>
                    {t('import_contacts')}
                  </Button>
                  <Button
                    type='button'
                    size='sm'
                    variant='outline'
                    onClick={() => {
                      setShowPreview(false);
                      setCsvData([]);
                      setDuplicates([]);
                      setHasDuplicates(false);
                      setSelectedCampaignCode(undefined);
                      // Reset the file input
                      const fileInput = document.getElementById('csvUpload') as HTMLInputElement;
                      if (fileInput) fileInput.value = '';
                    }}
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
                  <TableHead>{t('campaign')}</TableHead>
                  <TableHead>{t('remark')}</TableHead>
                  <TableHead>{t('created_at')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {nonDuplicates.map((row, index) => (
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
                      <Combobox
                        value={row.company ?? ''}
                        onChange={(value) => {
                          const selectedCompany = companies?.find((c) => c.name === value);
                          handleCsvEdit(index, 'company', selectedCompany ? selectedCompany.name : value);
                        }}
                        items={companies?.map((c) => c.name) || []}
                        placeholder={t('select_company')}
                        searchPlaceholder={t('search_company')}
                        groupHeading={t('companies')}
                        allowCustom={true}
                      />
                    </TableCell>
                    <TableCell>
                      <Select value={row.status} onValueChange={(value) => handleCsvEdit(index, 'status', value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {statusSchema.options.map((status) => (
                            <SelectItem key={status} value={status}>
                              <ColorBadge type='contactStatus' value={status} />
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Combobox
                        value={row.source ?? ''}
                        onChange={(value) => handleCsvEdit(index, 'source', value)}
                        items={sources}
                        placeholder={t('select_source')}
                        searchPlaceholder={t('search_source')}
                        groupHeading={t('sources')}
                      />
                    </TableCell>
                    <TableCell>
                      <Combobox
                        value={row.campaignCode ?? ''}
                        onChange={(value) => handleCsvEdit(index, 'campaignCode', value)}
                        items={campaigns?.map((c) => c.campaignCode) ?? []}
                        placeholder={t('select_campaign')}
                        searchPlaceholder={t('search_campaigns')}
                        groupHeading={t('campaigns')}
                        allowCustom={false}
                        renderItem={(code) => {
                          const campaign = campaigns?.find((c) => c.campaignCode === code);
                          return campaign?.name ?? code;
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Input value={row.remark} onChange={(e) => handleCsvEdit(index, 'remark', e.target.value)} />
                    </TableCell>
                    <TableCell>
                      <div className='flex gap-2'>
                        <Input
                          placeholder='DD/MM/YYYY'
                          value={row.createdAt ? formatDateForDisplay(row.createdAt) : ''}
                          onChange={(e) => {
                            const parsedDate = parseDate(e.target.value);
                            setCsvData((prev) => {
                              const newData = [...prev];
                              newData[index] = { ...newData[index], createdAt: parsedDate };
                              return newData;
                            });
                          }}
                        />
                        <Input
                          type='date'
                          className='absolute right-0 w-10 p-0 opacity-0'
                          onChange={(e) => {
                            const date = e.target.value ? startOfDay(new Date(e.target.value)) : undefined;
                            setCsvData((prev) => {
                              const newData = [...prev];
                              newData[index] = { ...newData[index], createdAt: date };
                              return newData;
                            });
                          }}
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
