import React from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Box, Container, Typography, AppBar, Toolbar } from '@mui/material';
import AwsConnectionForm from './components/AwsConnectionForm';

// Create custom theme with your purple gradient colors
const theme = createTheme({
  palette: {
    primary: {
      main: '#667eea',
    },
    secondary: {
      main: '#764ba2',
    },
    background: {
      default: '#f5f5f5',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ 
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <AppBar position="static" elevation={0} sx={{ 
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)'
        }}>
          <Toolbar>
            <Typography variant="h5" component="div" sx={{ 
              flexGrow: 1, 
              fontWeight: 700,
              color: 'white',
              textShadow: '2px 2px 4px rgba(0,0,0,0.2)'
            }}>
              Cloud Cost Autopilot
            </Typography>
          </Toolbar>
        </AppBar>

        <Container maxWidth="md" sx={{ 
          flex: 1, 
          display: 'flex', 
          alignItems: 'center',
          py: 4 
        }}>
          <Box sx={{ width: '100%' }}>
            <Typography 
              variant="h6" 
              align="center" 
              sx={{ 
                color: 'white', 
                mb: 4,
                textShadow: '1px 1px 2px rgba(0,0,0,0.2)'
              }}
            >
              AWS Cost Monitoring & Optimization Dashboard
            </Typography>
            <AwsConnectionForm />
          </Box>
        </Container>

        <Box sx={{ 
          py: 2, 
          textAlign: 'center',
          background: 'rgba(0, 0, 0, 0.2)',
          backdropFilter: 'blur(10px)'
        }}>
          <Typography variant="body2" sx={{ color: 'white', opacity: 0.9 }}>
            CSS 497 Capstone Project - Winter 2026
          </Typography>
        </Box>
      </Box>
    </ThemeProvider>
  );
}

export default App;