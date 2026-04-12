import { UserProfile } from '@clerk/nextjs'
import React from 'react'

function Profile() {
  return (
    <div className='p-6 flex items-center justify-center'>
      <UserProfile routing="hash"/>
    </div>
  )
}

export default Profile
