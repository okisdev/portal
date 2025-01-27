import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

export const copyToClipboard = async (text: string, successMessage?: string) => {
  const t = useTranslations();
  try {
    await navigator.clipboard.writeText(text);
    toast.success(successMessage || t('copied_to_clipboard'));
  } catch (err) {
    console.error(err);
    toast.error(t('copy_to_clipboard_failed'));
  }
};
