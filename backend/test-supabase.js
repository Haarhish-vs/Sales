import supabase from './src/config/supabase.js';

async function test() {
    console.log("Testing createSignedUploadUrl...");
    const { data, error } = await supabase.storage.from('reports').createSignedUploadUrl('test.tiff');
    console.log('Data:', data);
    console.log('Error:', error);
}

test();
