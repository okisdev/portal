'use client';

import { PageHeader } from '@/components/shared/page-header';
import {} from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'member';
  avatarUrl?: string;
}

export default function TeamConfiguration() {
  const t = useTranslations();

  const [teamName, setTeamName] = useState('My Team');
  const [teamMembers] = useState<TeamMember[]>([
    {
      id: '1',
      name: 'John Doe',
      email: 'john@example.com',
      role: 'admin',
      avatarUrl: 'https://github.com/shadcn.png',
    },
    {
      id: '2',
      name: 'Jane Smith',
      email: 'jane@example.com',
      role: 'member',
      avatarUrl: 'https://github.com/shadcn.png',
    },
  ]);

  return (
    <div className='space-y-4 p-4'>
      <PageHeader title={t('team_configuration')} description={t('team_configuration_description')} />

      <Tabs defaultValue='general' className='space-y-4'>
        <TabsList>
          <TabsTrigger value='general'>{t('general')}</TabsTrigger>
          <TabsTrigger value='settings'>{t('settings')}</TabsTrigger>
        </TabsList>

        <TabsContent value='general'>
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>Configure your team's basic information</CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='space-y-2'>
                <Label htmlFor='teamName'>{t('team_name')}</Label>
                <Input id='teamName' value={teamName} onChange={(e) => setTeamName(e.target.value)} />
              </div>
              <Button>{t('save_changes')}</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='settings'>
          <Card>
            <CardHeader>
              <CardTitle>Team Settings</CardTitle>
              <CardDescription>Configure advanced team settings</CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='space-y-2'>
                <Label htmlFor='teamDomain'>Team Domain</Label>
                <Input id='teamDomain' placeholder='your-team' disabled />
              </div>
              <div className='space-y-2'>
                <Button variant='destructive'>Delete Team</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
