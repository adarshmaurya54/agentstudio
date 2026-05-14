import { UserProfile } from '@clerk/nextjs'
import React from 'react'

function Profile() {
  return (
    <div className='p-6 flex items-center justify-center'>
      <div className="profile-container">

        <UserProfile routing="hash"
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

export default Profile
