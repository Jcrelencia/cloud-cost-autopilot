import React, { useState } from 'react';
import { 
  Box, 
  TextField, 
  Button, 
  Typography, 
  Paper,
  Alert 
} from '@mui/material';

function AwsConnectionForm() {
  const [formData, setFormData] = useState({
    accessKeyId: '',
    secretAccessKey: '',
    userId: '1' // Hardcoded for now since we don't have auth yet
  });
  
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const response = await fetch('/api/aws/connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
        setFormData({ 
          ...formData, 
          accessKeyId: '', 
          secretAccessKey: '' 
        });
        console.log('Account connected:', data);
      } else {
        setError(data.message || 'Failed to connect AWS account');
      }
    } catch (err) {
      setError('Network error. Make sure the backend server is running on port 5000.');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto', mt: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Connect AWS Account
        </Typography>
        
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Enter your AWS credentials to start monitoring your cloud costs
        </Typography>

        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            AWS account connected successfully!
          </Alert>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="AWS Access Key ID"
            name="accessKeyId"
            value={formData.accessKeyId}
            onChange={handleChange}
            margin="normal"
            required
            placeholder="AKIAIOSFODNN7EXAMPLE"
            helperText="Your AWS Access Key ID (starts with AKIA)"
          />
          
          <TextField
            fullWidth
            label="AWS Secret Access Key"
            name="secretAccessKey"
            type="password"
            value={formData.secretAccessKey}
            onChange={handleChange}
            margin="normal"
            required
            placeholder="Enter your secret access key"
            helperText="Your 40-character AWS Secret Access Key"
          />

          <Button
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
            size="large"
            sx={{ mt: 3 }}
            disabled={loading}
          >
            {loading ? 'Connecting...' : 'Connect AWS Account'}
          </Button>
        </form>
      </Paper>
    </Box>
  );
}

export default AwsConnectionForm;