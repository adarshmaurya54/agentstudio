import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import React, { useEffect, useState } from 'react'

function WhileSetting({ selectedNode, updateNodeSettingData }: any) {
    const [formData, setFormData] = useState({
        condition: '',
        maxIterations: 10
    })

    // sync when node changes
    useEffect(() => {
        if (selectedNode?.data?.settings) {
            setFormData({
                condition: selectedNode.data.settings.condition || '',
                maxIterations: selectedNode.data.settings.maxIterations || 10
            })
        } else {
            setFormData({
                condition: '',
                maxIterations: 10
            })
        }
    }, [selectedNode])
    const onSave = () => {
        updateNodeSettingData(formData)
    }

    const isDirty =
        (selectedNode?.data?.settings?.condition || '') !== formData.condition ||
        (selectedNode?.data?.settings?.maxIterations || 10) !== formData.maxIterations
    return (
        <div className='p-1 space-y-4'>
            <div>
                <h2 className='font-bold'>While Loop</h2>
                <p className='text-sm text-muted-foreground'>
                    Repeat actions while condition is true.
                </p>
            </div>

            <div className='space-y-2'>
                <Label>Condition</Label>
                <Input
                    value={formData.condition}
                    onChange={(e) =>
                        setFormData({ ...formData, condition: e.target.value })
                    }
                    placeholder='e.g. count < 5'
                    className='rounded-xl'
                />
            </div>

            <div className='space-y-2'>
                <Label>Max Iterations (Safety)</Label>
                <Input
                    type='number'
                    value={formData.maxIterations}
                    onChange={(e) =>
                        setFormData({
                            ...formData,
                            maxIterations: Number(e.target.value)
                        })
                    }
                    className='rounded-xl'
                />
            </div>
            <Button disabled={!isDirty} onClick={onSave} className='w-full cursor-pointer rounded-xl'>
                Save
            </Button>
        </div>
    )
}

export default WhileSetting