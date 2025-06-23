'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import ManualContactForm from '@/components/dashboard/contact/new/manual';
import ContactUpload from '@/components/dashboard/contact/new/upload';
import { PageHeader } from '@/components/shared/page-header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function ImportContacts() {
  const t = useTranslations();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const mode = searchParams.get('mode');

  const [activeTab, setActiveTab] = useState(
    mode === 'upload' ? 'upload' : 'manual'
  );

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    router.push(`${pathname}?mode=${value}`);
  };

  return (
    <div className='p-4'>
      <Tabs
        defaultValue={activeTab}
        onValueChange={handleTabChange}
        className='w-full space-y-8'
      >
        <PageHeader
          title={t('create_contact')}
          right={
            <TabsList>
              <TabsTrigger value='manual'>{t('manual_create')}</TabsTrigger>
              <TabsTrigger value='upload'>
                {t('upload_existing_contacts')}
              </TabsTrigger>
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
