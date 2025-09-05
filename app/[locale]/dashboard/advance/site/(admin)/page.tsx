'use client';

import type { TRPCClientErrorLike } from '@trpc/client';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { SiteMembers } from '@/components/dashboard/site/members';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { api } from '@/utils/trpc/client';

export default function SitePage() {
  const t = useTranslations();

  const [siteName, setSiteName] = useState('');
  const [siteDomain, setSiteDomain] = useState('');
  const [supportEmailDomains, setSupportEmailDomains] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const utils = api.useUtils();

  const { data: siteNameConfig } = api.site.getConfig.useQuery({ key: 'name' });
  const { data: siteDomainConfig } = api.site.getConfig.useQuery({
    key: 'domain',
  });
  const { data: supportEmailDomainConfig } = api.site.getConfig.useQuery({
    key: 'supportEmailDomains',
  });

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

  useEffect(() => {
    if (supportEmailDomainConfig) {
      setSupportEmailDomains(supportEmailDomainConfig.value);
    }
  }, [supportEmailDomainConfig]);

  const handleSupportEmailDomainChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    // Clean up the input by removing spaces around commas and filtering out empty entries
    const domains = e.target.value
      .split(',')
      .map((domain) => domain.trim())
      .filter(Boolean);
    setSupportEmailDomains(domains.join(','));
  };

  const { mutate: updateSiteConfig } = api.site.updateConfig.useMutation({
    onSuccess: (_, variables) => {
      const configType =
        variables.key === 'name'
          ? 'Site name'
          : variables.key === 'domain'
            ? 'Site domain'
            : 'Support email domain';
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

    // Update support email domain if changed
    if (supportEmailDomainConfig?.value !== supportEmailDomains) {
      updateSiteConfig({
        key: 'supportEmailDomains',
        value: supportEmailDomains,
        type: 'string',
        isPublic: true,
      });
    }

    setIsLoading(false);
  };

  return (
    <div className='container mx-auto max-w-4xl space-y-4 px-4 pt-10'>
      <PageHeader
        description={t('site_configuration_description')}
        title={t('site_configuration')}
      />

      <Tabs className='space-y-4' defaultValue='general'>
        <TabsList>
          <TabsTrigger value='general'>{t('general')}</TabsTrigger>
          <TabsTrigger value='members'>{t('members')}</TabsTrigger>
        </TabsList>

        <TabsContent value='general'>
          <div className='rounded-lg border bg-card text-card-foreground shadow-sm'>
            <div className='p-6 pb-4'>
              <h3 className='font-semibold text-lg'>{t('general_settings')}</h3>
              <p className='text-muted-foreground text-sm'>
                {t('general_settings_description')}
              </p>
            </div>
            <div className='space-y-4 p-6 pt-0'>
              <div className='space-y-2'>
                <Label htmlFor='siteName'>{t('site_name')}</Label>
                <Input
                  id='siteName'
                  onChange={(e) => setSiteName(e.target.value)}
                  placeholder='Portal'
                  value={siteName}
                />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='siteDomain'>{t('site_domain')}</Label>
                <Input
                  id='siteDomain'
                  onChange={(e) => setSiteDomain(e.target.value)}
                  placeholder='portal'
                  value={siteDomain}
                />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='supportEmailDomains'>
                  {t('support_email_domains')}
                </Label>
                <Input
                  id='supportEmailDomains'
                  onChange={handleSupportEmailDomainChange}
                  placeholder='support.portal.com, help.portal.com'
                  value={supportEmailDomains}
                />
                <p className='text-muted-foreground text-sm'>
                  {t('support_email_domains_description')}
                </p>
              </div>
              <Button disabled={isLoading} onClick={handleSaveChanges}>
                {isLoading ? t('saving') : t('save_changes')}
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value='members'>
          <SiteMembers />
        </TabsContent>
      </Tabs>
    </div>
  );
}
