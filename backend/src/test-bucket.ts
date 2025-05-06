import { storage } from './config/firebase';

interface GaxiosError extends Error {
  code?: string;
  response?: {
    status: number;
    data: any;
  };
}

async function testBucket() {
  try {
    console.log('=== Testing Firebase Storage Bucket ===');
    
    // Get the bucket
    const bucket = storage.bucket();
    console.log('Bucket name:', bucket.name);
    
    // List files in the bucket (this will create the meditations folder if it doesn't exist)
    console.log('\nListing files in bucket...');
    const [files] = await bucket.getFiles();
    console.log('Files in bucket:', files.map(file => file.name));
    
    // Try to create a test file
    console.log('\nTesting file upload...');
    const testFile = bucket.file('meditations/test.txt');
    await testFile.save('Hello World!');
    console.log('Test file created successfully');
    
    // Clean up test file
    console.log('\nCleaning up test file...');
    await testFile.delete();
    console.log('Test file deleted');
    
    console.log('\n=== Bucket Test Completed Successfully ===');
  } catch (error) {
    console.error('=== Error Testing Bucket ===');
    const gaxiosError = error as GaxiosError;
    console.error('Error details:', gaxiosError);
    
    // Additional error information
    if (gaxiosError.code) {
      console.error('Error code:', gaxiosError.code);
    }
    if (gaxiosError.message) {
      console.error('Error message:', gaxiosError.message);
    }
    if (gaxiosError.response) {
      console.error('Response status:', gaxiosError.response.status);
      console.error('Response data:', gaxiosError.response.data);
    }
  }
}

// Run the test
testBucket(); 