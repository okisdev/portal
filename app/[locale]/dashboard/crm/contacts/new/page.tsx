'use client';

import ManualContactForm from '@/components/dashboard/contact/new/manual';
import ContactUpload from '@/components/dashboard/contact/new/upload';
import { PageHeader } from '@/components/shared/page-header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

export default function ImportContacts() {
  const t = useTranslations();

  const [activeTab, setActiveTab] = useState('manual');

  return (
    <div className='space-y-4 p-4'>
      <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className='w-full'>
        <PageHeader
          title='Create Contact'
          description='Create a new contact'
          right={
            <TabsList>
              <TabsTrigger value='manual'>{t('manual_create')}</TabsTrigger>
              <TabsTrigger value='upload'>{t('upload_existing_contacts')}</TabsTrigger>
            </TabsList>
          }
        />

        <TabsContent value='manual'>
          <ManualContactForm />
        </TabsContent>

        <TabsContent value='upload'>
          <ContactUpload />
        </TabsContent>
      </Tabs>
    </div>
  );
}
