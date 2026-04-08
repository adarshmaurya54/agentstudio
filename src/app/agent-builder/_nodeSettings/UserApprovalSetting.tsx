import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import React, { useEffect, useState } from 'react'

function UserApprovalSetting({ selectedNode, updateNodeSettingData }: any) {
    const [formData, setFormData] = useState({
        name: '',
        message: ''
    })

    // sync when node changes
    useEffect(() => {
        if (selectedNode?.data?.settings) {
            setFormData({
                name: selectedNode.data.settings.name || '',
                message: selectedNode.data.settings.message || ''
            })
        } else {
            setFormData({
                name: '',
                message: ''
            })
        }
    }, [selectedNode])

    // safe previous
    const prev = selectedNode?.data?.settings || {
        name: '',
        message: ''
    }

    // dirty check
    const isDirty =
        prev.name !== formData.name ||
        prev.message !== formData.message

    // handle change
    const handleChange = (key: string, value: string) => {
        setFormData((prev) => ({
            ...prev,
            [key]: value
        }))
    }

    // save
    const onSave = () => {
        if (!isDirty) return
        updateNodeSettingData(formData)
    }

    return (
        <div className='p-1 space-y-4'>
            <div>
                <h2 className='font-bold'>User Approval</h2>
                <p className='text-sm text-muted-foreground'>
                    Pause for a human to approve or reject a step
                </p>
            </div>

            <div className='space-y-2'>
                <Label>Name</Label>
                <Input
                    value={formData.name}
                    onChange={(e) =>
                        handleChange('name', e.target.value)
                    }
                    placeholder='Approval step name'
                    className='rounded-xl'
                />
            </div>

            <div className='space-y-2'>
                <Label>Message</Label>
                <Textarea
                    value={formData.message}
                    onChange={(e) =>
                        handleChange('message', e.target.value)
                    }
                    placeholder='Message shown to user'
                    className='rounded-xl'
                />
            </div>
            <Button
                disabled={!isDirty}
                onClick={onSave}
                className={`w-full rounded-xl ${
                    !isDirty ? 'opacity-50 cursor-not-allowed' : ''
                }`}
            >
                Save
            </Button>
        </div>
    )
}

export default UserApprovalSetting