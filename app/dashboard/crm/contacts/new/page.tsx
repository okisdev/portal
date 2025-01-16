'use client';

import { Combobox } from '@/components/shared/combobox';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { insuranceCompanies, sources } from '@/data/data';
import type { Status } from '@/lib/schema';
import { generateUUID } from '@/lib/utils';
import { api } from '@/utils/trpc/client';
import { Upload } from 'lucide-react';
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
}

export default function NewContact() {
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
  });

  const [isLoading, setIsLoading] = useState(false);
  const [csvData, setCsvData] = useState<ContactFormData[]>([]);
  const [showPreview, setShowPreview] = useState(false);

  const createContact = api.contact.createContact.useMutation({
    onSuccess: () => {
      toast.success('Contact created successfully');
      router.push('/dashboard/crm/contacts');
    },
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

  const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      complete: (results) => {
        const parsedData = results.data as ContactFormData[];
        setCsvData(parsedData);
        setShowPreview(true);
      },
      error: (error) => {
        toast.error('Error parsing CSV file');
        console.error(error);
      },
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

    try {
      if (showPreview && csvData.length > 0) {
        // Submit multiple contacts
        for (const contact of csvData) {
          await createContact.mutateAsync({
            firstName: contact.firstName,
            lastName: contact.lastName,
            email: contact.email,
            phone: contact.phone || '', // Convert undefined to empty string
          });
        }
        toast.success(`${csvData.length} contacts created successfully`);
      } else {
        // Submit single contact
        await createContact.mutateAsync({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone || '', // Convert undefined to empty string
        });
      }

      router.push('/dashboard/crm/contacts');
      router.refresh();
    } catch (error) {
      console.error('Error creating contact:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='space-y-6 p-6'>
      <PageHeader
        title='Add New Contact'
        description='Add a new contact to CRM'
        right={
          <div className='mb-6 flex gap-4'>
            <Button variant='outline' className='h-8 gap-2' onClick={() => document.getElementById('csvUpload')?.click()}>
              <Upload className='h-4 w-4' />
              Upload CSV
            </Button>
            <input id='csvUpload' type='file' accept='.csv' className='hidden' onChange={handleCsvUpload} />
          </div>
        }
      />

      {showPreview ? (
        <div className='mb-6'>
          <h2 className='mb-4 font-semibold text-lg'>Preview CSV Data</h2>
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
                </TableRow>
              </TableHeader>
              <TableBody>
                {csvData.map((row, index) => (
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
        </form>
      )}

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
    </div>
  );
}
