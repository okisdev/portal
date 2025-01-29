'use client';

import { SiteMembers } from '@/components/dashboard/site/members';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { api } from '@/utils/trpc/client';
import type { TRPCClientErrorLike } from '@trpc/client';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

export default function SitePage() {
  const t = useTranslations();

  const [siteName, setSiteName] = useState('');
  const [siteDomain, setSiteDomain] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const utils = api.useUtils();

  const { data: siteNameConfig } = api.site.getConfig.useQuery({ key: 'name' });
  const { data: siteDomainConfig } = api.site.getConfig.useQuery({ key: 'domain' });

  useEffect(() => {
    if (siteNameConfig) {
      setSiteName(siteNameConfig.value);
    }
  }, [siteNameConfig]);

  useEffect(() => {
    if (siteDomainConfig) {
      setSiteDomain(siteDomainConfig.value);
    }
  }, [siteDomainConfig]);

  const { mutate: updateSiteConfig } = api.site.updateConfig.useMutation({
    onSuccess: (_, variables) => {
      const configType = variables.key === 'name' ? 'Site name' : 'Site domain';
      toast.success(`${configType} updated successfully`);
      utils.site.getConfig.invalidate({ key: variables.key });
    },
    onError: (error: TRPCClientErrorLike<any>) => {
      toast.error(error.message);
    },
  });

  const handleSaveChanges = () => {
    setIsLoading(true);

    // Update site name if changed
    if (siteNameConfig?.value !== siteName) {
      updateSiteConfig({
        key: 'name',
        value: siteName,
        type: 'string',
        isPublic: true,
      });
    }

    // Update site domain if changed
    if (siteDomainConfig?.value !== siteDomain) {
      updateSiteConfig({
        key: 'domain',
        value: siteDomain,
        type: 'string',
        isPublic: true,
      });
    }

    setIsLoading(false);
  };

  return (
    <div className='container mx-auto max-w-4xl space-y-4 px-4 pt-10'>
      <PageHeader title={t('site_configuration')} description={t('site_configuration_description')} />

      <Tabs defaultValue='general' className='space-y-4'>
        <TabsList>
          <TabsTrigger value='general'>{t('general')}</TabsTrigger>
          <TabsTrigger value='members'>{t('members')}</TabsTrigger>
          <TabsTrigger value='danger'>{t('danger')}</TabsTrigger>
        </TabsList>

        <TabsContent value='general'>
          <Card>
            <CardHeader>
              <CardTitle>{t('general_settings')}</CardTitle>
              <CardDescription>{t('general_settings_description')}</CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='space-y-2'>
                <Label htmlFor='siteName'>{t('site_name')}</Label>
                <Input id='siteName' placeholder='Portal' value={siteName} onChange={(e) => setSiteName(e.target.value)} />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='siteDomain'>{t('site_domain')}</Label>
                <Input id='siteDomain' placeholder='portal' value={siteDomain} onChange={(e) => setSiteDomain(e.target.value)} />
              </div>
              <Button onClick={handleSaveChanges} disabled={isLoading}>
                {isLoading ? 'Saving...' : t('save_changes')}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='members'>
          <SiteMembers />
        </TabsContent>

        <TabsContent value='danger'>
          <Card>
            <CardHeader>
              <CardTitle>{t('danger')}</CardTitle>
              <CardDescription>{t('danger_description')}</CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='space-y-2'>
                <Button variant='destructive'>{t('delete_site')}</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
