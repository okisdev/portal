'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';

import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useUpload } from '@/hooks/use-upload';
import { api } from '@/utils/trpc/client';

const profilePictureSchema = z.object({
  imageFile: z
    .any()
    .optional()
    .refine(
      (files) => {
        if (!files || files.length === 0) {
          return true; // No file is okay
        }
        const file = files[0];
        return file?.type?.startsWith('image/');
      },
      {
        message: 'Please select a valid image file',
      }
    )
    .refine(
      (files) => {
        if (!files || files.length === 0) {
          return true; // No file is okay
        }
        const file = files[0];
        return file?.size <= 5 * 1024 * 1024; // 5MB limit
      },
      {
        message: 'File size must be less than 5MB',
      }
    ),
});

type ProfilePictureFormValues = z.infer<typeof profilePictureSchema>;

interface ProfilePictureProps {
  image: string;
  firstName: string;
  lastName: string;
  onImageUpload?: (file: File) => Promise<void>;
}

export function ProfilePicture({
  image,
  firstName,
  lastName,
  onImageUpload,
}: ProfilePictureProps) {
  const t = useTranslations();

  const form = useForm<ProfilePictureFormValues>({
    resolver: zodResolver(profilePictureSchema),
    defaultValues: {
      imageFile: undefined,
    },
  });

  const updateMeMutation = api.account.updateMe.useMutation({
    onSuccess: () => {
      toast.success(t('image_updated_successfully'));
    },
    onError: (error) => {
      console.error('Failed to update profile image:', error);
      toast.error(t('failed_to_update_image'));
    },
  });

  const { uploadToR2, isUploading } = useUpload({
    onProgress: (info) => {
      toast.loading(info);
    },
    onError: (error) => {
      console.error('Upload error:', error);
      toast.error(t('failed_to_upload_image'));
    },
  });

  const handleImageUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) {
      return;
    }

    const file = files[0];

    // Validate using the form
    const isValid = await form.trigger('imageFile');
    if (!isValid) {
      return;
    }

    try {
      if (onImageUpload) {
        await onImageUpload(file);
      } else {
        // Default upload logic - upload to S3 and update user profile
        const imageKey = await uploadToR2(file);

        // Update user profile with the new image URL
        await updateMeMutation.mutateAsync({
          image: imageKey,
        });
      }
    } catch (error) {
      console.error('Failed to upload image:', error);
      toast.error(t('failed_to_upload_image'));
    }
  };

  return (
    <div className='flex items-center space-x-8'>
      <Avatar className='h-28 w-28'>
        <AvatarImage
          alt='Profile picture'
          src={image || '/default-avatar.png'}
        />
        <AvatarFallback>
          {firstName?.[0]}
          {lastName?.[0]}
        </AvatarFallback>
      </Avatar>
      <div className='space-y-2'>
        <h2 className='font-medium text-xl tracking-tight'>
          {t('profile_picture')}
        </h2>
        <p className='text-muted-foreground text-sm'>
          {t('update_your_profile_picture')}
        </p>

        <Form {...form}>
          <FormField
            control={form.control}
            name='imageFile'
            render={({ field: { onChange, value, ...field } }) => (
              <FormItem>
                <FormControl>
                  <div>
                    <Button
                      disabled={isUploading || updateMeMutation.isPending}
                      onClick={() => {
                        const input = document.createElement('input');
                        input.type = 'file';
                        input.accept = 'image/*';
                        input.onchange = (e) => {
                          const target = e.target as HTMLInputElement;
                          const files = target.files;
                          onChange(files);
                          handleImageUpload(files);
                        };
                        input.click();
                      }}
                      type='button'
                      variant='outline'
                    >
                      {isUploading || updateMeMutation.isPending
                        ? t('uploading')
                        : t('change_photo')}
                    </Button>
                    <Input
                      {...field}
                      accept='image/*'
                      className='hidden'
                      type='file'
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </Form>
      </div>
    </div>
  );
}
