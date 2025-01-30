'use client';

import ManualContactForm from '@/components/dashboard/contact/new/manual';
import ContactUpload from '@/components/dashboard/contact/new/upload';
import { PageHeader } from '@/components/shared/page-header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { useState } from 'react';

export default function ImportContacts() {
  const t = useTranslations();

  const searchParams = useSearchParams();
  const mode = searchParams.get('mode');

  const [activeTab, setActiveTab] = useState(mode === 'manual' ? 'manual' : 'upload');

  return (
    <div className='space-y-4 p-4'>
      <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className='w-full'>
        <PageHeader
          title={t('create_contact')}
          description={t('create_a_new_contact')}
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
