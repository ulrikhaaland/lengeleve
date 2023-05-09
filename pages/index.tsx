import Chat from '@/components/Chat';
import ChatHistory from '@/components/ChatHistory';
import FileUploadDialog from '@/components/FileUpload';
import PageHeader from '@/components/PageHeader';
import { useStore } from '@/stores/RootStoreProvider';
import { observer } from 'mobx-react';
import { useState } from 'react';
const { encode } = require('@nem035/gpt-3-encoder');

function Home() {
  const { generalStore } = useStore();

  const [uploadDialogOpen, setUploadDialogOpen] = useState<boolean>(true);

  return (
    <div style={{}} className='w-full bg-bg h-screen'>
      <PageHeader></PageHeader>

      <div
        style={{
          maxHeight: 'calc(100vh - 50px)',
        }}
        className='flex h-screen items-center'
      >
        <ChatHistory
          chatHistories={[
            { id: 1, content: 'Chat history 1' },
            { id: 2, content: 'Chat history 2' },
            { id: 3, content: 'Chat history 3' },
            // Add more chat histories if needed
          ]}
          username={'Ulrik Håland'}
          onNewChat={function (): void {}}
        ></ChatHistory>
        <Chat></Chat>
      </div>
      <FileUploadDialog
        open={uploadDialogOpen}
        onClose={function (): void {
          setUploadDialogOpen(false);
        }}
        onSave={function (files: File[]): void {
          throw new Error('Function not implemented.');
        }}
      ></FileUploadDialog>
    </div>
  );
}

export default observer(Home);
