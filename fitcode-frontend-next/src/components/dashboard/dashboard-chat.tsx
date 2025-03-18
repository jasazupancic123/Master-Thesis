import { User } from '@/controller/user/type/user.type';
import { Box, Button, TextField, Typography } from '@mui/material';
import BorderColor from '../border-color';
import { useState, useRef, useEffect } from 'react';
import { useScreenSize } from '@/context/screen-size-provider';

type Message = {
  sender: User | null;
  message: string;
};

interface DashboardChatProps {
  profile: User;
}

export default function DashboardChat(props: DashboardChatProps) {
  const { profile } = props;

  const screenSize = useScreenSize();

  const firstNameProfile = profile.displayName?.split(' ')[0] || '';

  const chatboxRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: null,
      message: firstNameProfile.length
        ? `Welcome back ${firstNameProfile}!\nHow are you today?\nDo you have any questions for me?`
        : `Welcome back!\nHow are you today?\nDo you have any questions for me?`,
    },
    {
      sender: profile,
      message: 'Yes, how many bugs do you have?',
    },
  ]);

  const [newMessage, setNewMessage] = useState('');

  const handleSendMessage = () => {
    if (!newMessage.trim()) return; 

    setMessages((prevMessages) => [
      ...prevMessages,
      { sender: profile, message: newMessage },
    ]);

    setNewMessage('');
  };

  useEffect(() => {
    chatboxRef.current?.scrollTo(0, chatboxRef.current?.scrollHeight);
  }, [messages]);

  return (
    <>
      <Box
        display="flex"
        flexDirection="column"
        ref={chatboxRef}
        gap={1}
        sx={{
          px: 1,
          py: 2,
          backgroundColor: 'background.paper',
          borderTopLeftRadius: '10px',
          borderTopRightRadius: '10px',
          minHeight: 300,
          maxHeight: screenSize.isSmallerThanLaptop ? 300 : 500,
          overflowY: 'auto',
        }}
      >
        {messages.map((message, i) => (
          <Box
            display="flex"
            justifyContent={message.sender ? 'flex-end' : 'flex-start'}
            key={i}
            width="100%"
          >
            <Box
              display="flex"
              flexDirection="column"
              key={i}
              textAlign={message.sender ? 'right' : 'left'}
              sx={{
                backgroundColor: message.sender
                  ? 'primary.dark'
                  : 'background.default',
                borderRadius: 3,
                px: 2,
                py: 1,
              }}
              width="70%"
            >
              <Typography
                variant="body1"
                sx={{
                  color: message.sender ? 'background.paper' : 'primary.main',
                  fontWeight: message.sender ? 'bold' : 'normal',
                }}
              >
                {message.sender ? firstNameProfile || '' : 'Fitco'}
              </Typography>
              <Typography variant="body1">{message.message}</Typography>
            </Box>
          </Box>
        ))}
        <Box display="flex" gap={1} mt={2}>
          <TextField
            fullWidth
            label="Type a message"
            size="small"
            variant="outlined"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()} // Send on Enter key
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 5,
                borderColor: 'primary.main',
              },
            }}
          />
          <Button
            variant="contained"
            color="primary"
            onClick={handleSendMessage}
          >
            Send
          </Button>
        </Box>
      </Box>
      <BorderColor color="#72DEFF" lower />
    </>
  );
}
