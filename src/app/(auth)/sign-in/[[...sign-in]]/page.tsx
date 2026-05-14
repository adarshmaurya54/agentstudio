import { SignIn } from '@clerk/nextjs'

export default function Page() {
    return (
        <div className='flex items-center justify-center h-screen'>
            <div className="auth-container">
                <SignIn
                    appearance={{
                        variables: {
                            borderRadius: "16px",
                        },
                    }}
                />
            </div>
        </div>
    )
}