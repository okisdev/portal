'use client';

import { Copy, Eye, EyeOff } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api } from '@/utils/trpc/client';

interface ApiKeyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApiKeyCreated?: () => void;
}

// Available permissions
const availablePermissions = [
  {
    value: 'read:contacts',
    label: 'Read Contacts',
    description: 'View contact information',
  },
  {
    value: 'write:contacts',
    label: 'Write Contacts',
    description: 'Create, update, and delete contacts',
  },
  {
    value: 'read:calendar',
    label: 'Read Calendar',
    description: 'View calendar events',
  },
  {
    value: 'write:calendar',
    label: 'Write Calendar',
    description: 'Create, update, and delete calendar events',
  },
  { value: 'read:tasks', label: 'Read Tasks', description: 'View tasks' },
  {
    value: 'write:tasks',
    label: 'Write Tasks',
    description: 'Create, update, and delete tasks',
  },
  {
    value: 'read:resources',
    label: 'Read Resources',
    description: 'View resources and content',
  },
  {
    value: 'write:resources',
    label: 'Write Resources',
    description: 'Create, update, and delete resources',
  },
];

export function ApiKeyDialog({
  open,
  onOpenChange,
  onApiKeyCreated,
}: ApiKeyDialogProps) {
  const t = useTranslations();
  const createApiKey = api.apiKey.createApiKey.useMutation();

  const [newApiKeyName, setNewApiKeyName] = useState('');
  const [newApiKeyPermissions, setNewApiKeyPermissions] = useState<string[]>(
    []
  );
  const [isFullAccess, setIsFullAccess] = useState(true);
  const [generatedApiKey, setGeneratedApiKey] = useState<string | null>(null);
  const [showApiKey, setShowApiKey] = useState(false);

  const handleCopyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(t('copied_to_clipboard'));
    } catch {
      toast.error(t('failed_to_copy_to_clipboard'));
    }
  };

  const togglePermission = (permission: string) => {
    setNewApiKeyPermissions((prev) =>
      prev.includes(permission)
        ? prev.filter((p) => p !== permission)
        : [...prev, permission]
    );
    // If we're selecting individual permissions, turn off full access
    setIsFullAccess(false);
  };

  const toggleFullAccess = (checked: boolean) => {
    setIsFullAccess(checked);
    if (checked) {
      setNewApiKeyPermissions([]);
    }
  };

  const handleCreateApiKey = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!newApiKeyName.trim()) {
      toast.error(t('api_key_name_required'));
      return;
    }

    try {
      const result = await createApiKey.mutateAsync({
        name: newApiKeyName.trim(),
        permissions: isFullAccess ? [] : newApiKeyPermissions,
      });

      setGeneratedApiKey(result.apiKey);
      toast.success(t('api_key_created_successfully'));
      if (onApiKeyCreated) {
        onApiKeyCreated();
      }
    } catch (error) {
      console.error('Failed to create API key:', error);
      toast.error(t('failed_to_create_api_key'));
    }
  };

  const resetApiKeyDialog = () => {
    onOpenChange(false);
    setGeneratedApiKey(null);
    setNewApiKeyName('');
    setNewApiKeyPermissions([]);
    setIsFullAccess(true);
    setShowApiKey(false);
  };

  return (
    <Dialog
      onOpenChange={(isOpen) => {
        if (isOpen) {
          onOpenChange(isOpen);
        } else {
          resetApiKeyDialog();
        }
      }}
      open={open}
    >
      <DialogContent className='sm:max-w-lg'>
        <DialogHeader>
          <DialogTitle>
            {generatedApiKey
              ? t('api_key_generated')
              : t('generate_new_api_key')}
          </DialogTitle>
          <DialogDescription>
            {generatedApiKey
              ? t('save_api_key_warning')
              : t('create_new_api_key_description')}
          </DialogDescription>
        </DialogHeader>

        {generatedApiKey ? (
          <div className='space-y-4 py-4'>
            <div className='space-y-3'>
              <Label className='font-semibold text-sm'>
                {t('your_new_api_key')}
              </Label>
              <div className='flex items-center gap-2'>
                <Input
                  className='font-mono text-sm'
                  readOnly
                  type={showApiKey ? 'text' : 'password'}
                  value={generatedApiKey}
                />
                <Button
                  onClick={() => setShowApiKey(!showApiKey)}
                  size='sm'
                  variant='outline'
                >
                  {showApiKey ? (
                    <EyeOff className='h-4 w-4' />
                  ) : (
                    <Eye className='h-4 w-4' />
                  )}
                </Button>
                <Button
                  onClick={() => handleCopyToClipboard(generatedApiKey)}
                  size='sm'
                  variant='outline'
                >
                  <Copy className='h-4 w-4' />
                </Button>
              </div>
            </div>
            <div className='rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950'>
              <p className='text-amber-900 text-sm dark:text-amber-100'>
                <strong>{t('important')}:</strong> {t('api_key_save_warning')}
              </p>
            </div>
            <DialogFooter>
              <Button onClick={resetApiKeyDialog}>
                {t('ive_saved_my_api_key')}
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <form onSubmit={handleCreateApiKey}>
            <div className='space-y-6 py-4'>
              <div className='space-y-3'>
                <Label className='font-semibold' htmlFor='apiKeyName'>
                  {t('name')}
                </Label>
                <Input
                  id='apiKeyName'
                  onChange={(e) => setNewApiKeyName(e.target.value)}
                  placeholder={t('api_key_name_placeholder')}
                  type='text'
                  value={newApiKeyName}
                />
              </div>

              <div className='space-y-3'>
                <Label className='font-semibold'>{t('permissions')}</Label>
                <div className='space-y-4 rounded-lg border p-4'>
                  {/* Full Access Option */}
                  <div className='flex items-start space-x-3 rounded-md border bg-blue-50/50 p-4 dark:bg-blue-950/20'>
                    <Checkbox
                      checked={isFullAccess}
                      id='full-access'
                      onCheckedChange={toggleFullAccess}
                    />
                    <div className='flex-1'>
                      <Label
                        className='cursor-pointer font-medium text-sm'
                        htmlFor='full-access'
                      >
                        {t('full_access')}
                      </Label>
                      <p className='text-muted-foreground text-xs leading-relaxed'>
                        {t('full_access_description')}
                      </p>
                    </div>
                  </div>

                  {!isFullAccess && (
                    <>
                      <div className='my-4 h-px bg-border' />
                      <div className='mb-3 space-y-1'>
                        <p className='font-medium text-sm'>
                          {t('or_select_specific_permissions')}
                        </p>
                        <p className='text-muted-foreground text-xs'>
                          {t('select_specific_permissions_description')}
                        </p>
                      </div>
                      <div className='grid gap-3 sm:grid-cols-2'>
                        {availablePermissions.map((permissionItem) => (
                          <div
                            className='flex items-start space-x-3 rounded-md p-3 transition-colors hover:bg-muted/50'
                            key={permissionItem.value}
                          >
                            <Checkbox
                              checked={newApiKeyPermissions.includes(
                                permissionItem.value
                              )}
                              id={permissionItem.value}
                              onCheckedChange={() =>
                                togglePermission(permissionItem.value)
                              }
                            />
                            <div className='flex-1'>
                              <Label
                                className='cursor-pointer font-medium text-sm'
                                htmlFor={permissionItem.value}
                              >
                                {permissionItem.label}
                              </Label>
                              <p className='text-muted-foreground text-xs leading-relaxed'>
                                {permissionItem.description}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                onClick={resetApiKeyDialog}
                type='button'
                variant='outline'
              >
                {t('cancel')}
              </Button>
              <Button
                disabled={createApiKey.isPending || !newApiKeyName.trim()}
                type='submit'
              >
                {createApiKey.isPending
                  ? t('generating')
                  : t('generate_api_key')}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
