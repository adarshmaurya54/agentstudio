import { UserProfile } from '@clerk/nextjs'
import React from 'react'

function Profile() {
  return (
    <div className="flex items-center justify-center h-screen w-full">
      <div className="w-full h-full profile-container">
        <UserProfile
          routing="hash"
          appearance={{
            variables: {
              borderRadius: "9px",
            },
            elements: {
              rootBox: "w-full h-full",
              card: "w-full h-full shadow-none border rounded-2xl",
            },
          }}
        />
      </div>
    </div>
  )
}

export default Profile
