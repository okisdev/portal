import { toast } from 'sonner';

export const copyToClipboard = async (text: string, successMessage?: string) => {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(successMessage);
  } catch (err) {
    console.error(err);
  }
};
