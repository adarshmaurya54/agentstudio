import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import React, { useEffect, useState } from 'react'

function EndSetting({ selectedNode, updateNodeSettingData }: any) {
    const [formData, setFormData] = useState({ schema: '' })

    // sync when node changes
    useEffect(() => {
        if (selectedNode?.data?.settings) {
            setFormData({
                schema: selectedNode.data.settings.schema || ''
            })
        } else {
            setFormData({ schema: '' })
        }
    }, [selectedNode])

    // safe previous values
    const prev = selectedNode?.data?.settings || { schema: '' }

    // dirty check
    const isDirty = prev.schema !== formData.schema

    // save handler
    const onSave = () => {
        if (!isDirty) return
        updateNodeSettingData(formData)
    }

    return (
        <div className='p-1 space-y-4'>
            <div>
                <h2 className='font-bold'>End</h2>
                <p className='text-sm text-muted-foreground'>
                    Choose the workflow output.
                </p>
            </div>

            <div className='space-y-2'>
                <Label>Output</Label>
                <Textarea
                    value={formData.schema}
                    onChange={(e) =>
                        setFormData({ schema: e.target.value })
                    }
                    className='rounded-xl'
                    placeholder='{name: string}'
                />
            </div>

            <Button
                disabled={!isDirty}
                onClick={onSave}
                className={`w-full cursor-pointer rounded-xl ${
                    !isDirty ? 'opacity-50 cursor-not-allowed' : ''
                }`}
            >
                Save
            </Button>
        </div>
    )
}

export default EndSetting