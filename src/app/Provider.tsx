'use client'
import { useUser } from '@clerk/nextjs';
import { useMutation } from 'convex/react';
import React, { useEffect, useState } from 'react'
import { api } from '../../convex/_generated/api';
import { UserDetailContext } from '@/context/UserDetailContext';

function Provider({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const { user } = useUser();
    const createUser = useMutation(api.user.CreateNewUser);
    const [userDetail, setUserDetail] = useState<any>()
    useEffect(() => {
        user && CreateAndGetUser();
    }, [user])
    const CreateAndGetUser = async () => {
        if (user) {
            const result = await createUser({
                name: user.fullName ?? '',
                email: user.primaryEmailAddress?.emailAddress ?? ''
            });
            console.log(result)
            setUserDetail(result);
            // save to context
        }
    }
    return (
        <UserDetailContext.Provider value={{ userDetail, setUserDetail }}>
            <div>
                {children}
            </div>
        </UserDetailContext.Provider>
    )
}

export default Provider
