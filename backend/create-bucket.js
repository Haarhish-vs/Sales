import supabase from './src/config/supabase.js';

async function createCloudBucket() {
    console.log("Checking if reports bucket exists...");

    const { data: buckets } = await supabase.storage.listBuckets();
    const exists = buckets?.find(b => b.name === 'reports');

    if (!exists) {
        console.log("Reports bucket missing. Creating it now with public access...");
        const { data, error } = await supabase.storage.createBucket('reports', {
            public: true,
            allowedMimeTypes: ['image/tiff', 'image/jpeg', 'image/png', 'application/pdf'],
        });

        if (error) {
            console.error("Failed to create bucket:", error.message);
        } else {
            console.log("✅ Bucket created successfully!", data);
        }
    } else {
        console.log("✅ Bucket already exists.");
    }
}

createCloudBucket();
