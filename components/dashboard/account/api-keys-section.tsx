'use client';

import { Key, Plus, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { toast } from 'sonner';
import { ActionAlertDialog } from '@/components/shared/action-alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { api } from '@/utils/trpc/client';

interface ApiKeysectionProps {
  onCreateApiKey: () => void;
}

export function ApiKeysSection({ onCreateApiKey }: ApiKeysectionProps) {
  const t = useTranslations();

  const { data: apiKeys, refetch: refetchApiKeys } = api.apiKey.list.useQuery();
  const deleteApiKey = api.apiKey.deleteApiKey.useMutation();

  const [deleteKeyId, setDeleteKeyId] = useState<string | null>(null);

  const handleDeleteApiKey = async (id: string) => {
    try {
      await deleteApiKey.mutateAsync({ id });
      toast.success(t('api_key_deleted_successfully'));
      setDeleteKeyId(null);
      refetchApiKeys();
    } catch (error) {
      console.error('Failed to delete API key:', error);
      toast.error(t('failed_to_delete_api_key'));
    }
  };

  return (
    <>
      <div className='space-y-4'>
        <div className='flex items-center justify-between'>
          <div className='space-y-1'>
            <h2 className='font-semibold text-2xl tracking-tight'>
              {t('api_keys')}
            </h2>
            <p className='text-muted-foreground text-sm'>
              {t('api_keys_description')}
            </p>
          </div>
          <Button onClick={onCreateApiKey} size='sm'>
            <Plus className='mr-2 h-4 w-4' />
            {t('generate_api_key')}
          </Button>
        </div>

        {/* API Keys List */}
        {apiKeys?.length === 0 ? (
          <div className='rounded-lg border border-dashed bg-card p-12 text-center'>
            <Key className='mx-auto mb-4 h-12 w-12 text-muted-foreground' />
            <h3 className='mb-2 font-semibold text-lg'>{t('no_api_keys')}</h3>
            <p className='mx-auto mb-4 max-w-md text-muted-foreground text-sm'>
              {t('no_api_keys_description')}
            </p>
            <Button onClick={onCreateApiKey} variant='outline'>
              <Plus className='mr-2 h-4 w-4' />
              {t('generate_your_first_api_key')}
            </Button>
          </div>
        ) : (
          <div className='grid gap-4'>
            {apiKeys?.map((key) => (
              <div
                className='group rounded-lg border bg-card p-4 shadow-sm'
                key={key.id}
              >
                <div className='flex items-start justify-between'>
                  <div className='flex-1 space-y-3'>
                    <div className='space-y-2'>
                      <h4 className='font-semibold text-lg'>{key.name}</h4>

                      <div className='flex items-center gap-3 text-muted-foreground text-sm'>
                        <code className='rounded bg-muted px-2 py-1 font-mono text-xs'>
                          {key.keyPrefix}•••••
                        </code>
                        <span>•</span>
                        <span>
                          {t('created')} {key.createdAt.toLocaleDateString()}
                        </span>
                        {key.lastUsedAt && (
                          <>
                            <span>•</span>
                            <span>
                              {t('last_used')}{' '}
                              {key.lastUsedAt.toLocaleDateString()}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {key.permissions &&
                      JSON.parse(key.permissions).length > 0 && (
                        <div className='space-y-2'>
                          <p className='font-medium text-sm'>
                            {t('permissions')}
                          </p>
                          <div className='flex flex-wrap gap-1'>
                            {JSON.parse(key.permissions).map(
                              (permission: string) => (
                                <Badge
                                  className='text-xs'
                                  key={permission}
                                  variant='outline'
                                >
                                  {permission}
                                </Badge>
                              )
                            )}
                          </div>
                        </div>
                      )}
                  </div>

                  <div className='flex items-center'>
                    <Button
                      onClick={() => setDeleteKeyId(key.id)}
                      size='sm'
                      variant='outline'
                    >
                      <Trash2 className='h-4 w-4' />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete API Key Dialog */}
      <ActionAlertDialog
        cancelText={t('cancel')}
        confirmText={
          deleteApiKey.isPending ? t('deleting') : t('delete_api_key')
        }
        description={t('delete_api_key_warning')}
        onConfirm={() => deleteKeyId && handleDeleteApiKey(deleteKeyId)}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteKeyId(null);
          }
        }}
        open={!!deleteKeyId}
        title={t('delete_api_key')}
      />
    </>
  );
}
