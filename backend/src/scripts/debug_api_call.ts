

const debugApi = async () => {
    try {
        console.log('Testing Transfer API...');
        const payload = {
            targetNodeId: 5,
            newOwnerId: 3,
            adminId: 1
        };
        console.log('Payload:', payload);

        const res = await fetch('http://localhost:3000/api/admin/transfer-node', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await res.json();

        console.log('STATUS:', res.status);
        console.log('RESPONSE:', data);

    } catch (err: any) {
        console.log('ERROR MESSAGE:', err.message);
    }
};

debugApi();
