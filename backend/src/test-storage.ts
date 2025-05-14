import { storage } from './config/firebase';
import * as admin from 'firebase-admin';

async function testStorage() {
  try {
    console.log('=== Testing Firebase Storage Setup ===');
    
    // Get the bucket
    const bucket = storage.bucket();
    console.log('Bucket name:', bucket.name);
    
    // Try to list files (this will verify permissions)
    console.log('\nListing files in bucket...');
    const [files] = await bucket.getFiles();
    console.log('Files in bucket:', files.map(file => file.name));
    
    // Try to create a test file
    console.log('\nTesting file upload...');
    const testFile = bucket.file('test/hello.txt');
    await testFile.save('Hello World!');
    console.log('Test file created successfully');
    
    // Try to read the test file
    console.log('\nTesting file read...');
    const [content] = await testFile.download();
    console.log('File content:', content.toString());
    
    // Clean up test file
    console.log('\nCleaning up test file...');
    await testFile.delete();
    console.log('Test file deleted');
    
    console.log('\n=== Storage Test Completed Successfully ===');
  } catch (error) {
    console.error('=== Error Testing Storage ===');
    console.error('Error Type:', error instanceof Error ? error.constructor.name : typeof error);
    console.error('Error Message:', error instanceof Error ? error.message : error);
    if (error instanceof Error) {
      console.error('Error Stack:', error.stack);
    }
    
    // Additional error information for GaxiosError
    if (error && typeof error === 'object' && 'response' in error) {
      const gaxiosError = error as any;
      console.error('\nResponse Status:', gaxiosError.response?.status);
      console.error('Response Data:', gaxiosError.response?.data);
    }
  }
}

// Run the test
testStorage(); 