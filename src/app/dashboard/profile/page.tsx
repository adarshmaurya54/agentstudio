import { UserProfile } from '@clerk/nextjs'
import React from 'react'

function Profile() {
  return (
    <div className='flex items-center bg-sidebar justify-center'>
      <div className="profile-container">
        <UserProfile routing="hash"
          appearance={{
            variables: {
              width: "100%",
              borderRadius: "16px",
            },
          }}
        />
      </div>
    </div>
  )
}

export default Profile
