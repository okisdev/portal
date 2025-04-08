import { Download, FileIcon, ImageIcon } from 'lucide-react';
import type React from 'react';
import { useEffect, useRef, useState } from 'react';

// Define the Activity type
interface Activity {
  id: string;
  description: string;
  createdAt: string;
  metadata: string | null;
  type: string;
  subType: string;
  initiatorType: string;
  initiatorId: string;
}

const ActivitySection = ({ contactId }: { contactId: string }) => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newActivity, setNewActivity] = useState('');
  const [attachments, setAttachments] = useState<Array<{ url: string; name: string; type: string }>>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/contacts/${contactId}/activities`);
        if (!response.ok) {
          throw new Error('Failed to fetch activities');
        }
        const data = await response.json();
        setActivities(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    fetchActivities();
  }, [contactId]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload file');
      }

      const data = await response.json();
      setAttachments([...attachments, { url: data.url, name: file.name, type: file.type }]);
    } catch (err) {
      console.error('Error uploading file:', err);
    }
  };

  const handleSubmitActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newActivity.trim() && attachments.length === 0) return;

    try {
      // Create metadata object with attachments if they exist
      const metadata = attachments.length > 0 ? { attachments } : undefined;

      const response = await fetch(`/api/contacts/${contactId}/activities`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          description: newActivity,
          type: 'NOTE',
          subType: 'GENERAL',
          initiatorType: 'user',
          initiatorId: 'current-user-id', // Replace with actual user ID
          metadata: metadata,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create activity');
      }

      const data = await response.json();
      setActivities([data, ...activities]);
      setNewActivity('');
      setAttachments([]);
    } catch (err) {
      console.error('Error creating activity:', err);
    }
  };

  const renderAttachments = (metadata: string | null) => {
    if (!metadata) return null;

    try {
      const parsedMetadata = JSON.parse(metadata);
      if (!parsedMetadata.attachments || !Array.isArray(parsedMetadata.attachments)) return null;

      return (
        <div className='mt-2 flex flex-wrap gap-2'>
          {parsedMetadata.attachments.map((attachment: { url: string; name: string; type: string }, index: number) => (
            <a
              key={`${attachment.url}-${index}`}
              href={attachment.url}
              target='_blank'
              rel='noopener noreferrer'
              className='inline-flex items-center gap-1 rounded-md bg-gray-100 px-2 py-1 text-sm text-gray-700 hover:bg-gray-200'
            >
              {attachment.type.startsWith('image/') ? <ImageIcon className='h-4 w-4' /> : <FileIcon className='h-4 w-4' />}
              <span className='truncate max-w-[150px]'>{attachment.name}</span>
              <Download className='h-3 w-3' />
            </a>
          ))}
        </div>
      );
    } catch (error) {
      console.error('Error parsing metadata:', error);
      return null;
    }
  };

  if (isLoading) return <div>Loading activities...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className='space-y-4'>
      <form onSubmit={handleSubmitActivity} className='space-y-4'>
        <textarea value={newActivity} onChange={(e) => setNewActivity(e.target.value)} placeholder='Add a note...' className='w-full rounded-md border border-gray-300 p-2' rows={3} />
        <div className='flex items-center gap-2'>
          <input type='file' ref={fileInputRef} onChange={handleFileUpload} className='hidden' />
          <button type='button' onClick={() => fileInputRef.current?.click()} className='rounded-md bg-gray-100 px-3 py-1 text-sm text-gray-700 hover:bg-gray-200'>
            Attach File
          </button>
          <button type='submit' className='rounded-md bg-blue-500 px-3 py-1 text-sm text-white hover:bg-blue-600'>
            Add Note
          </button>
        </div>
        {attachments.length > 0 && (
          <div className='flex flex-wrap gap-2'>
            {attachments.map((attachment, index) => (
              <div key={`${attachment.url}-${index}`} className='inline-flex items-center gap-1 rounded-md bg-gray-100 px-2 py-1 text-sm text-gray-700'>
                {attachment.type.startsWith('image/') ? <ImageIcon className='h-4 w-4' /> : <FileIcon className='h-4 w-4' />}
                <span className='truncate max-w-[150px]'>{attachment.name}</span>
              </div>
            ))}
          </div>
        )}
      </form>

      <div className='space-y-4'>
        {activities.map((activity) => (
          <div key={activity.id} className='rounded-lg border border-gray-200 p-4 shadow-sm'>
            <div className='flex items-start justify-between'>
              <div>
                <p className='text-sm text-gray-600'>{new Date(activity.createdAt).toLocaleString()}</p>
                <p className='mt-1 whitespace-pre-wrap'>{activity.description}</p>
                {activity.metadata && renderAttachments(activity.metadata)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ActivitySection;
