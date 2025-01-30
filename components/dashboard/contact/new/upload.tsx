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
import { api } from '@/utils/trpc/client';
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
  const [duplicates, setDuplicates] = useState<DuplicateContact[]>([]);
  const [hasDuplicates, setHasDuplicates] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const cancelUploadRef = useRef(false);
  const [selectedCampaignCode, setSelectedCampaignCode] = useState<string | undefined>(undefined);
  const [progress, setProgress] = useState(0);
  const [progressStatus, setProgressStatus] = useState('');

  const checkExistingContacts = api.contact.checkExistingContacts.useQuery({ emails: csvData.map((contact) => contact.email) }, { enabled: false });
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

    setIsProcessingCsv(true);
    try {
      Papa.parse(file, {
        header: true,
        complete: async (results) => {
          try {
            const parsedData = (results.data as any[])
              .filter((row) => row.name || row.firstName || row.email)
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
                    campaignCode: campaignCodes.join(',') || '', // Store all campaign codes
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
                  campaignCode: campaignCodes.join(',') || '', // Store all campaign codes
                };
              })
              .filter((row) => !isRowEmpty(row));

            // Set the global campaign code if any row has a campaign code
            const firstCampaignCode = parsedData.find((row) => row.campaignCodes?.length)?.campaignCodes?.[0];
            if (firstCampaignCode) {
              setSelectedCampaignCode(firstCampaignCode);
            }

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

  const formatName = (firstName: string, lastName?: string) => {
    if (firstName && lastName) return `${firstName} ${lastName}`;
    return firstName || '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    cancelUploadRef.current = false;
    setProgress(0);
    setProgressStatus('');

    try {
      const nonDuplicateContacts = csvData.filter((contact) => !isRowEmpty(contact) && !duplicates.some((d) => d.email === contact.email));
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
        setProgressStatus('Import completed successfully');
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
