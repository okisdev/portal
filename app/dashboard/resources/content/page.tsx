'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Edit, Eye, PlusCircle, Search, Trash } from 'lucide-react';
import { useState } from 'react';

interface Content {
  id: string;
  title: string;
  description: string;
  content: string;
  createdAt: string;
}

export default function ContentPage() {
  const [selectedContent, setSelectedContent] = useState<Content | null>(null);
  const [contents] = useState<Content[]>([
    {
      id: '1',
      title: 'Welcome Email Template',
      description: 'Template for welcoming new users',
      content: 'Hello {name},\n\nWelcome to our platform...',
      createdAt: '2025-01-19',
    },
    // Add more mock data as needed
  ]);

  return (
    <div className='flex h-full'>
      {/* Left Side - Content List */}
      <div className='w-1/3 border-r p-4'>
        <div className='mb-4 flex items-center justify-between'>
          <h2 className='font-bold text-2xl'>Contents</h2>
          <Button>
            <PlusCircle className='mr-2 h-4 w-4' />
            New Content
          </Button>
        </div>

        <div className='relative mb-4'>
          <Search className='absolute top-3 left-3 h-4 w-4 text-muted-foreground' />
          <Input placeholder='Search contents...' className='pl-10' />
        </div>

        <ScrollArea className='h-[calc(100vh-200px)]'>
          {contents.map((content) => (
            <Card key={content.id} className={`mb-2 cursor-pointer hover:bg-accent ${selectedContent?.id === content.id ? 'border-primary' : ''}`} onClick={() => setSelectedContent(content)}>
              <CardContent className='p-4'>
                <h3 className='font-semibold'>{content.title}</h3>
                <p className='text-sm text-muted-foreground'>{content.description}</p>
                <p className='text-xs text-muted-foreground mt-2'>Created: {content.createdAt}</p>
              </CardContent>
            </Card>
          ))}
        </ScrollArea>
      </div>

      {/* Right Side - Preview and Actions */}
      <div className='flex-1 p-4'>
        {selectedContent ? (
          <div className='h-full'>
            <div className='flex items-center justify-between mb-4'>
              <h2 className='text-2xl font-bold'>{selectedContent.title}</h2>
              <div className='space-x-2'>
                <Button variant='outline' size='icon'>
                  <Eye className='h-4 w-4' />
                </Button>
                <Button variant='outline' size='icon'>
                  <Edit className='h-4 w-4' />
                </Button>
                <Button variant='outline' size='icon' className='text-destructive'>
                  <Trash className='h-4 w-4' />
                </Button>
              </div>
            </div>
            <Card className='h-[calc(100vh-200px)]'>
              <CardContent className='p-4'>
                <ScrollArea className='h-full'>
                  <div className='prose max-w-none'>
                    <p className='text-muted-foreground mb-4'>{selectedContent.description}</p>
                    <pre className='bg-muted p-4 rounded-lg'>{selectedContent.content}</pre>
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className='h-full flex items-center justify-center text-muted-foreground'>Select a content to preview</div>
        )}
      </div>
    </div>
  );
}
