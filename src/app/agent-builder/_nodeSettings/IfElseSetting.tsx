import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import React, { useEffect, useState } from 'react'

function IfElseSetting({ selectedNode, updateNodeSettingData }: any) {
    const [formData, setFormData] = useState({
        condition: '',
        elseCondition: ''
    })

    // sync when node changes
    useEffect(() => {
        if (selectedNode?.data?.settings) {
            setFormData({
                condition: selectedNode.data.settings.condition || '',
                elseCondition: selectedNode.data.settings.elseCondition || ''
            })
        } else {
            setFormData({
                condition: '',
                elseCondition: ''
            })
        }
    }, [selectedNode])

    // safe previous values
    const prev = selectedNode?.data?.settings || {
        condition: '',
        elseCondition: ''
    }

    // dirty check
    const isDirty =
        prev.condition !== formData.condition ||
        prev.elseCondition !== formData.elseCondition

    // handle change (NO auto-save here)
    const handleChange = (key: string, value: string) => {
        setFormData((prev) => ({
            ...prev,
            [key]: value
        }))
    }

    // save handler
    const onSave = () => {
        if (!isDirty) return
        updateNodeSettingData(formData)
    }

    return (
        <div className='p-1 space-y-4'>
            <div>
                <h2 className='font-bold'>If / Else</h2>
                <p className='text-sm text-muted-foreground'>
                    Create condition to branch your workflow.
                </p>
            </div>

            <div className='space-y-2'>
                <Label>If Condition</Label>
                <Input
                    value={formData.condition}
                    onChange={(e) =>
                        handleChange('condition', e.target.value)
                    }
                    placeholder='e.g. output == "success"'
                />
            </div>

            <div className='space-y-2'>
                <Label>Else Condition (optional)</Label>
                <Input
                    value={formData.elseCondition}
                    onChange={(e) =>
                        handleChange('elseCondition', e.target.value)
                    }
                    placeholder='fallback condition'
                />
            </div>
            <Button
                disabled={!isDirty}
                onClick={onSave}
                className={`w-full cursor-pointer rounded-xl ${!isDirty ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
            >
                Save
            </Button>
        </div>
    )
}

export default IfElseSetting