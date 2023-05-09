import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Typography,
  Box,
  Button,
} from '@mui/material';
import Dropzone from 'react-dropzone-uploader';
import 'react-dropzone-uploader/dist/styles.css';
import CloseIcon from '@mui/icons-material/Close';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import DescriptionIcon from '@mui/icons-material/Description';
import SlideshowIcon from '@mui/icons-material/Slideshow';
import { styled } from '@mui/system';

interface FileUploadDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (files: File[]) => void;
}

const CustomButton = styled(Button)({
  'backgroundColor': '#17161b',
  'color': 'white',
  '&:hover': {
    backgroundColor: '#242329',
  },
});

const FileUploadDialog: React.FC<FileUploadDialogProps> = ({
  open,
  onClose,
  onSave,
}) => {
  const handleUpload = (file: any) => {
    onSave(file);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth='md' fullWidth>
      <DialogTitle>
        <Box display='flex' justifyContent='space-between' alignItems='center'>
          <Typography variant='h6'>Upload Files</Typography>
          <IconButton
            edge='end'
            color='inherit'
            onClick={onClose}
            aria-label='close'
          >
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Box mb={2} textAlign='center'>
          <Typography variant='subtitle1' gutterBottom>
            Accepted file types:
          </Typography>
          <Box display='flex' justifyContent='center' alignItems='center'>
            <PictureAsPdfIcon color='error' />
            <Typography variant='body1' className='mx-2'>
              PDF
            </Typography>
            <DescriptionIcon color='primary' />
            <Typography variant='body1' className='mx-2'>
              DOCX
            </Typography>
            <SlideshowIcon color='secondary' />
            <Typography variant='body1' className='mx-2'>
              PPT
            </Typography>
          </Box>
        </Box>
        <Dropzone
          inputContent='Drag and drop files, or click to select'
          accept='application/pdf, application/vnd.openxmlformats-officedocument.wordprocessingml.document, application/vnd.ms-powerpoint'
          maxFiles={10}
          maxSizeBytes={5000000}
          onSubmit={handleUpload}
          styles={{
            dropzone: {
              borderColor: '#242329',
              backgroundColor: '#17161b',
              color: 'white',
              overflow: 'hidden',
            },
            submitButtonContainer: { display: 'none' },
          }}
        />
        <Box mt={2} display='flex' justifyContent='center'>
          <CustomButton onClick={() => onSave([])}>Upload</CustomButton>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default FileUploadDialog;
