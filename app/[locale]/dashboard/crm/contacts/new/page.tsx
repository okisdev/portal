'use client';

import ManualContactForm from '@/components/dashboard/contact/new/manual';
import ContactUpload from '@/components/dashboard/contact/new/upload';
import { PageHeader } from '@/components/shared/page-header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useState } from 'react';

export default function ImportContacts() {
  const [activeTab, setActiveTab] = useState('simple');

  return (
    <div className='space-y-4 p-4'>
      <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className='w-full'>
        <PageHeader
          title='Create Contact'
          description='Create a new contact'
          right={
            <TabsList>
              <TabsTrigger value='simple'>Simple Create</TabsTrigger>
              <TabsTrigger value='existing'>Import Existing Contacts</TabsTrigger>
            </TabsList>
          }
        />

        <TabsContent value='simple'>
          <ManualContactForm />
        </TabsContent>

        <TabsContent value='existing'>
          <ContactUpload />
        </TabsContent>
      </Tabs>
    </div>
  );
}
