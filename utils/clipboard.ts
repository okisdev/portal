import { toast } from 'sonner';

export const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  } catch (err) {
    console.error(err);
    toast.error('Failed to copy to clipboard');
  }
};
