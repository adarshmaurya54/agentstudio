'use client'
import { useEffect } from 'react'

function Test() {
    useEffect(() => {
        const handleStream = async () => {
            const res = await fetch('http://localhost:3000/api/agent-sdk', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    userId: 'keydhay28dj2',
                    agentId: '7296c04f-0c65-4aee-8f2b-48f822738708',
                    input: 'delhi, india weather'
                })
            });

            if (!res.body) return;

            const reader = res.body.getReader();
            const decoder = new TextDecoder();
            let done = false;
            let fullText = '';

            while (!done) {
                const { value, done: doneReading } = await reader.read();
                done = doneReading;
                const chunk = decoder.decode(value || new Uint8Array());
                fullText += chunk;
                console.log(chunk); // stream token/chunk
            }

            console.log('Final response:', fullText);
        }

        handleStream();

    }, [])
    return (
        <div>
            blah
        </div>
    )
}

export default Test
