'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Copy, Eye, EyeOff } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { api } from '@/utils/trpc/client';

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
] as const;

const apiKeyFormSchema = z
  .object({
    name: z.string().min(1, 'API key name is required'),
    isFullAccess: z.boolean(),
    permissions: z.array(z.string()),
  })
  .refine((data) => data.isFullAccess || data.permissions.length > 0, {
    message: 'Please select at least one permission or choose full access',
    path: ['permissions'],
  });

type ApiKeyFormValues = z.infer<typeof apiKeyFormSchema>;

interface ApiKeyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApiKeyCreated?: () => void;
}

export function ApiKeyDialog({
  open,
  onOpenChange,
  onApiKeyCreated,
}: ApiKeyDialogProps) {
  const t = useTranslations();
  const utils = api.useUtils();
  const createApiKey = api.apiKey.create.useMutation();

  const [generatedApiKey, setGeneratedApiKey] = useState<string | null>(null);
  const [showApiKey, setShowApiKey] = useState(false);

  const form = useForm<ApiKeyFormValues>({
    resolver: zodResolver(apiKeyFormSchema),
    defaultValues: {
      name: '',
      isFullAccess: false,
      permissions: [],
    },
  });

  useEffect(() => {
    if (open && !generatedApiKey) {
      // Reset form when dialog opens for creating new key
      form.reset({
        name: '',
        isFullAccess: false,
        permissions: [],
      });
    }
  }, [open, generatedApiKey, form]);

  const handleCopyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(t('copied_to_clipboard'));
    } catch {
      toast.error(t('failed_to_copy_to_clipboard'));
    }
  };

  const togglePermission = (permission: string) => {
    if (isFullAccess) {
      // If full access is enabled, ignore individual permission toggles
      return;
    }

    const currentPermissions = form.watch('permissions');
    const newPermissions = currentPermissions.includes(permission)
      ? currentPermissions.filter((p) => p !== permission)
      : [...currentPermissions, permission];

    form.setValue('permissions', newPermissions, { shouldValidate: true });
  };

  const toggleFullAccess = (checked: boolean) => {
    form.setValue('isFullAccess', checked, { shouldValidate: true });
    if (checked) {
      // When selecting full access, populate all permissions for visibility
      form.setValue(
        'permissions',
        availablePermissions.map((p) => p.value),
        { shouldValidate: true }
      );
    } else {
      // When deselecting full access, clear permissions so user can choose
      form.setValue('permissions', [], { shouldValidate: true });
    }
  };

  const onSubmit = async (data: ApiKeyFormValues) => {
    try {
      const result = await createApiKey.mutateAsync({
        name: data.name,
        permissions: data.isFullAccess ? [] : data.permissions,
      });

      // Invalidate the API key list query to refresh the list
      await utils.apiKey.list.invalidate();

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
    setShowApiKey(false);
    form.reset();
  };

  const isFullAccess = form.watch('isFullAccess');
  const permissions = form.watch('permissions');

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
      <DialogContent className='max-h-[90vh] overflow-y-auto sm:max-w-lg'>
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
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <div className='space-y-6 py-4'>
                <FormField
                  control={form.control}
                  name='name'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className='font-semibold'>
                        {t('name')}
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder={t('api_key_name_placeholder')}
                          type='text'
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='permissions'
                  render={() => (
                    <FormItem>
                      <FormLabel className='font-semibold'>
                        {t('permissions')}
                      </FormLabel>
                      <FormControl>
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

                          <div className='my-4 h-px bg-border' />

                          <div className='mb-3 space-y-1'>
                            <p className='font-medium text-sm'>
                              {isFullAccess
                                ? t('included_permissions')
                                : t('select_specific_permissions')}
                            </p>
                            <p className='text-muted-foreground text-xs'>
                              {isFullAccess
                                ? t('all_permissions_included_description')
                                : t('choose_permissions_description')}
                            </p>
                          </div>

                          <div className='grid gap-3 sm:grid-cols-2'>
                            {availablePermissions.map((permissionItem) => (
                              <div
                                className={cn(
                                  'flex items-start space-x-3 rounded-md p-3 transition-colors',
                                  isFullAccess
                                    ? 'bg-muted/30 opacity-75'
                                    : 'hover:bg-muted/50'
                                )}
                                key={permissionItem.value}
                              >
                                <Checkbox
                                  checked={permissions.includes(
                                    permissionItem.value
                                  )}
                                  disabled={isFullAccess}
                                  id={permissionItem.value}
                                  onCheckedChange={() =>
                                    togglePermission(permissionItem.value)
                                  }
                                />
                                <div className='flex-1'>
                                  <Label
                                    className={cn(
                                      'font-medium text-sm',
                                      isFullAccess
                                        ? 'cursor-default text-muted-foreground'
                                        : 'cursor-pointer'
                                    )}
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
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
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
                  disabled={
                    form.formState.isSubmitting || !form.formState.isValid
                  }
                  type='submit'
                >
                  {form.formState.isSubmitting
                    ? t('generating')
                    : t('generate_api_key')}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
